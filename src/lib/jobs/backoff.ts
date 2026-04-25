const baseDelayMs = 5_000;
const maxDelayMs = 15 * 60 * 1000;

export function calculateExponentialBackoff(attemptCount: number) {
  const exponent = Math.max(0, attemptCount - 1);

  return Math.min(baseDelayMs * 2 ** exponent, maxDelayMs);
}
