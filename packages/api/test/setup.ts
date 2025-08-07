import fetch from 'cross-fetch';
import { beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import { server } from '../mocks/server';

// Establish API mocking before all tests.
beforeAll(async () => {
  server.listen();
});

beforeEach(async () => {
  // we do this instead of passing a fetchFn every time
  globalThis.fetch = fetch;
});

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(async () => {
  server.resetHandlers();
});

// Clean up after the tests are finished.
afterAll(async () => {
  server.close();
});
