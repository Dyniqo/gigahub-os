import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { seedProjects, paginate } from '../data/seed';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useAuth } from '../context/AuthContext';
import { useProposalIndex } from '../hooks/useProposalIndex';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { Button, Field, Input, LoadingStrip } from '../components/ui';
import { ProjectCard } from '../components/ProjectCard';
import { Icon } from '../components/Icon';
import { MultiSkillFilter } from '../components/MultiSkillFilter';
import { Pagination } from '../components/Pagination';
import type { Paginated, Project } from '../types/api';

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

function matchesLocalFilters(project: Project, search: string, selectedSkills: string[]): boolean {
  const needle = normalized(search);
  const skillSet = new Set(project.skills.map(normalized));
  const searchMatch =
    !needle ||
    [project.title, project.description, ...project.skills].some((item) =>
      normalized(item).includes(needle),
    );
  const skillMatch =
    !selectedSkills.length || selectedSkills.some((skill) => skillSet.has(normalized(skill)));
  return project.status === 'PUBLISHED' && searchMatch && skillMatch;
}

function localFallback(
  search: string,
  selectedSkills: string[],
  page: number,
  limit: number,
): Paginated<Project> {
  return paginate(
    seedProjects.filter((project) => matchesLocalFilters(project, search, selectedSkills)),
    page,
    limit,
  );
}

function normalizeSelectedSkills(skills: string[]): string[] {
  const seen = new Set<string>();

  return skills
    .map((skill) => normalized(skill).slice(0, 80))
    .filter((skill) => {
      if (!skill || seen.has(skill)) return false;
      seen.add(skill);
      return true;
    });
}

async function loadPublishedProjects(
  search: string,
  selectedSkills: string[],
  page: number,
  limit: number,
): Promise<Paginated<Project>> {
  const query = search.trim().slice(0, 120) || undefined;
  const skill = normalizeSelectedSkills(selectedSkills);

  return api.projects.published({
    page,
    limit,
    search: query,
    skill: skill.length ? skill : undefined,
  });
}

export function ExplorePage() {
  const { user, isAuthenticated } = useAuth();
  const proposalIndex = useProposalIndex(isAuthenticated, user?.role, user?.id);
  const [search, setSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const debouncedSearch = useDebouncedValue(search.trim().slice(0, 120));
  const selectedSkillKey = useMemo(
    () => normalizeSelectedSkills(selectedSkills).join('|'),
    [selectedSkills],
  );
  const debouncedSelectedSkillKey = useDebouncedValue(selectedSkillKey);
  const debouncedSelectedSkills = useMemo(
    () => (debouncedSelectedSkillKey ? debouncedSelectedSkillKey.split('|') : []),
    [debouncedSelectedSkillKey],
  );
  const fallback = useMemo(
    () => localFallback(debouncedSearch, debouncedSelectedSkills, page, limit),
    [debouncedSearch, debouncedSelectedSkills, page, limit],
  );
  const { data, error, isLoading, refresh } = useAsyncResource(
    () => loadPublishedProjects(debouncedSearch, debouncedSelectedSkills, page, limit),
    fallback,
    [debouncedSearch, debouncedSelectedSkillKey, page, limit],
    {
      cacheKey: `projects:published:${debouncedSearch}:${debouncedSelectedSkillKey}:${page}:${limit}`,
      ttlMs: 35_000,
      keepPreviousOnError: true,
    },
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedSkillKey, limit]);

  const skills = useMemo(
    () => Array.from(new Set(seedProjects.flatMap((project) => project.skills))).slice(0, 18),
    [],
  );
  const toggleSkill = (skill: string) => {
    setSelectedSkills((current) => {
      const exists = current.some((item) => normalized(item) === normalized(skill));
      return exists
        ? current.filter((item) => normalized(item) !== normalized(skill))
        : [...current, skill].slice(0, 8);
    });
  };

  const isTextSearchPending = search.trim().slice(0, 120) !== debouncedSearch;
  const areSkillFiltersPending = selectedSkillKey !== debouncedSelectedSkillKey;
  const activeFilterCount = (search.trim() ? 1 : 0) + selectedSkills.length;
  const clearFilters = () => {
    setSearch('');
    setSelectedSkills([]);
  };

  return (
    <div className="flex min-h-[calc(100vh-13.5rem)] flex-col gap-4">
      <section className="forge-card relative overflow-hidden rounded-[2.2rem] p-5 sm:p-7">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-300/10 blur-3xl" />
        <div className="absolute -bottom-28 left-10 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:items-end">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-200">
              Explore marketplace
            </p>
            <h2 className="text-safe mt-3 text-3xl font-black text-white sm:text-4xl">
              Find open work with the right technical signal.
            </h2>
            <p className="text-safe mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Browse published projects, combine multiple skill filters, and open the project room
              when the fit is clear.
            </p>
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-2 rounded-[1.5rem] border border-white/10 bg-black/20 p-3">
            <div className="rounded-[1.1rem] border border-white/10 bg-white/[.04] p-3">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                Visible
              </p>
              <p className="mt-1 text-2xl font-black text-white">{data.items.length}</p>
            </div>
            <div className="rounded-[1.1rem] border border-white/10 bg-white/[.04] p-3">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                Filters
              </p>
              <p className="mt-1 text-2xl font-black text-white">{activeFilterCount}</p>
            </div>
          </div>
        </div>

        <div className="relative mt-5 rounded-[1.6rem] border border-white/10 bg-black/20 p-3 shadow-glass sm:p-4">
          <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <Field label="Search projects" className="min-w-0">
              <div className="relative min-w-0">
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                />
                <Input
                  className="pl-11 pr-11"
                  value={search}
                  maxLength={120}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="escrow, React, audit…"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:text-white"
                    aria-label="Clear search"
                  >
                    <Icon name="x" className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </Field>
            <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
              <Button onClick={clearFilters} disabled={!activeFilterCount}>
                Clear filters
              </Button>
              <Button onClick={() => void refresh()} loading={isLoading}>
                Refresh
              </Button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-safe">
              {proposalIndex.isLoading
                ? 'Checking submitted proposals…'
                : selectedSkills.length
                  ? `${selectedSkills.length} skill filters active`
                  : 'All skills included'}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-safe">
              {isTextSearchPending
                ? 'Waiting for typing to pause…'
                : areSkillFiltersPending
                  ? 'Applying skill filters…'
                  : debouncedSearch
                    ? `Searching “${debouncedSearch}”`
                    : 'No text search'}
            </span>
          </div>
        </div>

        <div className="relative mt-4">
          <MultiSkillFilter
            skills={skills}
            selected={selectedSkills}
            onToggle={toggleSkill}
            onClear={() => setSelectedSkills([])}
          />
        </div>
      </section>

      {isLoading ? <LoadingStrip /> : null}
      {error ? (
        <div className="text-safe rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4 text-sm font-bold text-sky-100">
          {error}
        </div>
      ) : null}

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        {data.items.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            submittedProposal={proposalIndex.find(project.id)}
          />
        ))}
      </div>

      <Pagination
        className="mt-auto"
        meta={data.meta}
        limit={limit}
        onLimitChange={setLimit}
        onPageChange={setPage}
        summary={`Showing ${data.items.length} projects${selectedSkills.length ? ` · ${selectedSkills.length} skill filters` : ''}`}
      />
    </div>
  );
}
