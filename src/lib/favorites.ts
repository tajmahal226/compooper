const KEY = "compooper-favorites";
/** Compisser-era key; read once so a forked install keeps its saved thrones. */
const LEGACY_KEY = "compisser-favorites";

function read(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function loadFavorites(): string[] {
  if (typeof window === "undefined") return [];
  const current = read(KEY);
  if (current.length > 0) return current;
  // One-time carry-forward. Written back under the new key so the legacy read
  // happens at most once per browser.
  const legacy = read(LEGACY_KEY);
  if (legacy.length > 0) {
    try {
      localStorage.setItem(KEY, JSON.stringify(legacy));
    } catch {
      /* storage unavailable — still return what we found */
    }
  }
  return legacy;
}

export function toggleFavorite(id: string): string[] {
  const next = new Set(loadFavorites());
  if (next.has(id)) next.delete(id);
  else next.add(id);
  const arr = [...next];
  localStorage.setItem(KEY, JSON.stringify(arr));
  return arr;
}
