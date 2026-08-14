import type { ToiletStats } from "@/lib/community";
import type { Mood } from "@/lib/geo";
import { isUpscale, venueText, type Toilet } from "@/lib/toilets";

/**
 * Venue class, read out of the OSM name/operator/description text.
 *
 * This is the core of the Compooper thesis and the main thing that separates it
 * from Compisser. Compisser answers "where is the nearest toilet" (pee, urgent,
 * proximity wins). Compooper answers "where is a bathroom worth sitting in", and
 * the axis there is CLEANLINESS, not cost or distance.
 *
 * The reliable proxy for cleanliness is a venue whose brand depends on it: a
 * hotel, a high-end department store, a proper restaurant. Those may be free,
 * may expect a purchase, or may be technically guests-only — the access model is
 * incidental, and is surfaced to the user rather than scored.
 */
const UPSCALE_BONUS = 22;

/** Indoor and staffed, but no reputation riding on the bathrooms. */
const DECENT = /mall|shopping|arcade|market hall|food hall|grand central|terminal|airport/;

/**
 * Free, pleasant, frequently nearby — and deliberately NOT the product. A public
 * library is a fine place to pee and a poor answer to "where should I take my
 * time". Scored flat so it can never be mistaken for the upscale tier.
 */
const CIVIC = /library|town hall|city hall|community cent|leisure cent|civic|council|parish/;

/**
 * Actively grim for a sit-down. `urinal` is disqualifying rather than merely bad
 * — it is not a bathroom you can use at all for this purpose.
 */
const GRIM = /porta|portable|pit latrine|chemical|urinal|bushes|beach hut|layby|lay-by/;

/** 0–100 “is this a bathroom you’d actually sit in?” */
export function throneScore(t: Toilet, stats?: ToiletStats): number {
  let s = 38;

  const hay = venueText(t);
  const civic = CIVIC.test(hay);

  // Venue class carries the score. Civic buildings are excluded from the upscale
  // tier even when their name would otherwise match (a "Town Hall Hotel" is the
  // rare false positive; a council library is the common one).
  if (!civic && isUpscale(t)) s += UPSCALE_BONUS;
  else if (!civic && DECENT.test(hay)) s += 8;
  if (GRIM.test(hay)) s -= 24;

  // Cost is only a weak correlate of "someone attends this" — a paid turnstile
  // usually means a cleaner, but the venue above already says it better.
  if (t.free === false) s += 5;

  // Hard facts about the cubicle itself, when OSM actually has them.
  if (t.position === "seated") s += 10;
  if (t.position === "squat" || t.position === "urinal") s -= 30;
  if (t.paper === true) s += 8;
  if (t.paper === false) s -= 10;

  // Proxies for a real, private, maintained cubicle rather than a trough.
  if (t.accessible) s += 8; // full-size lockable stall with room to manoeuvre
  if (t.babyChange) s += 5; // family facility — cleaned on a rota
  if (t.allGender) s += 3; // usually a self-contained lockable room
  if (t.openingHours) s += 4; // published hours means someone manages it
  if (t.operator) s += 4; // a named owner is a cleaning rota

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

export function sitMood(meters: number): Mood {
  if (meters > 700)
    return { label: "Take your time", hint: "Scout the neighborhood.", tone: "calm" };
  if (meters > 350) return { label: "On the stroll", hint: "A civilized walk.", tone: "ok" };
  if (meters > 140) return { label: "Throne incoming", hint: "Pick your paper.", tone: "ok" };
  if (meters > 55) return { label: "Assume the position", hint: "Almost seated.", tone: "close" };
  return { label: "Dropping in", hint: "May the flush be with you.", tone: "urgent" };
}
