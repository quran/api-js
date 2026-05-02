export const API_BASE_URL = "https://apis.quran.foundation";

export const DEFAULT_BASE_URLS = {
  auth: "https://apis.quran.foundation/auth",
  content: "https://apis.quran.foundation/content",
  oauth2: "https://oauth2.quran.foundation",
  quranReflect: "https://apis.quran.foundation/quran-reflect",
  search: "https://apis.quran.foundation/search",
} as const;

export const DIRECT_PATH_PREFIX = {
  auth: "/v1",
  content: "/api/v4",
  oauth2: "",
  quranReflect: "/v1",
  search: "/v1",
} as const;

export const GATEWAY_PATH_PREFIX = {
  auth: "/auth/v1",
  content: "/content/api/v4",
  oauth2: "",
  quranReflect: "/quran-reflect/v1",
  search: "/search/v1",
} as const;

export const LEGACY_PREFIXES = {
  auth: ["/auth/v1", "/v1"] as const,
  content: ["/content/api/v4", "/api/v4"] as const,
  oauth2: [] as const,
  quranReflect: ["/quran-reflect/v1", "/v1"] as const,
  search: ["/search/v1", "/v1"] as const,
} as const;
