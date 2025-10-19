import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { handlers } from "./handlers";

export const server = setupServer(
  ...handlers,
  http.get("*", () => {
    return HttpResponse.json(
      { status: 404, error: "Not found" },
      { status: 404 },
    );
  }),
);
