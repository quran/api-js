type _NumbersFrom0ToN<Nr extends number> = Nr extends Nr
  ? number extends Nr
    ? number
    : Nr extends 0
    ? never
    : _NumbersFrom0ToNRec<Nr, [], 0>
  : never;

type _NumbersFrom0ToNRec<
  Nr extends number,
  Counter extends any[],
  Accumulator extends number
> = Counter['length'] extends Nr
  ? Accumulator
  : _NumbersFrom0ToNRec<Nr, [any, ...Counter], Accumulator | Counter['length']>;

export type NumberRange<Start extends number, End extends number> = Exclude<
  _NumbersFrom0ToN<End>,
  _NumbersFrom0ToN<Start>
>;

export type NumberUnionToString<TType> = TType extends number
  ? `${TType}`
  : TType;
