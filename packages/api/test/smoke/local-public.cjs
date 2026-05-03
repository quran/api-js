const { createPublicClient } = require("../../dist/public.min.js");

const getEnv = (name) => process.env[name]?.trim();
const LOCAL_SERVICE_OVERRIDES = {
  authBaseUrl: "http://localhost:3001",
  quranReflectBaseUrl: "http://localhost:9000",
};

const requireEnv = (name) => {
  const value = getEnv(name);
  if (value) {
    return value;
  }

  console.error(`Missing required environment variable: ${name}`);
  process.exit(1);
};

const getCollectionSize = (value) => {
  if (Array.isArray(value?.data)) {
    return value.data.length;
  }

  if (Array.isArray(value)) {
    return value.length;
  }

  return 0;
};

const assertLocalMode = () => {
  if (getEnv("QURANJS_LOCAL_SMOKE") === "1") {
    return;
  }

  console.error(
    "This script is a local-only maintainer smoke test. Run `pnpm smoke:local:public` instead of invoking it like a normal SDK example.",
  );
  process.exit(1);
};

const buildLocalServices = () => ({
  authBaseUrl: getEnv("AUTH_BASE_URL") ?? LOCAL_SERVICE_OVERRIDES.authBaseUrl,
  quranReflectBaseUrl:
    getEnv("QURAN_REFLECT_BASE_URL") ??
    LOCAL_SERVICE_OVERRIDES.quranReflectBaseUrl,
});

const main = async () => {
  assertLocalMode();

  const client = createPublicClient({
    clientId: requireEnv("CLIENT_ID"),
    clientType: getEnv("CLIENT_TYPE") ?? "confidential-proxy",
    services: buildLocalServices(),
    userSession: {
      accessToken: requireEnv("QF_USER_ACCESS_TOKEN"),
      refreshToken: getEnv("QF_USER_REFRESH_TOKEN"),
    },
  });

  const notes = await client.auth.v1.notes.list();
  const profile = await client.quranReflect.v1.users.profile();

  console.log(`Notes returned: ${getCollectionSize(notes)}`);
  console.log(
    `Profile keys: ${Object.keys(profile).slice(0, 5).join(", ") || "none"}`,
  );
  console.log("Used local-only service overrides for smoke verification.");
};

main().catch((error) => {
  console.error("Local public smoke test failed.");

  if (String(error?.message ?? "").includes("401")) {
    console.error(
      "Your QF_USER_ACCESS_TOKEN is likely expired. Mint a fresh user access token and run the command again.",
    );
  }

  console.error(error);
  process.exit(1);
});
