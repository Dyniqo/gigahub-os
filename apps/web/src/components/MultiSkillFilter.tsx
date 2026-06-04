import { cx } from '../lib/format';
import { Icon } from './Icon';

export function MultiSkillFilter({
  skills,
  selected,
  onToggle,
  onClear,
}: {
  skills: string[];
  selected: string[];
  onToggle: (skill: string) => void;
  onClear: () => void;
}) {
  const selectedSet = new Set(selected.map((skill) => skill.toLowerCase()));

  return (
    <div className="min-w-0 rounded-[1.65rem] border border-white/10 bg-black/20 p-3 shadow-glass sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-200">
            Skill filters
          </p>
          <p className="text-safe mt-1 text-xs font-bold leading-5 text-slate-500">
            Pick up to eight skills. Results match any selected skill.
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={!selected.length}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-slate-300 transition hover:border-sky-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="x" className="h-3.5 w-3.5" />
          Clear all
        </button>
      </div>

      {selected.length ? (
        <div className="mt-4 rounded-[1.25rem] border border-sky-300/15 bg-sky-300/5 p-3">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-sky-200">
            Active
          </p>
          <div className="flex flex-wrap gap-2">
            {selected.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => onToggle(skill)}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-sky-300/40 bg-sky-300/10 px-3 py-1.5 text-xs font-extrabold text-sky-50 transition hover:border-sky-200/60"
                aria-label={`Remove ${skill}`}
              >
                <span className="truncate">{skill}</span>
                <Icon name="x" className="h-3 w-3 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/[.035] p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            Suggested skills
          </p>
          <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-black text-slate-500">
            {selected.length}/8
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => {
            const active = selectedSet.has(skill.toLowerCase());
            return (
              <button
                key={skill}
                type="button"
                onClick={() => onToggle(skill)}
                className={cx(
                  'inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold transition text-safe',
                  active
                    ? 'border-sky-300/40 bg-sky-300/10 text-sky-50'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:border-sky-400/30 hover:bg-sky-400/5 hover:text-white',
                )}
                aria-pressed={active}
              >
                {active ? <Icon name="check" className="h-3.5 w-3.5 shrink-0" /> : null}
                <span className="truncate">{skill}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
