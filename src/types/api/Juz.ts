export interface Juz {
  id: number;
  juzNumber: number;
  verseMapping: Record<number, string>;
  firstVerseId: number;
  lastVerseId: number;
  versesCount: number;
}
