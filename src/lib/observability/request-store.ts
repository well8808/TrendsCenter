import { AsyncLocalStorage } from "node:async_hooks";

export interface ActiveRequestContext {
  requestId: string;
  route?: string;
  method?: string;
  startedAt?: number;
}

const requestStore = new AsyncLocalStorage<ActiveRequestContext>();

export function runWithRequestContext<T>(context: ActiveRequestContext, callback: () => T) {
  return requestStore.run(context, callback);
}

export function getActiveRequestContext() {
  return requestStore.getStore();
}
