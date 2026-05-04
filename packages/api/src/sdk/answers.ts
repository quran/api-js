import type {
  AnswerCountWithinRangeResponse,
  AnswerQuestion,
  AnswersByAyahResponse,
  BaseApiParams,
  QuranFetchClient,
  VerseKey,
} from "@/types";
import { isValidVerseKey } from "@/utils";

type GetAnswersByAyahOptions = BaseApiParams & {
  page?: number;
  pageSize?: number;
};

type CountAnswersWithinRangeOptions = BaseApiParams;

const normalizeAnswerCountWithinRangeResponse = (
  response: AnswerCountWithinRangeResponse,
): AnswerCountWithinRangeResponse => {
  return Object.fromEntries(
    Object.entries(response).map(([verseKey, count]) => {
      if (!count.types) return [verseKey, count];

      return [
        verseKey,
        {
          ...count,
          types: Object.fromEntries(
            Object.entries(count.types).map(([type, value]) => [
              type.toUpperCase(),
              value,
            ]),
          ),
        },
      ];
    }),
  );
};

/**
 * Quran answers API methods.
 */
export class QuranAnswers {
  constructor(private fetcher: QuranFetchClient) {}

  /**
   * Get published answer questions linked to a specific ayah.
   * @param {VerseKey} key verse key in format "chapter:verse" (e.g., "2:255")
   * @param {GetAnswersByAyahOptions} options
   * @example
   * client.answers.findByAyah("2:255", { page: 1, pageSize: 2 })
   */
  async findByAyah(
    key: VerseKey,
    options?: GetAnswersByAyahOptions,
  ): Promise<AnswersByAyahResponse> {
    if (!isValidVerseKey(key)) throw new Error("Invalid verse key");

    return this.fetcher.fetch<AnswersByAyahResponse>(
      `/content/api/v4/answers/by_ayah/${key}`,
      options,
    );
  }

  /**
   * Get a published answer question by id.
   * @param {string | number} questionId question id
   * @example
   * client.answers.findByQuestionId("988")
   */
  async findByQuestionId(
    questionId: string | number,
  ): Promise<AnswerQuestion> {
    return this.fetcher.fetch<AnswerQuestion>(
      `/content/api/v4/answers/${questionId}`,
    );
  }

  /**
   * Get a verse-key to answer-count map within an inclusive ayah range.
   * @param {VerseKey} from start verse key in format "chapter:verse"
   * @param {VerseKey} to end verse key in format "chapter:verse"
   * @param {CountAnswersWithinRangeOptions} options
   * @example
   * client.answers.countWithinRange("2:255", "2:256")
   */
  async countWithinRange(
    from: VerseKey,
    to: VerseKey,
    options?: CountAnswersWithinRangeOptions,
  ): Promise<AnswerCountWithinRangeResponse> {
    if (!isValidVerseKey(from) || !isValidVerseKey(to)) {
      throw new Error("Invalid verse key");
    }

    const response = await this.fetcher.fetch<AnswerCountWithinRangeResponse>(
      "/content/api/v4/answers/count_within_range",
      {
        ...options,
        from,
        to,
      },
    );

    return normalizeAnswerCountWithinRangeResponse(response);
  }
}
