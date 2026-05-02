import type {
  CatalogOperationDefinition as BaseCatalogOperationDefinition,
  OperationDefinition as BaseOperationDefinition,
  ServiceOperationCatalog as BaseServiceOperationCatalog,
  HttpMethod,
  OperationAuthMode,
} from "./contracts";
import publicOperationCatalogJson from "./specs/public-operation-catalog.json";

export type AuthService = "auth" | "quranReflect";

export type PublicApiService = AuthService | "oauth2";

export interface OperationDefinition
  extends Omit<BaseOperationDefinition, "service"> {
  service: PublicApiService;
}

export interface CatalogOperationDefinition
  extends Omit<BaseCatalogOperationDefinition, "service"> {
  service?: PublicApiService;
}

export interface ServiceOperationCatalog
  extends Omit<BaseServiceOperationCatalog, "operations" | "service"> {
  operations: Record<string, CatalogOperationDefinition>;
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
