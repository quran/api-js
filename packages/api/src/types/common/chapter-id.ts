import type { versesMapping } from "@/utils/verses-mapping";

import type { NumberUnionToString } from "../utils";

export type ChapterId =
  | keyof typeof versesMapping
  | NumberUnionToString<keyof typeof versesMapping>;
