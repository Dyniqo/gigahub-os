import { FormEvent, useEffect, useState } from 'react';
import { ApiError, api } from '../lib/api';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useAuth } from '../context/AuthContext';
import { useProposalIndex, primeProposalIndex } from '../hooks/useProposalIndex';
import { money, timeAgo } from '../lib/format';
import type { Project } from '../types/api';
import {
  ActionBanner,
  Button,
  EmptyState,
  Field,
  Input,
  LoadingStrip,
  StatusBadge,
  Textarea,
} from '../components/ui';
import { Icon } from '../components/Icon';
import { navigate } from '../hooks/useHashRoute';

function defaultProposalForm(project: Project | null) {
  return {
    proposedAmount: project?.budgetMax ?? project?.budgetMin ?? '8000',
    deliveryDays: '21',
    currency: project?.currency ?? 'USD',
    coverLetter:
      'I can deliver a polished workspace with role-aware screens, resilient flows, a smooth proposal-to-contract handoff, and clear milestone visibility.',
  };
}

export function ProjectDetailPage({ id }: { id: string }) {
  const { user, isAuthenticated } = useAuth();
  const proposalIndex = useProposalIndex(isAuthenticated, user?.role, user?.id);
  const {
    data: project,
    error,
    isLoading,
  } = useAsyncResource<Project | null>(() => api.projects.get(id), null, [id], {
    cacheKey: `projects:detail:${id}`,
    ttlMs: 45_000,
    keepPreviousOnError: true,
  });
  const [notice, setNotice] = useState<{
    type: 'info' | 'success' | 'error';
    title: string;
    description?: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(defaultProposalForm(project));
  const existingProposal = proposalIndex.find(project?.id);

  useEffect(() => {
    setForm(defaultProposalForm(project));
  }, [project?.id]);

  async function submitProposal(event: FormEvent) {
    event.preventDefault();
    if (!project) return;
    setNotice({
      type: 'info',
      title: 'Submitting proposal',
      description: 'Sending the proposal to the project owner…',
    });
    setSubmitting(true);
    try {
      const proposal = await api.proposals.create(project.id, {
        coverLetter: form.coverLetter.trim(),
        proposedAmount: Number(form.proposedAmount),
        deliveryDays: Number(form.deliveryDays),
        currency: form.currency.trim().toUpperCase() || undefined,
      });
      primeProposalIndex(proposal, user?.id);
      await proposalIndex.refresh(true);
      setNotice({
        type: 'success',
        title: 'Proposal submitted',
        description: `The proposal is now ${proposal.status.toLowerCase()} and available in Proposals.`,
      });
    } catch (errorValue) {
      const duplicateProposal =
        errorValue instanceof ApiError &&
        (errorValue.status === 409 || errorValue.message.toLowerCase().includes('already'));
      if (duplicateProposal) {
        const refreshed = await proposalIndex.refresh(true);
        const matched = refreshed.find((proposal) => proposal.projectId === project.id);
        setNotice({
          type: 'info',
          title: 'Proposal already sent',
          description: matched
            ? 'Continue from the proposal you already sent for this project.'
            : 'Open Proposals to continue from your existing submission.',
        });
      } else {
        setNotice({
          type: 'error',
          title: 'Could not submit proposal',
          description:
            errorValue instanceof Error ? errorValue.message : 'The proposal could not be sent.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!project && !isLoading) {
    return (
      <div className="space-y-4">
        {error ? (
          <div className="text-safe rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4 text-sm font-bold text-sky-100">
            {error}
          </div>
        ) : null}
        <EmptyState
          icon="briefcase"
          title="Project is not available"
          description="This public view only opens published projects. Drafts and private records stay inside the client workspace."
          action={
            <Button
              onClick={() => {
                window.location.hash = '/explore';
              }}
            >
              Back to Explore
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <section className="min-w-0 space-y-4">
        {isLoading ? <LoadingStrip /> : null}
        {error ? (
          <div className="text-safe rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4 text-sm font-bold text-sky-100">
            {error}
          </div>
        ) : null}

        {project ? (
          <>
            <article className="forge-card relative overflow-hidden rounded-[2.4rem] p-6 sm:p-8">
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
              <div className="relative min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={project.status} />
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-400">
                    Updated {timeAgo(project.updatedAt)}
                  </span>
                </div>
                <h2 className="text-safe mt-5 max-w-4xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                  {project.title}
                </h2>
                <p className="text-safe mt-5 max-w-4xl whitespace-pre-wrap text-base leading-8 text-slate-400">
                  {project.description}
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Budget min
                    </p>
                    <p className="text-safe mt-1 text-xl font-black text-white">
                      {money(project.budgetMin, project.currency)}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Budget max
                    </p>
                    <p className="text-safe mt-1 text-xl font-black text-white">
                      {money(project.budgetMax, project.currency)}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Version
                    </p>
                    <p className="text-safe mt-1 text-xl font-black text-white">
                      v{project.version}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-2">
                  {project.skills.map((skill) => (
                    <span
                      key={skill}
                      className="max-w-full truncate rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </article>

            <section className="forge-card rounded-[2.2rem] p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sky-100">
                  <Icon name="branch" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-200">
                    Deal structure
                  </p>
                  <h3 className="text-safe font-black text-white">Scope snapshot</h3>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Skills
                  </p>
                  <p className="mt-1 text-2xl font-black text-white">{project.skills.length}</p>
                  <p className="text-safe mt-2 text-sm text-slate-400">
                    Signals the team wants to see.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Budget band
                  </p>
                  <p className="text-safe mt-1 text-lg font-black text-white">
                    {money(project.budgetMin, project.currency)}–
                    {money(project.budgetMax, project.currency)}
                  </p>
                  <p className="text-safe mt-2 text-sm text-slate-400">
                    Clear range before proposal.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Next move
                  </p>
                  <p className="text-safe mt-1 text-lg font-black text-white">Proposal review</p>
                  <p className="text-safe mt-2 text-sm text-slate-400">
                    Pitch, shortlist, then contract.
                  </p>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </section>

      <aside className="forge-card min-w-0 self-start rounded-[2.2rem] p-5 sm:p-7 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto thin-scrollbar">
        {notice ? (
          <div className="mb-4">
            <ActionBanner
              type={notice.type}
              title={notice.title}
              description={notice.description}
              action={
                project && (existingProposal || notice.title.includes('already')) ? (
                  <Button
                    onClick={() =>
                      navigate(
                        `/studio/proposals?projectId=${project.id}${existingProposal ? `&proposalId=${existingProposal.id}` : ''}`,
                      )
                    }
                    icon="send"
                  >
                    Open proposal
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : null}
        {!isAuthenticated ? (
          <EmptyState
            icon="lock"
            title="Sign in to propose"
            description="Freelancers can submit proposals after authentication."
            action={
              <Button
                variant="primary"
                onClick={() => {
                  window.location.hash = '/auth';
                }}
              >
                Authenticate
              </Button>
            }
          />
        ) : user?.role !== 'FREELANCER' ? (
          <EmptyState
            icon="user"
            title="Freelancer role needed"
            description="Clients can review proposals from the Proposals area. Proposal submission is freelancer-only."
          />
        ) : !project || project.status !== 'PUBLISHED' ? (
          <EmptyState
            icon="lock"
            title="Project is not open"
            description="Only published projects can receive new proposals."
          />
        ) : existingProposal ? (
          <EmptyState
            icon="check"
            title="Proposal already sent"
            description={`Your proposal is currently ${existingProposal.status.toLowerCase()}. Continue from the existing submission.`}
            action={
              <Button
                variant="primary"
                icon="send"
                onClick={() =>
                  navigate(
                    `/studio/proposals?projectId=${project.id}&proposalId=${existingProposal.id}`,
                  )
                }
              >
                View proposal
              </Button>
            }
          />
        ) : (
          <form className="space-y-4" onSubmit={(event) => void submitProposal(event)}>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-200">
                Submit proposal
              </p>
              <h3 className="text-safe mt-2 text-2xl font-black text-white">
                Pitch with precision.
              </h3>
            </div>
            <Field label="Cover letter">
              <Textarea
                value={form.coverLetter}
                onChange={(event) => setForm({ ...form, coverLetter: event.target.value })}
                required
                maxLength={8000}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Amount">
                <Input
                  type="number"
                  min={1}
                  max={100000000}
                  step="0.01"
                  value={form.proposedAmount}
                  onChange={(event) => setForm({ ...form, proposedAmount: event.target.value })}
                  required
                />
              </Field>
              <Field label="Days">
                <Input
                  type="number"
                  min={1}
                  max={3650}
                  value={form.deliveryDays}
                  onChange={(event) => setForm({ ...form, deliveryDays: event.target.value })}
                  required
                />
              </Field>
            </div>
            <Field label="Currency">
              <Input
                minLength={3}
                maxLength={3}
                pattern="[A-Za-z]{3}"
                value={form.currency}
                onChange={(event) =>
                  setForm({ ...form, currency: event.target.value.toUpperCase() })
                }
              />
            </Field>
            <Button
              variant="primary"
              icon="send"
              type="submit"
              className="w-full"
              loading={submitting}
            >
              {submitting ? 'Submitting proposal' : 'Submit proposal'}
            </Button>
          </form>
        )}
      </aside>
    </div>
  );
}
