import { describe, expect, it, vi } from "vitest";

import { retry } from "../src/lib/retry";

describe("retry helper", () => {
  it("retries until the wrapped promise resolves", async () => {
    vi.useFakeTimers();

    try {
      const task = vi
        .fn<[], Promise<string>>()
        .mockRejectedValueOnce(new Error("first failure"))
        .mockResolvedValueOnce("success");

      const promise = retry(task, { retries: 1 });
      const expectation = expect(promise).resolves.toBe("success");

      await vi.runAllTimersAsync();

      await expectation;
      expect(task).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("propagates the last error once retries are exhausted", async () => {
    vi.useFakeTimers();

    try {
      const error = new Error("always failing");
      const task = vi.fn<[], Promise<never>>().mockRejectedValue(error);

      const promise = retry(task, { retries: 2 });
      const expectation = expect(promise).rejects.toBe(error);

      await vi.runAllTimersAsync();

      await expectation;
      expect(task).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });
});
