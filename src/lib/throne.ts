import type { ToiletStats } from "@/lib/community";
import type { Mood } from "@/lib/geo";
import type { Toilet } from "@/lib/toilets";

/** 0–100 “is this a bathroom you’d actually sit in?” */
export function throneScore(t: Toilet, stats?: ToiletStats): number {
  let s = 38;
  if (t.free === true) s += 6;
  if (t.accessible) s += 10;
  if (t.allGender) s += 4;
  if (t.babyChange) s += 5;
  if (t.openingHours) s += 4;
  if (t.operator) s += 3;
  const hay = `${t.operator ?? ""} ${t.name} ${t.description ?? ""}`.toLowerCase();
  if (/library|hotel|museum|gallery|mall|centre|center|station|park|garden|visitor/.test(hay)) s += 14;
  if (/brick|porta|portable|pit|chemical/.test(hay)) s -= 16;
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
  if (meters > 700) return { label: "Take your time", hint: "Scout the neighborhood.", tone: "calm" };
  if (meters > 350) return { label: "On the stroll", hint: "A civilized walk.", tone: "ok" };
  if (meters > 140) return { label: "Throne incoming", hint: "Pick your paper.", tone: "ok" };
  if (meters > 55) return { label: "Assume the position", hint: "Almost seated.", tone: "close" };
  return { label: "Dropping in", hint: "May the flush be with you.", tone: "urgent" };
}
