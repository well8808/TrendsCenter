import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getPrisma } from "@/lib/db";
import type { ApiResponseEnvelope } from "@/lib/http/contracts";
import { createHttpTestFixture, destroyHttpTestFixture, type HttpTestFixture } from "@/test/http/fixtures";
import { startNextServer, type NextServerHarness } from "@/test/http/server-harness";

const cronSecret = "tmcc-http-integration-secret";
const port = 3301;

async function readJson<T>(response: Response) {
  return (await response.json()) as ApiResponseEnvelope<T>;
}

function expectOk<T>(body: ApiResponseEnvelope<T>) {
  expect(body.ok).toBe(true);

  if (!body.ok) {
    throw new Error(body.error.message);
  }

  return body.data;
}

function expectError(body: ApiResponseEnvelope<unknown>) {
  expect(body.ok).toBe(false);

  if (body.ok) {
    throw new Error("Expected an error response envelope.");
  }

  return body.error;
}

describe.sequential("backend HTTP integration", () => {
  let fixture: HttpTestFixture;
  let server: NextServerHarness;

  beforeAll(async () => {
    fixture = await createHttpTestFixture();
    server = await startNextServer({
      port,
      env: {
        CRON_SECRET: cronSecret,
        INTERNAL_API_TOKEN: "tmcc-http-integration-internal-token",
        NEXT_PUBLIC_APP_URL: `http://127.0.0.1:${port}`,
      },
    });
  });

  afterAll(async () => {
    if (server) {
      await server.stop();
    }

    if (fixture) {
      await destroyHttpTestFixture(fixture);
    }
  });

  it("responds on health with envelope, requestId and observability snapshot", async () => {
    const response = await fetch(`${server.baseUrl}/api/health`, {
      headers: {
        "x-request-id": "health-smoke-001",
      },
    });
    const body = await readJson<{ status: string; observability: unknown }>(response);
    const data = expectOk(body);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("health-smoke-001");
    expect(body.meta.requestId).toBe("health-smoke-001");
    expect(data.status).toBe("ok");
    expect(data.observability).toBeTruthy();
  });

  it("enforces auth and returns a consistent error envelope", async () => {
    const response = await fetch(`${server.baseUrl}/api/v1/workspaces/current`);
    const body = await readJson<unknown>(response);
    const error = expectError(body);

    expect(response.status).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
    expect(typeof body.meta.requestId).toBe("string");
  });

  it("returns the current workspace for an authenticated tenant", async () => {
    const response = await fetch(`${server.baseUrl}/api/v1/workspaces/current`, {
      headers: {
        Cookie: fixture.cookieHeader,
      },
    });
    const body = await readJson<{ id: string; slug: string }>(response);
    const data = expectOk(body);

    expect(response.status).toBe(200);
    expect(data.id).toBe(fixture.workspaceId);
    expect(data.slug).toContain(fixture.slug);
    expect(response.headers.get("x-request-id")).toBe(body.meta.requestId);
  });

  it("lists only trends from the current tenant workspace", async () => {
    const response = await fetch(`${server.baseUrl}/api/v1/trends?market=BR&sort=score`, {
      headers: {
        Cookie: fixture.cookieHeader,
        "x-request-id": "trends-list-001",
      },
    });
    const body = await readJson<{ results: Array<{ id: string }> }>(response);
    const data = expectOk(body);

    expect(response.status).toBe(200);
    expect(body.meta.requestId).toBe("trends-list-001");
    expect(data.results).toHaveLength(1);
    expect(data.results[0].id).toBe(fixture.primaryVideoId);
  });

  it("returns trend detail for the current tenant and hides foreign data", async () => {
    const okResponse = await fetch(`${server.baseUrl}/api/v1/trends/${fixture.primaryVideoId}`, {
      headers: {
        Cookie: fixture.cookieHeader,
      },
    });
    const okBody = await readJson<{ id: string; timeline: unknown[] }>(okResponse);
    const okData = expectOk(okBody);

    expect(okResponse.status).toBe(200);
    expect(okData.id).toBe(fixture.primaryVideoId);
    expect(okData.timeline.length).toBeGreaterThan(0);

    const forbiddenResponse = await fetch(`${server.baseUrl}/api/v1/trends/${fixture.foreignVideoId}`, {
      headers: {
        Cookie: fixture.cookieHeader,
      },
    });
    const forbiddenBody = await readJson<unknown>(forbiddenResponse);
    const error = expectError(forbiddenBody);

    expect(forbiddenResponse.status).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
  });

  it("queues ingestion idempotently and exposes the job in the API", async () => {
    const payload = {
      type: "SIGNAL_CREATE",
      signalTitle: `Signal ${fixture.slug}`,
      summary: "Signal created from HTTP integration test.",
      signalType: "FORMAT",
      market: "BR",
      audience: "adult audience",
      sourceTitle: "Manual research intake",
      sourceKind: "MANUAL_RESEARCH",
      sourceOrigin: "MANUAL",
      evidenceTitle: "Evidence from HTTP route",
      evidenceNote: "Evidence attached from integration route.",
    };

    const firstResponse = await fetch(`${server.baseUrl}/api/v1/ingestion/requests`, {
      method: "POST",
      headers: {
        Cookie: fixture.cookieHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const firstBody = await readJson<{
      idempotent: boolean;
      request: { id: string; status: string };
    }>(firstResponse);
    const firstData = expectOk(firstBody);

    expect(firstResponse.status).toBe(202);
    expect(firstData.idempotent).toBe(false);
    expect(firstData.request.status).toBe("QUEUED");

    const secondResponse = await fetch(`${server.baseUrl}/api/v1/ingestion/requests`, {
      method: "POST",
      headers: {
        Cookie: fixture.cookieHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const secondBody = await readJson<{
      idempotent: boolean;
      request: { id: string };
    }>(secondResponse);
    const secondData = expectOk(secondBody);

    expect(secondResponse.status).toBe(202);
    expect(secondData.idempotent).toBe(true);
    expect(secondData.request.id).toBe(firstData.request.id);

    const jobsResponse = await fetch(`${server.baseUrl}/api/v1/jobs/runs`, {
      headers: {
        Cookie: fixture.cookieHeader,
      },
    });
    const jobsBody = await readJson<{ items: Array<{ requestId?: string }> }>(jobsResponse);
    const jobsData = expectOk(jobsBody);

    expect(jobsResponse.status).toBe(200);
    expect(jobsData.items.some((item) => item.requestId === firstData.request.id)).toBe(true);
  });

  it("processes queued ingestion via internal cron GET and POST and writes correlated logs", async () => {
    const getResponse = await fetch(`${server.baseUrl}/api/internal/cron/dispatch?limit=5`, {
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        "x-request-id": "cron-dispatch-get-001",
      },
    });
    const getBody = await readJson<{
      jobs: { claimed: number };
    }>(getResponse);
    const getData = expectOk(getBody);

    expect(getResponse.status).toBe(200);
    expect(getBody.meta.requestId).toBe("cron-dispatch-get-001");
    expect(getData.jobs.claimed).toBeGreaterThanOrEqual(1);

    const postResponse = await fetch(`${server.baseUrl}/api/internal/cron/dispatch`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ limit: 2 }),
    });
    const postBody = await readJson<unknown>(postResponse);
    expectOk(postBody);

    expect(postResponse.status).toBe(200);

    const createdSignal = await getPrisma().signal.findFirst({
      where: {
        workspaceId: fixture.workspaceId,
        title: `Signal ${fixture.slug}`,
      },
    });

    expect(createdSignal).toBeTruthy();
    expect(server.logs()).toContain("cron-dispatch-get-001");
  });

  it("handles retry and dead-letter flows through internal cron dispatch", async () => {
    const prisma = getPrisma();
    const failedRequest = await prisma.ingestRequest.create({
      data: {
        workspaceId: fixture.workspaceId,
        requestKey: `bad-request:${fixture.slug}`,
        type: "OFFICIAL_SNAPSHOT",
        status: "QUEUED",
        market: "BR",
        origin: "MANUAL",
        title: "Bad request fixture",
        submittedBy: `${fixture.slug}@example.com`,
        payload: {
          kind: "OFFICIAL_SNAPSHOT",
          input: {
            sourceTitle: "Broken snapshot",
            sourceKind: "MANUAL_RESEARCH",
            sourceOrigin: "MANUAL",
            market: "BR",
            payloadJson: "{}",
          },
        },
      },
    });
    const retryJob = await prisma.jobRun.create({
      data: {
        workspaceId: fixture.workspaceId,
        queue: "ingestion",
        handler: "ingestion.request.process",
        name: "retry-fixture",
        createdBy: "integration-test",
        requestId: failedRequest.id,
        status: "QUEUED",
        maxAttempts: 2,
        availableAt: new Date(Date.now() - 1000),
        payload: {
          requestId: failedRequest.id,
          requestType: "OFFICIAL_SNAPSHOT",
        },
      },
    });

    const retryDispatchResponse = await fetch(`${server.baseUrl}/api/internal/cron/dispatch?limit=10`, {
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    });
    const retryDispatchBody = await readJson<{ jobs: { failed: number } }>(retryDispatchResponse);
    const retryDispatchData = expectOk(retryDispatchBody);

    expect(retryDispatchResponse.status).toBe(200);
    expect(retryDispatchData.jobs.failed).toBeGreaterThanOrEqual(1);

    const retriedJob = await prisma.jobRun.findUniqueOrThrow({ where: { id: retryJob.id } });
    expect(retriedJob.status).toBe("FAILED");
    expect(retriedJob.lastError).toMatch(/nenhum video encontrado/i);
    expect(retriedJob.availableAt.getTime()).toBeGreaterThan(Date.now());

    await prisma.jobRun.update({
      where: { id: retryJob.id },
      data: {
        availableAt: new Date(Date.now() - 1000),
      },
    });

    const deadLetterResponse = await fetch(`${server.baseUrl}/api/internal/cron/dispatch?limit=10`, {
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    });
    const deadLetterBody = await readJson<{ jobs: { deadLettered: number } }>(deadLetterResponse);
    const deadLetterData = expectOk(deadLetterBody);

    expect(deadLetterResponse.status).toBe(200);
    expect(deadLetterData.jobs.deadLettered).toBeGreaterThanOrEqual(1);

    const deadLetterJob = await prisma.jobRun.findUniqueOrThrow({ where: { id: retryJob.id } });
    expect(deadLetterJob.status).toBe("DEAD_LETTERED");
    expect(deadLetterJob.deadLetteredAt).toBeTruthy();
  });

  it("processes the internal outbox route with auth and requestId envelope", async () => {
    const prisma = getPrisma();

    await prisma.authEmailOutbox.create({
      data: {
        kind: "EMAIL_VERIFICATION",
        toEmail: `${fixture.slug}+outbox@example.com`,
        subject: "Verify your email",
        body: "Please verify your email.",
        workspaceId: fixture.workspaceId,
        userId: fixture.userId,
        dedupeKey: `outbox:${fixture.slug}`,
        nextAttemptAt: new Date(Date.now() - 1000),
      },
    });

    const response = await fetch(`${server.baseUrl}/api/internal/outbox/process`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        "Content-Type": "application/json",
        "x-request-id": "outbox-process-001",
      },
      body: JSON.stringify({ limit: 10 }),
    });
    const body = await readJson<{ claimed: number; suppressed: number }>(response);
    const data = expectOk(body);

    expect(response.status).toBe(200);
    expect(body.meta.requestId).toBe("outbox-process-001");
    expect(data.claimed).toBeGreaterThanOrEqual(1);
    expect(data.suppressed).toBeGreaterThanOrEqual(1);

    const outbox = await prisma.authEmailOutbox.findFirstOrThrow({
      where: {
        workspaceId: fixture.workspaceId,
        dedupeKey: `outbox:${fixture.slug}`,
      },
    });

    expect(outbox.status).toBe("SUPPRESSED");
    expect(outbox.lastError).toMatch(/nao configurado/i);
    expect(server.logs()).toContain("outbox_item_suppressed");
    expect(server.logs()).toContain('"reasonCode":"missing_env"');
    expect(server.logs()).toContain('"emailDeliveryEnabled":false');
  });
});
