import type {
  HttpMethod,
  OperationDefinition,
  ServiceOperationCatalog,
} from "@/generated/contracts";
import { resolveCatalogOperation } from "@/generated/contracts";

export const HTTP_METHOD_TO_MUTATION_NAME: Record<HttpMethod, string> = {
  delete: "remove",
  get: "list",
  patch: "update",
  post: "create",
  put: "update",
};

export const toCamelCase = (value: string): string => {
  const parts = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "misc";
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

export const toPascalCase = (value: string): string => {
  const camel = toCamelCase(value);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
};

export const isPathParam = (segment: string): boolean =>
  segment.startsWith("{") && segment.endsWith("}");

export const getResourceSegments = (path: string): string[] => {
  const segments = path.split("/").filter(Boolean);
  if (segments[0]?.match(/^v\d+$/)) {
    return segments.slice(1);
  }

  return segments;
};

export const pickGeneratedMethodName = (
  operation: OperationDefinition,
): string => {
  const resourceSegments = getResourceSegments(operation.path);
  const lastSegment = resourceSegments.at(-1);
  const literalSegments = resourceSegments.filter(
    (segment) => !isPathParam(segment),
  );
  const lastLiteral = literalSegments.at(-1);
  const groupLiteral = literalSegments[0];

  if (resourceSegments.length === 1) {
    return HTTP_METHOD_TO_MUTATION_NAME[operation.method];
  }

  if (
    resourceSegments.length === 2 &&
    lastSegment &&
    isPathParam(lastSegment)
  ) {
    if (operation.method === "get") {
      return "get";
    }

    if (operation.method === "delete") {
      return "remove";
    }

    return "update";
  }

  if (lastSegment && !isPathParam(lastSegment) && lastLiteral) {
    if (lastLiteral === groupLiteral) {
      return `${HTTP_METHOD_TO_MUTATION_NAME[operation.method]}ById`;
    }

    return toCamelCase(lastLiteral);
  }

  return toCamelCase(operation.operationName);
};

export type RawOperation = (request?: unknown) => Promise<unknown>;
export type GeneratedGroup = Record<string, RawOperation>;
export type GeneratedGroups = Record<string, GeneratedGroup>;

export interface FetcherLike {
  request<T = unknown>(
    service: string,
    path: string,
    query?: unknown,
    request?: unknown,
  ): Promise<T>;
  requestOperation<T = unknown>(
    operation: OperationDefinition,
    request?: unknown,
  ): Promise<T>;
  getUserSession(): Promise<unknown>;
  setUserSession(session: unknown): Promise<void>;
  buildServiceUrl(service: string, path: string, query?: unknown): string;
}

export const createRawClient = (
  fetcher: FetcherLike,
  section: ServiceOperationCatalog,
): Record<string, RawOperation> => {
  const rawOperations: Record<string, RawOperation> = {};

  for (const [operationName, operation] of Object.entries(section.operations)) {
    const resolvedOperation = resolveCatalogOperation(
      section,
      operationName,
      operation,
    );

    rawOperations[operationName] = (request?: unknown) =>
      fetcher.requestOperation(resolvedOperation, request);
  }

  return rawOperations;
};

export const createGeneratedGroups = (
  section: ServiceOperationCatalog,
  rawOperations: Record<string, RawOperation>,
): GeneratedGroups => {
  const groups: GeneratedGroups = {};

  for (const [operationName, operation] of Object.entries(section.operations)) {
    const resolvedOperation = resolveCatalogOperation(
      section,
      operationName,
      operation,
    );
    const literals = getResourceSegments(resolvedOperation.path).filter(
      (segment) => !isPathParam(segment),
    );
    const groupName = toCamelCase(literals[0] ?? "misc");
    const suggestedName = pickGeneratedMethodName(resolvedOperation);
    const currentGroup = groups[groupName] ?? {};
    let methodName = suggestedName;

    if (currentGroup[methodName]) {
      methodName = `${suggestedName}${toPascalCase(operationName)}`;
    }

    currentGroup[methodName] = rawOperations[operationName]!;
    groups[groupName] = currentGroup;
  }

  return groups;
};
