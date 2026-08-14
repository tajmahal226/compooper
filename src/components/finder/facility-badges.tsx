import {
  Accessibility,
  Armchair,
  Baby,
  Gem,
  KeyRound,
  Lock,
  ScrollText,
  Users,
} from "lucide-react";
import { isUpscale, type Toilet } from "@/lib/toilets";

/**
 * Ordered by what actually decides a sit: is it a proper venue, is it a
 * sit-down, is there paper. Accessibility and family facilities follow. The
 * "Free" badge Compisser led with is gone — cost is in the detail card, because
 * for this app it is a footnote, not a selling point.
 */
export function FacilityBadges({ toilet }: { toilet: Toilet }) {
  const items: { show: boolean; label: string; icon: typeof Accessibility; strong?: boolean }[] = [
    { show: isUpscale(toilet), label: "Upscale", icon: Gem, strong: true },
    { show: toilet.position === "seated", label: "Sit-down", icon: Armchair, strong: true },
    { show: toilet.paper === true, label: "Paper", icon: ScrollText, strong: true },
    { show: toilet.access === "customers", label: "Customers only", icon: Lock },
    { show: toilet.access === "guests", label: "Guests only", icon: Lock },
    { show: toilet.accessible, label: "Accessible", icon: Accessibility },
    { show: toilet.babyChange, label: "Baby changing", icon: Baby },
    { show: toilet.allGender, label: "All-gender", icon: Users },
    { show: toilet.radarKey, label: "RADAR key", icon: KeyRound },
  ];
  const visible = items.filter((i) => i.show);
  if (visible.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map(({ label, icon: Icon, strong }) => (
        <span
          key={label}
          className={
            strong
              ? "inline-flex items-center gap-1 rounded-lg bg-brand px-2 py-1 text-[11px] font-bold text-on-brand"
              : "inline-flex items-center gap-1 rounded-lg bg-brand-soft px-2 py-1 text-[11px] font-bold text-ink"
          }
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
    <div
      className="flex items-center gap-0.5"
      aria-label={value == null ? "No ratings yet" : `${value.toFixed(1)} of 5 loo rolls`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <i key={i} className={i < filled ? "loo-roll is-filled" : "loo-roll"} />
      ))}
      {count > 0 && <span className="ml-1 text-[11px] text-muted">({count})</span>}
    </div>
  );
}
