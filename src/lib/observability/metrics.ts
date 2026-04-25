type MetricKind = "counter" | "gauge";

interface MetricSample {
  name: string;
  kind: MetricKind;
  value: number;
  tags?: Record<string, string>;
  updatedAt: string;
}

type ObservabilityGlobal = typeof globalThis & {
  __tmccMetrics?: Map<string, MetricSample>;
  __tmccBootedAt?: string;
};

function observabilityState() {
  const globalForMetrics = globalThis as ObservabilityGlobal;

  if (!globalForMetrics.__tmccMetrics) {
    globalForMetrics.__tmccMetrics = new Map<string, MetricSample>();
  }

  if (!globalForMetrics.__tmccBootedAt) {
    globalForMetrics.__tmccBootedAt = new Date().toISOString();
  }

  return {
    metrics: globalForMetrics.__tmccMetrics,
    bootedAt: globalForMetrics.__tmccBootedAt,
  };
}

function normalizeTags(tags?: Record<string, string>) {
  if (!tags) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(tags)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0)
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function metricKey(name: string, tags?: Record<string, string>) {
  const normalized = normalizeTags(tags);

  if (!normalized || Object.keys(normalized).length === 0) {
    return name;
  }

  return `${name}|${Object.entries(normalized)
    .map(([key, value]) => `${key}=${value}`)
    .join(",")}`;
}

export function incrementMetric(name: string, value = 1, tags?: Record<string, string>) {
  const state = observabilityState();
  const key = metricKey(name, tags);
  const current = state.metrics.get(key);

  state.metrics.set(key, {
    name,
    kind: "counter",
    value: (current?.value ?? 0) + value,
    tags: normalizeTags(tags),
    updatedAt: new Date().toISOString(),
  });
}

export function setGauge(name: string, value: number, tags?: Record<string, string>) {
  const state = observabilityState();
  const key = metricKey(name, tags);

  state.metrics.set(key, {
    name,
    kind: "gauge",
    value,
    tags: normalizeTags(tags),
    updatedAt: new Date().toISOString(),
  });
}

export function getMetricsSnapshot() {
  const state = observabilityState();

  return {
    bootedAt: state.bootedAt,
    samples: Array.from(state.metrics.values()).sort((left, right) => left.name.localeCompare(right.name)),
  };
}
