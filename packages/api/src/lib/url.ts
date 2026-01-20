import type { ApiParams } from "@/types";
import humps from "humps";

const { decamelize } = humps;

export const removeBeginningSlash = (url: string) => {
  return url.startsWith("/") ? url.slice(1) : url;
};

const fieldsKey = ["wordFields", "translationFields", "fields"] as const;
const fieldsKeySet = new Set<string>([
  ...fieldsKey,
  ...fieldsKey.map((key) => decamelize(key)),
]);
const preservedKeys = new Set(["navigationalResultsNumber", "versesResultsNumber"]);

export const paramsToString = (params?: ApiParams): string => {
  if (!params) return "";

  const paramsString = new URLSearchParams();

  for (const [rawKey, rawValue] of Object.entries(params)) {
    if (rawValue === undefined) continue;

    const key = preservedKeys.has(rawKey) ? rawKey : decamelize(rawKey);

    // fields is a special case, it's an object with boolean values
    if (fieldsKeySet.has(rawKey) || fieldsKeySet.has(key)) {
      const fields = Object.entries(rawValue as Record<string, boolean>)
        .filter(([, value]) => value)
        .map(([fieldKey]) => decamelize(fieldKey));
      if (fields.length > 0) {
        paramsString.set(key, fields.join(","));
      }
      continue;
    }

    if (typeof rawValue === "string") {
      paramsString.set(key, rawValue);
    } else if (typeof rawValue === "number") {
      paramsString.set(key, rawValue.toString());
    } else if (typeof rawValue === "boolean") {
      paramsString.set(key, rawValue.toString());
    } else if (Array.isArray(rawValue)) {
      paramsString.set(key, rawValue.join(","));
    }
  }

  if (paramsString.size === 0) return "";
  return `?${paramsString.toString()}`;
};
