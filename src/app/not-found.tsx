import { NotFoundPanel } from "@/components/not-found-panel";

/**
 * 404 genérico da aplicação. Fica raso e neutro porque qualquer rota pode
 * cair aqui — rotas específicas (ex.: /trends/[id]) têm not-found.tsx dedicado.
 */
export default function RootNotFound() {
  return (
    <main className="relative min-h-dvh text-[color:var(--foreground)]">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="premium-grid pointer-events-none fixed inset-0 opacity-55" aria-hidden="true" />
      <section className="relative mx-auto grid w-full max-w-[960px] items-start gap-6 px-4 py-10 md:px-6 md:py-16">
        <NotFoundPanel
          eyebrow="404"
          title="Essa rota não existe"
          description="O link que você seguiu aponta para um recurso que não está disponível neste workspace. Use a busca de trends ou volte ao command center."
          primaryCta={{ href: "/", label: "command center" }}
          secondaryCta={{ href: "/trends", label: "buscar trends" }}
        />
      </section>
    </main>
  );
}
