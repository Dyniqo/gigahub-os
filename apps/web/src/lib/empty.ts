import type { Paginated } from '../types/api';

export function emptyPage<T>(limit = 10): Paginated<T> {
  return {
    items: [],
    meta: {
      page: 1,
      limit,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}
