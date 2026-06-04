import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { emptyPage } from '../lib/empty';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useAuth } from '../context/AuthContext';
import { dateShort, shortId, timeAgo } from '../lib/format';
import { Button, EmptyState, Field, Input, LoadingStrip, StatusBadge } from '../components/ui';
import { Icon } from '../components/Icon';
import { Pagination } from '../components/Pagination';
import type { AuditLog } from '../types/api';

export function AuditPage() {
  const { user } = useAuth();
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const debouncedAction = useDebouncedValue(action.trim().toUpperCase());
  const debouncedResourceType = useDebouncedValue(resourceType.trim().toUpperCase());
  const debouncedResourceId = useDebouncedValue(resourceId.trim());
  const fallback = useMemo(() => emptyPage<AuditLog>(), []);
  const logs = useAsyncResource(
    () =>
      api.audit.mine({
        page,
        limit,
        action: debouncedAction || undefined,
        resourceType: debouncedResourceType || undefined,
        resourceId: debouncedResourceId || undefined,
      }),
    fallback,
    [user?.id, debouncedAction, debouncedResourceType, debouncedResourceId, page, limit],
    {
      cacheKey: `audit:mine:${user?.id ?? 'anon'}:${debouncedAction}:${debouncedResourceType}:${debouncedResourceId}:${page}:${limit}`,
      ttlMs: 25_000,
      keepPreviousOnError: true,
    },
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedAction, debouncedResourceType, debouncedResourceId, limit]);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="flex min-h-[calc(100vh-13.5rem)] min-w-0 flex-col gap-4">
        <div className="forge-card rounded-[2.2rem] p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-200">
                Audit trail
              </p>
              <h2 className="text-safe mt-2 text-3xl font-black text-white">
                A flight recorder for marketplace trust.
              </h2>
              <p className="text-safe mt-2 text-sm leading-6 text-slate-400">
                Review important account activity with action, resource, and timeline filters.
              </p>
            </div>
            <Button onClick={() => void logs.refresh()}>Refresh</Button>
          </div>
        </div>

        {logs.isLoading ? <LoadingStrip /> : null}
        {logs.error ? (
          <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4 text-sm font-bold text-sky-100">
            {logs.error}
          </div>
        ) : null}

        <div className="forge-card rounded-[2.2rem] p-4 sm:p-5">
          <div className="space-y-3">
            {logs.data.items.length ? (
              logs.data.items.map((log, index) => (
                <div
                  key={log.id}
                  className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/[.045] p-4 md:grid-cols-[42px_minmax(0,1fr)_160px] md:items-center"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-xs font-black text-sky-100">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={log.action} className="tracking-[0.08em]" />
                      <span className="text-xs font-bold text-slate-500">{log.resourceType}</span>
                    </div>
                    <p className="text-safe mt-2 font-mono text-xs text-slate-400">
                      resource: {shortId(log.resourceId)} · actor: {shortId(log.actorId)}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm font-bold text-white">{timeAgo(log.createdAt)}</p>
                    <p className="text-xs text-slate-500">{dateShort(log.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon="pulse"
                title="No audit entries"
                description="Activity will appear here as the workspace changes."
              />
            )}
          </div>
        </div>

        <Pagination
          className="mt-auto"
          meta={logs.data.meta}
          limit={limit}
          onLimitChange={setLimit}
          onPageChange={setPage}
          summary={`Showing ${logs.data.items.length} audit events`}
        />
      </section>

      <aside className="forge-card self-start rounded-[2.2rem] p-5 sm:p-7 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto thin-scrollbar">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-100">
            <Icon name="search" />
          </div>
          <div className="min-w-0">
            <h3 className="text-safe font-black text-white">Filters</h3>
            <p className="text-safe text-sm text-slate-400">Inspect one slice of activity.</p>
          </div>
        </div>
        <div className="space-y-4">
          <Field label="Action">
            <Input
              placeholder="PROJECT_CREATED"
              value={action}
              onChange={(event) => setAction(event.target.value.toUpperCase())}
            />
          </Field>
          <Field label="Resource type">
            <Input
              placeholder="PROJECT"
              value={resourceType}
              onChange={(event) => setResourceType(event.target.value.toUpperCase())}
            />
          </Field>
          <Field label="Resource ID">
            <Input
              placeholder="Optional exact id"
              value={resourceId}
              onChange={(event) => setResourceId(event.target.value)}
            />
          </Field>
          <Button
            className="w-full"
            onClick={() => {
              setAction('');
              setResourceType('');
              setResourceId('');
            }}
          >
            Clear filters
          </Button>
        </div>
      </aside>
    </div>
  );
}
