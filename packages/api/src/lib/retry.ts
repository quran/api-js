export const retry = async <T>(
  fn: () => Promise<T>,
  options: { retries: number } = { retries: 3 },
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i <= options.retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i === options.retries) {
        throw lastError;
      }

      // Simple exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000),
      );
    }
  }

  throw lastError!;
};
