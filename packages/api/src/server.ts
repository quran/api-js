import type { ServerClientConfig } from "@/types";

import { createRuntimeClient } from "./runtime/create-client";

export const createServerClient = (config: ServerClientConfig) => {
  return createRuntimeClient("server", config);
};

export type ServerClient = ReturnType<typeof createServerClient>;
