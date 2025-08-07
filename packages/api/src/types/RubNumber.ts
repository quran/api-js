import { NumberRange, NumberUnionToString } from './utils';

type _RubNumber = NumberRange<1, 241>;
export type RubNumber = _RubNumber | NumberUnionToString<_RubNumber>;
