import { useEffect, useState } from 'react';
import { initials } from '../lib/format';
import { safeHttpUrl } from '../lib/safety';

export function Avatar({
  name,
  url,
  className = 'h-20 w-20 rounded-[1.6rem] text-2xl',
}: {
  name?: string | null;
  url?: string | null;
  className?: string;
}) {
  const safeUrl = safeHttpUrl(url);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [safeUrl]);

  const baseClass = `flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-sky-200 to-cyan-200 font-black text-slate-950 ${className}`;

  if (safeUrl && !failed) {
    return (
      <div className={baseClass}>
        <img
          src={safeUrl}
          alt={name ? `${name} avatar` : 'Avatar'}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return <div className={baseClass}>{initials(name ?? undefined)}</div>;
}
