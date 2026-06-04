import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { emptyPage } from '../lib/empty';
import { invalidateResource } from '../lib/resourceCache';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useAuth } from '../context/AuthContext';
import type { Contract, ContractStatus } from '../types/api';
import { ContractTimeline } from '../components/ContractTimeline';
import { ActionBanner, Button, EmptyState, Field, LoadingStrip } from '../components/ui';
import { Pagination } from '../components/Pagination';

type MilestoneAction = 'submit' | 'approve' | 'release' | 'dispute';
type Notice = { type: 'info' | 'success' | 'error'; title: string; description?: string } | null;
type ActionState = { milestoneId: string; action: MilestoneAction } | null;

const actionCopy: Record<MilestoneAction, { pending: string; success: string; detail: string }> = {
  submit: {
    pending: 'Submitting milestone',
    success: 'Milestone submitted',
    detail: 'The milestone was sent for client review and the contract list has been refreshed.',
  },
  approve: {
    pending: 'Approving milestone',
    success: 'Milestone approved',
    detail: 'The milestone is now ready for release when the client is ready to pay out.',
  },
  release: {
    pending: 'Releasing milestone',
    success: 'Milestone released',
    detail: 'The release request completed and the contract state was refreshed.',
  },
  dispute: {
    pending: 'Opening dispute',
    success: 'Dispute opened',
    detail:
      'A dispute record was attached to the milestone and the updated state is visible below.',
  },
};

export function ContractsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ContractStatus | ''>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [notice, setNotice] = useState<Notice>(null);
  const [activeAction, setActiveAction] = useState<ActionState>(null);
  const [latestAction, setLatestAction] = useState<ActionState>(null);
  const fallback = useMemo(() => emptyPage<Contract>(), []);
  const contracts = useAsyncResource(
    () => api.contracts.mine({ page, limit, status: status || undefined }),
    fallback,
    [user?.id, page, limit, status],
    {
      cacheKey: `contracts:mine:${user?.id ?? 'anon'}:${status}:${page}:${limit}`,
      ttlMs: 30_000,
      keepPreviousOnError: true,
    },
  );

  useEffect(() => {
    setPage(1);
  }, [status, limit]);

  async function milestoneAction(id: string, action: MilestoneAction) {
    const copy = actionCopy[action];
    setLatestAction(null);
    setActiveAction({ milestoneId: id, action });
    setNotice({
      type: 'info',
      title: copy.pending,
      description: 'Updating the server and refreshing the visible contract state…',
    });

    try {
      if (action === 'submit') await api.milestones.submit(id);
      if (action === 'approve') await api.milestones.approve(id);
      if (action === 'release') await api.milestones.release(id);
      if (action === 'dispute')
        await api.milestones.dispute(id, {
          reason: 'Milestone needs review before the next state change.',
          evidenceUrls: [],
        });
      invalidateResource('contracts:');
      await contracts.refresh();
      setLatestAction({ milestoneId: id, action });
      setNotice({ type: 'success', title: copy.success, description: copy.detail });
    } catch (errorValue) {
      setNotice({
        type: 'error',
        title: `Could not ${action} milestone`,
        description:
          errorValue instanceof Error ? errorValue.message : 'The action could not be completed.',
      });
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-13.5rem)] flex-col gap-4">
      <section className="forge-card rounded-[2.2rem] p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-200">
              Contract cockpit
            </p>
            <h2 className="text-safe mt-2 text-3xl font-black text-white">
              Milestones move through clear review stages.
            </h2>
            <p className="text-safe mt-2 text-sm leading-6 text-slate-400">
              Follow every contract through funded milestones, submissions, approvals, releases, and
              disputes.
            </p>
          </div>
          <Field label="Status" className="sm:ml-auto">
            <select
              className="forge-input forge-input-compact w-full sm:w-44"
              value={status}
              onChange={(event) => setStatus(event.target.value as ContractStatus | '')}
            >
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="DISPUTED">Disputed</option>
            </select>
          </Field>
        </div>
      </section>

      {contracts.isLoading ? <LoadingStrip /> : null}
      {contracts.error ? (
        <ActionBanner
          type="error"
          title="Contracts could not be loaded"
          description={contracts.error}
        />
      ) : null}
      {notice ? (
        <ActionBanner type={notice.type} title={notice.title} description={notice.description} />
      ) : null}

      {contracts.data.items.length ? (
        <div className="space-y-4">
          {contracts.data.items.map((contract) => (
            <ContractTimeline
              key={contract.id}
              contract={contract}
              role={user?.role}
              onMilestoneAction={milestoneAction}
              activeAction={activeAction}
              latestAction={latestAction}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="shield"
          title="No contracts yet"
          description="Contracts are created when a client accepts a submitted or shortlisted proposal."
          action={
            <Button
              onClick={() => {
                window.location.hash = '/studio/proposals';
              }}
            >
              Open proposals
            </Button>
          }
        />
      )}

      <Pagination
        className="mt-auto"
        meta={contracts.data.meta}
        limit={limit}
        onLimitChange={setLimit}
        onPageChange={setPage}
        summary={`Showing ${contracts.data.items.length} contracts`}
        action={
          <Button onClick={() => void contracts.refresh()} loading={contracts.isLoading}>
            Refresh
          </Button>
        }
      />
    </div>
  );
}
