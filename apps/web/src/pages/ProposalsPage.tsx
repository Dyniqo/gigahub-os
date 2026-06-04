import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { emptyPage } from '../lib/empty';
import { useAuth } from '../context/AuthContext';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useHashRoute } from '../hooks/useHashRoute';
import { invalidateProposalIndex } from '../hooks/useProposalIndex';
import { cx, statusLabel } from '../lib/format';
import type { Paginated, Project, Proposal, ProposalStatus } from '../types/api';
import {
  ActionBanner,
  Button,
  EmptyState,
  Field,
  Input,
  LoadingStrip,
  SearchableSelect,
  Textarea,
  type SelectOption,
} from '../components/ui';
import { ProposalCard } from '../components/ProposalCard';
import { Pagination } from '../components/Pagination';

const PROJECT_SELECTOR_LIMIT = 8;

function paginateLocal<T>(items: T[], page: number, limit: number): Paginated<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    meta: {
      page: safePage,
      limit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
}

export function ProposalsPage() {
  const { user } = useAuth();
  const route = useHashRoute();
  const requestedProjectId = route.query.get('projectId') ?? '';
  const requestedProposalId = route.query.get('proposalId') ?? '';
  const [status, setStatus] = useState<ProposalStatus | ''>('');
  const [selectedProjectId, setSelectedProjectId] = useState(requestedProjectId);
  const [selectedProjectLabel, setSelectedProjectLabel] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const debouncedProjectSearch = useDebouncedValue(projectSearch.trim().slice(0, 120));
  const [projectPage, setProjectPage] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [accepting, setAccepting] = useState<Proposal | null>(null);
  const [notice, setNotice] = useState<{
    type: 'info' | 'success' | 'error';
    title: string;
    description?: string;
  } | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const projectsFallback = useMemo(() => emptyPage<Project>(), []);
  const projects = useAsyncResource(
    () =>
      user?.role === 'CLIENT'
        ? api.projects.mine({
            page: projectPage,
            limit: PROJECT_SELECTOR_LIMIT,
            search: debouncedProjectSearch || undefined,
          })
        : Promise.resolve(projectsFallback),
    projectsFallback,
    [user?.id, user?.role, projectPage, debouncedProjectSearch],
    {
      cacheKey: `projects:selector:${user?.id ?? 'anon'}:${projectPage}:${PROJECT_SELECTOR_LIMIT}:${debouncedProjectSearch}`,
      ttlMs: 45_000,
      keepPreviousOnError: true,
    },
  );
  const proposalsFallback = useMemo(() => emptyPage<Proposal>(), []);
  const proposals = useAsyncResource(
    async () => {
      if (user?.role === 'CLIENT') {
        return selectedProjectId
          ? api.proposals.forProject(selectedProjectId, {
              page,
              limit,
              status: status || undefined,
            })
          : Promise.resolve(proposalsFallback);
      }
      if (requestedProjectId) {
        const indexed = await api.proposals.mine({
          page: 1,
          limit: 50,
          status: status || undefined,
        });
        return paginateLocal(
          indexed.items.filter((proposal) => proposal.projectId === requestedProjectId),
          page,
          limit,
        );
      }
      return api.proposals.mine({ page, limit, status: status || undefined });
    },
    proposalsFallback,
    [user?.id, user?.role, selectedProjectId, requestedProjectId, status, page, limit],
    {
      cacheKey: `proposals:${user?.id ?? 'anon'}:${user?.role ?? 'anon'}:${selectedProjectId}:${requestedProjectId}:${status}:${page}:${limit}`,
      ttlMs: 30_000,
      keepPreviousOnError: true,
    },
  );

  useEffect(() => {
    setPage(1);
  }, [status, selectedProjectId, requestedProjectId, limit]);

  useEffect(() => {
    setProjectPage(1);
  }, [debouncedProjectSearch]);

  useEffect(() => {
    if (user?.role === 'CLIENT' && requestedProjectId) {
      setSelectedProjectId(requestedProjectId);
      setSelectedProjectLabel('Selected project');
    }
  }, [requestedProjectId, user?.role]);

  useEffect(() => {
    if (user?.role !== 'CLIENT' || selectedProjectId || debouncedProjectSearch) return;
    if (projects.data.items[0]) setSelectedProjectId(projects.data.items[0].id);
  }, [debouncedProjectSearch, projects.data.items, selectedProjectId, user?.role]);

  useEffect(() => {
    const currentProject = projects.data.items.find((project) => project.id === selectedProjectId);
    if (currentProject) setSelectedProjectLabel(currentProject.title);
  }, [projects.data.items, selectedProjectId]);

  const projectOptions = useMemo<SelectOption[]>(() => {
    const mapped = projects.data.items.map((project) => ({
      value: project.id,
      label: project.title,
      description: `${statusLabel(project.status)} · ${project.skills.slice(0, 3).join(', ') || 'No skills listed'}`,
    }));
    if (selectedProjectId && !mapped.some((project) => project.value === selectedProjectId)) {
      return [
        {
          value: selectedProjectId,
          label: selectedProjectLabel || 'Selected project',
          description: 'Pinned from the current proposal view',
        },
        ...mapped,
      ];
    }
    return mapped;
  }, [projects.data.items, selectedProjectId, selectedProjectLabel]);

  function changeProject(projectId: string) {
    const pickedProject = projectOptions.find((project) => project.value === projectId);
    setSelectedProjectId(projectId);
    setSelectedProjectLabel(pickedProject?.label ?? 'Selected project');
    setProjectSearch('');
    setProjectPage(1);
  }

  async function withdraw(id: string) {
    setNotice({
      type: 'info',
      title: 'Retracting proposal',
      description: 'Updating the proposal status and refreshing the list…',
    });
    setWithdrawingId(id);
    try {
      await api.proposals.withdraw(id);
      invalidateProposalIndex(user?.id);
      await proposals.refresh();
      setNotice({
        type: 'success',
        title: 'Proposal retracted',
        description: 'The proposal is no longer active for the selected project.',
      });
    } catch (errorValue) {
      setNotice({
        type: 'error',
        title: 'Could not retract proposal',
        description:
          errorValue instanceof Error
            ? errorValue.message
            : 'The proposal status could not be changed.',
      });
    } finally {
      setWithdrawingId(null);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-13.5rem)] flex-col gap-4">
      <section className="forge-card rounded-[2.2rem] p-5 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-200">
              Proposal exchange
            </p>
            <h2 className="text-safe mt-2 text-3xl font-black text-white">
              Review signal, accept one, reject the rest.
            </h2>
            <p className="text-safe mt-2 text-sm leading-6 text-slate-400">
              Freelancers manage outbound pitches; clients can open a project, review its proposals,
              and move the strongest match into a contract.
            </p>
          </div>
          <div
            className={cx(
              'grid min-w-0 gap-3 sm:items-end lg:ml-auto',
              user?.role === 'CLIENT'
                ? 'sm:grid-cols-[minmax(0,1fr)_10.5rem] lg:min-w-[34rem] lg:max-w-[42rem]'
                : 'sm:grid-cols-[10.5rem] lg:min-w-[10.5rem]',
            )}
          >
            {user?.role === 'CLIENT' ? (
              <Field label="Project" className="min-w-0">
                <SearchableSelect
                  value={selectedProjectId}
                  onChange={changeProject}
                  options={projectOptions}
                  placeholder="Select project"
                  searchPlaceholder="Search projects…"
                  emptyText="No projects found"
                  disabled={!projectOptions.length && !selectedProjectId}
                  isLoading={projects.isLoading}
                  searchValue={projectSearch}
                  onSearchChange={setProjectSearch}
                  page={projects.data.meta.page}
                  totalPages={projects.data.meta.totalPages}
                  total={projects.data.meta.total}
                  onPageChange={setProjectPage}
                />
              </Field>
            ) : null}
            <Field label="Status" className="sm:justify-self-end">
              <select
                className="forge-input forge-input-compact w-full sm:w-44"
                value={status}
                onChange={(event) => setStatus(event.target.value as ProposalStatus | '')}
              >
                <option value="">All</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
                <option value="WITHDRAWN">Retracted</option>
              </select>
            </Field>
          </div>
        </div>
      </section>

      {projects.isLoading || proposals.isLoading ? <LoadingStrip /> : null}
      {projects.error && user?.role === 'CLIENT' ? (
        <ActionBanner
          type="error"
          title="Projects could not be loaded"
          description={projects.error}
        />
      ) : null}
      {proposals.error ? (
        <ActionBanner
          type="error"
          title="Proposals could not be loaded"
          description={proposals.error}
        />
      ) : null}
      {notice ? (
        <ActionBanner type={notice.type} title={notice.title} description={notice.description} />
      ) : null}
      {user?.role === 'CLIENT' && !projects.data.items.length && !selectedProjectId ? (
        <EmptyState
          icon="briefcase"
          title="No projects available"
          description="Create and publish a project before reviewing proposals."
          action={
            <Button
              onClick={() => {
                window.location.hash = '/studio/projects';
              }}
            >
              Create project
            </Button>
          }
        />
      ) : proposals.data.items.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {proposals.data.items.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              canWithdraw={
                user?.role === 'FREELANCER' &&
                (proposal.status === 'SUBMITTED' || proposal.status === 'SHORTLISTED')
              }
              canAccept={
                user?.role === 'CLIENT' &&
                (proposal.status === 'SUBMITTED' || proposal.status === 'SHORTLISTED')
              }
              onWithdraw={withdraw}
              onAccept={setAccepting}
              isWithdrawing={withdrawingId === proposal.id}
              highlight={
                proposal.id === requestedProposalId || proposal.projectId === requestedProjectId
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="send"
          title="No proposals found"
          description="No proposals match the selected filters."
        />
      )}

      <Pagination
        className="mt-auto"
        meta={proposals.data.meta}
        limit={limit}
        onLimitChange={setLimit}
        onPageChange={setPage}
        summary={`Showing ${proposals.data.items.length} proposals${requestedProjectId && user?.role === 'FREELANCER' ? ' · Filtered by project' : ''}`}
        action={
          <Button onClick={() => void proposals.refresh()} loading={proposals.isLoading}>
            Refresh
          </Button>
        }
      />

      {accepting ? (
        <AcceptProposalPanel
          proposal={accepting}
          onClose={() => setAccepting(null)}
          onDone={(result) => {
            setNotice({ type: 'success', title: 'Contract created', description: result });
            setAccepting(null);
            void proposals.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function AcceptProposalPanel({
  proposal,
  onClose,
  onDone,
}: {
  proposal: Proposal;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [title, setTitle] = useState('Launch-ready foundation');
  const [description, setDescription] = useState(
    'Architecture, core UI system, and first working contract flow.',
  );
  const [amount, setAmount] = useState(proposal.proposedAmount);
  const [dueAt, setDueAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  async function accept(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const contract = await api.contracts.accept(proposal.id, {
        milestones: [
          {
            title: title.trim(),
            description: description.trim() || undefined,
            amount: Number(amount),
            dueAt: dueAt ? `${dueAt}T00:00:00.000Z` : undefined,
          },
        ],
        terms: { reviewWindowDays: 3 },
      });
      setSaving(false);
      onDone(`Contract created: ${contract.id}`);
    } catch (errorValue) {
      setError(errorValue instanceof Error ? errorValue.message : 'Could not accept proposal');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-xl">
      <form
        onSubmit={(event) => void accept(event)}
        className="forge-card w-full max-w-2xl rounded-[2rem] p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-200">
              Accept proposal
            </p>
            <h3 className="text-safe mt-2 text-2xl font-black text-white">
              Create contract milestones
            </h3>
            <p className="text-safe mt-2 text-sm leading-6 text-slate-400">
              The milestone amounts must add up to the accepted proposal amount.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-black text-slate-300"
          >
            Close
          </button>
        </div>
        <div className="mt-6 grid gap-4">
          <Field label="Milestone title">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={160}
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={`Amount (${proposal.currency})`}>
              <Input
                type="number"
                min={1}
                max={100000000}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </Field>
            <Field label="Due date">
              <Input
                type="date"
                min={today}
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
              />
            </Field>
          </div>
          {error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm font-bold text-red-100">
              {error}
            </div>
          ) : null}
          <Button variant="primary" icon="check" type="submit" className="w-full" loading={saving}>
            {saving ? 'Creating contract' : 'Accept proposal'}
          </Button>
        </div>
      </form>
    </div>
  );
}
