import { MarketingHeader } from '../components/Shell';
import { Icon } from '../components/Icon';
import { Button, StatusBadge } from '../components/ui';
import { navigate } from '../hooks/useHashRoute';
import { seedProjects } from '../data/seed';
import { money } from '../lib/format';

const featureCards = [
  [
    'Identity-aware marketplace',
    'Client and freelancer workflows stay separated, fast, and natural from the first click.',
    'user',
  ],
  [
    'Proposal-to-contract handoff',
    'Accept proposals into milestone contracts with totals, due dates, terms, and optimistic action states.',
    'branch',
  ],
  [
    'Every action stays traceable',
    'Project updates, proposal decisions, milestone submissions, and releases stay visible without clutter.',
    'pulse',
  ],
] as const;

const trustCards = [
  [
    'Verified context',
    'Profiles, project requirements, proposal intent, and contract state stay connected instead of scattered across tools.',
    'shield',
  ],
  [
    'Milestone discipline',
    'Every funded milestone has a visible owner, amount, due date, submission state, and release action.',
    'timer',
  ],
] as const;

export function Landing() {
  return (
    <div className="relative overflow-hidden">
      <div className="mesh-orb left-[-5rem] top-20 bg-cyan-300" />
      <div className="mesh-orb right-[-3rem] top-64 bg-blue-500" />
      <MarketingHeader />

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-20 pt-8 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pt-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-sky-100">
              <Icon name="spark" className="h-4 w-4" />A sharper way to run freelance work
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[.92] tracking-[-0.06em] text-white sm:text-7xl lg:text-[5rem]">
              A focused deal OS with{' '}
              <span className="gradient-text">clarity, trust, and momentum</span>.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400">
              GigaHub Forge brings projects, proposals, contracts, milestones, and account activity
              into a calm blue workspace that feels precise, fast, and ready for serious teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="primary" icon="bolt" onClick={() => navigate('/auth?mode=register')}>
                Launch workspace
              </Button>
              <Button icon="globe" onClick={() => navigate('/explore')}>
                Explore live projects
              </Button>
            </div>
            <div className="mt-9 grid max-w-2xl grid-cols-3 gap-3">
              {['Project flow', 'Milestone release', 'Audit trail'].map((label, index) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
                  <p className="text-2xl font-black text-white">0{index + 1}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-widest text-slate-500">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="forge-card relative overflow-hidden rounded-[2.5rem] p-4 shadow-forge">
              <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/90 to-transparent" />
              <div className="rounded-[2rem] border border-white/10 bg-black/30 p-4">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-200">
                      Deal graph
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-white">Escrow workspace</h2>
                  </div>
                  <StatusBadge status="ACTIVE" />
                </div>

                <div className="space-y-3">
                  {seedProjects.slice(0, 2).map((project, index) => (
                    <div
                      key={project.id}
                      className="group rounded-[1.5rem] border border-white/10 bg-white/[.045] p-4 transition hover:border-cyan-300/30 hover:bg-white/[.065]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-xs font-black text-slate-950">
                              {index + 1}
                            </span>
                            <StatusBadge status={project.status} />
                          </div>
                          <h3 className="mt-3 line-clamp-2 text-lg font-black text-white">
                            {project.title}
                          </h3>
                        </div>
                        <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-slate-300">
                          {money(project.budgetMax, project.currency)}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {project.skills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-slate-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    ['Proposals', '18'],
                    ['Funded', '$15k'],
                    ['Audit', 'Live'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <p className="text-xl font-black text-white">{value}</p>
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 -left-8 hidden w-56 rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-5 backdrop-blur-xl lg:block animate-float">
              <p className="text-xs font-black uppercase tracking-widest text-cyan-100">
                Next action
              </p>
              <p className="mt-2 text-sm font-bold text-white">
                Review submitted milestone and release funds.
              </p>
            </div>
          </div>
        </section>

        <section id="workflow" className="scroll-mt-24 mx-auto max-w-7xl px-5 pb-20 sm:px-8">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-200">
                Workflow
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">
                From posted work to funded milestones without context switching.
              </h2>
            </div>
            <p className="max-w-xl text-sm font-medium leading-6 text-slate-400">
              The main flow keeps discovery, proposal review, contract setup, delivery, and release
              actions in one connected workspace.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {featureCards.map(([title, body, icon]) => (
              <div key={title} className="forge-card relative overflow-hidden rounded-[2rem] p-6">
                <div className="forge-hover-line" />
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sky-100">
                  <Icon name={icon} />
                </div>
                <h3 className="text-xl font-black text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="trust" className="scroll-mt-24 mx-auto max-w-7xl px-5 pb-24 sm:px-8">
          <div className="forge-card relative overflow-hidden rounded-[2.5rem] p-6 sm:p-8">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
            <div className="relative z-10 grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-200">
                  Trust layer
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">
                  Built-in visibility for money, scope, and decisions.
                </h2>
                <p className="mt-5 text-sm font-medium leading-7 text-slate-400">
                  Trust is treated as product infrastructure: every proposal, contract, milestone,
                  and audit event is shaped so both sides can understand the current state quickly.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    variant="primary"
                    icon="shield"
                    onClick={() => navigate('/auth?mode=register')}
                  >
                    Create trusted workspace
                  </Button>
                  <Button icon="pulse" onClick={() => navigate('/studio/health')}>
                    Check service health
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {trustCards.map(([title, body, icon]) => (
                  <div
                    key={title}
                    className="rounded-[1.75rem] border border-white/10 bg-black/25 p-5"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-100">
                      <Icon name={icon} className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-black text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
