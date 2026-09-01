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

export interface QuranHttpError extends Error {
  readonly headers: Headers;
  readonly payload: unknown;
  readonly status: number;
}

interface QuranHttpErrorConstructor {
  [Symbol.hasInstance](value: unknown): value is QuranHttpError;
  readonly prototype: QuranHttpError;
  fromResponse(response: Response): Promise<QuranHttpError>;
}

class QuranHttpErrorImplementation extends Error implements QuranHttpError {
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

  public static async fromResponse(
    response: Response,
  ): Promise<QuranHttpError> {
    return new QuranHttpErrorImplementation(
      response,
      await readErrorPayload(response),
    );
  }
}

const QURAN_HTTP_ERROR_CONSTRUCTOR = Symbol.for(
  "@quranjs/api/QuranHttpError/v1",
);
const constructorRegistry = globalThis as typeof globalThis & {
  [QURAN_HTTP_ERROR_CONSTRUCTOR]?: QuranHttpErrorConstructor;
};

export const QuranHttpError: QuranHttpErrorConstructor =
  constructorRegistry[QURAN_HTTP_ERROR_CONSTRUCTOR] ??
  (QuranHttpErrorImplementation as unknown as QuranHttpErrorConstructor);

constructorRegistry[QURAN_HTTP_ERROR_CONSTRUCTOR] = QuranHttpError;
