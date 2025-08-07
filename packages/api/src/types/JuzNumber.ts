import type { NumberRange, NumberUnionToString } from "./utils";

type _JuzNumber = NumberRange<1, 31>;
export type JuzNumber = _JuzNumber | NumberUnionToString<_JuzNumber>;
