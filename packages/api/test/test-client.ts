import { Language, QuranClient } from "../src";

// Create a shared test client for all tests
export const testClient = new QuranClient({
  clientId: "test-client-id",
  clientSecret: "test-client-secret",
  defaults: {
    language: Language.ENGLISH,
    perPage: 25,
  },
});
