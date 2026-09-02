import type {
  ApiParams,
  AppStateBootstrapPage,
  AppStateChangesOptions,
  AppStateChangesPage,
  AppStateConfiguration,
  AppStateDocument,
  AppStateJsonValue,
  AppStateMutationOptions,
  AppStateMutationResult,
  AppStatePage,
  AppStatePageOptions,
  AppStatePutBody,
  AppStateResponse,
  AppStateSuccess,
  AppStateTransport,
  HTTPMethod,
  OperationRequest,
} from "@/types";
import { replacePathParams } from "@/lib/url";

interface AppStateFetcher {
  request<T>(
    service: "auth",
    path: string,
    query?: ApiParams,
    request?: OperationRequest,
  ): Promise<T>;
}

const documentPath = (collection: string, key: string): string =>
  replacePathParams("/v1/app-state/{collection}/{key}", { collection, key });

const mutationHeaders = (
  options: AppStateMutationOptions,
): Readonly<Record<string, string>> => {
  const { idempotencyKey, ifMatch, ifNoneMatch } = options as {
    idempotencyKey: string;
    ifMatch?: string;
    ifNoneMatch?: string;
  };
  if (ifMatch !== undefined && ifNoneMatch !== undefined) {
    throw new Error(
      "App State mutations accept only one of ifMatch or ifNoneMatch.",
    );
  }

  return Object.freeze({
    "Idempotency-Key": idempotencyKey,
    ...(ifMatch === undefined ? {} : { "If-Match": ifMatch }),
    ...(ifNoneMatch === undefined ? {} : { "If-None-Match": ifNoneMatch }),
  });
};

const snapshotPutBody = (body: AppStatePutBody): AppStatePutBody => {
  const snapshot = JSON.parse(JSON.stringify(body)) as AppStatePutBody;

  const freezeJson = (value: AppStatePutBody | AppStateJsonValue): void => {
    if (typeof value !== "object" || value === null) {
      return;
    }

    Object.freeze(value);
    for (const child of Object.values(value)) {
      freezeJson(child as AppStateJsonValue);
    }
  };

  freezeJson(snapshot);
  return snapshot;
};

export const createAppStateFacade = (
  fetcher: AppStateFetcher,
): AppStateTransport => {
  const request = <T>(
    method: HTTPMethod,
    path: string,
    query?: ApiParams,
    options: OperationRequest = {},
  ) =>
    fetcher.request<T>("auth", path, query, {
      ...options,
      auth: "user",
      method,
      preserveResponseKeys: true,
    });

  const requestWithEtag = async <T>(
    method: HTTPMethod,
    path: string,
    options: OperationRequest = {},
  ): Promise<AppStateResponse<T>> => {
    let etag: string | null = null;
    let status = 0;
    const body = await request<AppStateSuccess<T>>(method, path, undefined, {
      ...options,
      onResponse: (metadata) => {
        etag = metadata.headers.get("etag");
        status = metadata.status;
      },
    });

    return { ...body, etag, status };
  };

  return {
    bootstrap: (options: AppStatePageOptions = {}) =>
      request<AppStateSuccess<AppStateBootstrapPage>>(
        "GET",
        "/v1/app-state:bootstrap",
        options,
      ),
    deleteDocument: async (
      collection: string,
      key: string,
      options: AppStateMutationOptions,
    ) => {
      await request<void>("DELETE", documentPath(collection, key), undefined, {
        headers: mutationHeaders(options),
      });
    },
    getChanges: (since: string, options: AppStateChangesOptions = {}) =>
      request<AppStateSuccess<AppStateChangesPage>>(
        "GET",
        "/v1/app-state:changes",
        { ...options, since },
      ),
    getConfiguration: () =>
      request<AppStateSuccess<AppStateConfiguration>>(
        "GET",
        "/v1/app-state:config",
      ),
    getDocument: (collection: string, key: string) =>
      requestWithEtag<AppStateDocument>("GET", documentPath(collection, key)),
    listDocuments: (collection: string, options: AppStatePageOptions = {}) =>
      request<AppStateSuccess<AppStatePage>>(
        "GET",
        replacePathParams("/v1/app-state/{collection}", { collection }),
        options,
      ),
    putDocument: async (
      collection: string,
      key: string,
      body: AppStatePutBody,
      options: AppStateMutationOptions,
    ) => {
      const headers = mutationHeaders(options);
      const snapshot = snapshotPutBody(body);
      return requestWithEtag<AppStateMutationResult>(
        "PUT",
        documentPath(collection, key),
        {
          body: snapshot as unknown as Record<string, unknown>,
          headers,
        },
      );
    },
  };
};
