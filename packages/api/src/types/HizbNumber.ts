import type { NumberRange, NumberUnionToString } from "./utils";

type _HizbNumber = NumberRange<1, 61>;
export type HizbNumber = _HizbNumber | NumberUnionToString<_HizbNumber>;
