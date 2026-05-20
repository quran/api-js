import type {
  ApiParams,
  CreateQuranReflectPostPayload,
  OperationRequest,
  QuranReflectPost,
  QuranReflectPostMutationResponse,
  UpdateQuranReflectPostPayload,
} from "@/types";

type RawOperation = (request?: OperationRequest) => Promise<unknown>;
type GeneratedGroup = Record<string, RawOperation>;

export type QuranReflectPostCreateOperationRequest = Omit<
  OperationRequest,
  "body"
> & {
  body: {
    post: CreateQuranReflectPostPayload;
  };
};

export type QuranReflectPostUpdateOperationRequest = Omit<
  OperationRequest,
  "body" | "path"
> & {
  body: UpdateQuranReflectPostPayload;
  path: {
    id: string | number;
  };
};

export type QuranReflectPostGetOperationRequest = Omit<
  OperationRequest,
  "path"
> & {
  path: {
    id: string | number;
  };
};

type CreateQuranReflectPost = {
  (
    payload: CreateQuranReflectPostPayload,
  ): Promise<QuranReflectPostMutationResponse>;
  (
    request: QuranReflectPostCreateOperationRequest,
  ): Promise<QuranReflectPostMutationResponse>;
  (request?: OperationRequest): Promise<unknown>;
};

type UpdateQuranReflectPost = {
  (
    id: string | number,
    payload: UpdateQuranReflectPostPayload,
  ): Promise<QuranReflectPostMutationResponse>;
  (
    request: QuranReflectPostUpdateOperationRequest,
  ): Promise<QuranReflectPostMutationResponse>;
  (request?: OperationRequest): Promise<unknown>;
};

type GetQuranReflectPost = {
  (id: string | number, query?: ApiParams): Promise<QuranReflectPost>;
  (request: QuranReflectPostGetOperationRequest): Promise<QuranReflectPost>;
  (request?: OperationRequest): Promise<unknown>;
};

export type QuranReflectPostsFacade = GeneratedGroup & {
  create: CreateQuranReflectPost;
  get: GetQuranReflectPost;
  update: UpdateQuranReflectPost;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isCreatePayload = (value: unknown): value is CreateQuranReflectPostPayload => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value["body"] === "string" &&
    typeof value["draft"] === "boolean" &&
    Array.isArray(value["references"]) &&
    Array.isArray(value["mentions"])
  );
};

export const createQuranReflectPostsFacade = (
  generatedPosts: GeneratedGroup,
  request: (
    method: "GET" | "PATCH" | "POST",
    path: string,
    operationRequest?: OperationRequest,
  ) => Promise<unknown>,
): QuranReflectPostsFacade => {
  const create: CreateQuranReflectPost = ((
    payloadOrRequest:
      | CreateQuranReflectPostPayload
      | QuranReflectPostCreateOperationRequest,
  ) => {
    if (isCreatePayload(payloadOrRequest)) {
      return request("POST", "/v1/posts", {
        body: {
          post: payloadOrRequest,
        },
      }) as Promise<QuranReflectPostMutationResponse>;
    }

    return request("POST", "/v1/posts", payloadOrRequest) as Promise<
      QuranReflectPostMutationResponse
    >;
  }) as CreateQuranReflectPost;

  const update: UpdateQuranReflectPost = ((
    idOrRequest: string | number | QuranReflectPostUpdateOperationRequest,
    payload?: UpdateQuranReflectPostPayload,
  ) => {
    if (payload !== undefined) {
      return request("PATCH", "/v1/posts/{id}", {
        body: payload,
        path: { id: idOrRequest as string | number },
      }) as Promise<QuranReflectPostMutationResponse>;
    }

    return request(
      "PATCH",
      "/v1/posts/{id}",
      idOrRequest as QuranReflectPostUpdateOperationRequest,
    ) as Promise<QuranReflectPostMutationResponse>;
  }) as UpdateQuranReflectPost;

  const get: GetQuranReflectPost = ((
    idOrRequest: string | number | QuranReflectPostGetOperationRequest,
    query?: ApiParams,
  ) => {
    if (typeof idOrRequest === "string" || typeof idOrRequest === "number") {
      return request("GET", "/v1/posts/{id}", {
        path: { id: idOrRequest },
        query,
      }) as Promise<QuranReflectPost>;
    }

    return request("GET", "/v1/posts/{id}", idOrRequest) as Promise<
      QuranReflectPost
    >;
  }) as GetQuranReflectPost;

  return {
    ...generatedPosts,
    create,
    get,
    update,
  };
};
