export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status = 500, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function badRequest(message: string, details?: unknown) {
  return new AppError("BAD_REQUEST", message, 400, details);
}

export function unauthorized(message = "Sessao obrigatoria.") {
  return new AppError("UNAUTHORIZED", message, 401);
}

export function forbidden(message = "Acao nao autorizada.") {
  return new AppError("FORBIDDEN", message, 403);
}

export function notFound(message = "Recurso nao encontrado.") {
  return new AppError("NOT_FOUND", message, 404);
}

export function conflict(message: string, details?: unknown) {
  return new AppError("CONFLICT", message, 409, details);
}

export function serviceUnavailable(message: string, details?: unknown) {
  return new AppError("SERVICE_UNAVAILABLE", message, 503, details);
}

export function internalError(message = "Falha operacional interna.", details?: unknown) {
  return new AppError("INTERNAL_ERROR", message, 500, details);
}

export function toAppError(error: unknown) {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return internalError(error.message);
  }

  return internalError();
}
