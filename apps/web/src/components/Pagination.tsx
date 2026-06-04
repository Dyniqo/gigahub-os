import type { ReactNode } from 'react';
import { cx } from '../lib/format';
import type { PaginationMeta } from '../types/api';
import { Button } from './ui';

const LIMITS = [10, 20, 50, 100] as const;

function range(meta: PaginationMeta): string {
  if (!meta.total) return '0';
  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);
  return `${start}-${end}`;
}

export function Pagination({
  meta,
  onPageChange,
  limit,
  onLimitChange,
  className,
  summary,
  action,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  limit: number;
  onLimitChange?: (limit: number) => void;
  className?: string;
  summary?: string;
  action?: ReactNode;
}) {
  const current = Math.max(1, meta.page || 1);
  const totalPages = Math.max(1, meta.totalPages || 1);
  const canPrevious = meta.hasPreviousPage || current > 1;
  const canNext = meta.hasNextPage || current < totalPages;

  return (
    <div
      className={cx(
        'forge-card-soft min-w-0 rounded-[1.5rem] px-4 py-4 shadow-glass sm:px-5',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 text-sm font-bold leading-6 text-slate-400">
          <div className="text-safe">
            {summary ? <span>{summary} · </span> : null}
            <span className="text-white">{range(meta)}</span> of{' '}
            <span className="text-white">{meta.total}</span>
          </div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Page {current} / {totalPages}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
          {onLimitChange ? (
            <label className="inline-flex min-w-0 items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              <span className="shrink-0">Rows</span>
              <select
                className="forge-input forge-input-compact w-full sm:w-24"
                value={limit}
                onChange={(event) => onLimitChange(Number(event.target.value))}
                aria-label="Rows per page"
              >
                {LIMITS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            <Button disabled={!canPrevious} onClick={() => onPageChange(1)}>
              First
            </Button>
            <Button disabled={!canPrevious} onClick={() => onPageChange(Math.max(1, current - 1))}>
              Prev
            </Button>
            <Button
              disabled={!canNext}
              onClick={() => onPageChange(Math.min(totalPages, current + 1))}
            >
              Next
            </Button>
          </div>
          {action ? <div className="min-w-0 sm:ml-1">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
