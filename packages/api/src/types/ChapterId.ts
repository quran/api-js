import { NumberRange, NumberUnionToString } from './utils';

type _ChapterId = NumberRange<1, 115>;
export type ChapterId = _ChapterId | NumberUnionToString<_ChapterId>;
