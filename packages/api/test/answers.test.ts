import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../mocks/server";
import { testClient } from "./test-client";

describe("Answers API", () => {
  describe("findByAyah()", () => {
    it("should return answer questions for a valid ayah key", async () => {
      const response = await testClient.answers.findByAyah("2:255");

      expect(response.totalCount).toBe(1);
      expect(response.questions[0]).toMatchObject({
        id: "question-1",
        ranges: ["2:255"],
        surah: 2,
      });
      expect(response.questions[0]?.answers[0]?.answeredBy).toBe("Scholar");
    });

    it("should preserve pageSize casing for the public answers contract", async () => {
      let requestUrl = "http://missing.test";

      server.use(
        http.get(
          "https://apis.quran.foundation/content/api/v4/answers/by_ayah/:ayah_key",
          ({ request }) => {
            requestUrl = request.url;

            return HttpResponse.json({
              questions: [],
              totalCount: 0,
            });
          },
        ),
      );

      await testClient.answers.findByAyah("2:255", {
        language: "en",
        page: 1,
        pageSize: 2,
      });

      const params = new URL(requestUrl).searchParams;
      expect(params.get("page")).toBe("1");
      expect(params.get("pageSize")).toBe("2");
      expect(params.get("page_size")).toBeNull();
    });

    it("should throw for invalid ayah keys", async () => {
      await expect(
        // @ts-expect-error - invalid verse key
        testClient.answers.findByAyah("0:1"),
      ).rejects.toThrowError("Invalid verse key");
    });
  });

  describe("findByQuestionId()", () => {
    it("should return a published question by id", async () => {
      const response = await testClient.answers.findByQuestionId("question-1");

      expect(response.id).toBe("question-1");
      expect(response.answers[0]?.body).toContain("Ayat al-Kursi");
    });
  });

  describe("countWithinRange()", () => {
    it("should return answer counts for a verse range", async () => {
      await expect(
        testClient.answers.countWithinRange("2:255", "2:256"),
      ).resolves.toEqual({
        "2:255": {
          total: 2,
          types: {
            CLARIFICATION: 1,
            TAFSIR: 1,
          },
        },
        "2:256": {
          total: 1,
          types: {
            TAFSIR: 1,
          },
        },
      });
    });

    it("should throw for invalid verse ranges", async () => {
      await expect(
        // @ts-expect-error - invalid verse key
        testClient.answers.countWithinRange("2:255", "0:1"),
      ).rejects.toThrowError("Invalid verse key");
    });

    it("should expose the same methods through content.v4", async () => {
      const response = await testClient.content.v4.answers.byAyah("2:255");

      expect(response.questions[0]?.answers[0]?.id).toBe("answer-1");
    });
  });
});
