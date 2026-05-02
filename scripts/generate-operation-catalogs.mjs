#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];
const DEFAULT_SOURCE_URL =
  "https://raw.githubusercontent.com/quran/qf-api-docs/main/openAPI";
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
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
  return route.replace(/:([A-Za-z_][\w]*)/g, "{$1}");
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

const readSpecs = async ({
  sourceDir,
  sourceUrl = DEFAULT_SOURCE_URL,
} = {}) => {
  if (sourceDir && sourceUrl !== DEFAULT_SOURCE_URL) {
    throw new Error("Use either --source-dir or --source-url, not both.");
  }

  const readJson = sourceDir
    ? (relativePath) => readJsonFromSourceDir(sourceDir, relativePath)
    : (relativePath) => readJsonFromSourceUrl(sourceUrl, relativePath);

  return {
    content: await readJson(inputSpecs.content.file),
    oauth2: await readJson(inputSpecs.oauth2.file),
    search: await readJson(inputSpecs.search.file),
    userRelated: await readJson(inputSpecs.userRelated.file),
  };
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
    const catalogOperation = {
      auth,
      method,
      path: normalizeOperationPath(route, service),
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
