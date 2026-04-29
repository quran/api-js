import type { ApiService } from "@/types";

import operationCatalogJson from "./specs/operation-catalog.json";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";
export type OperationAuthMode = "none" | "app" | "user";

export interface OperationDefinition {
  auth: OperationAuthMode;
  method: HttpMethod;
  operationId?: string;
  operationName: string;
  path: string;
  serverUrl?: string;
  service: ApiService;
  tags: string[];
  version: string;
}

export interface ServiceOperationCatalog {
  operations: Record<string, OperationDefinition>;
  service: ApiService;
  version: string;
}

interface OperationCatalog {
  auth: { v1: ServiceOperationCatalog };
  content: { v4: ServiceOperationCatalog };
  oauth2: { v1: ServiceOperationCatalog };
  quranReflect: { v1: ServiceOperationCatalog };
  search: { v1: ServiceOperationCatalog };
}

export const operationCatalog = operationCatalogJson as OperationCatalog;

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
  return versionCatalog?.operations[operationName];
};
