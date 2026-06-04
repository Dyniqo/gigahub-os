import { api } from '../lib/api';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useAuth } from '../context/AuthContext';
import { money, statusLabel, timeAgo } from '../lib/format';
import { Button, EmptyState, LoadingStrip, StatCard, StatusBadge } from '../components/ui';
import { Icon } from '../components/Icon';
import { navigate } from '../hooks/useHashRoute';
import type { Dashboard } from '../types/api';

const emptyDashboard: Dashboard = {
  generatedAt: new Date(0).toISOString(),
  projectStatuses: [],
  proposalStatuses: [],
  contractStatuses: [],
  milestoneStatuses: [],
  workQueue: {
    clientMilestonesWaitingForReview: 0,
    freelancerMilestonesReadyToSubmit: 0,
    proposalsWaitingForClientDecision: 0,
    activeContractsAsClient: 0,
    activeContractsAsFreelancer: 0,
  },
  financials: {
    earned: [],
    spent: [],
    pendingEarnings: [],
    committedSpend: [],
  },
  recentActivity: [],
};

function StatusRail({
  title,
  items,
}: {
  title: string;
  items: Array<{ status: string; count: number }>;
}) {
  const total = Math.max(
    1,
    items.reduce((sum, item) => sum + item.count, 0),
  );
  return (
    <div className="forge-card rounded-[2rem] p-5">
      <p className="text-sm font-black text-white">{title}</p>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div key={item.status}>
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="text-safe">{statusLabel(item.status)}</span>
              <span>{item.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300"
                style={{ width: `${Math.max(4, (item.count / total) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function totalCount(items: Array<{ count: number }>) {
  return items.reduce((sum, item) => sum + item.count, 0);
}

function firstMoney(
  items: Dashboard['financials'][keyof Dashboard['financials']],
  fallbackCurrency = 'USD',
) {
  const item = items[0];
  return money(item?.amount ?? 0, item?.currency ?? fallbackCurrency);
}

export function DashboardPage() {
  const { user } = useAuth();
  const {
    data: dashboard,
    error,
    isLoading,
  } = useAsyncResource(() => api.dashboard.me(), emptyDashboard, [user?.id], {
    cacheKey: `dashboard:me:${user?.id ?? 'anon'}`,
    ttlMs: 30_000,
    keepPreviousOnError: true,
  });
  const queue = dashboard.workQueue;
  const activeContracts = queue.activeContractsAsClient + queue.activeContractsAsFreelancer;
  const activityItems = dashboard.recentActivity.slice(0, 10);

  return (
    <div className="space-y-4">
      {isLoading ? <LoadingStrip /> : null}
      {error ? (
        <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4 text-sm font-bold text-sky-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active contracts"
          value={activeContracts}
          icon="shield"
          caption={`${queue.activeContractsAsClient} as client · ${queue.activeContractsAsFreelancer} as freelancer`}
        />
        <StatCard
          label="Proposal decisions"
          value={queue.proposalsWaitingForClientDecision}
          icon="send"
          caption="Waiting for client review"
        />
        <StatCard
          label="Pending earnings"
          value={firstMoney(dashboard.financials.pendingEarnings)}
          icon="money"
          caption="Committed but unreleased payout"
        />
        <StatCard
          label="Earned"
          value={firstMoney(dashboard.financials.earned)}
          icon="check"
          caption="Released earnings across contracts"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr] xl:items-stretch">
        <section className="forge-card relative h-full min-h-0 overflow-hidden rounded-[2.2rem] p-5 sm:p-7">
          <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative flex h-full min-w-0 flex-col">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-200">
                Operational graph
              </p>
              <h2 className="text-safe mt-3 text-3xl font-black text-white">
                One workspace, five business objects.
              </h2>
              <p className="text-safe mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Track active work, proposal decisions, milestone queues, financial movement, and
                recent activity without jumping between tools.
              </p>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Review queue
                </p>
                <p className="text-safe mt-2 text-sm leading-6 text-slate-400">
                  {queue.proposalsWaitingForClientDecision} proposal decisions,{' '}
                  {queue.clientMilestonesWaitingForReview} client reviews, and{' '}
                  {queue.freelancerMilestonesReadyToSubmit} ready-to-submit milestones are queued.
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Active coverage
                </p>
                <p className="text-safe mt-2 text-sm leading-6 text-slate-400">
                  {activeContracts} active contracts connect delivery, budget, and milestone release
                  signals in one place.
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Financial signal
                </p>
                <p className="text-safe mt-2 text-sm leading-6 text-slate-400">
                  {firstMoney(dashboard.financials.earned)} earned and{' '}
                  {firstMoney(dashboard.financials.pendingEarnings)} pending across tracked work.
                </p>
              </div>
            </div>

            <div className="mt-5 grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              {[
                ['Projects', totalCount(dashboard.projectStatuses), 'briefcase'],
                ['Proposals', totalCount(dashboard.proposalStatuses), 'send'],
                ['Contracts', totalCount(dashboard.contractStatuses), 'shield'],
                ['Milestones', totalCount(dashboard.milestoneStatuses), 'check'],
              ].map(([label, value, icon]) => (
                <div
                  key={label}
                  className="min-w-0 rounded-[1.4rem] border border-white/10 bg-black/20 p-4 text-center sm:p-5"
                >
                  <Icon name={icon as never} className="mx-auto mb-3 h-5 w-5 text-sky-100" />
                  <p className="text-safe text-3xl font-black leading-none text-white">{value}</p>
                  <p className="text-safe mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="relative min-h-[28rem] min-w-0 xl:min-h-0 xl:self-stretch">
          <section className="forge-card flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[2.2rem] p-5 sm:p-7 xl:absolute xl:inset-0">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-black text-white">Recent activity</p>
                <p className="text-safe mt-1 text-xs font-bold text-slate-500">
                  The latest traceable workspace changes.
                </p>
              </div>
              <Button onClick={() => navigate('/studio/audit')} icon="pulse">
                Open log
              </Button>
            </div>
            <div className="thin-scrollbar mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {activityItems.length ? (
                activityItems.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-sky-400 shadow-[0_0_0_4px_rgba(56,189,248,.16)]" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={activity.action} className="tracking-[0.08em]" />
                        <span className="text-xs font-bold text-slate-500">
                          {timeAgo(activity.createdAt)}
                        </span>
                      </div>
                      <p className="text-safe mt-1 font-mono text-xs text-slate-400">
                        {activity.resourceType} · {activity.resourceId}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon="pulse"
                  title="No recent activity"
                  description="Workspace actions will appear here as they happen."
                />
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusRail title="Projects" items={dashboard.projectStatuses} />
        <StatusRail title="Proposals" items={dashboard.proposalStatuses} />
        <StatusRail title="Contracts" items={dashboard.contractStatuses} />
        <StatusRail title="Milestones" items={dashboard.milestoneStatuses} />
      </div>
    </div>
  );
}
