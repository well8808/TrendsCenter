import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import path from "node:path";

interface StartServerOptions {
  port: number;
  env?: Record<string, string>;
}

export interface NextServerHarness {
  baseUrl: string;
  stop: () => Promise<void>;
  logs: () => string;
}

const root = process.cwd();
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

async function waitForServer(baseUrl: string, timeoutMs: number) {
  const startedAt = Date.now();
  let lastError: unknown;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);

      if (response.ok) {
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Servidor local nao iniciou a tempo. Ultimo erro: ${String(lastError)}`);
}

export async function startNextServer(options: StartServerOptions): Promise<NextServerHarness> {
  const baseUrl = `http://127.0.0.1:${options.port}`;
  const lines: string[] = [];
  const child = spawn(
    process.execPath,
    [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(options.port)],
    {
      cwd: root,
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
        ...options.env,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  ) as unknown as ChildProcessWithoutNullStreams;

  const append = (chunk: Buffer) => {
    lines.push(chunk.toString("utf8"));
  };

  child.stdout.on("data", append);
  child.stderr.on("data", append);

  await waitForServer(baseUrl, 60_000);

  return {
    baseUrl,
    logs: () => lines.join(""),
    stop: async () => {
      if (child.exitCode !== null) {
        return;
      }

      child.kill("SIGTERM");

      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          if (child.exitCode === null) {
            child.kill("SIGKILL");
          }
        }, 5_000);

        child.once("exit", () => {
          clearTimeout(timer);
          resolve();
        });
      });
    },
  };
}
