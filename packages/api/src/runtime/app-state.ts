import type {
  ApiParams,
  AppStateBootstrapPage,
  AppStateChangesOptions,
  AppStateChangesPage,
  AppStateConfiguration,
  AppStateDocument,
  AppStateMutationOptions,
  AppStateMutationResult,
  AppStatePage,
  AppStatePageOptions,
  AppStatePutBody,
  AppStateResponse,
  AppStateSuccess,
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

const mutationHeaders = ({
  idempotencyKey,
  ifMatch,
  ifNoneMatch,
}: AppStateMutationOptions): Record<string, string> => ({
  "Idempotency-Key": idempotencyKey,
  ...(ifMatch === undefined ? {} : { "If-Match": ifMatch }),
  ...(ifNoneMatch === undefined ? {} : { "If-None-Match": ifNoneMatch }),
});

export const createAppStateFacade = (fetcher: AppStateFetcher) => {
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
    deleteDocument: (
      collection: string,
      key: string,
      options: AppStateMutationOptions,
    ) =>
      request<void>("DELETE", documentPath(collection, key), undefined, {
        headers: mutationHeaders(options),
      }),
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
      requestWithEtag<AppStateDocument>(
        "GET",
        documentPath(collection, key),
      ),
    listDocuments: (collection: string, options: AppStatePageOptions = {}) =>
      request<AppStateSuccess<AppStatePage>>(
        "GET",
        replacePathParams("/v1/app-state/{collection}", { collection }),
        options,
      ),
    putDocument: (
      collection: string,
      key: string,
      body: AppStatePutBody,
      options: AppStateMutationOptions,
    ) =>
      requestWithEtag<AppStateMutationResult>(
        "PUT",
        documentPath(collection, key),
        {
          body: body as unknown as Record<string, unknown>,
          headers: mutationHeaders(options),
        },
      ),
  };
};
