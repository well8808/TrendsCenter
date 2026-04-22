import { headers } from "next/headers";

export async function getRequestBaseUrl() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");

  if (host) {
    const isLocalHost = host.startsWith("127.0.0.1") || host.startsWith("localhost");
    const proto = headerStore.get("x-forwarded-proto") ?? (isLocalHost ? "http" : "https");

    return `${proto}://${host}`;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://127.0.0.1:3000";
}

export function buildActionUrl(baseUrl: string, path: string, token: string) {
  const url = new URL(path, baseUrl);
  url.searchParams.set("token", token);

  return url.toString();
}
