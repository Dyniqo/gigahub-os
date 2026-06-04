import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useAuth } from '../context/AuthContext';
import type { Profile, ProfileType, UserRole } from '../types/api';
import { Button, Field, Input, LoadingStrip, SearchableSelect, Textarea } from '../components/ui';
import { Icon } from '../components/Icon';
import { SkillInput } from '../components/SkillInput';
import {
  dispatchProfileUpdated,
  loadCurrentProfileCached,
  primeCurrentProfile,
} from '../hooks/useCurrentProfile';
import { Avatar } from '../components/Avatar';
import { hasOnlySafeHttpUrl, normalizeSkillList, safeHttpUrl } from '../lib/safety';

const TIMEZONES = [
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Tehran',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];
const PROFILE_SKILL_SUGGESTIONS = [
  'product design',
  'react',
  'nestjs',
  'postgresql',
  'typescript',
  'ux research',
  'marketplace',
  'api design',
  'escrow',
  'analytics',
];

type ProfileForm = {
  type: ProfileType;
  displayName: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  countryCode: string;
  timezone: string;
  hourlyRate: string;
  currency: string;
  skills: string[];
};

type ProfilePreview = {
  type: ProfileType;
  displayName: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  countryCode: string;
  timezone: string;
  hourlyRate: string;
  currency: string;
  skills: string[];
};

function browserTimezone(): string {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return TIMEZONES.includes(zone) ? zone : 'America/New_York';
}

function defaultProfileForm(
  userRole?: UserRole,
  email?: string,
  profile?: Profile | null,
): ProfileForm {
  const fallbackName = email?.split('@')[0]?.replace(/[._-]+/g, ' ') ?? '';
  const defaultType: ProfileType = profile?.type ?? 'INDIVIDUAL';
  return {
    type: defaultType,
    displayName: profile?.displayName ?? fallbackName,
    headline: profile?.headline ?? '',
    bio: profile?.bio ?? '',
    avatarUrl: safeHttpUrl(profile?.avatarUrl) ?? '',
    countryCode: profile?.countryCode ?? 'US',
    timezone:
      profile?.timezone && TIMEZONES.includes(profile.timezone)
        ? profile.timezone
        : browserTimezone(),
    hourlyRate: profile?.hourlyRate ?? '',
    currency: profile?.currency ?? 'USD',
    skills: profile?.skills ?? [],
  };
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function optionalNumber(value: string): number | undefined {
  return value.trim() === '' ? undefined : Number(value);
}

function makeProfilePreview(form: ProfileForm): ProfilePreview {
  return {
    type: form.type,
    displayName: form.displayName.trim(),
    headline: form.headline.trim(),
    bio: form.bio.trim(),
    avatarUrl: safeHttpUrl(form.avatarUrl) ?? '',
    countryCode: form.countryCode.trim().toUpperCase(),
    timezone: form.timezone.trim(),
    hourlyRate: form.hourlyRate.trim(),
    currency: form.currency.trim().toUpperCase() || 'USD',
    skills: normalizeSkillList(form.skills) ?? [],
  };
}

export function ProfilePage() {
  const { user } = useAuth();
  const profileCacheKey = `profile:me:${user?.id ?? 'anonymous'}`;
  const {
    data: profile,
    error,
    isLoading,
    refresh,
  } = useAsyncResource<Profile | null>(
    () => loadCurrentProfileCached(false, user?.id),
    null,
    [user?.id],
    { cacheKey: profileCacheKey, ttlMs: 90_000, keepPreviousOnError: true },
  );
  const baseForm = useMemo(
    () => defaultProfileForm(user?.role, user?.email, profile),
    [profile, user?.email, user?.role],
  );
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState<ProfileForm>(baseForm);
  const previewProfile = useMemo(() => makeProfilePreview(form), [form]);
  const timezoneOptions = useMemo(
    () =>
      TIMEZONES.map((zone) => ({ value: zone, label: zone, description: zone.replace('_', ' ') })),
    [],
  );

  useEffect(() => {
    if (!isDirty) {
      setForm(baseForm);
    }
  }, [baseForm, isDirty]);

  function updateForm(patch: Partial<ProfileForm>) {
    setForm((current) => ({ ...current, ...patch }));
    setIsDirty(true);
    setMessage(null);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setMessage(null);

    if (!hasOnlySafeHttpUrl(form.avatarUrl)) {
      setMessage({ type: 'error', text: 'Avatar URL must start with http:// or https://.' });
      return;
    }

    setIsSaving(true);
    try {
      const saved = await api.profiles.upsert({
        type: form.type,
        displayName: form.displayName.trim(),
        headline: optionalText(form.headline),
        bio: optionalText(form.bio),
        avatarUrl: safeHttpUrl(form.avatarUrl) ?? undefined,
        countryCode: optionalText(form.countryCode)?.toUpperCase(),
        timezone: optionalText(form.timezone),
        hourlyRate: optionalNumber(form.hourlyRate),
        currency: optionalText(form.currency)?.toUpperCase(),
        skills: normalizeSkillList(form.skills),
      });
      primeCurrentProfile(saved, user?.id);
      dispatchProfileUpdated(saved);
      setForm(defaultProfileForm(user?.role, user?.email, saved));
      setIsDirty(false);
      setMessage({ type: 'success', text: `Profile saved for ${saved.displayName}` });
      await refresh();
    } catch (errorValue) {
      setMessage({
        type: 'error',
        text: errorValue instanceof Error ? errorValue.message : 'Could not save profile',
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <aside className="forge-card self-start overflow-hidden rounded-[2.2rem] p-5 sm:p-6 xl:sticky xl:top-4">
        <div className="relative rounded-[2rem] border border-white/10 bg-black/25 p-5 sm:p-6">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="relative min-w-0">
            <Avatar
              name={previewProfile.displayName || user?.email}
              url={previewProfile.avatarUrl}
            />
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-200">
                Profile identity
              </p>
              {isDirty ? (
                <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-100">
                  Unsaved preview
                </span>
              ) : null}
            </div>
            <h2 className="text-safe mt-2 text-3xl font-black text-white">
              {previewProfile.displayName || 'Unnamed profile'}
            </h2>
            <p className="text-safe mt-2 text-sm leading-6 text-slate-400">
              {previewProfile.headline || 'Set a clear positioning line.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-300">
                {previewProfile.type.toLowerCase()}
              </span>
            </div>
            {previewProfile.bio ? (
              <p className="text-safe mt-4 line-clamp-4 text-sm leading-6 text-slate-400">
                {previewProfile.bio}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              {previewProfile.skills.slice(0, 8).map((skill) => (
                <span
                  key={skill}
                  className="max-w-full truncate rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300"
                >
                  {skill}
                </span>
              ))}
              {!previewProfile.skills.length ? (
                <span className="rounded-full border border-dashed border-white/10 px-3 py-1 text-xs font-bold text-slate-500">
                  Add skills to improve matching
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
          <div className="flex min-w-0 items-center gap-3 text-sm text-slate-400">
            <Icon name="globe" className="h-4 w-4 shrink-0 text-cyan-100" />{' '}
            <span className="text-safe min-w-0">
              {previewProfile.countryCode || '—'} · {previewProfile.timezone || '—'}
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-3 text-sm text-slate-400">
            <Icon name="money" className="h-4 w-4 shrink-0 text-sky-100" />{' '}
            <span className="text-safe min-w-0">
              {previewProfile.hourlyRate || '—'} {previewProfile.currency || 'USD'}/hr
            </span>
          </div>
        </div>
      </aside>

      <section className="forge-card min-w-0 rounded-[2.2rem] p-5 sm:p-7">
        <div className="mb-6 min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-200">
            Profile editor
          </p>
          <h2 className="text-safe mt-2 text-3xl font-black text-white">
            Shape your marketplace identity.
          </h2>
          <p className="text-safe mt-2 text-sm leading-6 text-slate-400">
            Keep your public profile clear: identity, rate, location, timezone, bio, and core
            skills.
          </p>
        </div>

        {isLoading ? <LoadingStrip /> : null}
        {error ? (
          <div className="text-safe mb-4 rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4 text-sm font-bold text-sky-100">
            {error}
          </div>
        ) : null}
        {message ? (
          <div
            role="status"
            aria-live="polite"
            className={`text-safe mb-4 rounded-2xl border p-4 text-sm font-bold ${message.type === 'success' ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100' : 'border-red-400/20 bg-red-400/10 text-red-100'}`}
          >
            {message.text}
          </div>
        ) : null}

        <form onSubmit={(event) => void save(event)} className="grid gap-4 sm:grid-cols-2">
          <Field label="Profile type">
            <select
              className="forge-input"
              value={form.type}
              onChange={(event) => updateForm({ type: event.target.value as ProfileType })}
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="AGENCY">Agency</option>
            </select>
          </Field>
          <Field label="Display name">
            <Input
              value={form.displayName}
              onChange={(event) => updateForm({ displayName: event.target.value })}
              required
              maxLength={120}
            />
          </Field>
          <Field label="Headline">
            <Input
              value={form.headline}
              onChange={(event) => updateForm({ headline: event.target.value })}
              maxLength={160}
            />
          </Field>
          <Field
            label="Avatar URL"
            hint="Only http(s) image URLs are accepted. Content is rendered as an image URL only, never as HTML."
          >
            <Input
              value={form.avatarUrl}
              type="url"
              maxLength={2048}
              inputMode="url"
              placeholder="https://example.com/avatar.jpg"
              onChange={(event) => updateForm({ avatarUrl: event.target.value })}
            />
          </Field>
          <Field label="Country code">
            <Input
              value={form.countryCode}
              minLength={2}
              maxLength={2}
              pattern="[A-Za-z]{2}"
              onChange={(event) => updateForm({ countryCode: event.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Timezone">
            <SearchableSelect
              value={form.timezone}
              onChange={(timezone) => updateForm({ timezone })}
              options={timezoneOptions}
              placeholder="Select timezone"
              searchPlaceholder="Search timezone…"
              emptyText="No timezone found"
              pageSize={6}
            />
          </Field>
          <Field label="Hourly rate">
            <Input
              type="number"
              min={0}
              max={1000000}
              step="0.01"
              value={form.hourlyRate}
              onChange={(event) => updateForm({ hourlyRate: event.target.value })}
            />
          </Field>
          <Field label="Currency">
            <Input
              minLength={3}
              maxLength={3}
              pattern="[A-Za-z]{3}"
              value={form.currency}
              onChange={(event) => updateForm({ currency: event.target.value.toUpperCase() })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Bio">
              <Textarea
                value={form.bio}
                onChange={(event) => updateForm({ bio: event.target.value })}
                maxLength={4000}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <SkillInput
              value={form.skills}
              onChange={(skills) => updateForm({ skills })}
              suggestions={PROFILE_SKILL_SUGGESTIONS}
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              variant="primary"
              icon="check"
              type="submit"
              className="w-full"
              loading={isSaving}
            >
              {isSaving ? 'Saving profile…' : isDirty ? 'Save profile changes' : 'Save profile'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
