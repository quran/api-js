export interface QuranReflectPostReference {
  chapterId: number;
  from: number;
  to: number;
  id?: string;
}

export interface QuranReflectPostMention {
  marker: string;
  userId: string;
  displayName: string;
}

/**
 * A mention as returned on a post. `location` is a UTF-16 range in the post
 * `body`: `start` is inclusive and `end` is exclusive.
 */
export interface QuranReflectPostMentionOccurrence {
  id: string;
  username?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  verified?: boolean;
  followersCount?: number;
  avatarUrls?: { small?: string; medium?: string; large?: string };
  location: { start: number; end: number };
}

export interface QuranReflectPostTag {
  id: number;
  name: string;
  language?: string;
}

export type QuranReflectPostListType = "BULLET_LIST" | "NUMBERED_LIST";

export type QuranReflectPostFormattingType =
  | "BOLD"
  | "ITALIC"
  | "UNDERLINE"
  | QuranReflectPostListType;

/**
 * A formatting range over the post `body`, in UTF-16 offsets: `start` is
 * inclusive and `end` is exclusive. A list range covers exactly one line.
 */
export interface QuranReflectPostFormatting {
  type: QuranReflectPostFormattingType;
  start: number;
  end: number;
}

export type QuranReflectRoomPostStatus = 0 | 1 | 2;

export interface CreateQuranReflectPostPayload {
  body: string;
  draft: boolean;
  references: QuranReflectPostReference[];
  mentions: QuranReflectPostMention[];
  /** Tag names. Hashtags typed in `body` are linked without listing them here. */
  tags?: string[];
  /**
   * Formatting ranges over the body as it reads once mention markers are removed.
   * On edit, send the complete set: `body` without `formatting` clears it.
   */
  formatting?: QuranReflectPostFormatting[];
  roomId?: number;
  roomPostStatus?: QuranReflectRoomPostStatus;
  postAsAuthorId?: string;
  publishedAt?: string | Date;
}

export type UpdateQuranReflectPostPayload =
  Partial<CreateQuranReflectPostPayload>;

/**
 * Partner app that created a post through the Quran Foundation API, for display
 * as "Post from {name}".
 */
export interface QuranReflectPostSourceApp {
  /** Display name of the partner app. */
  name: string;
  /** Absolute http(s) link to the partner app. */
  url: string;
}

export interface QuranReflectPost {
  id: number | string;
  authorId?: string;
  body?: string;
  commentsCount?: number;
  createdAt?: string;
  discussionId?: number;
  draft?: boolean;
  estimatedReadingTime?: number;
  featuredAt?: string;
  /** Absent or `null` means the body is plain text. */
  formatting?: QuranReflectPostFormatting[] | null;
  global?: boolean;
  hidden?: boolean;
  languageId?: number;
  languageName?: string;
  likesCount?: number;
  mentions?: QuranReflectPostMentionOccurrence[];
  moderationStatus?: number;
  postTypeId?: number | null;
  postTypeName?: string;
  publishedAt?: string;
  pushedUpAt?: string;
  references?: QuranReflectPostReference[];
  removed?: boolean;
  reported?: boolean;
  reviewedAt?: string;
  roomId?: number | null;
  roomPostStatus?: number;
  /**
   * Present only when the creating partner app is configured for attribution.
   * Omitted (never `null`) for native, unverified, and unconfigured posts.
   */
  sourceApp?: QuranReflectPostSourceApp;
  tags?: QuranReflectPostTag[];
  toxicityScore?: number;
  updatedAt?: string;
  verified?: boolean;
  views?: number;
  viewsCount?: number;
}

/** The post fields the rendering helpers read. Any post response fits. */
export interface QuranReflectPostRenderInput {
  body?: string | null;
  mentions?: QuranReflectPostMentionOccurrence[] | null;
  formatting?: QuranReflectPostFormatting[] | null;
}

/** A run of body text with one set of styles and at most one link target. */
export interface QuranReflectPostSegment {
  text: string;
  bold?: true;
  italic?: true;
  underline?: true;
  /** Set when the segment is part of a mention. */
  mention?: QuranReflectPostMentionOccurrence;
  /** Tag name without the leading `#`, set when the segment is part of a hashtag. */
  hashtag?: string;
}

export interface QuranReflectPostLine {
  /** Set when the line is a list item. */
  list?: QuranReflectPostListType;
  segments: QuranReflectPostSegment[];
}

export interface QuranReflectPostRenderOptions {
  /** Site that mention and hashtag links point to. Defaults to `https://quranreflect.com`. */
  baseUrl?: string;
  /** Build the mention link yourself. Return `null` to render the mention as text. */
  mentionHref?: (mention: QuranReflectPostMentionOccurrence) => string | null;
  /** Build the hashtag link yourself. Return `null` to render the hashtag as text. */
  hashtagHref?: (tag: string) => string | null;
  /** Markup placed between lines outside lists. Defaults to `<br>`. */
  lineBreak?: string;
}

export interface QuranReflectPostMutationResponse {
  success: boolean;
  data?: QuranReflectPost;
  post?: QuranReflectPost;
  error?: unknown;
}
