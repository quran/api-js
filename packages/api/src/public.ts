import type { PublicClientConfig } from "@/types";

import { createPublicRuntimeClient } from "./runtime/create-public-client";

export { createAppStateReconciler } from "./runtime/app-state-reconciler";
export {
  AppStateProtocolError,
  createAppStateMemoryStore,
} from "./runtime/app-state-state";
export { QuranHttpError } from "./sdk/http-error";
export {
  getAppStateErrorCode,
  isAppStateHttpError,
} from "./sdk/app-state-errors";
export type {
  AppStateErrorCode,
  AppStateErrorPayload,
  AppStateHttpError,
} from "./sdk/app-state-errors";
export type {
  AppStateAccountState,
  AppStateBootstrapPage,
  AppStateChange,
  AppStateChangesOptions,
  AppStateChangesPage,
  AppStateCollection,
  AppStateConfiguration,
  AppStateDocument,
  AppStateDocumentWithEtag,
  AppStateJsonValue,
  AppStateLimits,
  AppStateMutationOptions,
  AppStateMutationResult,
  AppStatePage,
  AppStatePageOptions,
  AppStatePendingDelete,
  AppStatePendingMutation,
  AppStatePendingMutationBase,
  AppStatePendingPut,
  AppStatePutBody,
  AppStateReconciler,
  AppStateReconcilerOptions,
  AppStateResponse,
  AppStateStateView,
  AppStateStore,
  AppStateStoredDocument,
  AppStateStoreReducer,
  AppStateSuccess,
  AppStateTransport,
  AppStateVisibleDocument,
} from "@/types";
export type { TokenStorage, UserSession } from "@/types";

export const createPublicClient = (config: PublicClientConfig) => {
  if ((config as PublicClientConfig & { clientSecret?: string }).clientSecret) {
    throw new Error("client_secret is server-only. Use @quranjs/api/server.");
  }

  return createPublicRuntimeClient(config);
};

export type PublicClient = ReturnType<typeof createPublicClient>;
