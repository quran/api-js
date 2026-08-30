const readErrorPayload = async (response: Response): Promise<unknown> => {
  try {
    const body = await response.text();
    if (!body) {
      return undefined;
    }

    if (response.headers.get("content-type")?.toLowerCase().includes("json")) {
      try {
        return JSON.parse(body) as unknown;
      } catch {
        return body;
      }
    }

    return body;
  } catch {
    return undefined;
  }
};

export class QuranHttpError extends Error {
  public readonly headers: Headers;
  public readonly payload: unknown;
  public readonly status: number;

  private constructor(response: Response, payload: unknown) {
    super(`${response.status} ${response.statusText}`);
    this.name = "QuranHttpError";
    this.headers = new Headers(response.headers);
    this.payload = payload;
    this.status = response.status;
  }

  public static async fromResponse(response: Response): Promise<QuranHttpError> {
    return new QuranHttpError(response, await readErrorPayload(response));
  }
}
