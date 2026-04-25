type LogLevel = "info" | "warn" | "error";

import { getActiveRequestContext } from "@/lib/observability/request-store";

export interface LogContext {
  requestId?: string;
  scope: string;
  route?: string;
  method?: string;
  workspaceId?: string;
  userId?: string;
  jobId?: string;
  outboxId?: string;
  [key: string]: unknown;
}

function write(level: LogLevel, message: string, context: LogContext) {
  const activeRequest = getActiveRequestContext();
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    requestId: context.requestId ?? activeRequest?.requestId,
    route: context.route ?? activeRequest?.route,
    method: context.method ?? activeRequest?.method,
    ...context,
  };

  const serialized = JSON.stringify(payload);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export function createLogger(base: LogContext) {
  return {
    info(message: string, context: Record<string, unknown> = {}) {
      write("info", message, { ...base, ...context });
    },
    warn(message: string, context: Record<string, unknown> = {}) {
      write("warn", message, { ...base, ...context });
    },
    error(message: string, context: Record<string, unknown> = {}) {
      write("error", message, { ...base, ...context });
    },
  };
}
