import type {
  QuranReflectPostFormattingType,
  QuranReflectPostLine,
  QuranReflectPostListType,
  QuranReflectPostMentionOccurrence,
  QuranReflectPostRenderInput,
  QuranReflectPostRenderOptions,
  QuranReflectPostSegment,
} from "@/types";

type InlineType = Exclude<
  QuranReflectPostFormattingType,
  QuranReflectPostListType
>;

interface Range {
  start: number;
  end: number;
}

interface FormattingRange extends Range {
  type: QuranReflectPostFormattingType;
}

interface MentionRange extends Range {
  mention: QuranReflectPostMentionOccurrence;
}

const DEFAULT_BASE_URL = "https://quranreflect.com";
const INLINE_TAGS = [
  ["bold", "strong"],
  ["italic", "em"],
  ["underline", "u"],
] as const;
const INLINE_FLAGS: Record<InlineType, "bold" | "italic" | "underline"> = {
  BOLD: "bold",
  ITALIC: "italic",
  UNDERLINE: "underline",
};
const LIST_TAGS: Record<QuranReflectPostListType, string> = {
  BULLET_LIST: "ul",
  NUMBERED_LIST: "ol",
};
// A hashtag starts the body or follows whitespace, so URL fragments are not tags.
const HASHTAG_PATTERN = /(^|\s)#([\p{L}\p{N}_-]+)/gu;

const isList = (type: string): type is QuranReflectPostListType =>
  type in LIST_TAGS;

const isRange = (body: string, start: unknown, end: unknown): boolean =>
  Number.isInteger(start) &&
  Number.isInteger(end) &&
  (start as number) >= 0 &&
  (start as number) < (end as number) &&
  (end as number) <= body.length;

const overlaps = (a: Range, b: Range): boolean =>
  a.start < b.end && a.end > b.start;

const getFormatting = (
  body: string,
  formatting: unknown,
): FormattingRange[] => {
  if (!Array.isArray(formatting)) {
    return [];
  }
  return formatting.filter((range): range is FormattingRange => {
    const { type, start, end } = (range ?? {}) as Partial<FormattingRange>;
    return (
      typeof type === "string" &&
      (type in INLINE_FLAGS || isList(type)) &&
      isRange(body, start, end)
    );
  });
};

const getMentions = (body: string, mentions: unknown): MentionRange[] => {
  if (!Array.isArray(mentions)) {
    return [];
  }
  const ranges: MentionRange[] = [];
  (mentions as (QuranReflectPostMentionOccurrence | null)[])
    .flatMap((mention) => {
      // The payload is untyped at runtime, so `location` can be missing.
      const location = mention?.location as Partial<Range> | undefined;
      const start = location?.start;
      const end = location?.end;
      return mention && isRange(body, start, end)
        ? [{ end: end as number, mention, start: start as number }]
        : [];
    })
    .sort((left, right) => left.start - right.start)
    .forEach((range) => {
      const previous = ranges[ranges.length - 1];
      if (!previous || range.start >= previous.end) {
        ranges.push(range);
      }
    });
  return ranges;
};

const getHashtags = (body: string, mentions: MentionRange[]): Range[] =>
  [...body.matchAll(HASHTAG_PATTERN)]
    .map((match) => {
      const start = match.index + (match[1] ?? "").length;
      return { end: start + 1 + (match[2] ?? "").length, start };
    })
    .filter((tag) => !mentions.some((mention) => overlaps(tag, mention)));

/**
 * Split a QuranReflect post body into lines of styled segments.
 *
 * Use this when you render natively (React components, attributed strings, text
 * spans). Offsets in `mentions` and `formatting` are UTF-16 positions in `body`.
 * Invalid ranges are ignored, so an unformatted body still renders as plain text.
 * Consecutive lines with the same `list` value belong to one list.
 *
 * @param {QuranReflectPostRenderInput} post - a post, or its `body`, `mentions` and `formatting`
 * @returns {QuranReflectPostLine[]} one entry per line of the body
 */
export const getQuranReflectPostLines = (
  post: QuranReflectPostRenderInput,
): QuranReflectPostLine[] => {
  const body = typeof post.body === "string" ? post.body : "";
  if (!body) {
    return [];
  }
  const formatting = getFormatting(body, post.formatting);
  const mentions = getMentions(body, post.mentions);
  const hashtags = getHashtags(body, mentions);
  const lists = new Map<string, QuranReflectPostListType>();
  formatting.forEach(({ type, start, end }) => {
    if (isList(type)) {
      lists.set(`${start}:${end}`, type);
    }
  });
  const inline = formatting.filter(({ type }) => !isList(type));
  const ranges: Range[] = [...inline, ...mentions, ...hashtags];

  let lineStart = 0;
  return body.split("\n").map((text) => {
    const lineEnd = lineStart + text.length;
    const points = new Set([lineStart, lineEnd]);
    ranges.forEach(({ start, end }) => {
      [start, end].forEach((point) => {
        if (point > lineStart && point < lineEnd) {
          points.add(point);
        }
      });
    });
    const sorted = [...points].sort((a, b) => a - b);
    const segments: QuranReflectPostSegment[] = [];
    sorted.slice(0, -1).forEach((from, index) => {
      const to = sorted[index + 1] as number;
      const covers = (range: Range) => range.start <= from && range.end >= to;
      const segment: QuranReflectPostSegment = { text: body.slice(from, to) };
      inline.filter(covers).forEach(({ type }) => {
        segment[INLINE_FLAGS[type as InlineType]] = true;
      });
      const mention = mentions.find(covers);
      const hashtag = hashtags.find(covers);
      if (mention) {
        segment.mention = mention.mention;
      } else if (hashtag) {
        segment.hashtag = body.slice(hashtag.start + 1, hashtag.end);
      }
      segments.push(segment);
    });
    const line: QuranReflectPostLine = { segments };
    const list = lists.get(`${lineStart}:${lineEnd}`);
    if (list) {
      line.list = list;
    }
    lineStart = lineEnd + 1;
    return line;
  });
};

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const getLink = (
  segment: QuranReflectPostSegment,
  options: QuranReflectPostRenderOptions,
): { className: string; href: string; key: unknown } | undefined => {
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  if (segment.mention) {
    const { username } = segment.mention;
    const href = options.mentionHref
      ? options.mentionHref(segment.mention)
      : username && `${baseUrl}/${encodeURIComponent(username)}`;
    return href
      ? { className: "mention", href, key: segment.mention }
      : undefined;
  }
  if (segment.hashtag) {
    const href = options.hashtagHref
      ? options.hashtagHref(segment.hashtag)
      : `${baseUrl}/?tags=${encodeURIComponent(`#${segment.hashtag}`)}`;
    return href
      ? { className: "hashtag", href, key: segment.hashtag }
      : undefined;
  }
  return undefined;
};

const renderSegments = (
  segments: QuranReflectPostSegment[],
  options: QuranReflectPostRenderOptions,
): string => {
  let html = "";
  let openKey: unknown;
  segments.forEach((segment) => {
    const link = getLink(segment, options);
    // One anchor wraps a mention or hashtag even when styles split it into segments.
    if (!link || openKey !== link.key) {
      html += openKey === undefined ? "" : "</a>";
      openKey = undefined;
      if (link) {
        html += `<a class="${link.className}" href="${escapeHtml(link.href)}">`;
        openKey = link.key;
      }
    }
    let text = escapeHtml(segment.text);
    INLINE_TAGS.forEach(([flag, tag]) => {
      if (segment[flag]) {
        text = `<${tag}>${text}</${tag}>`;
      }
    });
    html += text;
  });
  return openKey === undefined ? html : `${html}</a>`;
};

/**
 * Render a QuranReflect post body to an HTML string.
 *
 * Applies `formatting` (`<strong>`, `<em>`, `<u>`, `<ul>`/`<ol>`), links mentions
 * and hashtags, and escapes the body text, so the result is safe to insert as
 * HTML. Lines outside lists are joined with `<br>`.
 *
 * @param {QuranReflectPostRenderInput} post - a post, or its `body`, `mentions` and `formatting`
 * @param {QuranReflectPostRenderOptions} options - link and line break options
 * @returns {string} the HTML for the post body
 */
export const renderQuranReflectPostHtml = (
  post: QuranReflectPostRenderInput,
  options: QuranReflectPostRenderOptions = {},
): string => {
  const lineBreak = options.lineBreak ?? "<br>";
  let html = "";
  let openList: QuranReflectPostListType | undefined;
  getQuranReflectPostLines(post).forEach((line, index) => {
    const content = renderSegments(line.segments, options);
    if (openList && line.list !== openList) {
      html += `</${LIST_TAGS[openList]}>`;
    }
    if (line.list) {
      html += line.list === openList ? "" : `<${LIST_TAGS[line.list]}>`;
      html += `<li>${content}</li>`;
    } else {
      html += `${index > 0 && !openList ? lineBreak : ""}${content}`;
    }
    openList = line.list;
  });
  return openList ? `${html}</${LIST_TAGS[openList]}>` : html;
};
