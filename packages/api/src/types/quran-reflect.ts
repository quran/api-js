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
