import type { ChapterInfoResource } from "./Resources";

export interface ChapterInfo {
  id: number;
  chapterId: number;
  text: string;
  shortText: string;
  source: string;
  languageName?: string;
  resourceId?: number;
}

export interface ChapterInfoResponse {
  chapterInfo: ChapterInfo | null;
  resources?: ChapterInfoResource[];
}
