import type {
  ApiParams,
  HTTPMethod,
  OperationRequest,
  PublicClientConfig,
  TokenResponse,
} from "@/types";
import type { AuthService } from "@/generated/public-contracts";
import { publicOperationCatalog } from "@/generated/public-contracts";
import { toUserSession } from "@/lib/http-utils";
import { createGeneratedGroups, createRawClient } from "@/lib/runtime-utils";
import { replacePathParams } from "@/lib/url";
import { PublicQuranFetcher } from "@/sdk/public-fetcher";

type RawOperation = (request?: OperationRequest) => Promise<unknown>;
type GeneratedGroup = Record<string, RawOperation>;
type QuranReflectFacade = {
  comments: GeneratedGroup;
  posts: GeneratedGroup;
  raw: Record<string, RawOperation>;
  rooms: GeneratedGroup;
  tags: GeneratedGroup;
  users: GeneratedGroup;
};

const SERVER_ONLY_MESSAGE =
  "This API requires @quranjs/api/server or a backend. Content and search are server-side for confidential clients.";
const LEGACY_BOOKMARK_GET_MESSAGE =
  "auth.bookmarks.get(bookmarkId) is not supported because /v1/bookmarks/bookmark expects bookmark detail query parameters. Pass a query object such as { mushafId, key, type, verseNumber } or { mushafId, isReading: true }.";

const createUserServiceRequest =
  (fetcher: PublicQuranFetcher, service: AuthService) =>
  (method: HTTPMethod, path: string, request?: OperationRequest) => {
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

const createAuthFacade = (fetcher: PublicQuranFetcher) => {
  const raw = createRawClient(fetcher, publicOperationCatalog.auth.v1);
  const generatedGroups = createGeneratedGroups(
    publicOperationCatalog.auth.v1,
    raw,
  );
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
      get: async (query?: ApiParams | string) => {
        if (typeof query === "string") {
          throw new Error(LEGACY_BOOKMARK_GET_MESSAGE);
        }

        return request("GET", "/v1/bookmarks/bookmark", {
          query,
        });
      },
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

const createQuranReflectFacade = (
  fetcher: PublicQuranFetcher,
): QuranReflectFacade => {
  const raw = createRawClient(fetcher, publicOperationCatalog.quranReflect.v1);
  const generatedGroups = createGeneratedGroups(
    publicOperationCatalog.quranReflect.v1,
    raw,
  );

  return {
    comments: generatedGroups.comments ?? {},
    posts: generatedGroups.posts ?? {},
    raw,
    rooms: generatedGroups.rooms ?? {},
    tags: generatedGroups.tags ?? {},
    users: generatedGroups.users ?? {},
  };
};

const createOAuth2Facade = (
  fetcher: PublicQuranFetcher,
  config: PublicClientConfig,
) => {
  const raw = createRawClient(fetcher, publicOperationCatalog.oauth2.v1);

  const exchangeToken = async (
    body: URLSearchParams,
    options: { requiresRefreshToken?: boolean } = {},
  ) => {
    if (config.clientType !== "public") {
      throw new Error(
        "This OAuth2 exchange requires a backend because your client is confidential.",
      );
    }

    if (options.requiresRefreshToken && !body.get("refresh_token")) {
      throw new Error("Missing refresh token.");
    }

    body.set("client_id", config.clientId);

    const requestRefreshToken = body.get("refresh_token") ?? undefined;
    const storedSession = options.requiresRefreshToken
      ? await fetcher.getUserSession()
      : null;
    const currentSession =
      options.requiresRefreshToken && requestRefreshToken
        ? { ...(storedSession ?? {}), refreshToken: requestRefreshToken }
        : storedSession;

    const token = await fetcher.request<TokenResponse>(
      "oauth2",
      "/oauth2/token",
      undefined,
      {
        auth: "none",
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

      return exchangeToken(body);
    },
    getUserInfo: (accessToken?: string) =>
      fetcher.request("oauth2", "/userinfo", undefined, {
        accessToken,
        auth: "user",
        method: "GET",
      }),
    introspect: () => {
      throw new Error(
        "Token introspection requires @quranjs/api/server or a backend.",
      );
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

      return exchangeToken(body, { requiresRefreshToken: true });
    },
  };
};

type ServerOnlyGuard = ((...args: unknown[]) => Promise<never>) & {
  [key: string]: ServerOnlyGuard | undefined;
};

const createServerOnlyGuard = (): ServerOnlyGuard => {
  const fail = (() =>
    Promise.reject(new Error(SERVER_ONLY_MESSAGE))) as ServerOnlyGuard;
  const proxy = new Proxy(fail, {
    apply() {
      return Promise.reject(new Error(SERVER_ONLY_MESSAGE));
    },
    get(_target, property) {
      if (property === "then") {
        return undefined;
      }

      return proxy;
    },
  });

  return proxy;
};

export const createPublicRuntimeClient = (config: PublicClientConfig) => {
  const fetcher = new PublicQuranFetcher(config);
  fetcher.getFetch();

  const authV1 = createAuthFacade(fetcher);
  const quranReflectV1 = createQuranReflectFacade(fetcher);
  const oauth2V1 = createOAuth2Facade(fetcher, config);
  const serverOnlyGuard = createServerOnlyGuard();

  const raw = {
    auth: {
      v1: authV1.raw,
    },
    content: {
      v4: serverOnlyGuard,
    },
    oauth2: {
      v1: oauth2V1.raw,
    },
    quranReflect: {
      v1: quranReflectV1.raw,
    },
    search: {
      v1: serverOnlyGuard,
    },
  };

  return {
    audio: serverOnlyGuard,
    auth: {
      ...authV1,
      v1: authV1,
    },
    chapters: serverOnlyGuard,
    clearCachedTokens: () => fetcher.clearCachedTokens(),
    content: serverOnlyGuard,
    getUserSession: () => fetcher.getUserSession(),
    juzs: serverOnlyGuard,
    oauth2: {
      ...oauth2V1,
      v1: oauth2V1,
    },
    quranReflect: {
      ...quranReflectV1,
      v1: quranReflectV1,
    },
    raw,
    resources: serverOnlyGuard,
    search: serverOnlyGuard,
    verses: serverOnlyGuard,
  };
};
