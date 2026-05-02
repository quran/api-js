import type {
  OperationDefinition as BaseOperationDefinition,
  ServiceOperationCatalog as BaseServiceOperationCatalog,
  HttpMethod,
  OperationAuthMode,
} from "./contracts";
import publicOperationCatalogJson from "./specs/public-operation-catalog.json";

export type PublicApiService = "auth" | "oauth2" | "quranReflect";

export interface OperationDefinition
  extends Omit<BaseOperationDefinition, "service"> {
  service: PublicApiService;
}

export interface ServiceOperationCatalog
  extends Omit<BaseServiceOperationCatalog, "operations" | "service"> {
  operations: Record<string, OperationDefinition>;
  service: PublicApiService;
}

interface PublicOperationCatalog {
  auth: { v1: ServiceOperationCatalog };
  oauth2: { v1: ServiceOperationCatalog };
  quranReflect: { v1: ServiceOperationCatalog };
}

export const publicOperationCatalog =
  publicOperationCatalogJson as PublicOperationCatalog;

export type { HttpMethod, OperationAuthMode };
