import type { ApiService } from "@/types";

import operationCatalogJson from "./specs/operation-catalog.json";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";
export type OperationAuthMode = "none" | "app" | "user";

/**
 * OAuth scopes an operation accepts, from the pinned content scope contract.
 *
 * `legacyAnyOf` is what the API accepts today; `granularAnyOf` is the successor. The API accepts
 * ANY ONE of the two lists combined, so a token carrying either is authorized. The SDK requests
 * one of them depending on `contentScopeMode`, and never requests both.
 */
export interface OperationScopes {
  contractVersion: string;
  legacyAnyOf: string[];
  granularAnyOf: string[];
}

export interface OperationDefinition {
  auth: OperationAuthMode;
  method: HttpMethod;
  operationId?: string;
  operationName: string;
  path: string;
  scopes?: OperationScopes;
  serverUrl?: string;
  service: ApiService;
  tags: string[];
  version: string;
}

export type CatalogOperationDefinition = Omit<
  OperationDefinition,
  "operationName" | "service" | "tags" | "version"
> &
  Partial<
    Pick<OperationDefinition, "operationName" | "service" | "tags" | "version">
  >;

export interface ServiceOperationCatalog {
  operations: Record<string, CatalogOperationDefinition>;
  service: ApiService;
  version: string;
}

interface OperationCatalog {
  analytics: { v1: ServiceOperationCatalog };
  auth: { v1: ServiceOperationCatalog };
  content: { v4: ServiceOperationCatalog };
  oauth2: { v1: ServiceOperationCatalog };
  quranReflect: { v1: ServiceOperationCatalog };
  search: { v1: ServiceOperationCatalog };
}

export const operationCatalog = operationCatalogJson as OperationCatalog;

export const resolveCatalogOperation = (
  section: ServiceOperationCatalog,
  operationName: string,
  operation: CatalogOperationDefinition,
): OperationDefinition => {
  return {
    ...operation,
    operationName: operation.operationName ?? operationName,
    service: operation.service ?? section.service,
    tags: operation.tags ?? [],
    version: operation.version ?? section.version,
  };
};

export const getOperationByName = (
  service: ApiService,
  version: string,
  operationName: string,
): OperationDefinition | undefined => {
  const serviceCatalog = operationCatalog[service] as
    | Record<string, ServiceOperationCatalog | undefined>
    | undefined;
  if (!serviceCatalog) {
    return undefined;
  }

  const versionCatalog = serviceCatalog[version];
  const operation = versionCatalog?.operations[operationName];
  if (!versionCatalog || !operation) {
    return undefined;
  }

  return resolveCatalogOperation(versionCatalog, operationName, operation);
};
