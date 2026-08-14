import type { ToiletStats } from "@/lib/community";
import type { Mood } from "@/lib/geo";
import type { Toilet } from "@/lib/toilets";

/**
 * Venue quality, read out of the OSM name/operator/description text.
 *
 * This is the core of the Compooper thesis and the main thing that separates it
 * from Compisser: Compisser answers "where is the nearest toilet" (pee, urgent,
 * proximity wins). Compooper answers "where is a toilet worth sitting in" —
 * which in practice means somewhere ATTENDED. A venue that has staff, a cleaning
 * rota and a reputation to protect beats a council block in a park every time,
 * even when the park one is closer and free.
 */
const UPSCALE =
  /hotel|museum|gallery|library|department store|spa|theatre|theater|opera|restaurant|cafe|café|lounge|club|hall|airport|terminal|john lewis|selfridges|harrods|waitrose/;

/** Indoor, staffed, generally maintained — good, but a step below the above. */
const DECENT = /mall|shopping|centre|center|visitor|garden|station|arcade|market/;

/**
 * Actively grim for a sit-down. `urinal` is disqualifying rather than merely bad
 * — it is not a bathroom you can use at all for this purpose.
 */
const GRIM = /porta|portable|pit latrine|chemical|urinal|bushes|beach hut|layby|lay-by/;

/** 0–100 “is this a bathroom you’d actually sit in?” */
export function throneScore(t: Toilet, stats?: ToiletStats): number {
  let s = 38;

  // Paying is a QUALITY SIGNAL here, not a cost to avoid. A turnstile or an
  // attendant means someone is restocking the paper and mopping the floor;
  // Compisser's free-first instinct is exactly backwards for a proper sit.
  if (t.free === false) s += 12;

  // Proxies for a real, private, maintained cubicle rather than a trough.
  if (t.accessible) s += 8; // full-size lockable stall with room to manoeuvre
  if (t.babyChange) s += 5; // family facility — cleaned on a rota
  if (t.allGender) s += 3; // usually a self-contained lockable room
  if (t.openingHours) s += 4; // published hours means someone manages it
  if (t.operator) s += 4; // a named owner is a cleaning rota

  const hay = `${t.operator ?? ""} ${t.name} ${t.description ?? ""}`.toLowerCase();
  if (UPSCALE.test(hay)) s += 18;
  else if (DECENT.test(hay)) s += 8;
  if (GRIM.test(hay)) s -= 24;

  // Community signal outranks every heuristic above — someone actually sat here.
  if (stats?.avgRolls) s += stats.avgRolls * 8;
  if (stats?.condition === "open") s += 6;
  if (stats?.condition === "out_of_paper" || stats?.condition === "out_of_order") s -= 22;
  if (stats?.condition === "queueing") s -= 6;

  return Math.max(0, Math.min(100, Math.round(s)));
}

export function throneLabel(score: number): string {
  if (score >= 80) return "Regal";
  if (score >= 65) return "Solid sit";
  if (score >= 50) return "It’ll do";
  return "Emergency only";
}

export function dumpMood(meters: number): Mood {
  if (meters > 700)
    return { label: "Take your time", hint: "Scout the neighborhood.", tone: "calm" };
  if (meters > 350) return { label: "On the stroll", hint: "A civilized walk.", tone: "ok" };
  if (meters > 140) return { label: "Throne incoming", hint: "Pick your paper.", tone: "ok" };
  if (meters > 55) return { label: "Assume the position", hint: "Almost seated.", tone: "close" };
  return { label: "Dropping in", hint: "May the flush be with you.", tone: "urgent" };
}
