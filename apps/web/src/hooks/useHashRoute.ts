import { useEffect, useMemo, useState } from 'react';

function currentHash(): string {
  const value = window.location.hash.replace(/^#/, '');
  return value.startsWith('/') ? value : `/${value || ''}`;
}

export function navigate(path: string): void {
  window.location.hash = path.startsWith('/') ? path : `/${path}`;
}

export function useHashRoute() {
  const [rawPath, setRawPath] = useState(currentHash());

  useEffect(() => {
    const onHashChange = () => setRawPath(currentHash());
    window.addEventListener('hashchange', onHashChange);
    onHashChange();
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return useMemo(() => {
    const [pathnamePart, queryPart = ''] = rawPath.split('?');
    const pathname = pathnamePart || '/';
    const query = new URLSearchParams(queryPart);
    const segments = pathname.split('/').filter(Boolean);
    return { path: rawPath, pathname, segments, query };
  }, [rawPath]);
}
