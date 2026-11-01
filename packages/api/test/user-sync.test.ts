import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import type { UserSyncMutationInput } from "../src";
import { server } from "../mocks/server";
import {
  isUserSyncOutOfSyncError,
  QuranHttpError,
  UserSyncPullRestartLimitError,
} from "../src";
import { createPublicClient } from "../src/public";
import { createServerClient } from "../src/server";

const SYNC_URL = "http://localhost:3001/v1/sync";

const OUT_OF_SYNC_BODY = {
  details: {
    error: {
      code: "OutOfSyncError",
      message:
        "Invalid lastMutationAt, please re-sync your data and try again.",
    },
    success: false,
  },
  message: "Invalid lastMutationAt, please re-sync your data and try again.",
  success: false,
  type: "service_error",
};

const publicClient = () =>
  createPublicClient({
    clientId: "client-id",
    clientType: "confidential-proxy",
    services: { authBaseUrl: "http://localhost:3001" },
    userSession: { accessToken: "user-access-token" },
  });

const serverClient = () =>
  createServerClient({
    clientId: "client-id",
    clientSecret: "client-secret",
    services: { authBaseUrl: "http://localhost:3001" },
    userSession: { accessToken: "server-user-token" },
  });

const mutation = (id: string, timestamp: number) => ({
  data: { body: `note ${id}`, ranges: ["2:255-2:255"] },
  resource: "NOTE",
  resourceId: id,
  timestamp,
  type: "CREATE",
});

const query = (request: Request) =>
  Object.fromEntries(new URL(request.url).searchParams);

describe("User Sync facade", () => {
  it("sends GET /v1/sync with user auth and exact query params", async () => {
    let sentRequest: Request | undefined;
    server.use(
      http.get(SYNC_URL, ({ request }) => {
        sentRequest = request;
        return HttpResponse.json(
          {
            data: {
              hasMore: false,
              lastMutationAt: 1769986347987,
              limit: 50,
              mutations: [
                {
                  data: { bookmark_group: "verses_6236", key: 18 },
                  resource: "BOOKMARK",
                  resourceId: "j1rnpmr1zu3ytynk6e0w5zp0",
                  timestamp: 1769985812916,
                  type: "UPDATE",
                },
              ],
              page: 2,
              total: 51,
            },
            success: true,
          },
          { headers: { "X-Mutation-At": "1769986347990" } },
        );
      }),
    );

    const response = await publicClient().auth.v1.sync.getMutations({
      lastMutationAt: 1769986347987,
      limit: 50,
      mutationsSince: 0,
      page: 2,
      resources: ["BOOKMARK", "COLLECTION_BOOKMARK"],
    });

    expect(sentRequest!.headers.get("x-auth-token")).toBe("user-access-token");
    expect(sentRequest!.headers.get("x-client-id")).toBe("client-id");
    expect(query(sentRequest!)).toEqual({
      lastMutationAt: "1769986347987",
      limit: "50",
      mutationsSince: "0",
      page: "2",
      resources: "BOOKMARK,COLLECTION_BOOKMARK",
    });
    expect(response.mutationAt).toBe(1769986347990);
    expect(response.status).toBe(200);
    expect(response.data.lastMutationAt).toBe(1769986347987);
    // Resource data is returned as sent, without key camelization.
    expect(response.data.mutations?.[0]?.data).toEqual({
      bookmark_group: "verses_6236",
      key: 18,
    });
  });

  it("supports metadataOnly reads and a missing X-Mutation-At header", async () => {
    let sentRequest: Request | undefined;
    server.use(
      http.get(SYNC_URL, ({ request }) => {
        sentRequest = request;
        return HttpResponse.json({
          data: { lastMutationAt: 1769986347987 },
          success: true,
        });
      }),
    );

    const response = await serverClient().auth.sync.getMutations({
      metadataOnly: true,
      mutationsSince: 0,
    });

    expect(sentRequest!.headers.get("x-auth-token")).toBe("server-user-token");
    expect(query(sentRequest!)).toEqual({
      metadataOnly: "true",
      mutationsSince: "0",
    });
    expect(response.data).toEqual({ lastMutationAt: 1769986347987 });
    expect(response.mutationAt).toBeNull();
  });

  it("pushes a snapshot of the mutations with lastMutationAt in the query", async () => {
    let releaseSession: (() => void) | undefined;
    const sessionReady = new Promise<void>((resolve) => {
      releaseSession = resolve;
    });
    let sentRequest: Request | undefined;
    const client = createServerClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      fetch: (input, init) => {
        sentRequest = new Request(input, init);
        return Promise.resolve(
          HttpResponse.json(
            {
              data: {
                lastMutationAt: 1769340915572,
                mutations: [
                  {
                    data: { name: "Woman in Quran" },
                    resource: "COLLECTION",
                    resourceId: "na6orcv0pbcomiphmkv0yhma",
                    timestamp: 1769340915572,
                    type: "CREATE",
                  },
                ],
              },
              success: true,
            },
            { headers: { "X-Mutation-At": "1769340915572" } },
          ),
        );
      },
      storage: {
        getSession: async () => {
          await sessionReady;
          return { accessToken: "server-user-token" };
        },
      },
    });
    const mutations: UserSyncMutationInput[] = [
      {
        data: { name: "Woman in Quran" },
        resource: "COLLECTION",
        type: "CREATE",
      },
    ];

    const pending = client.auth.v1.sync.pushMutations({
      lastMutationAt: 1769340915000,
      mutations,
    });
    mutations[0]!.data!.name = "changed";
    mutations.push({ resource: "NOTE", resourceId: "x", type: "DELETE" });
    releaseSession?.();
    const response = await pending;

    expect(sentRequest!.method).toBe("POST");
    expect(new URL(sentRequest!.url).pathname).toBe("/auth/v1/sync");
    expect(query(sentRequest!)).toEqual({ lastMutationAt: "1769340915000" });
    expect(sentRequest!.headers.get("content-type")).toBe("application/json");
    expect(await sentRequest!.json()).toEqual({
      mutations: [
        {
          data: { name: "Woman in Quran" },
          resource: "COLLECTION",
          type: "CREATE",
        },
      ],
    });
    expect(response.mutationAt).toBe(1769340915572);
    expect(response.data.lastMutationAt).toBe(1769340915572);
    expect(response.data.mutations[0]?.resourceId).toBe(
      "na6orcv0pbcomiphmkv0yhma",
    );
  });

  it("rejects more than 100 mutations before network I/O", async () => {
    let fetchCalls = 0;
    const client = createServerClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      fetch: () => {
        fetchCalls += 1;
        return Promise.resolve(HttpResponse.json({ success: true, data: {} }));
      },
      userSession: { accessToken: "server-user-token" },
    });

    await expect(
      client.auth.sync.pushMutations({
        lastMutationAt: 1,
        mutations: Array.from({ length: 101 }, () => ({
          resource: "NOTE" as const,
          resourceId: "x",
          type: "DELETE" as const,
        })),
      }),
    ).rejects.toThrow("at most 100 mutations per request");
    expect(fetchCalls).toBe(0);
  });

  it("identifies 409 OutOfSyncError from the Gateway and the backend", async () => {
    const responses = [
      HttpResponse.json(OUT_OF_SYNC_BODY, { status: 409 }),
      HttpResponse.json(OUT_OF_SYNC_BODY.details, { status: 409 }),
      HttpResponse.json(
        {
          details: {
            error: {
              code: "UniqueViolationError",
              details: { mutationIndex: 0 },
              message: "You already have a collection with this name",
            },
            success: false,
          },
          message: "You already have a collection with this name",
          success: false,
          type: "service_error",
        },
        { status: 409 },
      ),
      HttpResponse.json(OUT_OF_SYNC_BODY, { status: 422 }),
    ];
    server.use(http.post(SYNC_URL, () => responses.shift()!));

    const errors: unknown[] = [];
    for (let index = 0; index < 4; index += 1) {
      errors.push(
        await publicClient()
          .auth.v1.sync.pushMutations({
            lastMutationAt: 1,
            mutations: [{ resource: "NOTE", resourceId: "x", type: "DELETE" }],
          })
          .catch((error: unknown) => error),
      );
    }

    expect(errors.every((error) => error instanceof QuranHttpError)).toBe(true);
    expect(errors.map((error) => isUserSyncOutOfSyncError(error))).toEqual([
      true,
      true,
      false,
      false,
    ]);
    expect(isUserSyncOutOfSyncError(new Error("409"))).toBe(false);
  });
});

describe("User Sync pullAllMutations", () => {
  it("pins later pages to page 1's head and keeps the original params", async () => {
    const requests: Request[] = [];
    const pages = [
      { hasMore: true, lastMutationAt: 300, mutations: [mutation("a", 100)] },
      { hasMore: true, lastMutationAt: 300, mutations: [mutation("b", 200)] },
      { hasMore: false, lastMutationAt: 300, mutations: [mutation("c", 300)] },
    ];
    server.use(
      http.get(SYNC_URL, ({ request }) => {
        requests.push(request);
        return HttpResponse.json(
          { data: pages.shift(), success: true },
          { headers: { "X-Mutation-At": "999" } },
        );
      }),
    );

    const result = await publicClient().auth.v1.sync.pullAllMutations({
      limit: 1,
      mutationsSince: 50,
      resources: ["NOTE"],
    });

    expect(requests.map(query)).toEqual([
      { limit: "1", mutationsSince: "50", page: "1", resources: "NOTE" },
      {
        lastMutationAt: "300",
        limit: "1",
        mutationsSince: "50",
        page: "2",
        resources: "NOTE",
      },
      {
        lastMutationAt: "300",
        limit: "1",
        mutationsSince: "50",
        page: "3",
        resources: "NOTE",
      },
    ]);
    // The cursor comes from the response body, never the X-Mutation-At header.
    expect(result).toEqual({
      lastMutationAt: 300,
      mutations: [mutation("a", 100), mutation("b", 200), mutation("c", 300)],
      pages: 3,
      restarts: 0,
    });
  });

  it("restarts from page 1 with the original cursor after a later-page 409", async () => {
    const requests: Request[] = [];
    const responses = [
      HttpResponse.json({
        data: {
          hasMore: true,
          lastMutationAt: 300,
          mutations: [mutation("a", 100)],
        },
        success: true,
      }),
      HttpResponse.json(OUT_OF_SYNC_BODY, { status: 409 }),
      HttpResponse.json({
        data: {
          hasMore: true,
          lastMutationAt: 400,
          mutations: [mutation("a", 100)],
        },
        success: true,
      }),
      HttpResponse.json({
        data: {
          hasMore: false,
          lastMutationAt: 400,
          mutations: [mutation("d", 400)],
        },
        success: true,
      }),
    ];
    server.use(
      http.get(SYNC_URL, ({ request }) => {
        requests.push(request);
        return responses.shift()!;
      }),
    );

    const result = await serverClient().auth.v1.sync.pullAllMutations({
      mutationsSince: 50,
    });

    expect(requests.map(query)).toEqual([
      { mutationsSince: "50", page: "1" },
      { lastMutationAt: "300", mutationsSince: "50", page: "2" },
      { mutationsSince: "50", page: "1" },
      { lastMutationAt: "400", mutationsSince: "50", page: "2" },
    ]);
    expect(result).toEqual({
      lastMutationAt: 400,
      mutations: [mutation("a", 100), mutation("d", 400)],
      pages: 2,
      restarts: 1,
    });
  });

  it("gives up after maxRestarts later-page 409s", async () => {
    let calls = 0;
    server.use(
      http.get(SYNC_URL, ({ request }) => {
        calls += 1;
        return new URL(request.url).searchParams.get("page") === "1"
          ? HttpResponse.json({
              data: {
                hasMore: true,
                lastMutationAt: calls,
                mutations: [mutation("a", 100)],
              },
              success: true,
            })
          : HttpResponse.json(OUT_OF_SYNC_BODY, { status: 409 });
      }),
    );

    const error = await publicClient()
      .auth.v1.sync.pullAllMutations({ maxRestarts: 1, mutationsSince: 0 })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(UserSyncPullRestartLimitError);
    expect((error as UserSyncPullRestartLimitError).restarts).toBe(1);
    expect(
      isUserSyncOutOfSyncError((error as UserSyncPullRestartLimitError).cause),
    ).toBe(true);
    expect(calls).toBe(4);
  });

  it("does not restart on a page 1 409 or other errors", async () => {
    let calls = 0;
    server.use(
      http.get(SYNC_URL, () => {
        calls += 1;
        return HttpResponse.json(OUT_OF_SYNC_BODY, { status: 409 });
      }),
    );

    const error = await publicClient()
      .auth.v1.sync.pullAllMutations({ mutationsSince: 0 })
      .catch((caught: unknown) => caught);

    expect(isUserSyncOutOfSyncError(error)).toBe(true);
    expect(calls).toBe(1);

    server.use(
      http.get(SYNC_URL, ({ request }) =>
        new URL(request.url).searchParams.get("page") === "1"
          ? HttpResponse.json({
              data: {
                hasMore: true,
                lastMutationAt: 300,
                mutations: [mutation("a", 100)],
              },
              success: true,
            })
          : HttpResponse.json({ message: "boom" }, { status: 500 }),
      ),
    );

    const serverError = await publicClient()
      .auth.v1.sync.pullAllMutations({ mutationsSince: 0 })
      .catch((caught: unknown) => caught);
    expect((serverError as QuranHttpError).status).toBe(500);
  });
});
