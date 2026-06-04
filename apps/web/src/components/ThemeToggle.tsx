import { useTheme, type ThemePreference } from '../lib/theme';
import { cx } from '../lib/format';
import { Icon } from './Icon';

const items: Array<{ value: ThemePreference; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { preference, setPreference, resolvedTheme } = useTheme();

  if (compact) {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    const nextLabel = nextTheme === 'dark' ? 'Switch to dark theme' : 'Switch to light theme';

    return (
      <button
        type="button"
        onClick={() => setPreference(nextTheme)}
        className="forge-button inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-200"
        aria-label={nextLabel}
        title={
          preference === 'system' ? `${nextLabel} · system follows device preference` : nextLabel
        }
      >
        <Icon name={resolvedTheme === 'dark' ? 'moon' : 'sun'} className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[.04] p-2">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <span className="text-xs font-black uppercase tracking-[0.18em] text-sky-200">Theme</span>
        <Icon name={resolvedTheme === 'dark' ? 'moon' : 'sun'} className="h-4 w-4 text-slate-400" />
      </div>
      <div className="grid grid-cols-3 gap-1">
        {items.map((item) => {
          const active = preference === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setPreference(item.value)}
              className={cx(
                'rounded-xl px-2 py-2 text-xs font-black transition',
                active
                  ? 'bg-white text-slate-950 shadow-glass'
                  : 'text-slate-400 hover:bg-white/10 hover:text-white',
              )}
              aria-pressed={active}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
