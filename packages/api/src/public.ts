import type { PublicClientConfig } from "@/types";

import { createPublicRuntimeClient } from "./runtime/create-public-client";

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
export type { AppStateTransport } from "@/types";
export type { TokenStorage, UserSession } from "@/types";

export const createPublicClient = (config: PublicClientConfig) => {
  if ((config as PublicClientConfig & { clientSecret?: string }).clientSecret) {
    throw new Error("client_secret is server-only. Use @quranjs/api/server.");
  }

  return createPublicRuntimeClient(config);
};

export type PublicClient = ReturnType<typeof createPublicClient>;
