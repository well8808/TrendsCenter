import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Serviço | Trends Center",
  description: "Termos de Serviço do Trends Center.",
};

const sections = [
  {
    title: "1. Uso do serviço",
    body:
      "O Trends Center é uma plataforma operacional de inteligência de mercado para acompanhar fontes, sinais, evidências e conectores relacionados a tendências digitais. O usuário deve usar o serviço apenas de forma lícita, segura e compatível com as políticas das plataformas externas.",
  },
  {
    title: "2. Fontes e plataformas externas",
    body:
      "O serviço pode apontar para páginas, APIs ou superfícies oficiais de terceiros, incluindo Instagram Reels, Instagram Graph API, Meta Ad Library e fluxos OAuth oficiais quando configurados. O Trends Center nao e afiliado, endossado ou operado pelo Instagram ou pela Meta. O acesso a recursos externos depende das permissões, credenciais, disponibilidade e políticas de cada plataforma.",
  },
  {
    title: "3. Responsabilidades do usuário",
    body:
      "O usuário é responsável por manter suas credenciais seguras, operar apenas dados e arquivos próprios, licenciados ou autorizados, e não utilizar o serviço para scraping clandestino, violação de direitos de terceiros, tentativa de burlar proteções técnicas ou coleta não autorizada.",
  },
  {
    title: "4. Dados, evidências e decisões",
    body:
      "Os dados exibidos pelo Trends Center devem ser analisados como apoio operacional. O serviço não garante resultados comerciais, crescimento de audiência ou desempenho de campanhas. Decisões tomadas a partir dos sinais apresentados são de responsabilidade do usuário.",
  },
  {
    title: "5. Segurança e disponibilidade",
    body:
      "O Trends Center busca manter controles de segurança, autenticação e isolamento por workspace. Ainda assim, o serviço pode sofrer indisponibilidades, limitações de provedores, manutenção, falhas de rede ou mudanças em APIs externas.",
  },
  {
    title: "6. Alterações",
    body:
      "Estes termos podem ser atualizados para refletir mudanças no produto, requisitos legais, segurança ou integrações oficiais. O uso contínuo do serviço após uma atualização indica aceitação dos termos revisados.",
  },
  {
    title: "7. Contato",
    body:
      "Dúvidas sobre estes termos devem ser enviadas pelo canal de suporte ou contato informado dentro do aplicativo Trends Center.",
  },
];

export default function TermsPage() {
  return (
    <main className="relative min-h-dvh text-[color:var(--foreground)]">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="premium-grid pointer-events-none fixed inset-0 opacity-40" aria-hidden="true" />

      <section className="relative mx-auto w-full max-w-4xl px-4 py-8 md:px-6 md:py-12">
        <Link className="inline-flex text-sm font-semibold text-[color:var(--aqua)] transition hover:text-[color:var(--acid)]" href="/login">
          voltar para login
        </Link>

        <article className="app-panel mt-6 rounded-[var(--radius-lg)] p-6 md:p-8">
          <p className="eyebrow text-[color:var(--acid)]">Trends Center</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-5xl">Termos de Serviço</h1>
          <p className="mt-4 text-sm leading-6 text-[color:var(--muted-strong)]">
            Última atualização: 27 de abril de 2026.
          </p>

          <div className="mt-8 grid gap-6">
            {sections.map((section) => (
              <section key={section.title} className="border-t border-[color:var(--line)] pt-5">
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted-strong)]">{section.body}</p>
              </section>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
