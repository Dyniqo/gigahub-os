import type { Proposal } from '../types/api';
import { money, timeAgo } from '../lib/format';
import { Button, StatusBadge } from './ui';
import { Icon } from './Icon';

export function ProposalCard({
  proposal,
  canWithdraw,
  canAccept,
  onWithdraw,
  onAccept,
  isWithdrawing = false,
  highlight = false,
}: {
  proposal: Proposal;
  canWithdraw?: boolean;
  canAccept?: boolean;
  onWithdraw?: (id: string) => Promise<void> | void;
  onAccept?: (proposal: Proposal) => void;
  isWithdrawing?: boolean;
  highlight?: boolean;
}) {
  return (
    <article
      className={`forge-card relative overflow-hidden rounded-[2rem] p-5 ${highlight ? 'ring-2 ring-sky-400/50' : ''}`}
    >
      <div className="forge-hover-line" />
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={proposal.status} />
              <span className="text-xs font-bold text-slate-500">
                Submitted {timeAgo(proposal.submittedAt)}
              </span>
            </div>
            <h3 className="text-safe text-lg font-black text-white">{proposal.project.title}</h3>
          </div>
          <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 p-3 text-sky-100">
            <Icon name="send" />
          </div>
        </div>
        <p className="text-safe line-clamp-4 text-sm leading-6 text-slate-400">
          {proposal.coverLetter}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Amount</p>
            <p className="text-safe mt-1 font-black text-white">
              {money(proposal.proposedAmount, proposal.currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Delivery</p>
            <p className="mt-1 font-black text-white">{proposal.deliveryDays} days</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Version</p>
            <p className="mt-1 font-black text-white">v{proposal.version}</p>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {canAccept && ['SUBMITTED', 'SHORTLISTED'].includes(proposal.status) ? (
              <Button variant="primary" icon="check" onClick={() => onAccept?.(proposal)}>
                Accept & contract
              </Button>
            ) : null}
            {canWithdraw && ['SUBMITTED', 'SHORTLISTED'].includes(proposal.status) ? (
              <Button
                variant="danger"
                loading={isWithdrawing}
                onClick={() => void onWithdraw?.(proposal.id)}
                title="Retract this proposal before it is accepted"
              >
                {isWithdrawing ? 'Retracting' : 'Retract proposal'}
              </Button>
            ) : null}
          </div>
          {canWithdraw && ['SUBMITTED', 'SHORTLISTED'].includes(proposal.status) ? (
            <span className="text-safe text-xs font-bold leading-5 text-slate-500">
              Available before acceptance.
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
