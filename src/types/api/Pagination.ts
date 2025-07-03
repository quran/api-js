export interface Pagination {
  per_page: number;
  current_page: number;
  next_page: number | null;
  total_pages: number;
  total_records: number;
}
