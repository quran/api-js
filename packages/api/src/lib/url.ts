import type { ApiParams } from "@/types";
import humps from "humps";

const { decamelize, decamelizeKeys } = humps;

export const removeBeginningSlash = (url: string) => {
  return url.startsWith("/") ? url.slice(1) : url;
};

const fieldsKey = ["word_fields", "translation_fields", "fields"];

export const paramsToString = (params?: ApiParams): string => {
  if (!params) return "";

  const paramsWithDecamelizedKeys = decamelizeKeys(params) as ApiParams;
  const paramsString = new URLSearchParams();

  for (const [key, value] of Object.entries(paramsWithDecamelizedKeys)) {
    if (value === undefined) continue;

    if (typeof value === "string") {
      paramsString.set(key, value);
    } else if (typeof value === "number") {
      paramsString.set(key, value.toString());
    } else if (typeof value === "boolean") {
      paramsString.set(key, value.toString());
    } else if (Array.isArray(value)) {
      paramsString.set(key, value.join(","));
    }

    // fields is a special case, it's an object with boolean values
    if (fieldsKey.includes(key)) {
      const fields = Object.entries(value)
        .filter(([, value]) => value)
        .map(([key]) => decamelize(key));
      if (fields.length > 0) {
        paramsString.set(key, fields.join(","));
      }
    }
  }

  if (paramsString.size === 0) return "";
  return `?${paramsString.toString()}`;
};
