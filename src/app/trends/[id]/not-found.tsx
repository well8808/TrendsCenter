import { NotFoundPanel } from "@/components/not-found-panel";

/**
 * Acionado quando `getTrendDetail` não encontra a trend neste workspace
 * (incluindo casos de isolamento de tenant). O Next.js preserva o status 404,
 * então mantemos a semântica correta sem gambiarra client-side.
 */
export default function TrendNotFound() {
  return (
    <main className="relative min-h-dvh text-[color:var(--foreground)]">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="premium-grid pointer-events-none fixed inset-0 opacity-55" aria-hidden="true" />
      <section className="relative mx-auto grid w-full max-w-[960px] items-start gap-6 px-4 py-10 md:px-6 md:py-16">
        <NotFoundPanel
          eyebrow="404 · trend não encontrada"
          title="Essa trend saiu do radar"
          description="Ela pode ter sido despromovida, arquivada ou nunca ter existido neste workspace. Volte para a busca para recalibrar."
          primaryCta={{ href: "/trends", label: "voltar para trends" }}
          secondaryCta={{ href: "/", label: "command center" }}
        />
      </section>
    </main>
  );
}
