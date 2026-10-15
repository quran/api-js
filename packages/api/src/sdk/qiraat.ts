import type {
  BaseApiParams,
  ChapterId,
  QiraatJunctureInclude,
  QiraatJunctureResponse,
  QiraatJuncturesByChapterResponse,
  QiraatJuncturesByVerseResponse,
  QiraatMatrixByChapterResponse,
  QiraatMatrixByVerseResponse,
  QiraatMatrixCountWithinRangeResponse,
  QiraatMatrixTextField,
  QiraatReaderInclude,
  QiraatReaderResponse,
  QiraatReadersResponse,
  QiraatReadingResponse,
  QiraatTransmitterResponse,
  QiraatTransmittersResponse,
  QuranFetchClient,
  VerseKey,
} from "@/types";
import { isValidChapterId, isValidVerseKey } from "@/utils";

type GetQiraatReadersOptions = BaseApiParams & {
  include?: QiraatReaderInclude | QiraatReaderInclude[];
};

type GetQiraatReaderOptions = BaseApiParams;

type GetQiraatTransmittersOptions = BaseApiParams & {
  readerId?: number | string;
};

type GetQiraatTransmitterOptions = BaseApiParams;

type GetQiraatJuncturesByVerseOptions = BaseApiParams & {
  category?: string;
  include?: QiraatJunctureInclude | QiraatJunctureInclude[];
};

type GetQiraatJuncturesByChapterOptions = BaseApiParams & {
  category?: string;
  page?: number;
  perPage?: number;
};

type GetQiraatJunctureOptions = BaseApiParams;

type GetQiraatReadingOptions = BaseApiParams;

type GetQiraatMatrixByVerseOptions = BaseApiParams & {
  textField?: QiraatMatrixTextField | "uthmani" | "imlaei" | "qpc_hafs";
};

type GetQiraatMatrixByChapterOptions = GetQiraatMatrixByVerseOptions & {
  page?: number;
  perPage?: number;
};

type CountQiraatMatrixWithinRangeOptions = BaseApiParams;

const QIRAAT_BASE_PATH = "/content/api/v4/qiraat";

/**
 * Qira'at (variant recitations) API methods.
 *
 * These endpoints require the `qiraat.read` (or `qiraat`) OAuth scope.
 */
export class QuranQiraat {
  constructor(private fetcher: QuranFetchClient) {}

  /**
   * Get all Qira'at readers.
   * @param {GetQiraatReadersOptions} options
   * @example
   * client.qiraat.findAllReaders({ include: ["transmitters"] })
   */
  async findAllReaders(
    options?: GetQiraatReadersOptions,
  ): Promise<QiraatReadersResponse> {
    return this.fetcher.fetch<QiraatReadersResponse>(
      `${QIRAAT_BASE_PATH}/readers`,
      options,
    );
  }

  /**
   * Get a Qira'at reader by id.
   * @param {string | number} id reader id
   * @param {GetQiraatReaderOptions} options
   * @example
   * client.qiraat.findReaderById(1)
   */
  async findReaderById(
    id: string | number,
    options?: GetQiraatReaderOptions,
  ): Promise<QiraatReaderResponse> {
    return this.fetcher.fetch<QiraatReaderResponse>(
      `${QIRAAT_BASE_PATH}/readers/${id}`,
      options,
    );
  }

  /**
   * Get all Qira'at transmitters, optionally filtered by reader.
   * @param {GetQiraatTransmittersOptions} options
   * @example
   * client.qiraat.findAllTransmitters({ readerId: 1 })
   */
  async findAllTransmitters(
    options?: GetQiraatTransmittersOptions,
  ): Promise<QiraatTransmittersResponse> {
    return this.fetcher.fetch<QiraatTransmittersResponse>(
      `${QIRAAT_BASE_PATH}/transmitters`,
      options,
    );
  }

  /**
   * Get a Qira'at transmitter by id.
   * @param {string | number} id transmitter id
   * @param {GetQiraatTransmitterOptions} options
   * @example
   * client.qiraat.findTransmitterById(1)
   */
  async findTransmitterById(
    id: string | number,
    options?: GetQiraatTransmitterOptions,
  ): Promise<QiraatTransmitterResponse> {
    return this.fetcher.fetch<QiraatTransmitterResponse>(
      `${QIRAAT_BASE_PATH}/transmitters/${id}`,
      options,
    );
  }

  /**
   * Get the approved junctures (points of variation) in a specific ayah.
   * @param {VerseKey} key verse key in format "chapter:verse" (e.g., "1:4")
   * @param {GetQiraatJuncturesByVerseOptions} options
   * @example
   * client.qiraat.findJuncturesByVerse("1:4", { include: ["readings"] })
   */
  async findJuncturesByVerse(
    key: VerseKey,
    options?: GetQiraatJuncturesByVerseOptions,
  ): Promise<QiraatJuncturesByVerseResponse> {
    if (!isValidVerseKey(key)) throw new Error("Invalid verse key");

    return this.fetcher.fetch<QiraatJuncturesByVerseResponse>(
      `${QIRAAT_BASE_PATH}/junctures/by_verse/${key}`,
      options,
    );
  }

  /**
   * Get the approved junctures in a chapter (paginated).
   * @param {ChapterId} chapterId chapter number (1-114)
   * @param {GetQiraatJuncturesByChapterOptions} options
   * @example
   * client.qiraat.findJuncturesByChapter(1, { page: 1, perPage: 20 })
   */
  async findJuncturesByChapter(
    chapterId: ChapterId,
    options?: GetQiraatJuncturesByChapterOptions,
  ): Promise<QiraatJuncturesByChapterResponse> {
    if (!isValidChapterId(chapterId)) throw new Error("Invalid chapter id");

    return this.fetcher.fetch<QiraatJuncturesByChapterResponse>(
      `${QIRAAT_BASE_PATH}/junctures/by_chapter/${chapterId}`,
      options,
    );
  }

  /**
   * Get a juncture with its readings by id.
   * @param {string | number} id juncture id
   * @param {GetQiraatJunctureOptions} options
   * @example
   * client.qiraat.findJunctureById(1)
   */
  async findJunctureById(
    id: string | number,
    options?: GetQiraatJunctureOptions,
  ): Promise<QiraatJunctureResponse> {
    return this.fetcher.fetch<QiraatJunctureResponse>(
      `${QIRAAT_BASE_PATH}/junctures/${id}`,
      options,
    );
  }

  /**
   * Get a reading and its reader/transmitter attributions by id.
   * @param {string | number} id reading id
   * @param {GetQiraatReadingOptions} options
   * @example
   * client.qiraat.findReadingById(1)
   */
  async findReadingById(
    id: string | number,
    options?: GetQiraatReadingOptions,
  ): Promise<QiraatReadingResponse> {
    return this.fetcher.fetch<QiraatReadingResponse>(
      `${QIRAAT_BASE_PATH}/readings/${id}`,
      options,
    );
  }

  /**
   * Get the Qira'at matrix for an ayah. The API responds with 404 when the
   * ayah has no recorded variations.
   * @param {VerseKey} key verse key in format "chapter:verse" (e.g., "1:4")
   * @param {GetQiraatMatrixByVerseOptions} options
   * @example
   * client.qiraat.findMatrixByVerse("1:4", { textField: "text_imlaei" })
   */
  async findMatrixByVerse(
    key: VerseKey,
    options?: GetQiraatMatrixByVerseOptions,
  ): Promise<QiraatMatrixByVerseResponse> {
    if (!isValidVerseKey(key)) throw new Error("Invalid verse key");

    return this.fetcher.fetch<QiraatMatrixByVerseResponse>(
      `${QIRAAT_BASE_PATH}/matrix/by_verse/${key}`,
      options,
    );
  }

  /**
   * Get the Qira'at matrix for a chapter (paginated).
   * @param {ChapterId} chapterId chapter number (1-114)
   * @param {GetQiraatMatrixByChapterOptions} options
   * @example
   * client.qiraat.findMatrixByChapter(1, { page: 1, perPage: 20 })
   */
  async findMatrixByChapter(
    chapterId: ChapterId,
    options?: GetQiraatMatrixByChapterOptions,
  ): Promise<QiraatMatrixByChapterResponse> {
    if (!isValidChapterId(chapterId)) throw new Error("Invalid chapter id");

    return this.fetcher.fetch<QiraatMatrixByChapterResponse>(
      `${QIRAAT_BASE_PATH}/matrix/by_chapter/${chapterId}`,
      options,
    );
  }

  /**
   * Get a verse-key to juncture-count map within an inclusive ayah range.
   * @param {VerseKey} from start verse key in format "chapter:verse"
   * @param {VerseKey} to end verse key in format "chapter:verse"
   * @param {CountQiraatMatrixWithinRangeOptions} options
   * @example
   * client.qiraat.countMatrixWithinRange("1:1", "2:10")
   */
  async countMatrixWithinRange(
    from: VerseKey,
    to: VerseKey,
    options?: CountQiraatMatrixWithinRangeOptions,
  ): Promise<QiraatMatrixCountWithinRangeResponse> {
    if (!isValidVerseKey(from) || !isValidVerseKey(to)) {
      throw new Error("Invalid verse key");
    }

    return this.fetcher.fetch<QiraatMatrixCountWithinRangeResponse>(
      `${QIRAAT_BASE_PATH}/matrix/count_within_range`,
      {
        ...options,
        from,
        to,
      },
    );
  }
}
