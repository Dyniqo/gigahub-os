export function safeHttpUrl(value?: string | null): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function hasOnlySafeHttpUrl(value?: string | null): boolean {
  const raw = value?.trim();
  return !raw || Boolean(safeHttpUrl(raw));
}

export function normalizeSkillLabel(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeSkillList(values: string[]): string[] | undefined {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  values.forEach((value) => {
    const normalized = normalizeSkillLabel(value).toLowerCase();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    cleaned.push(normalized.slice(0, 80));
  });

  return cleaned.length ? cleaned.slice(0, 25) : undefined;
}
