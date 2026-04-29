import { Language } from "../src";
import { createServerClient } from "../src/server";

// Create a shared test client for all tests
export const testClient = createServerClient({
  clientId: "test-client-id",
  clientSecret: "test-client-secret",
  defaults: {
    language: Language.ENGLISH,
    perPage: 25,
  },
});
