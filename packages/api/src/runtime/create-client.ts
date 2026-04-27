import type {
  HttpMethod,
  OperationDefinition,
  ServiceOperationCatalog,
} from "@/generated/contracts";
import type {
  ApiParams,
  ChapterId,
  HizbNumber,
  JuzNumber,
  OperationRequest,
  PageNumber,
  PublicClientConfig,
  RubNumber,
  SearchParams,
  ServerClientConfig,
  TokenResponse,
  UserSession,
  VerseKey,
} from "@/types";
import { operationCatalog } from "@/generated/contracts";
import { replacePathParams } from "@/lib/url";
import { QuranAudio } from "@/sdk/audio";
import { QuranChapters } from "@/sdk/chapters";
import { QuranFetcher } from "@/sdk/fetcher";
import { QuranJuzs } from "@/sdk/juzs";
import { QuranResources } from "@/sdk/resources";
import { QuranSearch } from "@/sdk/search";
import { QuranVerses } from "@/sdk/verses";

type RuntimeClientConfig = PublicClientConfig | ServerClientConfig;
type RuntimeMode = "public" | "server";
type RawOperation = (request?: OperationRequest) => Promise<unknown>;

const HTTP_METHOD_TO_MUTATION_NAME: Record<HttpMethod, string> = {
  delete: "remove",
  get: "list",
  patch: "update",
  post: "create",
  put: "update",
};

const toCamelCase = (value: string): string => {
  const parts = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "misc";
  }

  return parts
    .map((part, index) => {
      const lower = part.toLowerCase();
      if (index === 0) {
        return lower;
      }

      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
};

const toPascalCase = (value: string): string => {
  const camel = toCamelCase(value);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
};

const isPathParam = (segment: string): boolean =>
  segment.startsWith("{") && segment.endsWith("}");

const getResourceSegments = (path: string): string[] => {
  const segments = path.split("/").filter(Boolean);
  if (segments[0]?.match(/^v\d+$/)) {
    return segments.slice(1);
  }

  return segments;
};

const pickGeneratedMethodName = (operation: OperationDefinition): string => {
  const resourceSegments = getResourceSegments(operation.path);
  const lastSegment = resourceSegments.at(-1);
  const literalSegments = resourceSegments.filter(
    (segment) => !isPathParam(segment),
  );
  const lastLiteral = literalSegments.at(-1);
  const groupLiteral = literalSegments[0];

  if (resourceSegments.length === 1) {
    return HTTP_METHOD_TO_MUTATION_NAME[operation.method];
  }

  if (
    resourceSegments.length === 2 &&
    lastSegment &&
    isPathParam(lastSegment)
  ) {
    if (operation.method === "get") {
      return "get";
    }

    if (operation.method === "delete") {
      return "remove";
    }

    return "update";
  }

  if (lastSegment && !isPathParam(lastSegment) && lastLiteral) {
    if (lastLiteral === groupLiteral) {
      return `${HTTP_METHOD_TO_MUTATION_NAME[operation.method]}ById`;
    }

    return toCamelCase(lastLiteral);
  }

  return toCamelCase(operation.operationName);
};

const createRawClient = (
  fetcher: QuranFetcher,
  section: ServiceOperationCatalog,
): Record<string, RawOperation> => {
  const rawOperations: Record<string, RawOperation> = {};

  for (const [operationName, operation] of Object.entries(section.operations)) {
    rawOperations[operationName] = (request?: OperationRequest) =>
      fetcher.requestOperation(operation, request);
  }

  return rawOperations;
};

const createGeneratedGroups = (
  section: ServiceOperationCatalog,
  rawOperations: Record<string, RawOperation>,
): Record<string, Record<string, RawOperation>> => {
  const groups: Record<string, Record<string, RawOperation>> = {};

  for (const [operationName, operation] of Object.entries(section.operations)) {
    const literals = getResourceSegments(operation.path).filter(
      (segment) => !isPathParam(segment),
    );
    const groupName = toCamelCase(literals[0] ?? "misc");
    const suggestedName = pickGeneratedMethodName(operation);
    const currentGroup = groups[groupName] ?? {};
    let methodName = suggestedName;

    if (currentGroup[methodName]) {
      methodName = `${suggestedName}${toPascalCase(operationName)}`;
    }

    currentGroup[methodName] = rawOperations[operationName]!;
    groups[groupName] = currentGroup;
  }

  return groups;
};

const createUserServiceRequest =
  (fetcher: QuranFetcher, service: "auth" | "quranReflect") =>
  (
    method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT",
    path: string,
    request?: OperationRequest,
  ) => {
    return fetcher.request<unknown>(
      service,
      replacePathParams(path, request?.path),
      request?.query,
      {
        ...request,
        auth: "user",
        method,
        path: undefined,
        query: undefined,
      },
    );
  };

const createAuthFacade = (fetcher: QuranFetcher) => {
  const raw = createRawClient(fetcher, operationCatalog.auth.v1);
  const generatedGroups = createGeneratedGroups(operationCatalog.auth.v1, raw);
  const request = createUserServiceRequest(fetcher, "auth");

  return {
    ...generatedGroups,
    collections: {
      ...generatedGroups.collections,
      addBookmark: (collectionId: string, body: Record<string, unknown>) =>
        request("POST", "/v1/collections/{collectionId}/bookmarks", {
          body,
          path: { collectionId },
        }),
      create: (body: Record<string, unknown>) =>
        request("POST", "/v1/collections", { body }),
      get: (collectionId: string, query?: ApiParams) =>
        request("GET", "/v1/collections/{collectionId}", {
          path: { collectionId },
          query,
        }),
      list: (query?: ApiParams) => request("GET", "/v1/collections", { query }),
      listAll: (query?: ApiParams) =>
        request("GET", "/v1/collections/all", { query }),
      remove: (collectionId: string) =>
        request("DELETE", "/v1/collections/{collectionId}", {
          path: { collectionId },
        }),
      removeBookmark: (collectionId: string, bookmarkId: string) =>
        request(
          "DELETE",
          "/v1/collections/{collectionId}/bookmarks/{bookmarkId}",
          {
            path: { bookmarkId, collectionId },
          },
        ),
      update: (collectionId: string, body: Record<string, unknown>) =>
        request("POST", "/v1/collections/{collectionId}", {
          body,
          path: { collectionId },
        }),
    },
    bookmarks: {
      ...generatedGroups.bookmarks,
      create: (body: Record<string, unknown>) =>
        request("POST", "/v1/bookmarks", { body }),
      get: (bookmarkId: string) =>
        request("GET", "/v1/bookmarks/bookmark", {
          query: { bookmarkId },
        }),
      list: (query?: ApiParams) => request("GET", "/v1/bookmarks", { query }),
      listCollections: (query?: ApiParams) =>
        request("GET", "/v1/bookmarks/collections", { query }),
      listRange: (query?: ApiParams) =>
        request("GET", "/v1/bookmarks/ayahs-range", { query }),
      remove: (bookmarkId: string) =>
        request("DELETE", "/v1/bookmarks/{bookmarkId}", {
          path: { bookmarkId },
        }),
    },
    goals: {
      ...generatedGroups.goals,
      create: (body: Record<string, unknown>) =>
        request("POST", "/v1/goals", { body }),
      estimate: (query?: ApiParams) =>
        request("GET", "/v1/goals/estimate", { query }),
      getTodaysPlan: (query?: ApiParams) =>
        request("GET", "/v1/goals/get-todays-plan", { query }),
      remove: (id: string) =>
        request("DELETE", "/v1/goals/{id}", { path: { id } }),
      update: (id: string, body: Record<string, unknown>) =>
        request("PUT", "/v1/goals/{id}", {
          body,
          path: { id },
        }),
    },
    notes: {
      ...generatedGroups.notes,
      create: (body: Record<string, unknown>) =>
        request("POST", "/v1/notes", { body }),
      get: (noteId: string) =>
        request("GET", "/v1/notes/{noteId}", { path: { noteId } }),
      list: (query?: ApiParams) => request("GET", "/v1/notes", { query }),
      listByAttachedEntity: (query?: ApiParams) =>
        request("GET", "/v1/notes/by-attached-entity", { query }),
      listByRange: (query?: ApiParams) =>
        request("GET", "/v1/notes/by-range", { query }),
      listByVerseKey: (verseKey: string, query?: ApiParams) =>
        request("GET", "/v1/notes/by-verse/{verseKey}", {
          path: { verseKey },
          query,
        }),
      publish: (noteId: string, body?: Record<string, unknown>) =>
        request("POST", "/v1/notes/{noteId}/publish", {
          body,
          path: { noteId },
        }),
      remove: (noteId: string) =>
        request("DELETE", "/v1/notes/{noteId}", { path: { noteId } }),
      update: (noteId: string, body: Record<string, unknown>) =>
        request("PATCH", "/v1/notes/{noteId}", {
          body,
          path: { noteId },
        }),
    },
    preferences: {
      ...generatedGroups.preferences,
      bulkUpdate: (body: Record<string, unknown>) =>
        request("POST", "/v1/preferences/bulk", { body }),
      get: (query?: ApiParams) => request("GET", "/v1/preferences", { query }),
      update: (body: Record<string, unknown>) =>
        request("POST", "/v1/preferences", { body }),
    },
    raw,
    readingSessions: {
      ...generatedGroups.readingSessions,
      create: (body: Record<string, unknown>) =>
        request("POST", "/v1/reading-sessions", { body }),
      list: (query?: ApiParams) =>
        request("GET", "/v1/reading-sessions", { query }),
    },
  };
};

const createQuranReflectFacade = (fetcher: QuranFetcher) => {
  const raw = createRawClient(fetcher, operationCatalog.quranReflect.v1);
  const generatedGroups = createGeneratedGroups(
    operationCatalog.quranReflect.v1,
    raw,
  );

  return {
    ...generatedGroups,
    raw,
  };
};

const toUserSession = (
  token: TokenResponse & {
    accessToken?: string;
    expiresIn?: number;
    idToken?: string;
    refreshToken?: string;
    tokenType?: string;
  },
  currentSession?: UserSession | null,
): UserSession => {
  const expiresIn = token.expiresIn ?? token.expires_in;
  const accessToken = token.accessToken ?? token.access_token;
  const idToken = token.idToken ?? token.id_token ?? currentSession?.idToken;
  const refreshToken =
    token.refreshToken ?? token.refresh_token ?? currentSession?.refreshToken;
  const tokenType =
    token.tokenType ?? token.token_type ?? currentSession?.tokenType;
  const expiresAt = expiresIn
    ? Date.now() + expiresIn * 1000
    : currentSession?.expiresAt;

  return {
    accessToken,
    expiresAt,
    idToken,
    refreshToken,
    scope: token.scope ?? currentSession?.scope,
    tokenType,
  };
};

const createOAuth2Facade = (
  fetcher: QuranFetcher,
  mode: RuntimeMode,
  config: RuntimeClientConfig,
) => {
  const raw = createRawClient(fetcher, operationCatalog.oauth2.v1);

  const exchangeToken = async (
    body: URLSearchParams,
    options: {
      allowPublicExchange?: boolean;
      requiresRefreshToken?: boolean;
    } = {},
  ) => {
    if (mode === "public") {
      if ((config as PublicClientConfig).clientType !== "public") {
        throw new Error(
          "This OAuth2 exchange requires a backend because your client is confidential.",
        );
      }

      if (!options.allowPublicExchange) {
        throw new Error(
          "This OAuth2 flow requires @quranjs/api/server or a backend.",
        );
      }

      body.set("client_id", config.clientId);
    }

    if (options.requiresRefreshToken && !body.get("refresh_token")) {
      throw new Error("Missing refresh token.");
    }

    const currentSession = options.requiresRefreshToken
      ? await fetcher.getUserSession()
      : null;

    const token = await fetcher.request<TokenResponse>(
      "oauth2",
      "/oauth2/token",
      undefined,
      {
        auth: "none",
        basicAuth:
          mode === "server" && "clientSecret" in config
            ? {
                password: config.clientSecret,
                username: config.clientId,
              }
            : undefined,
        body,
        contentType: "application/x-www-form-urlencoded",
        method: "POST",
      },
    );

    await fetcher.setUserSession(toUserSession(token, currentSession));
    return token;
  };

  return {
    authorizeUrl: (query: Record<string, string | number | undefined>) =>
      fetcher.buildServiceUrl("oauth2", "/oauth2/auth", query as ApiParams),
    exchangeCode: (params: {
      code: string;
      codeVerifier?: string;
      redirectUri: string;
      scope?: string;
    }) => {
      const body = new URLSearchParams({
        code: params.code,
        grant_type: "authorization_code",
        redirect_uri: params.redirectUri,
      });

      if (params.codeVerifier) {
        body.set("code_verifier", params.codeVerifier);
      }

      if (params.scope) {
        body.set("scope", params.scope);
      }

      return exchangeToken(body, { allowPublicExchange: true });
    },
    getUserInfo: (accessToken?: string) =>
      fetcher.request("oauth2", "/userinfo", undefined, {
        accessToken,
        auth: "user",
        method: "GET",
      }),
    introspect: (token: string) => {
      if (mode !== "server" || !("clientSecret" in config)) {
        throw new Error(
          "Token introspection requires @quranjs/api/server or a backend.",
        );
      }

      return fetcher.request("oauth2", "/oauth2/introspect", undefined, {
        auth: "none",
        basicAuth: {
          password: config.clientSecret,
          username: config.clientId,
        },
        body: new URLSearchParams({ token }),
        contentType: "application/x-www-form-urlencoded",
        method: "POST",
      });
    },
    logout: (query?: ApiParams) =>
      fetcher.request("oauth2", "/oauth2/sessions/logout", query, {
        auth: "none",
        method: "GET",
      }),
    raw,
    refresh: async (refreshToken?: string) => {
      const currentSession = await fetcher.getUserSession();
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken ?? currentSession?.refreshToken ?? "",
      });

      return exchangeToken(body, {
        allowPublicExchange: true,
        requiresRefreshToken: true,
      });
    },
  };
};

const createContentFacade = (
  chapters: QuranChapters,
  verses: QuranVerses,
  juzs: QuranJuzs,
  audio: QuranAudio,
  resources: QuranResources,
  raw: Record<string, RawOperation>,
) => {
  return {
    audio: {
      chapterRecitation: {
        get: (reciterId: string, chapterId: ChapterId, query?: ApiParams) =>
          audio.findChapterRecitationById(reciterId, chapterId, query),
        list: (reciterId: string, query?: ApiParams) =>
          audio.findAllChapterRecitations(reciterId, query),
      },
      verseRecitation: {
        byChapter: (
          chapterId: ChapterId,
          recitationId: string,
          query?: ApiParams,
        ) =>
          audio.findVerseRecitationsByChapter(chapterId, recitationId, query),
        byKey: (verseKey: VerseKey, recitationId: string, query?: ApiParams) =>
          audio.findVerseRecitationsByKey(verseKey, recitationId, query),
      },
    },
    chapters: {
      get: (id: ChapterId, query?: ApiParams) => chapters.findById(id, query),
      getInfo: (id: ChapterId, query?: ApiParams) =>
        chapters.findInfoById(id, query),
      list: (query?: ApiParams) => chapters.findAll(query),
    },
    juzs: {
      list: () => juzs.findAll(),
    },
    raw,
    resources: {
      chapterInfos: {
        list: (query?: ApiParams) => resources.findAllChapterInfos(query),
      },
      chapterReciters: {
        list: (query?: ApiParams) => resources.findAllChapterReciters(query),
      },
      languages: {
        list: (query?: ApiParams) => resources.findAllLanguages(query),
      },
      recitationStyles: {
        list: (query?: ApiParams) => resources.findAllRecitationStyles(query),
      },
      recitations: {
        getInfo: (id: string, query?: ApiParams) =>
          resources.findRecitationInfo(id, query),
        list: (query?: ApiParams) => resources.findAllRecitations(query),
      },
      tafsirs: {
        getInfo: (id: string, query?: ApiParams) =>
          resources.findTafsirInfo(id, query),
        list: (query?: ApiParams) => resources.findAllTafsirs(query),
      },
      translations: {
        getInfo: (id: string, query?: ApiParams) =>
          resources.findTranslationInfo(id, query),
        list: (query?: ApiParams) => resources.findAllTranslations(query),
      },
      verseMedia: {
        list: (query?: ApiParams) => resources.findVerseMedia(query),
      },
    },
    verses: {
      byChapter: (id: ChapterId, query?: ApiParams) =>
        verses.findByChapter(id, query),
      byHizb: (id: HizbNumber, query?: ApiParams) =>
        verses.findByHizb(id, query),
      byJuz: (id: JuzNumber, query?: ApiParams) => verses.findByJuz(id, query),
      byKey: (key: VerseKey, query?: ApiParams) => verses.findByKey(key, query),
      byPage: (page: PageNumber, query?: ApiParams) =>
        verses.findByPage(page, query),
      byRange: (from: VerseKey, to: VerseKey, query?: ApiParams) =>
        verses.findByRange(from, to, query),
      byRub: (id: RubNumber, query?: ApiParams) => verses.findByRub(id, query),
      random: (query?: ApiParams) => verses.findRandom(query),
    },
  };
};

export const createRuntimeClient = (
  mode: RuntimeMode,
  config: RuntimeClientConfig,
) => {
  const fetcher = new QuranFetcher(mode, config);
  fetcher.getFetch();
  const chapters = new QuranChapters(fetcher);
  const verses = new QuranVerses(fetcher);
  const juzs = new QuranJuzs(fetcher);
  const audio = new QuranAudio(fetcher);
  const resources = new QuranResources(fetcher);
  const searchClient = new QuranSearch(fetcher);

  const raw = {
    auth: {
      v1: createRawClient(fetcher, operationCatalog.auth.v1),
    },
    content: {
      v4: createRawClient(fetcher, operationCatalog.content.v4),
    },
    oauth2: {
      v1: createRawClient(fetcher, operationCatalog.oauth2.v1),
    },
    quranReflect: {
      v1: createRawClient(fetcher, operationCatalog.quranReflect.v1),
    },
    search: {
      v1: createRawClient(fetcher, operationCatalog.search.v1),
    },
  };

  const contentV4 = createContentFacade(
    chapters,
    verses,
    juzs,
    audio,
    resources,
    raw.content.v4,
  );
  const authV1 = createAuthFacade(fetcher);
  const quranReflectV1 = createQuranReflectFacade(fetcher);
  const oauth2V1 = createOAuth2Facade(fetcher, mode, config);

  const query = ({
    query: searchQuery,
    ...options
  }: {
    query: string;
  } & Omit<SearchParams, "query">) => searchClient.search(searchQuery, options);

  const search = Object.assign(searchClient, {
    query,
    raw: raw.search.v1,
    v1: {
      query,
      raw: raw.search.v1,
    },
  });

  return {
    audio,
    auth: {
      ...authV1,
      v1: authV1,
    },
    chapters,
    clearCachedTokens: () => fetcher.clearCachedTokens(),
    content: {
      ...contentV4,
      v4: contentV4,
    },
    getUserSession: () => fetcher.getUserSession(),
    juzs,
    oauth2: {
      ...oauth2V1,
      v1: oauth2V1,
    },
    quranReflect: {
      ...quranReflectV1,
      v1: quranReflectV1,
    },
    raw,
    resources,
    search,
    verses,
  };
};
