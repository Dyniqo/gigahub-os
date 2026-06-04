import type { SVGProps } from 'react';

export type IconName =
  | 'spark'
  | 'grid'
  | 'briefcase'
  | 'file'
  | 'shield'
  | 'pulse'
  | 'user'
  | 'arrow'
  | 'plus'
  | 'check'
  | 'send'
  | 'search'
  | 'bolt'
  | 'branch'
  | 'lock'
  | 'logout'
  | 'globe'
  | 'timer'
  | 'money'
  | 'alert'
  | 'code'
  | 'sun'
  | 'moon'
  | 'x';

const paths: Record<IconName, JSX.Element> = {
  spark: <path d="M12 2 9.8 8.7 3 11l6.8 2.3L12 20l2.2-6.7L21 11l-6.8-2.3L12 2Z" />,
  grid: <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" />,
  briefcase: (
    <path d="M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1h4a2 2 0 0 1 2 2v4.2a22 22 0 0 1-18 0V8a2 2 0 0 1 2-2h4Zm2 0h2V5h-2v1Zm10 8.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4.6a24 24 0 0 0 18 0Z" />
  ),
  file: <path d="M6 2h8l4 4v16H6V2Zm7 1.5V7h3.5M9 12h6M9 16h6" />,
  shield: <path d="M12 2 20 5v6c0 5-3.2 8.8-8 11-4.8-2.2-8-6-8-11V5l8-3Zm-3 10 2 2 4-5" />,
  pulse: <path d="M3 12h4l2-6 4 12 2-6h6" />,
  user: <path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 13 4 4L19 7" />,
  send: <path d="m22 2-7 20-4-9-9-4 20-7Z" />,
  search: <path d="m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" />,
  bolt: <path d="M13 2 4 14h7l-1 8 10-13h-7l0-7Z" />,
  branch: (
    <path d="M6 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm12-6a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM6 9v6m3-9h3a6 6 0 0 1 6 6" />
  ),
  lock: <path d="M7 10V8a5 5 0 0 1 10 0v2m-9 0h8a2 2 0 0 1 2 2v7H6v-7a2 2 0 0 1 2-2Z" />,
  logout: <path d="M14 8V5a2 2 0 0 0-2-2H5v18h7a2 2 0 0 0 2-2v-3m1-8 4 4-4 4m-9-4h13" />,
  globe: (
    <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0 0c3-3 4.5-6.3 4.5-10S15 5 12 2m0 20c-3-3-4.5-6.3-4.5-10S9 5 12 2M2 12h20" />
  ),
  timer: <path d="M10 2h4m-2 8v4l3 2m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  money: <path d="M4 7h16v10H4V7Zm3 3h.01M17 14h.01M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
  alert: (
    <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  ),
  code: <path d="m8 9-4 3 4 3m8-6 4 3-4 3m-2-9-4 12" />,
  sun: (
    <path d="M12 4V2m0 20v-2m8-8h2M2 12h2m14.95-6.95 1.41-1.41M3.64 20.36l1.41-1.41m0-13.9L3.64 3.64m16.72 16.72-1.41-1.41M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z" />
  ),
  moon: <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
};

export function Icon({
  name,
  className = 'h-5 w-5',
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
