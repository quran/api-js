#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];
const RAW_HOST = "https://raw.githubusercontent.com";

const SOURCE_REPOSITORY = "quran/qf-api-docs";
const SOURCE_REPO_RAW_BASE = `${RAW_HOST}/${SOURCE_REPOSITORY}`;
const UNPINNED_REF = "main";
const DEFAULT_CONTRACT_PATH = "contracts/content-scopes/v1.json";

/**
 * Pinned source revision, from scripts/openapi-source.json.
 *
 * Generation, `--check` and CI all resolve their default from this one committed file, so a
 * rebuild cannot silently pick up a different upstream state. `--source-ref`, `--source-url` and
 * `--source-dir` still override it for local work.
 *
 * Read lazily and tolerantly: the module is copied and imported standalone by
 * test/operation-catalog-generator.test.js, where the pin file is not present. A missing pin
 * falls back to the unpinned branch and says so, rather than failing at import time. CI runs from
 * a full checkout, so CI is always pinned.
 */
let sourcePinCache;

const getSourcePin = () => {
  if (sourcePinCache) return sourcePinCache;

  const pinPath = path.join(scriptDir, "openapi-source.json");
  let pin;
  try {
    pin = JSON.parse(fsSync.readFileSync(pinPath, "utf8"));
  } catch (error) {
    // Only standalone imports without a pin may use the compatibility fallback.
    // A broken committed pin must never silently select a moving upstream revision.
    if (error.code !== "ENOENT") throw error;
    sourcePinCache = {
      available: false,
      contractPath: DEFAULT_CONTRACT_PATH,
      contractSha256: undefined,
      path: "openAPI",
      repository: SOURCE_REPOSITORY,
      contractUrl: `${SOURCE_REPO_RAW_BASE}/${UNPINNED_REF}/${DEFAULT_CONTRACT_PATH}`,
      isCommitSha: false,
      ref: UNPINNED_REF,
      url: `${SOURCE_REPO_RAW_BASE}/${UNPINNED_REF}/openAPI`,
    };
    return sourcePinCache;
  }

  if (!pin.repository || !pin.ref) {
    throw new Error(`${pinPath} must set "repository" and "ref"`);
  }

  if (
    pin.contractSha256 !== undefined &&
    !/^[0-9a-f]{64}$/u.test(pin.contractSha256)
  ) {
    throw new Error(
      `${pinPath} "contractSha256" must be a 64-character lowercase sha256 hex digest`,
    );
  }

  sourcePinCache = {
    available: true,
    contractPath: pin.contractPath ?? DEFAULT_CONTRACT_PATH,
    contractSha256: pin.contractSha256,
    path: pin.path ?? "openAPI",
    repository: pin.repository,
    contractUrl: `${RAW_HOST}/${pin.repository}/${pin.ref}/${pin.contractPath ?? DEFAULT_CONTRACT_PATH}`,
    isCommitSha: /^[0-9a-f]{40}$/u.test(pin.ref),
    ref: pin.ref,
    url: `${RAW_HOST}/${pin.repository}/${pin.ref}/${pin.path ?? "openAPI"}`,
  };
  return sourcePinCache;
};
const repoRoot = path.resolve(scriptDir, "..");
const defaultOutputDir = path.join(
  repoRoot,
  "packages",
  "api",
  "src",
  "generated",
  "specs",
);

const inputSpecs = {
  analytics: {
    file: "analytics/v1.json",
    service: "analytics",
    version: "v1",
  },
  content: {
    file: "content/v4.json",
    service: "content",
    version: "v4",
  },
  oauth2: {
    file: "oauth2-apis/v1.json",
    service: "oauth2",
    version: "v1",
  },
  search: {
    file: "search/v1.json",
    service: "search",
    version: "v1",
  },
  userRelated: {
    file: "user-related-apis/v1.json",
    version: "v1",
  },
};

const createSection = (service, version) => ({
  operations: {},
  service,
  version,
});

const createOperationCatalog = () => ({
  analytics: { v1: createSection("analytics", "v1") },
  auth: { v1: createSection("auth", "v1") },
  content: { v4: createSection("content", "v4") },
  oauth2: { v1: createSection("oauth2", "v1") },
  quranReflect: { v1: createSection("quranReflect", "v1") },
  search: { v1: createSection("search", "v1") },
});

const createPublicOperationCatalog = () => ({
  auth: { v1: createSection("auth", "v1") },
  oauth2: { v1: createSection("oauth2", "v1") },
  quranReflect: { v1: createSection("quranReflect", "v1") },
});

const toCamelCase = (value) => {
  const parts = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "operation";
  }

  return parts
    .map((part, index) => {
      const lower = part.toLowerCase();
      if (index === 0) {
        return lower;
      }

      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
};

const stripAuthPrefix = (operationName) => {
  if (!operationName.startsWith("auth")) {
    return operationName;
  }

  const rest = operationName.slice("auth".length);
  if (!rest || rest[0] !== rest[0].toUpperCase()) {
    return operationName;
  }

  return `${rest[0].toLowerCase()}${rest.slice(1)}`;
};

const normalizeOperationName = (operationId, method, route, service) => {
  const fallbackId = `${method}-${route}`;
  const operationName = toCamelCase(operationId ?? fallbackId);

  if (service === "auth") {
    return stripAuthPrefix(operationName);
  }

  return operationName;
};

const ensureLeadingSlash = (value) =>
  value.startsWith("/") ? value : `/${value}`;

const normalizePathTemplate = (route) => {
  return route.replace(/(^|\/)\:([A-Za-z_][\w]*)/g, "$1{$2}");
};

const stripPrefix = (route, prefix, replacement = "") => {
  if (route === prefix) {
    return replacement || "/";
  }

  if (!route.startsWith(`${prefix}/`)) {
    return route;
  }

  return ensureLeadingSlash(`${replacement}${route.slice(prefix.length)}`);
};

const normalizeOperationPath = (route, service) => {
  let normalizedPath = ensureLeadingSlash(normalizePathTemplate(route));

  if (service === "content") {
    normalizedPath = stripPrefix(normalizedPath, "/content/api/v4");
    normalizedPath = stripPrefix(normalizedPath, "/api/v4");
    return normalizedPath;
  }

  if (service === "search") {
    normalizedPath = stripPrefix(normalizedPath, "/search/v1", "/v1");
    normalizedPath = stripPrefix(normalizedPath, "/api/v1", "/v1");
    return normalizedPath;
  }

  if (service === "auth") {
    return stripPrefix(normalizedPath, "/auth/v1", "/v1");
  }

  if (service === "quranReflect") {
    return stripPrefix(normalizedPath, "/quran-reflect/v1", "/v1");
  }

  return normalizedPath;
};

const getOperationServers = (spec, pathItem, operation) => {
  return operation.servers ?? pathItem.servers ?? spec.servers ?? [];
};

const usesQuranReflectServer = (servers) => {
  return servers.some((server) => server.url?.includes("/quran-reflect"));
};

const getUserRelatedService = (servers) => {
  return usesQuranReflectServer(servers) ? "quranReflect" : "auth";
};

const getOauth2AuthMode = (spec, operation) => {
  const security = operation.security ?? spec.security ?? [];

  return security.some((securityEntry) =>
    Object.keys(securityEntry).some((scheme) =>
      scheme.toLowerCase().includes("bearer"),
    ),
  )
    ? "user"
    : "none";
};

const addOperation = (section, operationName, operation) => {
  let candidateName = operationName;
  let suffix = 2;

  while (section.operations[candidateName]) {
    candidateName = `${operationName}${suffix}`;
    suffix += 1;
  }

  section.operations[candidateName] = operation;
};

const getCatalogSection = (catalog, service, version) => {
  const serviceCatalog = catalog[service];
  const section = serviceCatalog?.[version];

  if (!section) {
    throw new Error(`Unsupported catalog section: ${service} ${version}`);
  }

  return section;
};

const readJsonFromSourceDir = async (sourceDir, relativePath) => {
  const content = await fs.readFile(path.join(sourceDir, relativePath), "utf8");
  return JSON.parse(content);
};

const readJsonFromSourceUrl = async (sourceUrl, relativePath) => {
  const baseUrl = sourceUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/${relativePath}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
};

/** sha256 of the contract text, with CRLF normalized exactly as qf-api-docs hashes it. */
export const hashContract = (text) =>
  crypto
    .createHash("sha256")
    .update(text.split("\r\n").join("\n"))
    .digest("hex");

const readOptionalText = async (read) => {
  try {
    return await read();
  } catch (error) {
    if (error?.code === "ENOENT" || error?.status === 404) return null;
    throw error;
  }
};

/**
 * Where the contract sits relative to the OpenAPI directory: the pin's `contractPath` is relative
 * to the docs repository root, and its `path` (the OpenAPI directory) is too, so climb out of
 * `path` and descend into `contractPath`. Used for every source, pinned or overridden.
 */
const contractPathFromSpecs = (pin) =>
  `${pin.path
    .split("/")
    .filter(Boolean)
    .map(() => "..")
    .join("/")}/${pin.contractPath}`;

const readContractFromSourceDir = (sourceDir, pin) =>
  readOptionalText(() =>
    fs.readFile(path.join(sourceDir, contractPathFromSpecs(pin)), "utf8"),
  );

const readContractFromUrl = (url) =>
  readOptionalText(async () => {
    const response = await fetch(url);
    if (!response.ok) {
      const error = new Error(
        `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
      );
      error.status = response.status;
      throw error;
    }
    return response.text();
  });

/**
 * Check the content scope contract the catalogs are generated from.
 *
 * qf-api-docs stamps every `x-qf-scopes` block with the sha256 of the contract it was generated
 * from (`contracts/content-scopes/v1.json`), and promises that each consumer's CI fails when that
 * hash drifts. This is that check for this package:
 *
 * - the OpenAPI metadata must name exactly one contract hash, and it must be the hash of the
 *   contract file at the same docs revision (stale metadata is caught here);
 * - when scripts/openapi-source.json records `contractSha256`, the pinned revision's contract must
 *   hash to it, so moving `ref` to a revision with a different contract fails until the new hash is
 *   reviewed and recorded alongside it.
 *
 * @returns {string | undefined} the verified contract hash, when the source carries one.
 */
export const verifyContentScopeContract = ({
  contentSpec,
  contractPath = DEFAULT_CONTRACT_PATH,
  contractText,
  recordedSha256,
  source = "the OpenAPI source",
}) => {
  const specHashes = new Set();
  visitOperations(contentSpec, ({ operation }) => {
    const hash = operation["x-qf-scopes"]?.contractSha256;
    if (hash) specHashes.add(hash);
  });

  if (specHashes.size > 1) {
    throw new Error(
      `x-qf-scopes in ${source} names more than one contract hash: ${[...specHashes].join(", ")}`,
    );
  }

  const actual = contractText == null ? undefined : hashContract(contractText);
  const [specHash] = specHashes;

  if ((specHash || recordedSha256) && !actual) {
    throw new Error(
      `${source} has no ${contractPath}, so its content scope contract hash cannot be verified.`,
    );
  }

  if (specHash && specHash !== actual) {
    throw new Error(
      `x-qf-scopes in ${source} records contract ${specHash}, but ${contractPath} ` +
        `hashes to ${actual}. The OpenAPI metadata is stale relative to the contract.`,
    );
  }

  if (recordedSha256 && recordedSha256 !== actual) {
    throw new Error(
      `The content scope contract at ${source} hashes to ${actual}, but ` +
        `scripts/openapi-source.json records contractSha256 ${recordedSha256}. Review the ` +
        "contract change, then update contractSha256 together with ref and regenerate the catalogs.",
    );
  }

  return actual && (specHash || recordedSha256) ? actual : undefined;
};

const readSpecs = async ({ sourceDir, sourceRef, sourceUrl: sourceUrlOption } = {}) => {
  if ([sourceDir, sourceRef, sourceUrlOption].filter(Boolean).length > 1) {
    throw new Error("Use only one of --source-dir, --source-url and --source-ref.");
  }

  const pin = getSourcePin();
  // --source-ref reads the pinned repository and OpenAPI directory at another revision.
  const sourceUrl = sourceRef
    ? `${RAW_HOST}/${pin.repository}/${sourceRef}/${pin.path}`
    : sourceUrlOption;
  const resolvedUrl = sourceUrl ?? pin.url;

  // The generated catalog is a published artifact: the scopes and paths in it are what the SDK
  // requests at runtime. A moving ref means a rebuild can change client behaviour with no
  // corresponding change here, so only a full commit SHA counts as reproducible.
  if (!sourceDir && !sourceUrl && !pin.isCommitSha) {
    console.warn(
      pin.available
        ? `scripts/openapi-source.json pins ref "${pin.ref}", which is not a commit SHA. ` +
            "A branch is not a reproducible input: set it to a full 40-character commit SHA."
        : `No scripts/openapi-source.json found; falling back to the mutable ${UNPINNED_REF} ` +
            "branch. This build is not reproducible.",
    );
  }

  const readJson = sourceDir
    ? (relativePath) => readJsonFromSourceDir(sourceDir, relativePath)
    : (relativePath) => readJsonFromSourceUrl(resolvedUrl, relativePath);

  const specs = {
    analytics: await readJson(inputSpecs.analytics.file),
    content: await readJson(inputSpecs.content.file),
    oauth2: await readJson(inputSpecs.oauth2.file),
    search: await readJson(inputSpecs.search.file),
    userRelated: await readJson(inputSpecs.userRelated.file),
  };

  // The recorded hash describes the pinned revision only. An explicit override is for local work
  // against another revision, so it is checked for internal consistency and the recorded hash is
  // only reported, never enforced.
  const usesPin = !sourceDir && !sourceUrl;
  const contractText = sourceDir
    ? await readContractFromSourceDir(sourceDir, pin)
    : await readContractFromUrl(
        usesPin
          ? pin.contractUrl
          : new URL(contractPathFromSpecs(pin), `${resolvedUrl.replace(/\/+$/, "")}/`).href,
      );
  const source = sourceDir ?? (usesPin ? `qf-api-docs@${pin.ref}` : resolvedUrl);
  const verified = verifyContentScopeContract({
    contentSpec: specs.content,
    contractPath: pin.contractPath,
    contractText,
    recordedSha256: usesPin ? pin.contractSha256 : undefined,
    source,
  });

  if (!usesPin && verified && pin.contractSha256 && verified !== pin.contractSha256) {
    console.warn(
      `${source} carries content scope contract ${verified}; scripts/openapi-source.json ` +
        `records ${pin.contractSha256}. Update both together when re-pinning.`,
    );
  }

  return specs;
};

const visitOperations = (spec, callback) => {
  for (const [route, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) {
        continue;
      }

      callback({ method, operation, pathItem, route });
    }
  }
};

/**
 * Lift the `x-qf-scopes` extension from an OpenAPI operation into catalog metadata.
 *
 * Only the fields the SDK needs at request time are carried over, so the generated catalog
 * shipped in the bundle stays small. `quotaBuckets` deliberately stays out: rate limiting is the
 * gateway's business and the SDK must never treat it as an authorization input.
 *
 * @param {object} operation - OpenAPI operation object.
 * @returns {object | undefined} scope metadata, when the operation declares any.
 */
const extractOperationScopes = (operation) => {
  const scopes = operation["x-qf-scopes"];
  if (!scopes) {
    return undefined;
  }

  const legacyAnyOf = scopes.legacyAnyOf ?? [];
  const granularAnyOf = scopes.granularAnyOf ?? [];
  if (legacyAnyOf.length === 0 || granularAnyOf.length === 0) {
    throw new Error(
      `x-qf-scopes on ${operation.operationId} must list both legacyAnyOf and granularAnyOf`,
    );
  }

  return {
    contractVersion: scopes.contractVersion,
    granularAnyOf,
    legacyAnyOf,
  };
};

const addSpecOperations = ({
  auth,
  catalog,
  publicCatalog,
  service,
  spec,
  version,
}) => {
  visitOperations(spec, ({ method, operation, route }) => {
    const operationName = normalizeOperationName(
      operation.operationId,
      method,
      route,
      service,
    );
    const section = getCatalogSection(catalog, service, version);
    const scopes = extractOperationScopes(operation);
    // Recorded once per section, so the shipped catalog names the reviewed contract it was
    // generated from without repeating the hash on every operation. verifyContentScopeContract
    // has already rejected a source whose operations name more than one hash.
    const contractSha256 = operation["x-qf-scopes"]?.contractSha256;
    if (contractSha256) section.contractSha256 = contractSha256;
    const catalogOperation = {
      auth,
      method,
      path: normalizeOperationPath(route, service),
      ...(scopes ? { scopes } : {}),
    };

    addOperation(section, operationName, catalogOperation);

    if (publicCatalog?.[service]?.[version]) {
      addOperation(
        getCatalogSection(publicCatalog, service, version),
        operationName,
        catalogOperation,
      );
    }
  });
};

const addUserRelatedOperations = ({ catalog, publicCatalog, spec }) => {
  visitOperations(spec, ({ method, operation, pathItem, route }) => {
    const service = getUserRelatedService(
      getOperationServers(spec, pathItem, operation),
    );
    const operationName = normalizeOperationName(
      operation.operationId,
      method,
      route,
      service,
    );
    const catalogOperation = {
      auth: "user",
      method,
      path: normalizeOperationPath(route, service),
    };

    addOperation(
      getCatalogSection(catalog, service, inputSpecs.userRelated.version),
      operationName,
      catalogOperation,
    );
    addOperation(
      getCatalogSection(publicCatalog, service, inputSpecs.userRelated.version),
      operationName,
      catalogOperation,
    );
  });
};

const addOauth2Operations = ({ catalog, publicCatalog, spec }) => {
  visitOperations(spec, ({ method, operation, route }) => {
    const service = inputSpecs.oauth2.service;
    const version = inputSpecs.oauth2.version;
    const operationName = normalizeOperationName(
      operation.operationId,
      method,
      route,
      service,
    );
    const catalogOperation = {
      auth: getOauth2AuthMode(spec, operation),
      method,
      path: normalizeOperationPath(route, service),
    };

    addOperation(
      getCatalogSection(catalog, service, version),
      operationName,
      catalogOperation,
    );
    addOperation(
      getCatalogSection(publicCatalog, service, version),
      operationName,
      catalogOperation,
    );
  });
};

export const generateCatalogs = async (options = {}) => {
  const specs = await readSpecs(options);
  const operationCatalog = createOperationCatalog();
  const publicOperationCatalog = createPublicOperationCatalog();

  addSpecOperations({
    auth: "app",
    catalog: operationCatalog,
    service: inputSpecs.analytics.service,
    spec: specs.analytics,
    version: inputSpecs.analytics.version,
  });
  addSpecOperations({
    auth: "app",
    catalog: operationCatalog,
    service: inputSpecs.content.service,
    spec: specs.content,
    version: inputSpecs.content.version,
  });
  addSpecOperations({
    auth: "app",
    catalog: operationCatalog,
    service: inputSpecs.search.service,
    spec: specs.search,
    version: inputSpecs.search.version,
  });
  addOauth2Operations({
    catalog: operationCatalog,
    publicCatalog: publicOperationCatalog,
    spec: specs.oauth2,
  });
  addUserRelatedOperations({
    catalog: operationCatalog,
    publicCatalog: publicOperationCatalog,
    spec: specs.userRelated,
  });

  return {
    operationCatalog,
    publicOperationCatalog,
  };
};

const formatJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

const getOutputPaths = (outputDir = defaultOutputDir) => ({
  operationCatalog: path.join(outputDir, "operation-catalog.json"),
  publicOperationCatalog: path.join(outputDir, "public-operation-catalog.json"),
});

export const writeCatalogs = async (catalogs, outputDir = defaultOutputDir) => {
  const outputPaths = getOutputPaths(outputDir);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    outputPaths.operationCatalog,
    formatJson(catalogs.operationCatalog),
  );
  await fs.writeFile(
    outputPaths.publicOperationCatalog,
    formatJson(catalogs.publicOperationCatalog),
  );
};

const readExistingCatalog = async (filePath) => {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }

    throw error;
  }
};

export const checkCatalogs = async (catalogs, outputDir = defaultOutputDir) => {
  const outputPaths = getOutputPaths(outputDir);
  const expected = {
    operationCatalog: formatJson(catalogs.operationCatalog),
    publicOperationCatalog: formatJson(catalogs.publicOperationCatalog),
  };
  const actual = {
    operationCatalog: await readExistingCatalog(outputPaths.operationCatalog),
    publicOperationCatalog: await readExistingCatalog(
      outputPaths.publicOperationCatalog,
    ),
  };

  return Object.entries(expected)
    .filter(([key, value]) => actual[key] !== value)
    .map(([key]) => outputPaths[key]);
};

const parseArgs = (args) => {
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--check") {
      options.check = true;
      continue;
    }

    if (arg === "--source-dir") {
      options.sourceDir = args[++index];
      continue;
    }

    if (arg === "--source-url") {
      options.sourceUrl = args[++index];
      continue;
    }

    // Convenience for the common case: pin the docs revision without spelling out the raw URL.
    if (arg === "--source-ref") {
      const ref = args[++index];
      if (!ref) {
        throw new Error("--source-ref requires a git ref, for example a commit SHA.");
      }
      options.sourceRef = ref;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const catalogs = await generateCatalogs(options);

  if (options.check) {
    const changedFiles = await checkCatalogs(catalogs);
    if (changedFiles.length > 0) {
      console.error("Generated operation catalogs are out of date:");
      for (const file of changedFiles) {
        console.error(`- ${path.relative(repoRoot, file)}`);
      }
      console.error(
        "Run `pnpm --filter @quranjs/api generate:operation-catalogs` and commit the updated catalogs.",
      );
      process.exitCode = 1;
      return;
    }

    console.log("Generated operation catalogs are up to date.");
    return;
  }

  await writeCatalogs(catalogs);
  console.log("Generated operation catalogs.");
};

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
