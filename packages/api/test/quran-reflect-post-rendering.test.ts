import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import type {
  QuranReflectPostLine,
  QuranReflectPostRenderInput,
  QuranReflectPostRenderOptions,
} from "../src";
import { getQuranReflectPostLines, renderQuranReflectPostHtml } from "../src";

interface ConformanceCase {
  name: string;
  post: QuranReflectPostRenderInput;
  options?: QuranReflectPostRenderOptions;
  lines: QuranReflectPostLine[];
  html: string;
}

// Shared with the Python SDK, which must produce the same output for every case.
const fixture = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      "conformance",
      "quran-reflect-post-rendering-v1.json",
    ),
    "utf8",
  ),
) as { cases: ConformanceCase[] };

describe("QuranReflect post rendering", () => {
  it.each(fixture.cases)("$name", ({ post, options, lines, html }) => {
    expect(getQuranReflectPostLines(post)).toEqual(lines);
    expect(renderQuranReflectPostHtml(post, options)).toBe(html);
  });

  it("builds links with the supplied callbacks", () => {
    const post = {
      body: "Hi Sarah #dua",
      mentions: [
        { id: "u2", username: "sarah", location: { start: 3, end: 8 } },
      ],
    };

    expect(
      renderQuranReflectPostHtml(post, {
        hashtagHref: (tag) => `/tags/${tag}?a=1&b="2"`,
        mentionHref: (mention) => `/users/${mention.id}`,
      }),
    ).toBe(
      'Hi <a class="mention" href="/users/u2">Sarah</a> <a class="hashtag" href="/tags/dua?a=1&amp;b=&quot;2&quot;">#dua</a>',
    );
    expect(
      renderQuranReflectPostHtml(post, {
        hashtagHref: () => null,
        mentionHref: () => null,
      }),
    ).toBe("Hi Sarah #dua");
  });
});
