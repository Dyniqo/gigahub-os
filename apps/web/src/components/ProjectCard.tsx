import type { Project, Proposal } from '../types/api';
import { money, timeAgo } from '../lib/format';
import { navigate } from '../hooks/useHashRoute';
import { Icon } from './Icon';
import { Button, StatusBadge } from './ui';

export function ProjectCard({
  project,
  onPublish,
  isPublishing = false,
  submittedProposal,
  showProposalReview = false,
}: {
  project: Project;
  onPublish?: (id: string) => Promise<void> | void;
  isPublishing?: boolean;
  submittedProposal?: Proposal | null;
  showProposalReview?: boolean;
}) {
  const range =
    project.budgetMin && project.budgetMax
      ? `${money(project.budgetMin, project.currency)}–${money(project.budgetMax, project.currency)}`
      : project.budgetMin
        ? `From ${money(project.budgetMin, project.currency)}`
        : project.budgetMax
          ? `Up to ${money(project.budgetMax, project.currency)}`
          : 'Flexible budget';

  return (
    <article className="forge-card group relative overflow-hidden rounded-[2rem] p-5 transition duration-300 hover:-translate-y-1">
      <div className="forge-hover-line" />
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl transition group-hover:bg-sky-400/10" />
      <div className="relative flex h-full min-w-0 flex-col gap-5">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={project.status} />
              {submittedProposal ? (
                <StatusBadge
                  status={submittedProposal.status}
                  className="border-sky-400/30 bg-sky-400/10 text-sky-100"
                />
              ) : null}
              {submittedProposal ? (
                <span
                  className="inline-flex max-w-full items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-cyan-100"
                  title="You already have a proposal for this project"
                >
                  <Icon name="check" className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Proposal sent</span>
                </span>
              ) : null}
              <span className="text-xs font-bold text-slate-500">
                Updated {timeAgo(project.updatedAt)}
              </span>
            </div>
            <h3 className="text-safe text-xl font-black leading-tight text-white">
              {project.title}
            </h3>
          </div>
          <div className="hidden shrink-0 rounded-2xl border border-white/10 bg-white/5 p-3 text-cyan-100 sm:block">
            <Icon name={submittedProposal ? 'check' : 'briefcase'} />
          </div>
        </div>
        <p className="text-safe line-clamp-3 text-sm leading-6 text-slate-400">
          {project.description}
        </p>
        <div className="flex min-w-0 flex-wrap gap-2">
          {project.skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="max-w-full truncate rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300"
            >
              {skill}
            </span>
          ))}
        </div>
        <div className="mt-auto min-w-0 border-t border-white/10 pt-4">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Budget
              </p>
              <p className="text-safe mt-1 text-lg font-black leading-snug text-white">{range}</p>
            </div>
          </div>

          <div className="mt-4 grid min-w-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
            {onPublish && (project.status === 'DRAFT' || project.status === 'PAUSED') ? (
              <Button
                className="w-full"
                variant="primary"
                icon="bolt"
                loading={isPublishing}
                onClick={() => void onPublish(project.id)}
              >
                {isPublishing ? 'Publishing' : 'Publish'}
              </Button>
            ) : null}
            {showProposalReview ? (
              <Button
                className="w-full"
                icon="send"
                onClick={() => navigate(`/studio/proposals?projectId=${project.id}`)}
                title="Review proposals for this project"
              >
                Review proposals
              </Button>
            ) : null}
            {submittedProposal ? (
              <Button
                className="w-full"
                icon="send"
                onClick={() =>
                  navigate(
                    `/studio/proposals?projectId=${project.id}&proposalId=${submittedProposal.id}`,
                  )
                }
              >
                View proposal
              </Button>
            ) : project.status === 'PUBLISHED' ? (
              <Button
                className="w-full"
                icon="arrow"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                Open
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
