import { describe, expect, it } from "vitest";

import { calculateExponentialBackoff } from "./backoff";

describe("calculateExponentialBackoff", () => {
  it("starts at the base delay", () => {
    expect(calculateExponentialBackoff(1)).toBe(5_000);
  });

  it("grows exponentially and caps at fifteen minutes", () => {
    expect(calculateExponentialBackoff(2)).toBe(10_000);
    expect(calculateExponentialBackoff(3)).toBe(20_000);
    expect(calculateExponentialBackoff(20)).toBe(15 * 60 * 1000);
  });
});
