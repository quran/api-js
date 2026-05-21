import type { Pagination } from "./Pagination";
import type { Tafsir } from "./Tafsir";

export interface TafsirMeta {
  tafsirName?: string;
  authorName?: string;
}

export interface TafsirResponse {
  tafsirs: Tafsir[];
  meta?: TafsirMeta;
  pagination?: Omit<Pagination, "nextPage"> & {
    nextPage: number | null;
  };
}
