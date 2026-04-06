import { PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT } from './constants';

export function parsePagination(url: URL) {
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(
    PAGINATION_MAX_LIMIT,
    Math.max(1, parseInt(url.searchParams.get('limit') ?? String(PAGINATION_DEFAULT_LIMIT), 10) || PAGINATION_DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
