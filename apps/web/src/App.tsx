import { useEffect } from 'react';
import { AppShell } from './components/Shell';
import { useAuth } from './context/AuthContext';
import { navigate, useHashRoute } from './hooks/useHashRoute';
import { Landing } from './pages/Landing';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExplorePage } from './pages/ExplorePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ProposalsPage } from './pages/ProposalsPage';
import { ContractsPage } from './pages/ContractsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuditPage } from './pages/AuditPage';
import { HealthPage } from './pages/HealthPage';
import { Button, EmptyState } from './components/ui';

function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen px-5 py-8">
        <div className="mx-auto max-w-2xl pt-20">
          <EmptyState
            icon="lock"
            title="Authentication required"
            description="Sign in to manage projects, proposals, contracts, milestones, and your profile. Public exploration remains available."
            action={
              <Button variant="primary" onClick={() => navigate('/auth')}>
                Sign in
              </Button>
            }
          />
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  const route = useHashRoute();
  const { refreshMe, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) void refreshMe();
  }, [isAuthenticated, refreshMe]);

  if (route.pathname === '/' || route.pathname === '') return <Landing />;
  if (route.pathname.startsWith('/auth')) return <AuthPage />;
  if (route.pathname === '/explore')
    return (
      <AppShell path={route.pathname}>
        <ExplorePage />
      </AppShell>
    );
  if (route.segments[0] === 'projects' && route.segments[1])
    return (
      <AppShell path={route.pathname}>
        <ProjectDetailPage id={route.segments[1]} />
      </AppShell>
    );

  const content = (() => {
    if (route.pathname === '/app') return <DashboardPage />;
    if (route.pathname === '/studio/projects') return <ProjectsPage />;
    if (route.pathname === '/studio/proposals') return <ProposalsPage />;
    if (route.pathname === '/studio/contracts') return <ContractsPage />;
    if (route.pathname === '/studio/profile') return <ProfilePage />;
    if (route.pathname === '/studio/audit') return <AuditPage />;
    if (route.pathname === '/studio/health') return <HealthPage />;
    return (
      <EmptyState
        icon="search"
        title="Route not found"
        description="The workspace could not find this route."
        action={<Button onClick={() => navigate('/app')}>Back to workspace</Button>}
      />
    );
  })();

  return (
    <Protected>
      <AppShell path={route.pathname}>{content}</AppShell>
    </Protected>
  );
}
