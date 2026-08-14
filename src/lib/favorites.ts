const KEY = "compisser-favorites";

export function loadFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(id: string): string[] {
  const next = new Set(loadFavorites());
  if (next.has(id)) next.delete(id);
  else next.add(id);
  const arr = [...next];
  localStorage.setItem(KEY, JSON.stringify(arr));
  return arr;
}
