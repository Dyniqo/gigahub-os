import { KeyboardEvent, useMemo, useState } from 'react';
import { normalizeSkillLabel } from '../lib/safety';
import { Button } from './ui';
import { Icon } from './Icon';

const MAX_SKILLS = 25;
const MAX_SKILL_LENGTH = 80;

function parseSkillText(value: string): string[] {
  return value
    .split(/[\n,;\t]+|\s+-\s+/g)
    .map(normalizeSkillLabel)
    .filter(Boolean);
}

export function SkillInput({
  label = 'Skills',
  hint = 'Type a skill and press Enter. Paste lists separated by commas, new lines, or spaced dashes.',
  value,
  onChange,
  suggestions = [],
  placeholder = 'Type a skill, then press Enter',
}: {
  label?: string;
  hint?: string;
  value: string[];
  onChange: (skills: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const normalizedSet = useMemo(() => new Set(value.map((skill) => skill.toLowerCase())), [value]);
  const visibleSuggestions = suggestions
    .map(normalizeSkillLabel)
    .filter((skill) => skill && !normalizedSet.has(skill.toLowerCase()))
    .slice(0, 6);

  function commit(raw: string): boolean {
    const parts = parseSkillText(raw);
    if (!parts.length) return false;

    const next = [...value];
    const seen = new Set(next.map((skill) => skill.toLowerCase()));
    let changed = false;

    for (const part of parts) {
      if (next.length >= MAX_SKILLS) {
        setNotice(`You can add up to ${MAX_SKILLS} skills.`);
        break;
      }

      if (part.length > MAX_SKILL_LENGTH) {
        setNotice(`Each skill can be up to ${MAX_SKILL_LENGTH} characters.`);
        continue;
      }

      const key = part.toLowerCase();
      if (seen.has(key)) continue;

      seen.add(key);
      next.push(part);
      changed = true;
    }

    if (changed) {
      onChange(next);
      setDraft('');
      setNotice(null);
    }

    return changed;
  }

  function removeSkill(skill: string): void {
    onChange(value.filter((item) => item !== skill));
    setNotice(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commit(draft);
      return;
    }

    if (event.key === 'Backspace' && !draft && value.length) {
      event.preventDefault();
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <span className="forge-label mb-0">{label}</span>
          <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-black text-slate-400">
          {value.length}/{MAX_SKILLS}
        </span>
      </div>

      <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/40 p-2 transition focus-within:border-sky-400/50 focus-within:ring-4 focus-within:ring-sky-400/10">
        <div className="flex min-h-[3rem] flex-wrap items-center gap-2">
          {value.map((skill) => (
            <span
              key={skill}
              className="group inline-flex max-w-full items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-xs font-extrabold text-sky-50 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]"
            >
              <span className="max-w-[12rem] truncate sm:max-w-[18rem]">{skill}</span>
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="rounded-full p-0.5 text-sky-100/70 transition hover:bg-white/10 hover:text-white"
                aria-label={`Remove ${skill}`}
              >
                <Icon name="x" className="h-3 w-3" />
              </button>
            </span>
          ))}

          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={(event) => {
              const pasted = event.clipboardData.getData('text');
              if (/[\n,;\t]|\s+-\s+/.test(pasted)) {
                event.preventDefault();
                commit(`${draft}${draft ? ' ' : ''}${pasted}`);
              }
            }}
            onBlur={() => commit(draft)}
            disabled={value.length >= MAX_SKILLS}
            maxLength={MAX_SKILL_LENGTH}
            placeholder={value.length ? 'Add another skill' : placeholder}
            className="min-w-[12rem] flex-1 bg-transparent px-2 py-2 text-sm font-semibold text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed"
            aria-label="Add skill"
          />

          <Button
            type="button"
            className="w-full px-3 py-2 sm:w-auto sm:shrink-0"
            onClick={() => commit(draft)}
            disabled={!draft.trim() || value.length >= MAX_SKILLS}
          >
            Add
          </Button>
        </div>
      </div>

      {visibleSuggestions.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => commit(suggestion)}
              className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs font-bold text-slate-400 transition hover:border-sky-400/30 hover:text-white"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      ) : null}

      {notice ? <p className="mt-2 text-xs font-bold text-cyan-100">{notice}</p> : null}
    </div>
  );
}
