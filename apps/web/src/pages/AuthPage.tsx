import { FormEvent, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { navigate } from '../hooks/useHashRoute';
import { Button, Field, Input } from '../components/ui';
import { Icon } from '../components/Icon';
import { ThemeToggle } from '../components/ThemeToggle';
import type { RegistrationRole } from '../types/api';

const TEST_LOGINS = [
  {
    label: 'Client',
    role: 'CLIENT' as const,
    email: 'client@gigahub.local',
    password: 'StrongPassword123!',
  },
  {
    label: 'Freelancer',
    role: 'FREELANCER' as const,
    email: 'freelancer@gigahub.local',
    password: 'StrongPassword123!',
  },
];

export function AuthPage() {
  const queryMode = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('mode');
  const [mode, setMode] = useState<'login' | 'register'>(
    queryMode === 'register' ? 'register' : 'login',
  );
  const [role, setRole] = useState<RegistrationRole>('CLIENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, register, isLoading } = useAuth();

  const sideCopy = useMemo(
    () =>
      role === 'CLIENT'
        ? [
            'Client command room',
            'Create projects, inspect proposals, accept one into a milestone contract, and review release/dispute actions.',
          ]
        : [
            'Freelancer flight deck',
            'Browse published projects, submit proposals, track contracts, and move funded milestones into submitted status.',
          ],
    [role],
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, role);
      }
      navigate('/app');
    } catch (errorValue) {
      setError(errorValue instanceof Error ? errorValue.message : 'Authentication failed');
    }
  }

  return (
    <div className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div className="col-span-full mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-3 text-left"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sky-100">
              <Icon name="branch" />
            </span>
            <span>
              <span className="block text-sm font-black uppercase tracking-[0.26em] text-white">
                GigaHub
              </span>
              <span className="block text-xs font-bold text-slate-500">Back to launch</span>
            </span>
          </button>
          <ThemeToggle compact />
        </div>

        <section className="forge-card relative overflow-hidden rounded-[2.5rem] p-4 sm:p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="relative">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-100">
              <Icon name="lock" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-200">
              Identity gateway
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Access your <span className="gradient-text">marketplace workspace.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
              Sign in as a client or freelancer and manage the full deal lifecycle from one place.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {(['CLIENT', 'FREELANCER'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setRole(item);
                  }}
                  className={`rounded-[1.5rem] border p-4 text-left transition ${role === item ? 'border-sky-400/40 bg-sky-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                >
                  <p className="font-black text-white">
                    {item === 'CLIENT' ? 'Client' : 'Freelancer'}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {item === 'CLIENT'
                      ? 'Hire, accept, approve, release.'
                      : 'Propose, deliver, submit, earn.'}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/20 p-5">
              <p className="text-safe text-xl font-black text-white">{sideCopy[0]}</p>
              <p className="text-safe mt-2 text-sm leading-6 text-slate-400">{sideCopy[1]}</p>
            </div>
          </div>
        </section>

        <section className="forge-card rounded-[2.5rem] p-4 sm:p-8">
          <div className="rounded-[2rem] border border-white/10 bg-black/25 p-5 sm:p-7">
            <div className="mb-6 flex rounded-full border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-black ${mode === 'login' ? 'bg-white text-slate-950' : 'text-slate-400'}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-black ${mode === 'register' ? 'bg-white text-slate-950' : 'text-slate-400'}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={(event) => void onSubmit(event)} className="space-y-5">
              {mode === 'login' ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[.04] p-3">
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-sky-200">
                    Quick test access
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {TEST_LOGINS.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          setRole(item.role);
                          setEmail(item.email);
                          setPassword(item.password);
                          setError(null);
                        }}
                        className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-left transition hover:border-sky-300/30 hover:bg-sky-300/10"
                      >
                        <span className="block text-sm font-black text-white">{item.label}</span>
                        <span className="text-safe mt-1 block text-xs font-bold text-slate-500">
                          {item.email}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <Field label="Email">
                <Input
                  value={email}
                  type="email"
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </Field>
              <Field label="Password" hint="Use at least 12 characters.">
                <Input
                  value={password}
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={12}
                  maxLength={128}
                />
              </Field>

              {mode === 'register' ? (
                <Field label="Registration role">
                  <select
                    className="forge-input"
                    value={role}
                    onChange={(event) => setRole(event.target.value as RegistrationRole)}
                  >
                    <option value="CLIENT">Client</option>
                    <option value="FREELANCER">Freelancer</option>
                  </select>
                </Field>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm font-bold text-red-100">
                  {error}
                </div>
              ) : null}

              <Button
                variant="primary"
                icon="arrow"
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading
                  ? 'Connecting…'
                  : mode === 'login'
                    ? 'Enter workspace'
                    : 'Create account'}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
