const { SearchMode } = require("../../dist/index.min.js");
const { createServerClient } = require("../../dist/server.min.js");

const getEnv = (name) => process.env[name]?.trim();
const LOCAL_SERVICE_OVERRIDES = {
  authBaseUrl: "http://localhost:3001",
  contentBaseUrl: "http://localhost:3020",
  quranReflectBaseUrl: "http://localhost:9000",
  searchBaseUrl: "http://localhost:3002",
  tokenHost: "http://localhost:5444",
};

const requireEnv = (name) => {
  const value = getEnv(name);
  if (value) {
    return value;
  }

  console.error(`Missing required environment variable: ${name}`);
  process.exit(1);
};

const assertLocalMode = () => {
  if (getEnv("QURANJS_LOCAL_SMOKE") === "1") {
    return;
  }

  console.error(
    "This script is a local-only maintainer smoke test. Run `pnpm smoke:local:server` instead of invoking it like a normal SDK example.",
  );
  process.exit(1);
};

const buildLocalServices = () => ({
  gatewayUrl: getEnv("GATEWAY_URL"),
  tokenHost: getEnv("TOKEN_HOST") ?? LOCAL_SERVICE_OVERRIDES.tokenHost,
  contentBaseUrl:
    getEnv("CONTENT_BASE_URL") ?? LOCAL_SERVICE_OVERRIDES.contentBaseUrl,
  searchBaseUrl:
    getEnv("SEARCH_BASE_URL") ?? LOCAL_SERVICE_OVERRIDES.searchBaseUrl,
  authBaseUrl: getEnv("AUTH_BASE_URL") ?? LOCAL_SERVICE_OVERRIDES.authBaseUrl,
  quranReflectBaseUrl:
    getEnv("QURAN_REFLECT_BASE_URL") ??
    LOCAL_SERVICE_OVERRIDES.quranReflectBaseUrl,
});

const main = async () => {
  assertLocalMode();

  const client = createServerClient({
    clientId: requireEnv("CLIENT_ID"),
    clientSecret: requireEnv("CLIENT_SECRET"),
    services: buildLocalServices(),
  });

  const chapters = await client.content.v4.chapters.list();
  const search = await client.search.v1.query({
    query: getEnv("SEARCH_QUERY") ?? "mercy",
    mode: SearchMode.Quick,
  });

  console.log(`Chapters returned: ${chapters.length}`);
  console.log(`Search page: ${search.pagination.currentPage}`);
  console.log(`Search records: ${search.pagination.totalRecords}`);
  console.log("Used local-only service overrides for smoke verification.");
};

main().catch((error) => {
  console.error("Local server smoke test failed.");
  console.error(error);
  process.exit(1);
});
