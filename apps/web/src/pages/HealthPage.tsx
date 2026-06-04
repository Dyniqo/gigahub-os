import { useAsyncResource } from '../hooks/useAsyncResource';
import { api } from '../lib/api';
import { Button, LoadingStrip, StatusBadge } from '../components/ui';
import { Icon } from '../components/Icon';

const fallback = { status: 'pending', details: { service: 'waiting' } };

export function HealthPage() {
  const live = useAsyncResource(() => api.health.live(), fallback, []);
  const ready = useAsyncResource(() => api.health.ready(), fallback, []);

  return (
    <div className="space-y-4">
      <section className="forge-card rounded-[2.2rem] p-5 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-200">System health</p>
        <h2 className="mt-2 text-3xl font-black text-white">System readiness panel.</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Monitor availability and readiness from one compact system view.
        </p>
      </section>
      {live.isLoading || ready.isLoading ? <LoadingStrip /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ['Live', live.data, live.refresh],
          ['Ready', ready.data, ready.refresh],
        ].map(([label, data, refresh]) => (
          <article key={String(label)} className="forge-card rounded-[2rem] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sky-100">
                  <Icon name="pulse" />
                </div>
                <h3 className="text-xl font-black text-white">{String(label)}</h3>
              </div>
              <StatusBadge
                status={
                  typeof data === 'object' && data && 'status' in data
                    ? String(data.status)
                    : 'unknown'
                }
              />
            </div>
            <pre className="max-h-[360px] overflow-auto rounded-[1.5rem] border border-white/10 bg-black/35 p-4 text-xs leading-6 text-slate-300 thin-scrollbar">
              {JSON.stringify(data, null, 2)}
            </pre>
            <Button className="mt-4 w-full" onClick={() => void (refresh as () => Promise<void>)()}>
              Refresh {String(label)}
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
