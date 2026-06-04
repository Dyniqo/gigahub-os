import type { Contract } from '../types/api';
import { dateShort, money } from '../lib/format';
import { Button, StatusBadge } from './ui';
import { Icon } from './Icon';

type MilestoneAction = 'submit' | 'approve' | 'release' | 'dispute';

type ActionState = {
  milestoneId: string;
  action: MilestoneAction;
} | null;

const pendingCopy: Record<MilestoneAction, string> = {
  submit: 'Submitting this milestone for client review…',
  approve: 'Approving the submitted milestone…',
  release: 'Releasing the approved milestone…',
  dispute: 'Opening a dispute record for this milestone…',
};

const doneCopy: Record<MilestoneAction, string> = {
  submit: 'Submitted for review. The client can approve, dispute, or continue review.',
  approve: 'Approved. The milestone is now ready for release.',
  release: 'Released. The milestone payout state has been updated.',
  dispute: 'Dispute opened. The milestone now needs resolution before moving forward.',
};

export function ContractTimeline({
  contract,
  role,
  onMilestoneAction,
  activeAction,
  latestAction,
}: {
  contract: Contract;
  role?: string;
  onMilestoneAction?: (milestoneId: string, action: MilestoneAction) => Promise<void> | void;
  activeAction?: ActionState;
  latestAction?: ActionState;
}) {
  const busy = Boolean(activeAction);

  return (
    <article className="forge-card relative overflow-hidden rounded-[2rem] p-5">
      <div className="forge-hover-line" />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={contract.status} />
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-400">
              Started {dateShort(contract.startedAt)}
            </span>
          </div>
          <h3 className="text-safe text-xl font-black text-white">{contract.project.title}</h3>
          <p className="text-safe mt-2 text-sm text-slate-400">
            {money(contract.totalAmount, contract.currency)} total · {contract.milestones.length}{' '}
            milestones
          </p>
        </div>
        <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 text-left lg:text-right">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Contract id
          </p>
          <p className="text-safe mt-1 font-mono text-xs text-slate-300">{contract.id}</p>
        </div>
      </div>

      <div className="mt-7 space-y-4">
        {contract.milestones.map((milestone, index) => {
          const isActive = activeAction?.milestoneId === milestone.id;
          const isLatest = latestAction?.milestoneId === milestone.id && !isActive;
          return (
            <div
              key={milestone.id}
              className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-black/15 p-4 md:grid-cols-[48px_minmax(0,1fr)] xl:grid-cols-[48px_minmax(0,1fr)_auto]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sky-100">
                <span className="font-black">{index + 1}</span>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-safe font-black text-white">{milestone.title}</h4>
                  <StatusBadge status={milestone.status} />
                </div>
                <p className="text-safe mt-2 text-sm leading-6 text-slate-400">
                  {milestone.description ?? 'No description'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-400">
                  <span className="text-safe rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    {money(milestone.amount, milestone.currency)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    Due {dateShort(milestone.dueAt)}
                  </span>
                  {milestone.submittedAt ? (
                    <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sky-100">
                      Submitted {dateShort(milestone.submittedAt)}
                    </span>
                  ) : null}
                </div>
                {isActive ? (
                  <div className="mt-3 flex items-start gap-2 rounded-2xl border border-sky-400/20 bg-sky-400/10 p-3 text-xs font-bold leading-5 text-sky-100">
                    <span
                      className="mt-0.5 h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
                      aria-hidden="true"
                    />
                    <span>{pendingCopy[activeAction.action]}</span>
                  </div>
                ) : isLatest ? (
                  <div className="mt-3 flex items-start gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-xs font-bold leading-5 text-cyan-100">
                    <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{doneCopy[latestAction.action]}</span>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 md:col-start-2 xl:col-start-auto xl:justify-end">
                {role === 'FREELANCER' && milestone.status === 'FUNDED' ? (
                  <Button
                    icon="send"
                    loading={isActive && activeAction?.action === 'submit'}
                    disabled={busy && !isActive}
                    onClick={() => void onMilestoneAction?.(milestone.id, 'submit')}
                  >
                    Submit
                  </Button>
                ) : null}
                {role === 'CLIENT' && milestone.status === 'SUBMITTED' ? (
                  <Button
                    variant="primary"
                    icon="check"
                    loading={isActive && activeAction?.action === 'approve'}
                    disabled={busy && !isActive}
                    onClick={() => void onMilestoneAction?.(milestone.id, 'approve')}
                  >
                    Approve
                  </Button>
                ) : null}
                {role === 'CLIENT' && milestone.status === 'APPROVED' ? (
                  <Button
                    icon="money"
                    loading={isActive && activeAction?.action === 'release'}
                    disabled={busy && !isActive}
                    onClick={() => void onMilestoneAction?.(milestone.id, 'release')}
                  >
                    Release
                  </Button>
                ) : null}
                {['CLIENT', 'FREELANCER'].includes(role ?? '') &&
                ['FUNDED', 'SUBMITTED', 'APPROVED'].includes(milestone.status) ? (
                  <Button
                    variant="danger"
                    icon="alert"
                    loading={isActive && activeAction?.action === 'dispute'}
                    disabled={busy && !isActive}
                    onClick={() => void onMilestoneAction?.(milestone.id, 'dispute')}
                  >
                    Dispute
                  </Button>
                ) : null}
                {!onMilestoneAction ? (
                  <Icon name="lock" className="h-4 w-4 text-slate-500" />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
