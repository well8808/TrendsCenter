export {
  apiFetch,
  apiGet,
  apiPost,
  ApiError,
  ApiTransportError,
  type ApiRequestOptions,
} from "@/lib/api/client";

export {
  useApiResource,
  usePolling,
  type ResourceState,
  type ResourceStatus,
  type UseApiResourceOptions,
  type UsePollingOptions,
} from "@/lib/api/hooks";

export {
  defaultUnauthorizedHandler,
  setUnauthorizedHandler,
  handleClientApiError,
  toResourceErrorInfo,
  type ResourceErrorInfo,
  type HandleClientApiErrorContext,
} from "@/lib/api/error-handling";

export {
  getCurrentWorkspaceApi,
  listTrendsApi,
  getTrendByIdApi,
  listJobRunsApi,
  submitIngestionRequestApi,
  submitProviderReelsImportApi,
  getProviderReelsImportStatusApi,
  requestReelsSearchAssistantApi,
  getHealthApi,
  type WorkspaceDto,
  type TrendsSearchParams,
  type JobRunDto,
  type JobRunsListDto,
  type ListJobRunsParams,
  type JobStatus,
  type IngestionRequestBody,
  type IngestionRequestAckDto,
  type ProviderReelsImportBody,
  type ProviderReelsImportDto,
  type ProviderReelsImportMode,
  type ReelsSearchAssistantBody,
  type ReelsSearchAssistantPlanDto,
  type HealthDto,
} from "@/lib/api/endpoints";
