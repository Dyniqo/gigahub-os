import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { cx, statusLabel } from '../lib/format';
import { Icon, type IconName } from './Icon';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
  icon?: IconName;
  loading?: boolean;
};

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export function Button({
  className,
  variant = 'ghost',
  icon,
  children,
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(
        'forge-button inline-flex max-w-full min-w-0 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-center text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' && 'forge-button-primary',
        variant === 'danger' && 'forge-button-danger',
        loading && 'pointer-events-none',
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : icon ? (
        <Icon name={icon} className="h-4 w-4 shrink-0" />
      ) : null}
      {children ? <span className="min-w-0 truncate">{children}</span> : null}
    </button>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx('forge-input text-safe', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx('forge-input text-safe min-h-[140px] resize-y', className)}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={cx('block min-w-0', className)}>
      <span className="forge-label">{label}</span>
      {children}
      {hint ? (
        <span className="text-safe mt-2 block text-xs leading-5 text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function selectedOptionLabel(option: SelectOption | undefined, placeholder: string): string {
  return option?.label || placeholder;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search…',
  emptyText = 'No matching options',
  disabled = false,
  isLoading = false,
  pageSize = 8,
  searchValue,
  onSearchChange,
  page,
  totalPages,
  total,
  onPageChange,
  className,
  buttonClassName,
  menuClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  isLoading?: boolean;
  pageSize?: number;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalSearch, setInternalSearch] = useState('');
  const [internalPage, setInternalPage] = useState(1);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const activeSearch = searchValue ?? internalSearch;
  const selected = options.find((option) => option.value === value);
  const usesRemotePaging = Boolean(onPageChange);

  const filteredOptions = useMemo(() => {
    if (onSearchChange) return options;
    const needle = normalizeSearch(activeSearch);
    if (!needle) return options;
    return options.filter((option) =>
      [option.label, option.description]
        .filter(Boolean)
        .some((item) => normalizeSearch(String(item)).includes(needle)),
    );
  }, [activeSearch, onSearchChange, options]);

  const safePageSize = Math.max(1, pageSize);
  const computedTotalPages = usesRemotePaging
    ? Math.max(1, totalPages ?? 1)
    : Math.max(1, Math.ceil(filteredOptions.length / safePageSize));
  const activePage = usesRemotePaging
    ? Math.min(Math.max(1, page ?? 1), computedTotalPages)
    : Math.min(Math.max(1, internalPage), computedTotalPages);
  const visibleOptions = usesRemotePaging
    ? filteredOptions
    : filteredOptions.slice((activePage - 1) * safePageSize, activePage * safePageSize);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node))
        setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  useEffect(() => {
    if (!usesRemotePaging) setInternalPage(1);
  }, [activeSearch, usesRemotePaging]);

  function setSearch(nextValue: string) {
    if (onSearchChange) {
      onSearchChange(nextValue);
      if (onPageChange) onPageChange(1);
      return;
    }
    setInternalSearch(nextValue);
  }

  function movePage(nextPage: number) {
    const bounded = Math.min(Math.max(1, nextPage), computedTotalPages);
    if (usesRemotePaging && onPageChange) onPageChange(bounded);
    else setInternalPage(bounded);
  }

  function choose(option: SelectOption) {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
  }

  return (
    <div ref={wrapperRef} className={cx('relative min-w-0', className)}>
      <button
        type="button"
        className={cx(
          'forge-input forge-combo-button flex items-center justify-between gap-3 text-left',
          !value && 'text-slate-500',
          disabled && 'cursor-not-allowed opacity-60',
          buttonClassName,
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="min-w-0 truncate text-safe">
          {selectedOptionLabel(selected, placeholder)}
        </span>
        <span
          className={cx(
            'shrink-0 text-xs font-black text-slate-500 transition',
            isOpen && 'rotate-180',
          )}
        >
          ⌄
        </span>
      </button>

      {isOpen ? (
        <div
          className={cx(
            'absolute right-0 z-40 mt-2 w-full min-w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[1.35rem] border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl',
            menuClassName,
          )}
        >
          <div className="relative">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            />
            <input
              ref={inputRef}
              value={activeSearch}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-2xl border border-white/10 bg-black/30 py-2.5 pl-10 pr-3 text-sm font-bold text-white outline-none transition focus:border-sky-400/40 focus:bg-black/40"
            />
          </div>

          <div className="thin-scrollbar mt-2 max-h-64 overflow-y-auto pr-1" role="listbox">
            {visibleOptions.length ? (
              visibleOptions.map((option) => {
                const active = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={option.disabled}
                    onClick={() => choose(option)}
                    className={cx(
                      'mb-1 flex w-full min-w-0 items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-45',
                      active
                        ? 'border border-sky-300/30 bg-sky-300/10 text-sky-50'
                        : 'border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <span className="min-w-0">
                      <span className="text-safe block truncate text-sm font-black">
                        {option.label}
                      </span>
                      {option.description ? (
                        <span className="text-safe mt-0.5 block truncate text-xs font-bold text-slate-500">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                    {active ? <Icon name="check" className="h-4 w-4 shrink-0" /> : null}
                  </button>
                );
              })
            ) : (
              <div className="text-safe rounded-2xl border border-white/10 bg-white/[.04] px-3 py-5 text-center text-sm font-bold text-slate-500">
                {isLoading ? 'Loading options…' : emptyText}
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-xs font-black text-slate-500">
            <span className="text-safe min-w-0 truncate">
              {isLoading
                ? 'Refreshing…'
                : `${total ?? filteredOptions.length} result${(total ?? filteredOptions.length) === 1 ? '' : 's'}`}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300 disabled:opacity-35"
                disabled={activePage <= 1}
                onClick={() => movePage(activePage - 1)}
              >
                Prev
              </button>
              <span className="px-1 tabular-nums">
                {activePage}/{computedTotalPages}
              </span>
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300 disabled:opacity-35"
                disabled={activePage >= computedTotalPages}
                onClick={() => movePage(activePage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const statusStyles: Record<string, string> = {
  PUBLISHED: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
  DRAFT: 'border-white/10 bg-white/5 text-slate-200',
  CONTRACTED: 'border-violet-300/30 bg-violet-300/10 text-violet-100',
  SUBMITTED: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
  SHORTLISTED: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
  ACCEPTED: 'border-teal-400/30 bg-teal-400/10 text-teal-100',
  REJECTED: 'border-red-400/30 bg-red-400/10 text-red-100',
  WITHDRAWN: 'border-white/10 bg-white/5 text-slate-400',
  ACTIVE: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
  COMPLETED: 'border-teal-400/30 bg-teal-400/10 text-teal-100',
  FUNDED: 'border-sky-300/30 bg-sky-300/10 text-sky-100',
  APPROVED: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
  RELEASED: 'border-teal-400/30 bg-teal-400/10 text-teal-100',
  DISPUTED: 'border-red-400/30 bg-red-400/10 text-red-100',
};

export function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex max-w-full min-w-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-safe',
        status
          ? (statusStyles[status] ?? 'border-white/10 bg-white/5 text-slate-200')
          : 'border-white/10 bg-white/5 text-slate-200',
        className,
      )}
    >
      <span className="truncate">{statusLabel(status)}</span>
    </span>
  );
}

export function ActionBanner({
  type = 'info',
  title,
  description,
  action,
}: {
  type?: 'info' | 'success' | 'error';
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const classes = {
    info: 'border-sky-400/20 bg-sky-400/10 text-sky-100',
    success: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100',
    error: 'border-red-400/20 bg-red-400/10 text-red-100',
  }[type];

  return (
    <div
      className={cx('text-safe rounded-2xl border p-4 shadow-glass', classes)}
      role={type === 'error' ? 'alert' : 'status'}
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black">{title}</p>
          {description ? (
            <p className="mt-1 text-xs font-bold leading-5 opacity-80">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

export function EmptyState({
  icon = 'spark',
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="forge-card rounded-[2rem] p-6 text-center sm:p-8">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sky-200">
        <Icon name={icon} />
      </div>
      <h3 className="text-safe text-lg font-black text-white">{title}</h3>
      <p className="text-safe mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function LoadingStrip({ label = 'Refreshing workspace' }: { label?: string }) {
  return (
    <div className="relative overflow-hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300">
      <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-sky-400/15 to-transparent animate-scan" />
      <span className="text-safe relative">{label}</span>
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  caption,
}: {
  label: string;
  value: string | number;
  icon: IconName;
  caption?: string;
}) {
  return (
    <div className="forge-card relative overflow-hidden rounded-[1.6rem] p-5">
      <div className="forge-hover-line" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="text-safe mt-3 text-3xl font-black text-white">{value}</p>
          {caption ? <p className="text-safe mt-2 text-sm text-slate-400">{caption}</p> : null}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sky-200">
          <Icon name={icon} />
        </div>
      </div>
    </div>
  );
}

export function Chip({
  children,
  active = false,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'max-w-full rounded-full border px-3 py-1.5 text-xs font-extrabold transition hover:border-sky-400/30 hover:text-white text-safe',
        active
          ? 'border-sky-400/40 bg-sky-400/10 text-sky-100'
          : 'border-white/10 bg-white/5 text-slate-400',
      )}
    >
      {children}
    </button>
  );
}
