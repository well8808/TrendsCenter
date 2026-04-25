export interface ApiResponseMeta {
  requestId: string;
  timestamp: string;
}

export interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
  meta: ApiResponseMeta;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  status: number;
  requestId: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  ok: false;
  error: ApiErrorBody;
  meta: ApiResponseMeta;
}

export type ApiResponseEnvelope<T> = ApiSuccessResponse<T> | ApiErrorResponse;
