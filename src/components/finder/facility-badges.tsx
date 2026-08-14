import { Accessibility, Baby, CircleDollarSign, KeyRound, Users } from "lucide-react";
import type { Toilet } from "@/lib/toilets";

export function FacilityBadges({ toilet }: { toilet: Toilet }) {
  const items: { show: boolean; label: string; icon: typeof Accessibility }[] = [
    { show: toilet.accessible, label: "Accessible", icon: Accessibility },
    { show: toilet.babyChange, label: "Baby changing", icon: Baby },
    { show: toilet.free === true, label: "Free", icon: CircleDollarSign },
    { show: toilet.allGender, label: "All-gender", icon: Users },
    { show: toilet.radarKey, label: "RADAR key", icon: KeyRound },
  ];
  const visible = items.filter((i) => i.show);
  if (visible.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map(({ label, icon: Icon }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-soft px-2 py-1 text-[11px] font-bold text-navy"
        >
          <Icon className="size-3" />
          {label}
        </span>
      ))}
    </div>
  );
}

export function LooRolls({ value, count }: { value: number | null; count: number }) {
  const filled = value == null ? 0 : Math.round(value);
  return (
    <div className="flex items-center gap-0.5" aria-label={value == null ? "No ratings yet" : `${value.toFixed(1)} of 5 loo rolls`}>
      {Array.from({ length: 5 }, (_, i) => (
        <i key={i} className={i < filled ? "loo-roll is-filled" : "loo-roll"} />
      ))}
      {count > 0 && <span className="ml-1 text-[11px] text-muted">({count})</span>}
    </div>
  );
}
