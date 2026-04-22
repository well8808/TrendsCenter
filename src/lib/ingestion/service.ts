import type { Prisma } from "@prisma/client";

import {
  buildEvidenceDedupeKey,
  buildSignalDedupeKey,
  buildSourceDedupeKey,
  stableHash,
} from "@/lib/ingestion/dedupe";
import { getPrisma } from "@/lib/db";
import { calculateTrendScore } from "@/lib/scoring";
import type { DataOrigin, Market, SignalType, SourceKind } from "@/lib/types";

type Tx = Prisma.TransactionClient;

export interface ManualSignalInput {
  title: string;
  summary: string;
  type: SignalType;
  market: Market;
  audience: string;
  sourceTitle: string;
  sourceKind: SourceKind;
  sourceOrigin: DataOrigin;
  evidenceTitle: string;
  evidenceUrl?: string;
  evidenceNote: string;
  submittedBy?: string;
}

export interface ManualEvidenceInput {
  signalId: string;
  sourceId: string;
  evidenceTitle: string;
  evidenceUrl?: string;
  evidenceNote: string;
  submittedBy?: string;
}

const ingestionStepNames = ["RECEIVE", "VALIDATE", "NORMALIZE", "DEDUPE", "PERSIST", "SCORE", "AUDIT"] as const;

function requireText(value: string, field: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${field} obrigatorio`);
  }

  return trimmed;
}

function assertOperationalOrigin(origin: DataOrigin) {
  if (origin === "DEMO") {
    throw new Error("Origem demo/mock nao pode ser usada em fluxos reais. Use MANUAL, OWNED ou OFFICIAL.");
  }
}

function assertSafeText(...values: string[]) {
  const unsafeMinorPattern = /\b(menor|menores|crianca|criança|infantil|adolescente|teen|underage|minor)\b/i;

  if (values.some((value) => unsafeMinorPattern.test(value))) {
    throw new Error("Conteudo com menor ou idade ambigua bloqueado pelo safe mode.");
  }
}

function connectorSlug(kind: SourceKind, origin: DataOrigin) {
  if (origin === "OFFICIAL") {
    return `official-${kind.toLowerCase()}`;
  }

  if (origin === "DEMO") {
    throw new Error("Origem nao operacional nao possui connector de ingestao.");
  }

  return "manual-safe-intake";
}

function initialScoreInput(type: SignalType, market: Market) {
  return {
    velocity7d: 35,
    acceleration: 24,
    brazilFit: market === "BR" ? 58 : 36,
    usTransferability: market === "US" || type === "US_TO_BR" ? 58 : 24,
    formatRepeatability: type === "FORMAT" || type === "REVIVAL" ? 62 : 42,
    creatorSignal: type === "CREATOR" ? 64 : 30,
    audioCommercialUsable: type === "AUDIO" ? 56 : 26,
    revivalStrength: type === "REVIVAL" ? 58 : 18,
    evidenceQuality: 42,
    riskPenalty: 8,
  };
}

async function ensureConnector(
  tx: Tx,
  input: {
    kind: SourceKind;
    origin: DataOrigin;
    market: Market;
  },
) {
  const slug = connectorSlug(input.kind, input.origin);

  return tx.connector.upsert({
    where: { slug },
    update: {
      status: input.origin === "OFFICIAL" || input.origin === "MANUAL" ? "APPROVED" : "NEEDS_REVIEW",
      manualEntryEnabled: true,
      market: input.market,
    },
    create: {
      slug,
      title: input.origin === "OFFICIAL" ? `Official manual intake: ${input.kind}` : "Manual safe intake",
      kind: input.kind,
      origin: input.origin,
      status: input.origin === "OFFICIAL" || input.origin === "MANUAL" ? "APPROVED" : "NEEDS_REVIEW",
      market: input.market,
      manualEntryEnabled: true,
      officialSurface: input.origin === "OFFICIAL" ? input.kind : undefined,
      policyNotes: "Criado pela Fase 3B sem integracao externa automatica.",
    },
  });
}

async function createSteps(
  tx: Tx,
  batchId: string,
  status: "SUCCEEDED" | "FAILED" | "SKIPPED",
  failedStep?: (typeof ingestionStepNames)[number],
) {
  const now = new Date();

  await tx.ingestionStep.createMany({
    data: ingestionStepNames.map((name, index) => {
      const stepStatus = failedStep && ingestionStepNames.indexOf(name) > ingestionStepNames.indexOf(failedStep)
        ? "SKIPPED"
        : failedStep === name
          ? "FAILED"
          : status;

      return {
        batchId,
        name,
        status: stepStatus,
        sequence: index + 1,
        startedAt: now,
        completedAt: now,
        notes:
          stepStatus === "SUCCEEDED"
            ? "Etapa local concluida sem rede externa."
            : stepStatus === "SKIPPED"
              ? "Etapa ignorada apos falha anterior."
              : "Etapa falhou e nao gerou insight.",
      };
    }),
  });
}

async function createJob(
  tx: Tx,
  input: {
    name: string;
    requestId: string;
    importBatchId: string;
    payload: Prisma.JsonObject;
  },
) {
  return tx.jobRun.create({
    data: {
      name: input.name,
      status: "SUCCEEDED",
      stage: "AUDIT",
      requestId: input.requestId,
      importBatchId: input.importBatchId,
      payload: input.payload,
      startedAt: new Date(),
      finishedAt: new Date(),
    },
  });
}

export async function createManualSignalWithEvidence(input: ManualSignalInput) {
  const title = requireText(input.title, "Titulo do sinal");
  const sourceTitle = requireText(input.sourceTitle, "Fonte");
  const evidenceTitle = requireText(input.evidenceTitle, "Titulo da evidencia");
  const evidenceNote = requireText(input.evidenceNote, "Nota da evidencia");

  assertOperationalOrigin(input.sourceOrigin);
  assertSafeText(title, input.summary, input.audience, sourceTitle, evidenceTitle, evidenceNote);

  const signalKey = buildSignalDedupeKey({ market: input.market, type: input.type, title });
  const sourceKey = buildSourceDedupeKey({
    origin: input.sourceOrigin,
    kind: input.sourceKind,
    market: input.market,
    title: sourceTitle,
  });
  const evidenceKey = buildEvidenceDedupeKey({
    signalKey,
    title: evidenceTitle,
    url: input.evidenceUrl,
  });
  const requestKey = ["manual-signal", signalKey, evidenceKey].join(":");
  const payload = {
    signalKey,
    sourceKey,
    evidenceKey,
    title,
    sourceTitle,
    evidenceTitle,
    externalNetwork: false,
  };

  return getPrisma().$transaction(async (tx) => {
    const connector = await ensureConnector(tx, {
      kind: input.sourceKind,
      origin: input.sourceOrigin,
      market: input.market,
    });
    const source = await tx.source.upsert({
      where: { dedupeKey: sourceKey },
      update: {
        connectorId: connector.id,
        updatedAt: new Date(),
      },
      create: {
        title: sourceTitle,
        kind: input.sourceKind,
        origin: input.sourceOrigin,
        market: input.market,
        confidence: input.sourceOrigin === "OFFICIAL" ? "MEDIUM" : "LOW",
        connectorId: connector.id,
        dedupeKey: sourceKey,
        coverage: "registro manual/oficial aprovado pelo operador",
        freshness: "coletado manualmente",
        gap: "sem conector externo automatico nesta fase",
        notes: "Criado via Ingestion Lab Fase 3B.",
      },
    });
    const request = await tx.ingestRequest.upsert({
      where: { requestKey },
      update: {
        status: "RUNNING",
        sourceId: source.id,
        processedAt: new Date(),
      },
      create: {
        requestKey,
        type: "SIGNAL_CREATE",
        status: "RUNNING",
        market: input.market,
        origin: input.sourceOrigin,
        connectorId: connector.id,
        sourceId: source.id,
        title,
        submittedBy: input.submittedBy ?? "operator",
        collectedAt: new Date(),
        processedAt: new Date(),
        payload,
        isDemo: input.sourceOrigin === "DEMO",
      },
    });
    const batch = await tx.importBatch.upsert({
      where: { idempotencyKey: requestKey },
      update: {
        status: "RUNNING",
        processedAt: new Date(),
      },
      create: {
        idempotencyKey: requestKey,
        kind: "MANUAL_SIGNAL",
        status: "RUNNING",
        market: input.market,
        origin: input.sourceOrigin,
        connectorId: connector.id,
        requestId: request.id,
        sourceId: source.id,
        title: `Manual signal: ${title}`,
        payloadHash: stableHash(payload),
        payload,
        collectedAt: new Date(),
        processedAt: new Date(),
        isDemo: input.sourceOrigin === "DEMO",
      },
    });
    const job = await createJob(tx, {
      name: "manual-signal-ingest",
      requestId: request.id,
      importBatchId: batch.id,
      payload,
    });
    const snapshot = await tx.sourceSnapshot.create({
      data: {
        sourceId: source.id,
        importBatchId: batch.id,
        jobRunId: job.id,
        collectedAt: new Date(),
        rawPayloadHash: stableHash(payload),
        recordCount: 2,
        isDemo: input.sourceOrigin === "DEMO",
      },
    });
    const scoreInput = initialScoreInput(input.type, input.market);
    const score = calculateTrendScore(scoreInput);
    const existingSignal = await tx.signal.findUnique({
      where: { dedupeKey: signalKey },
      select: { id: true },
    });
    const signal = existingSignal
      ? await tx.signal.update({
          where: { id: existingSignal.id },
          data: {
            sourceId: source.id,
            importBatchId: batch.id,
            lastIngestedAt: new Date(),
            processedAt: new Date(),
            updatedAt: new Date(),
          },
        })
      : await tx.signal.create({
          data: {
            title,
            summary: input.summary.trim() || "Sinal criado manualmente; aguarda evidencias adicionais.",
            type: input.type,
            market: input.market,
            audience: input.audience.trim() || "Operacao interna",
            status: "WATCH",
            priority: "WATCH",
            riskLevel: "LOW",
            stage: "MONITOR",
            strength: score.value,
            trendWindow: "aguardar validacao manual",
            decision: "Manter em observacao ate acumular evidencia verificavel.",
            nextAction: "Revisar fonte, confirmar permissao de uso e comparar com sinais BR/EUA.",
            tags: ["manual", input.market.toLowerCase(), input.type.toLowerCase()],
            scoreDrivers: ["manual intake", "evidencia inicial", "sem scraping"],
            dedupeKey: signalKey,
            importBatchId: batch.id,
            lastIngestedAt: new Date(),
            processedAt: new Date(),
            origin: input.sourceOrigin,
            sourceId: source.id,
            confidence: "LOW",
            evidenceCount: 0,
            isDemo: input.sourceOrigin === "DEMO",
            scores: {
              create: {
                score: score.value,
                confidence: "LOW",
                velocity7d: scoreInput.velocity7d,
                acceleration: scoreInput.acceleration,
                brazilFit: scoreInput.brazilFit,
                usTransferability: scoreInput.usTransferability,
                formatRepeatability: scoreInput.formatRepeatability,
                creatorSignal: scoreInput.creatorSignal,
                audioCommercialUsable: scoreInput.audioCommercialUsable,
                revivalStrength: scoreInput.revivalStrength,
                evidenceQuality: scoreInput.evidenceQuality,
                riskPenalty: scoreInput.riskPenalty,
                modelVersion: "score-v0.1-manual",
                explanation: "Score inicial conservador para sinal criado manualmente.",
              },
            },
          },
        });
    const evidenceExists = await tx.evidence.findUnique({
      where: { dedupeKey: evidenceKey },
      select: { id: true },
    });
    const evidence = evidenceExists
      ? await tx.evidence.update({
          where: { id: evidenceExists.id },
          data: {
            importBatchId: batch.id,
            jobRunId: job.id,
            snapshotId: snapshot.id,
            capturedAt: new Date(),
          },
        })
      : await tx.evidence.create({
          data: {
            signalId: signal.id,
            sourceId: source.id,
            importBatchId: batch.id,
            jobRunId: job.id,
            snapshotId: snapshot.id,
            dedupeKey: evidenceKey,
            title: evidenceTitle,
            url: input.evidenceUrl?.trim() || undefined,
            excerpt: sourceTitle,
            note: evidenceNote,
            quality: input.sourceOrigin === "OFFICIAL" ? "MEDIUM" : "LOW",
            capturedAt: new Date(),
            isDemo: input.sourceOrigin === "DEMO",
          },
        });

    await tx.signalObservation.create({
      data: {
        signalId: signal.id,
        snapshotId: snapshot.id,
        observedAt: new Date(),
        postCount: 1,
        rawMetrics: {
          manual: true,
          importBatchId: batch.id,
          externalNetwork: false,
        },
      },
    });
    const evidenceCount = await tx.evidence.count({ where: { signalId: signal.id } });

    await tx.signal.update({
      where: { id: signal.id },
      data: { evidenceCount, updatedAt: new Date() },
    });
    await tx.auditEvent.createMany({
      data: [
        {
          type: existingSignal ? "SIGNAL_UPDATED" : "SIGNAL_CREATED",
          signalId: signal.id,
          sourceId: source.id,
          importBatchId: batch.id,
          jobRunId: job.id,
          label: existingSignal ? "dedupe" : "ingest",
          value: existingSignal ? "atualizado" : "manual",
          tone: existingSignal ? "gold" : "acid",
          message: existingSignal ? "Sinal atualizado por ingestao idempotente." : "Sinal criado por ingestao manual real.",
          actor: input.submittedBy ?? "operator",
        },
        {
          type: "EVIDENCE_ATTACHED",
          signalId: signal.id,
          sourceId: source.id,
          importBatchId: batch.id,
          jobRunId: job.id,
          label: "evid.",
          value: evidenceExists ? "dedupe" : "+1",
          tone: evidenceExists ? "violet" : "aqua",
          message: evidenceExists ? "Evidencia idempotente reutilizada." : "Evidencia anexada ao sinal.",
          actor: input.submittedBy ?? "operator",
        },
        {
          type: "SOURCE_REGISTERED",
          signalId: signal.id,
          sourceId: source.id,
          importBatchId: batch.id,
          jobRunId: job.id,
          label: "fonte",
          value: input.sourceOrigin.toLowerCase(),
          tone: input.sourceOrigin === "OFFICIAL" ? "gold" : "violet",
          message: "Fonte registrada com connector aprovado.",
          actor: input.submittedBy ?? "operator",
        },
      ],
    });
    await createSteps(tx, batch.id, "SUCCEEDED");
    await tx.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "SUCCEEDED",
        itemCount: evidenceCount,
        completedAt: new Date(),
        processedAt: new Date(),
      },
    });
    await tx.ingestRequest.update({
      where: { id: request.id },
      data: {
        status: "SUCCEEDED",
        sourceId: source.id,
        signalId: signal.id,
        completedAt: new Date(),
        processedAt: new Date(),
      },
    });

    return {
      ok: true,
      signalId: signal.id,
      evidenceId: evidence.id,
      batchId: batch.id,
      dedupedSignal: Boolean(existingSignal),
      dedupedEvidence: Boolean(evidenceExists),
      message: existingSignal ? "Sinal existente atualizado com proveniencia." : "Sinal manual criado com proveniencia.",
    };
  });
}

export async function attachManualEvidence(input: ManualEvidenceInput) {
  const evidenceTitle = requireText(input.evidenceTitle, "Titulo da evidencia");
  const evidenceNote = requireText(input.evidenceNote, "Nota da evidencia");

  assertSafeText(evidenceTitle, evidenceNote);

  return getPrisma().$transaction(async (tx) => {
    const signal = await tx.signal.findUnique({
      where: { id: input.signalId },
      include: { source: true },
    });
    const source = await tx.source.findUnique({
      where: { id: input.sourceId },
      include: { connector: true },
    });

    if (!signal || !source) {
      throw new Error("Sinal ou fonte nao encontrados");
    }

    assertOperationalOrigin(source.origin);

    const signalKey = signal.dedupeKey ?? buildSignalDedupeKey({
      market: signal.market,
      type: signal.type,
      title: signal.title,
    });
    const evidenceKey = buildEvidenceDedupeKey({
      signalKey,
      title: evidenceTitle,
      url: input.evidenceUrl,
    });
    const requestKey = ["manual-evidence", signal.id, evidenceKey].join(":");
    const payload = {
      signalId: signal.id,
      sourceId: source.id,
      evidenceKey,
      evidenceTitle,
      externalNetwork: false,
    };
    const connector = source.connector ?? (await ensureConnector(tx, {
      kind: source.kind,
      origin: source.origin,
      market: source.market,
    }));
    const request = await tx.ingestRequest.upsert({
      where: { requestKey },
      update: { status: "RUNNING", processedAt: new Date() },
      create: {
        requestKey,
        type: "EVIDENCE_APPEND",
        status: "RUNNING",
        market: signal.market,
        origin: source.origin,
        connectorId: connector.id,
        sourceId: source.id,
        signalId: signal.id,
        title: evidenceTitle,
        submittedBy: input.submittedBy ?? "operator",
        collectedAt: new Date(),
        processedAt: new Date(),
        payload,
        isDemo: source.origin === "DEMO",
      },
    });
    const batch = await tx.importBatch.upsert({
      where: { idempotencyKey: requestKey },
      update: { status: "RUNNING", processedAt: new Date() },
      create: {
        idempotencyKey: requestKey,
        kind: "MANUAL_EVIDENCE",
        status: "RUNNING",
        market: signal.market,
        origin: source.origin,
        connectorId: connector.id,
        requestId: request.id,
        sourceId: source.id,
        title: `Manual evidence: ${signal.title}`,
        payloadHash: stableHash(payload),
        payload,
        collectedAt: new Date(),
        processedAt: new Date(),
        isDemo: source.origin === "DEMO",
      },
    });
    const job = await createJob(tx, {
      name: "manual-evidence-append",
      requestId: request.id,
      importBatchId: batch.id,
      payload,
    });
    const snapshot = await tx.sourceSnapshot.create({
      data: {
        sourceId: source.id,
        importBatchId: batch.id,
        jobRunId: job.id,
        collectedAt: new Date(),
        rawPayloadHash: stableHash(payload),
        recordCount: 1,
        isDemo: source.origin === "DEMO",
      },
    });
    const existingEvidence = await tx.evidence.findUnique({
      where: { dedupeKey: evidenceKey },
      select: { id: true },
    });
    const evidence = existingEvidence
      ? await tx.evidence.update({
          where: { id: existingEvidence.id },
          data: {
            importBatchId: batch.id,
            jobRunId: job.id,
            snapshotId: snapshot.id,
            capturedAt: new Date(),
          },
        })
      : await tx.evidence.create({
          data: {
            signalId: signal.id,
            sourceId: source.id,
            importBatchId: batch.id,
            jobRunId: job.id,
            snapshotId: snapshot.id,
            dedupeKey: evidenceKey,
            title: evidenceTitle,
            url: input.evidenceUrl?.trim() || undefined,
            excerpt: source.title,
            note: evidenceNote,
            quality: source.origin === "OFFICIAL" ? "MEDIUM" : "LOW",
            capturedAt: new Date(),
            isDemo: source.origin === "DEMO",
          },
        });
    const evidenceCount = await tx.evidence.count({ where: { signalId: signal.id } });

    await tx.signal.update({
      where: { id: signal.id },
      data: {
        evidenceCount,
        importBatchId: batch.id,
        lastIngestedAt: new Date(),
        processedAt: new Date(),
      },
    });
    await tx.auditEvent.create({
      data: {
        type: "EVIDENCE_ATTACHED",
        signalId: signal.id,
        sourceId: source.id,
        importBatchId: batch.id,
        jobRunId: job.id,
        label: "evid.",
        value: existingEvidence ? "dedupe" : "+1",
        tone: existingEvidence ? "violet" : "aqua",
        message: existingEvidence ? "Evidencia idempotente reutilizada." : "Evidencia anexada ao sinal.",
        actor: input.submittedBy ?? "operator",
      },
    });
    await createSteps(tx, batch.id, "SUCCEEDED");
    await tx.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "SUCCEEDED",
        itemCount: evidenceCount,
        completedAt: new Date(),
        processedAt: new Date(),
      },
    });
    await tx.ingestRequest.update({
      where: { id: request.id },
      data: {
        status: "SUCCEEDED",
        completedAt: new Date(),
        processedAt: new Date(),
      },
    });

    return {
      ok: true,
      signalId: signal.id,
      evidenceId: evidence.id,
      batchId: batch.id,
      dedupedEvidence: Boolean(existingEvidence),
      message: existingEvidence ? "Evidencia existente vinculada novamente." : "Evidencia anexada ao sinal.",
    };
  });
}
