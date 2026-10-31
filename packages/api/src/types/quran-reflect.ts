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

export type QuranReflectRoomPostStatus = 0 | 1 | 2;

export interface CreateQuranReflectPostPayload {
  body: string;
  draft: boolean;
  references: QuranReflectPostReference[];
  mentions: QuranReflectPostMention[];
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
  global?: boolean;
  hidden?: boolean;
  languageId?: number;
  languageName?: string;
  likesCount?: number;
  mentions?: QuranReflectPostMention[];
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
  toxicityScore?: number;
  updatedAt?: string;
  verified?: boolean;
  views?: number;
  viewsCount?: number;
}

export interface QuranReflectPostMutationResponse {
  success: boolean;
  data?: QuranReflectPost;
  post?: QuranReflectPost;
  error?: unknown;
}
