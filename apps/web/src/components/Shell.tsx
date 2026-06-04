import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { navigate } from '../hooks/useHashRoute';
import { useCurrentProfile } from '../hooks/useCurrentProfile';
import { cx } from '../lib/format';
import { Avatar } from './Avatar';
import { Button } from './ui';
import { Icon, type IconName } from './Icon';
import { ThemeToggle } from './ThemeToggle';

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

const appNav: NavItem[] = [
  { href: '/app', label: 'Command', icon: 'grid' },
  { href: '/explore', label: 'Explore', icon: 'globe' },
  { href: '/studio/projects', label: 'Projects', icon: 'briefcase' },
  { href: '/studio/proposals', label: 'Proposals', icon: 'send' },
  { href: '/studio/contracts', label: 'Contracts', icon: 'shield' },
  { href: '/studio/audit', label: 'Audit', icon: 'pulse' },
  { href: '/studio/profile', label: 'Profile', icon: 'user' },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => navigate('/')}
      className="group flex min-w-0 items-center gap-3 text-left"
    >
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[.07] shadow-glass">
        <span className="absolute inset-0 bg-[conic-gradient(from_180deg,var(--cyan),var(--blue),var(--aqua),var(--cyan))] opacity-20 transition group-hover:opacity-35" />
        <Icon name="branch" className="relative h-5 w-5 text-white" />
      </span>
      {!compact ? (
        <span className="min-w-0">
          <span
            className="block truncate text-sm font-black uppercase tracking-[0.26em] text-white"
            title="GigaHub"
          >
            GigaHub
          </span>
          <span className="block truncate text-xs font-bold text-slate-500" title="Trusted work OS">
            Trusted work OS
          </span>
        </span>
      ) : null}
    </button>
  );
}

export function MarketingHeader() {
  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-8">
      <Logo />
      <nav
        className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[.04] p-1 text-sm font-bold text-slate-300 md:flex"
        aria-label="Marketing navigation"
      >
        <button
          type="button"
          className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-slate-950 dark:hover:text-white"
          onClick={() => navigate('/explore')}
        >
          Explore
        </button>
        <button
          type="button"
          className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-slate-950 dark:hover:text-white"
          onClick={() => scrollToSection('workflow')}
        >
          Workflow
        </button>
        <button
          type="button"
          className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-slate-950 dark:hover:text-white"
          onClick={() => scrollToSection('trust')}
        >
          Trust layer
        </button>
      </nav>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <ThemeToggle compact />
        <Button onClick={() => navigate('/auth')}>Sign in</Button>
        <Button variant="primary" onClick={() => navigate('/auth?mode=register')}>
          Open workspace
        </Button>
      </div>
    </header>
  );
}

function NavButton({
  item,
  path,
  compact = false,
}: {
  item: NavItem;
  path: string;
  compact?: boolean;
}) {
  const active = path === item.href || path.startsWith(`${item.href}/`);

  return (
    <button
      type="button"
      key={item.href}
      onClick={() => navigate(item.href)}
      className={cx(
        'group flex min-w-0 items-center gap-3 rounded-2xl text-left text-sm font-extrabold transition',
        compact ? 'shrink-0 px-3 py-2 text-xs' : 'w-full px-3 py-3',
        active
          ? 'bg-white text-slate-950 shadow-glass'
          : 'border border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[.07] hover:text-white',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon
        name={item.icon}
        className={cx(
          'h-4 w-4 shrink-0',
          active ? 'text-slate-950' : 'text-slate-500 group-hover:text-sky-200',
        )}
      />
      <span className="truncate" title={item.label}>
        {item.label}
      </span>
    </button>
  );
}

function AccountCard({
  user,
  profile,
  isLoading,
  onLogout,
}: {
  user: ReturnType<typeof useAuth>['user'];
  profile: ReturnType<typeof useCurrentProfile>['profile'];
  isLoading?: boolean;
  onLogout: () => void;
}) {
  const displayName = profile?.displayName || user?.email || 'Guest';
  const caption =
    isLoading && !profile ? 'Loading profile' : profile?.headline || user?.role || 'Visitor';
  const emailTitle = user?.email ?? displayName;

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-3 shadow-glass backdrop-blur-xl supports-[backdrop-filter]:bg-white/[.045]">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar
          name={displayName}
          url={profile?.avatarUrl}
          className="h-11 w-11 rounded-2xl text-sm"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white" title={displayName}>
            {displayName}
          </p>
          <p
            className="truncate text-xs font-bold uppercase tracking-wider text-slate-500"
            title={caption}
          >
            {caption}
          </p>
          {user?.email ? (
            <p className="truncate text-[11px] font-bold text-slate-500/90" title={emailTitle}>
              {user.email}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <ThemeToggle />
        {user ? (
          <Button className="w-full" icon="logout" onClick={onLogout} title="End this session">
            Logout
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function AppShell({ children, path }: { children: React.ReactNode; path: string }) {
  const { user, logout } = useAuth();
  const { profile, isLoading: profileLoading } = useCurrentProfile(Boolean(user), user?.id);
  const activeLabel = useMemo(
    () =>
      appNav.find((item) => path === item.href || path.startsWith(`${item.href}/`))?.label ??
      'Workspace',
    [path],
  );
  const onLogout = () => void logout().then(() => navigate('/'));

  return (
    <div className="min-h-screen px-3 py-3 sm:px-5 sm:py-5">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-[1500px] grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="forge-shell sticky top-4 z-30 hidden h-[calc(100vh-2rem)] self-start overflow-hidden rounded-[2rem] p-4 lg:block">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative z-10 flex h-full min-h-0 flex-col">
            <div className="shrink-0">
              <Logo />
            </div>
            <nav
              className="mt-6 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 thin-scrollbar"
              aria-label="Workspace navigation"
            >
              {appNav.map((item) => (
                <NavButton key={item.href} item={item} path={path} />
              ))}
            </nav>
            <div className="mt-4 shrink-0 border-t border-white/10 pt-4">
              <AccountCard
                user={user}
                profile={profile}
                isLoading={profileLoading}
                onLogout={onLogout}
              />
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="forge-shell sticky top-3 z-40 mb-4 rounded-[1.5rem] p-3 lg:hidden">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <Logo compact />
              <div className="min-w-0 flex-1 text-right">
                <p className="truncate text-xs font-black uppercase tracking-[0.18em] text-sky-200">
                  {activeLabel}
                </p>
                <p
                  className="truncate text-xs font-bold text-slate-500"
                  title={profile?.displayName || user?.email || 'Public view'}
                >
                  {profileLoading && !profile
                    ? 'Loading profile'
                    : profile?.displayName || user?.email || 'Public view'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ThemeToggle compact />
                <Avatar
                  name={profile?.displayName || user?.email}
                  url={profile?.avatarUrl}
                  className="h-9 w-9 rounded-xl text-xs"
                />
              </div>
            </div>
            <nav
              className="mt-3 flex gap-2 overflow-x-auto pb-1 thin-scrollbar"
              aria-label="Mobile workspace navigation"
            >
              {appNav.map((item) => (
                <NavButton key={item.href} item={item} path={path} compact />
              ))}
            </nav>
          </div>

          <div className="forge-shell mb-4 overflow-hidden rounded-[2rem] p-4 sm:p-5">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-200">
                  {activeLabel}
                </p>
                <h1 className="text-safe mt-1 text-2xl font-black text-white sm:text-3xl">
                  Control projects, proposals, contracts, and milestones.
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
                <span className="text-safe rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  Protected access
                </span>
                <span className="text-safe rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-sky-100">
                  Synced profile
                </span>
              </div>
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
