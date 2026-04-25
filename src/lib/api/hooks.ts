"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  handleClientApiError,
  type ResourceErrorInfo,
} from "@/lib/api/error-handling";

export type ResourceStatus = "idle" | "loading" | "success" | "error";

export interface ResourceState<T> {
  data: T | null;
  status: ResourceStatus;
  error: ResourceErrorInfo | null;
  /** True enquanto há fetch em voo (inclui refetch). */
  isFetching: boolean;
  /** Timestamp do ultimo sucesso. */
  updatedAt: number | null;
  /** requestId do ultimo envelope recebido (sucesso ou erro). Para auditoria. */
  requestId: string | null;
}

export type { ResourceErrorInfo };

export interface UseApiResourceOptions<T> {
  /** Dados iniciais (ex: hidratação SSR). Quando presente, status inicia como "success". */
  initialData?: T;
  /** Timestamp estavel da hidratacao SSR. Evita mismatch em UI que exibe horario inicial. */
  initialUpdatedAt?: number;
  /** Não dispara fetch no mount. Usuário chama refetch manualmente. */
  manual?: boolean;
  /** Callback pra erro — útil pra extensões locais (banner, toast).
   *  Redirect em 401 e telemetria já são tratados de forma central. */
  onError?: (error: ResourceErrorInfo) => void;
  /** Rotulo usado na telemetria (ex.: "job-runs-feed"). */
  telemetryContext?: string;
}

interface UseApiResourceReturn<T> extends ResourceState<T> {
  refetch: () => Promise<T | null>;
  setData: (updater: T | ((prev: T | null) => T)) => void;
  reset: () => void;
}

type Fetcher<T> = (signal: AbortSignal) => Promise<{ data: T; meta: { requestId: string } }>;

/**
 * Resource hook com abort-on-unmount, refetch seguro e tracking de requestId.
 * Suporta hidratação SSR via `initialData` — nesse caso nao faz fetch no mount.
 */
export function useApiResource<T>(
  fetcher: Fetcher<T>,
  deps: ReadonlyArray<unknown>,
  options: UseApiResourceOptions<T> = {},
): UseApiResourceReturn<T> {
  const { initialData, initialUpdatedAt, manual = false, onError, telemetryContext } = options;
  const hasInitial = initialData !== undefined;

  const [state, setState] = useState<ResourceState<T>>(() => ({
    data: hasInitial ? initialData : null,
    status: hasInitial ? "success" : manual ? "idle" : "loading",
    error: null,
    isFetching: !manual && !hasInitial,
    updatedAt: hasInitial ? initialUpdatedAt ?? null : null,
    requestId: null,
  }));

  const fetcherRef = useRef(fetcher);
  const manualRef = useRef(manual);
  useEffect(() => {
    fetcherRef.current = fetcher;
    manualRef.current = manual;
  });

  // Flag travada no primeiro render: replica o teste original
  // (hasInitial && state.{success,updatedAt!=null} && deps.length===0).
  // No mount, hasInitial implica state.updatedAt/status corretos via useState initializer.
  const skipFirstFetchRef = useRef(!manual && hasInitial && deps.length === 0);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const run = useCallback(async (): Promise<T | null> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, status: prev.data ? prev.status : "loading", isFetching: true }));

    try {
      const result = await fetcherRef.current(controller.signal);
      if (!mountedRef.current || controller.signal.aborted) return null;
      setState({
        data: result.data,
        status: "success",
        error: null,
        isFetching: false,
        updatedAt: Date.now(),
        requestId: result.meta.requestId,
      });
      return result.data;
    } catch (error) {
      if (controller.signal.aborted) return null;
      if (!mountedRef.current) return null;
      const info = handleClientApiError(error, {
        context: telemetryContext ? `hook:useApiResource:${telemetryContext}` : "hook:useApiResource",
      });
      setState((prev) => ({
        ...prev,
        status: "error",
        error: info,
        isFetching: false,
        requestId: info.requestId === "n/a" ? prev.requestId : info.requestId,
      }));
      onError?.(info);
      return null;
    }
  }, [onError, telemetryContext]);

  const runRef = useRef(run);
  useEffect(() => {
    runRef.current = run;
  });

  useEffect(() => {
    if (manualRef.current) return;
    if (skipFirstFetchRef.current) {
      // já hidratado via SSR sem deps dinâmicos; pula primeiro fetch
      skipFirstFetchRef.current = false;
      return;
    }
    // agendar fora do commit phase: evita setState síncrono dentro do effect
    queueMicrotask(() => {
      void runRef.current();
    });
    // `deps` e a API publica do hook; o chamador decide quando o resource deve refazer fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps]);

  const setData = useCallback((updater: T | ((prev: T | null) => T)) => {
    setState((prev) => {
      const next = typeof updater === "function" ? (updater as (p: T | null) => T)(prev.data) : updater;
      return { ...prev, data: next, updatedAt: Date.now() };
    });
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({
      data: hasInitial ? initialData : null,
      status: hasInitial ? "success" : "idle",
      error: null,
      isFetching: false,
      updatedAt: hasInitial ? initialUpdatedAt ?? null : null,
      requestId: null,
    });
  }, [hasInitial, initialData, initialUpdatedAt]);

  return { ...state, refetch: run, setData, reset };
}

export interface UsePollingOptions {
  /** ms entre ticks quando a "janela" está ativa (default 3000). */
  activeIntervalMs?: number;
  /** ms entre ticks quando nada muda / idle (default 15000). */
  idleIntervalMs?: number;
  /** retorna true se o estado atual deve ser considerado "ativo" (acelera polling). */
  isActive?: () => boolean;
  /** Pausa o loop. */
  enabled?: boolean;
  /** Pausa quando document.hidden === true. */
  pauseWhenHidden?: boolean;
}

/**
 * Loop de polling com duas cadências (ativa/idle), pausa quando tab escondida,
 * não dispara overlap (aguarda o tick anterior completar).
 */
export function usePolling(tick: () => Promise<unknown>, options: UsePollingOptions = {}) {
  const {
    activeIntervalMs = 3000,
    idleIntervalMs = 15000,
    isActive,
    enabled = true,
    pauseWhenHidden = true,
  } = options;

  const tickRef = useRef(tick);
  const isActiveRef = useRef(isActive);
  useEffect(() => {
    tickRef.current = tick;
    isActiveRef.current = isActive;
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (cancelled) return;
      const hidden = pauseWhenHidden && typeof document !== "undefined" && document.hidden;
      if (hidden) {
        timeoutId = setTimeout(schedule, idleIntervalMs);
        return;
      }
      const active = isActiveRef.current?.() ?? false;
      const delay = active ? activeIntervalMs : idleIntervalMs;
      timeoutId = setTimeout(async () => {
        if (cancelled) return;
        try {
          await tickRef.current();
        } catch {
          // swallow — caller trata via resource hook próprio
        }
        schedule();
      }, delay);
    };

    schedule();

    const onVisibility = () => {
      if (!document.hidden && timeoutId) {
        clearTimeout(timeoutId);
        // tick imediato ao voltar
        void tickRef.current().finally(schedule);
      }
    };
    if (pauseWhenHidden && typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (pauseWhenHidden && typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
    };
  }, [enabled, activeIntervalMs, idleIntervalMs, pauseWhenHidden]);
}

export { defaultUnauthorizedHandler, setUnauthorizedHandler } from "@/lib/api/error-handling";
