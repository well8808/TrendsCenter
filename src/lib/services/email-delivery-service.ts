import { serviceUnavailable } from "@/lib/http/errors";

export interface DeliverEmailInput {
  to: string;
  subject: string;
  html: string;
  idempotencyKey?: string;
}

export interface DeliveredEmail {
  provider: string;
  messageId?: string;
}

function resendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;

  if (!apiKey || !from) {
    return null;
  }

  return { apiKey, from };
}

export async function deliverEmail(input: DeliverEmailInput): Promise<DeliveredEmail> {
  const config = resendConfig();

  if (!config) {
    throw serviceUnavailable("Email provider não configurado.", {
      provider: "resend",
      reason: "missing_env",
    });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: config.from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });

  const payload = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;

  if (!response.ok) {
    throw serviceUnavailable("Falha ao entregar e-mail no provider.", {
      provider: "resend",
      status: response.status,
      response: payload,
    });
  }

  return {
    provider: "resend",
    messageId: payload?.id,
  };
}
