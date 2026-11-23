const CANONICAL_POSITIVE_INTEGER = /^[1-9]\d*$/;

/**
 * Parses a Quran reference number (chapter, verse, juz, hizb, rub or page).
 * Strings must be plain decimal digits without a sign, exponent, hex prefix,
 * fraction, whitespace or leading zeros, so that a value which passes is the
 * same string the SDK sends to the API. Values that are neither numbers nor
 * strings, such as arrays, boxed strings or bigints, are rejected rather than
 * coerced.
 * @param value reference number
 * @returns the parsed number, or `null` when it is not a positive integer
 */
export const parseReferenceNumber = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 1 ? value : null;
  }
  if (typeof value !== "string") return null;
  return CANONICAL_POSITIVE_INTEGER.test(value) ? Number(value) : null;
};
