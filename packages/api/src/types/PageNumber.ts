import { NumberRange, NumberUnionToString } from './utils';

type _PageNumber = NumberRange<1, 605>;
export type PageNumber = _PageNumber | NumberUnionToString<_PageNumber>;
