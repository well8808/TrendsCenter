import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | Trends Center",
  description: "Política de Privacidade do Trends Center.",
};

const sections = [
  {
    title: "1. Dados que coletamos",
    body:
      "O Trends Center pode tratar dados de conta, sessão, workspace, convites, logs operacionais, fontes cadastradas, evidências enviadas pelo usuário e metadados necessários para autenticação, segurança, auditoria e funcionamento do produto.",
  },
  {
    title: "2. Integrações externas",
    body:
      "Quando uma integração oficial com plataforma externa for configurada, como Instagram OAuth, o Trends Center usará credenciais e permissões apenas para a finalidade autorizada pelo usuário. Segredos, tokens e chaves de API são tratados no backend e não devem ser expostos em componentes client, HTML público ou armazenamento local do navegador.",
  },
  {
    title: "3. Uso das informações",
    body:
      "As informações são usadas para operar o app, autenticar usuários, isolar workspaces, exibir fontes e sinais, registrar auditoria, melhorar segurança e manter rastreabilidade das ações realizadas no produto.",
  },
  {
    title: "4. Compartilhamento",
    body:
      "Não vendemos dados pessoais. Informações podem ser processadas por provedores de infraestrutura, banco de dados, hospedagem, autenticação, e-mail ou APIs oficiais quando necessário para entregar o serviço ou cumprir obrigações legais.",
  },
  {
    title: "5. Retenção e segurança",
    body:
      "Mantemos dados pelo tempo necessário para operação, segurança, auditoria e obrigações legais. Usamos controles como autenticação, cookies httpOnly, isolamento por workspace e práticas de armazenamento seguro para reduzir riscos.",
  },
  {
    title: "6. Direitos do usuário",
    body:
      "Usuários podem solicitar acesso, correção ou remoção de dados pessoais conforme a legislação aplicável e as limitações técnicas, legais e de auditoria do serviço.",
  },
  {
    title: "7. Contato",
    body:
      "Solicitações sobre privacidade devem ser enviadas pelo canal de suporte ou contato informado dentro do aplicativo Trends Center.",
  },
];

export default function PrivacyPage() {
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
          <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-5xl">Política de Privacidade</h1>
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
