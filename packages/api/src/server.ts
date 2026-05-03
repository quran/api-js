import { Language } from "@/types";
import type { ServerClientConfig } from "@/types";

import { createRuntimeClient } from "./runtime/create-client";

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
