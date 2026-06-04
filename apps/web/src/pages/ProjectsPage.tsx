import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { emptyPage } from '../lib/empty';
import { invalidateResource } from '../lib/resourceCache';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useAuth } from '../context/AuthContext';
import type { Project, ProjectStatus } from '../types/api';
import {
  ActionBanner,
  Button,
  EmptyState,
  Field,
  Input,
  LoadingStrip,
  Textarea,
} from '../components/ui';
import { ProjectCard } from '../components/ProjectCard';
import { Icon } from '../components/Icon';
import { SkillInput } from '../components/SkillInput';
import { Pagination } from '../components/Pagination';
import { normalizeSkillList } from '../lib/safety';

const PROJECT_SKILL_SUGGESTIONS = [
  'react',
  'typescript',
  'nestjs',
  'postgresql',
  'product design',
  'escrow',
  'dashboard',
  'api design',
  'analytics',
  'workflow',
];

const defaultProject = {
  title: '',
  description: '',
  budgetMin: '',
  budgetMax: '',
  currency: 'USD',
  skills: [] as string[],
};

const starterProject = {
  title: 'Design a secure client workspace',
  description:
    'Build a clean client workspace with project tracking, proposal review, contract milestones, responsive layouts, and safe profile rendering.',
  budgetMin: '5000',
  budgetMax: '9000',
  currency: 'USD',
  skills: ['react', 'typescript', 'ux research', 'api design'] as string[],
};

const projectPlaceholders = {
  title: 'Build a role-aware contract workspace',
  description:
    'Describe the outcome, constraints, milestones, and the skills needed to deliver it.',
  budgetMin: '5000',
  budgetMax: '9000',
};

function optionalAmount(value: string): number | undefined {
  return value.trim() === '' ? undefined : Number(value);
}

function isProjectDraftReady(form: typeof defaultProject): boolean {
  const titleReady = form.title.trim().length >= 4;
  const descriptionReady = form.description.trim().length >= 20;
  const currencyReady = /^[A-Za-z]{3}$/.test(form.currency.trim());
  const budgetMin = optionalAmount(form.budgetMin);
  const budgetMax = optionalAmount(form.budgetMax);
  const amountsReady = [budgetMin, budgetMax].every(
    (value) => value === undefined || (Number.isFinite(value) && value >= 0 && value <= 100000000),
  );
  const rangeReady = budgetMin === undefined || budgetMax === undefined || budgetMin <= budgetMax;
  return titleReady && descriptionReady && currencyReady && amountsReady && rangeReady;
}

type Notice = { type: 'info' | 'success' | 'error'; title: string; description?: string } | null;

export function ProjectsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ProjectStatus | ''>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [notice, setNotice] = useState<Notice>(null);
  const [creating, setCreating] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const fallback = useMemo(() => emptyPage<Project>(), []);
  const { data, error, isLoading, refresh } = useAsyncResource(
    () =>
      user?.role === 'CLIENT'
        ? api.projects.mine({ page, limit, status: status || undefined })
        : Promise.resolve(fallback),
    fallback,
    [page, limit, status, user?.id, user?.role],
    {
      cacheKey: `projects:mine:${user?.id ?? 'anon'}:${user?.role ?? 'anon'}:${status}:${page}:${limit}`,
      ttlMs: 30_000,
      keepPreviousOnError: true,
    },
  );
  const [form, setForm] = useState(starterProject);
  const canCreateDraft = isProjectDraftReady(form);

  useEffect(() => {
    setPage(1);
  }, [status, limit]);

  async function createProject(event: FormEvent) {
    event.preventDefault();
    setNotice(null);

    if (!isProjectDraftReady(form)) {
      setNotice({
        type: 'error',
        title: 'Project draft is incomplete',
        description:
          'Add a clear title, a useful description, and a valid currency before creating the draft.',
      });
      return;
    }

    const budgetMin = optionalAmount(form.budgetMin);
    const budgetMax = optionalAmount(form.budgetMax);
    if (budgetMin !== undefined && budgetMax !== undefined && budgetMin > budgetMax) {
      setNotice({
        type: 'error',
        title: 'Budget range is invalid',
        description: 'Minimum budget cannot be greater than maximum budget.',
      });
      return;
    }

    setCreating(true);
    setNotice({
      type: 'info',
      title: 'Creating project draft',
      description: 'Saving the draft and refreshing the project list…',
    });
    try {
      const created = await api.projects.create({
        title: form.title.trim(),
        description: form.description.trim(),
        budgetMin,
        budgetMax,
        currency: form.currency.trim().toUpperCase() || undefined,
        skills: normalizeSkillList(form.skills),
      });
      invalidateResource('projects:');
      await refresh();
      setForm(defaultProject);
      setNotice({
        type: 'success',
        title: 'Project draft created',
        description: `${created.title} is saved privately and ready to publish when you are ready.`,
      });
    } catch (errorValue) {
      setNotice({
        type: 'error',
        title: 'Could not create project',
        description:
          errorValue instanceof Error ? errorValue.message : 'The draft could not be saved.',
      });
    } finally {
      setCreating(false);
    }
  }

  async function publishProject(id: string) {
    setNotice({
      type: 'info',
      title: 'Publishing project',
      description: 'Making this project visible and refreshing the list…',
    });
    setPublishingId(id);
    try {
      const published = await api.projects.publish(id);
      invalidateResource('projects:');
      await refresh();
      setNotice({
        type: 'success',
        title: 'Project published',
        description: `${published.title} is now visible in Explore.`,
      });
    } catch (errorValue) {
      setNotice({
        type: 'error',
        title: 'Could not publish project',
        description:
          errorValue instanceof Error
            ? errorValue.message
            : 'The project status could not be updated.',
      });
    } finally {
      setPublishingId(null);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <section className="flex min-h-[calc(100vh-13.5rem)] min-w-0 flex-col gap-4">
        <div className="forge-card rounded-[2.2rem] p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-200">
                My projects
              </p>
              <h2 className="text-safe mt-2 text-3xl font-black text-white">
                Client-owned pipeline of work.
              </h2>
              <p className="text-safe mt-2 text-sm leading-6 text-slate-400">
                Create structured project briefs, keep drafts organized, and publish opportunities
                when they are ready.
              </p>
            </div>
            <select
              className="forge-input forge-input-compact w-full sm:max-w-[220px]"
              value={status}
              onChange={(event) => setStatus(event.target.value as ProjectStatus | '')}
              disabled={user?.role !== 'CLIENT'}
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="PAUSED">Paused</option>
              <option value="CONTRACTED">Contracted</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {isLoading ? <LoadingStrip /> : null}
        {error && user?.role === 'CLIENT' ? (
          <ActionBanner type="error" title="Projects could not be loaded" description={error} />
        ) : null}
        {notice ? (
          <ActionBanner type={notice.type} title={notice.title} description={notice.description} />
        ) : null}

        {user?.role !== 'CLIENT' ? (
          <EmptyState
            icon="lock"
            title="Client role needed"
            description="Freelancers can browse published projects and submit proposals from Explore."
            action={
              <Button
                onClick={() => {
                  window.location.hash = '/explore';
                }}
              >
                Browse projects
              </Button>
            }
          />
        ) : data.items.length ? (
          <div className="grid gap-4 2xl:grid-cols-2">
            {data.items.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                showProposalReview
                onPublish={
                  project.status === 'DRAFT' || project.status === 'PAUSED'
                    ? publishProject
                    : undefined
                }
                isPublishing={publishingId === project.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="briefcase"
            title="No projects yet"
            description="Create a draft from the right panel. It will stay private until published."
          />
        )}
        {user?.role === 'CLIENT' ? (
          <Pagination
            className="mt-auto"
            meta={data.meta}
            limit={limit}
            onLimitChange={setLimit}
            onPageChange={setPage}
            summary={`Showing ${data.items.length} projects`}
            action={
              <Button onClick={() => void refresh()} loading={isLoading}>
                Refresh
              </Button>
            }
          />
        ) : null}
      </section>

      <aside className="forge-card min-w-0 self-start rounded-[2.2rem] p-5 sm:p-7 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto thin-scrollbar">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sky-100">
            <Icon name="plus" />
          </div>
          <div className="min-w-0">
            <h3 className="text-safe text-xl font-black text-white">Create project draft</h3>
            <p className="text-safe mt-1 text-sm text-slate-400">Available for clients.</p>
          </div>
        </div>

        {user?.role !== 'CLIENT' ? (
          <EmptyState
            icon="lock"
            title="Client role needed"
            description="Only client accounts can create and publish projects."
          />
        ) : (
          <form className="space-y-4" onSubmit={(event) => void createProject(event)}>
            <Field label="Title">
              <Input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
                maxLength={160}
                placeholder={projectPlaceholders.title}
              />
            </Field>
            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                required
                maxLength={8000}
                placeholder={projectPlaceholders.description}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Budget min">
                <Input
                  value={form.budgetMin}
                  type="number"
                  min={0}
                  max={100000000}
                  step="0.01"
                  placeholder={projectPlaceholders.budgetMin}
                  onChange={(event) => setForm({ ...form, budgetMin: event.target.value })}
                />
              </Field>
              <Field label="Budget max">
                <Input
                  value={form.budgetMax}
                  type="number"
                  min={0}
                  max={100000000}
                  step="0.01"
                  placeholder={projectPlaceholders.budgetMax}
                  onChange={(event) => setForm({ ...form, budgetMax: event.target.value })}
                />
              </Field>
            </div>
            <Field label="Currency">
              <Input
                value={form.currency}
                minLength={3}
                maxLength={3}
                pattern="[A-Za-z]{3}"
                onChange={(event) =>
                  setForm({ ...form, currency: event.target.value.toUpperCase() })
                }
              />
            </Field>
            <SkillInput
              value={form.skills}
              onChange={(skills) => setForm({ ...form, skills })}
              suggestions={PROJECT_SKILL_SUGGESTIONS}
            />
            <Button
              variant="primary"
              icon="plus"
              type="submit"
              className="w-full"
              loading={creating}
              disabled={!canCreateDraft}
              title={
                canCreateDraft
                  ? 'Create project draft'
                  : 'Complete title, description, and currency first'
              }
            >
              {creating ? 'Creating draft' : 'Create draft'}
            </Button>
          </form>
        )}
      </aside>
    </div>
  );
}
