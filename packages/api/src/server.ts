import type { ServerClientConfig } from "@/types";
import { Language } from "@/types";

import { createRuntimeClient } from "./runtime/create-client";

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

export const createServerClient = (config: ServerClientConfig) => {
  return createRuntimeClient("server", {
    ...config,
    defaults: {
      language: Language.ARABIC,
      ...config.defaults,
    },
  });
};

export type ServerClient = ReturnType<typeof createServerClient>;
