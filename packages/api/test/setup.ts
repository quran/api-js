import fetch from "cross-fetch";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

import { server } from "../mocks/server";

// Establish API mocking before all tests.
beforeAll(() => {
  server.listen();
});

beforeEach(() => {
  // we do this instead of passing a fetchFn every time
  globalThis.fetch = fetch;
});

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => {
  // we do this instead of passing a fetchFn every time
  globalThis.fetch = fetch;
  server.resetHandlers();
});

// Clean up after the tests are finished.
afterAll(() => {
  server.close();
});
