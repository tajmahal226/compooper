import { Navigation } from "lucide-react";
import { useBrandId } from "@/lib/brand";
import { distanceMood, formatDistance, formatWalk } from "@/lib/geo";
import { dumpMood } from "@/lib/throne";
import { cn } from "@/lib/utils";

export type NearbyTick = {
  id: string;
  bearing: number;
  distance: number;
};

type Props = {
  heading: number;
  targetBearing: number;
  distance: number;
  name?: string;
  nearby?: NearbyTick[];
  compact?: boolean;
};

export function CompassDial({
  heading,
  targetBearing,
  distance,
  name = "Nearest toilet",
  nearby = [],
  compact = false,
}: Props) {
  const relative = ((targetBearing - heading + 540) % 360) - 180;
  const ringRot = -heading;
  const mood = useBrandId() === "compooper" ? dumpMood(distance) : distanceMood(distance);

  return (
    <div className={cn("flex h-full flex-col items-center justify-between px-4 pt-[max(4.5rem,calc(env(safe-area-inset-top)+3.75rem))] pb-24", compact && "pt-6 pb-4")}>
      <div className="text-center">
        <p className="text-[0.7rem] font-bold tracking-[0.14em] text-blue uppercase">{name}</p>
        <p className={cn("mt-1 font-extrabold text-navy tabular-nums", compact ? "text-3xl" : "text-4xl")}>
          {formatDistance(distance)}
        </p>
        <p className="text-sm font-medium text-muted">{formatWalk(distance)}</p>
      </div>

      <div className={cn("relative", compact ? "size-[200px]" : "size-[240px] sm:size-[268px]")}>
        <div className="absolute inset-0 rounded-full border border-card-border bg-card/70 shadow-(--shadow-sm) backdrop-blur-sm">
          <div
            className="absolute inset-0"
            style={{ transform: `rotate(${ringRot}deg)` }}
          >
            <span className="absolute top-2.5 left-1/2 -translate-x-1/2 text-[11px] font-extrabold text-navy">
              N
            </span>
            <span className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[11px] font-extrabold text-muted">
              E
            </span>
            <span className="absolute bottom-2.5 left-1/2 -translate-x-1/2 text-[11px] font-extrabold text-muted">
              S
            </span>
            <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-[11px] font-extrabold text-muted">
              W
            </span>
          </div>
          {nearby.slice(0, 6).map((tick) => {
            const r = compact ? 84 : 108;
            const rad = ((tick.bearing - heading - 90) * Math.PI) / 180;
            const x = Math.round(Math.cos(rad) * r);
            const y = Math.round(Math.sin(rad) * r);
            return (
              <span
                key={tick.id}
                className="absolute size-2.5 rounded-full bg-green-pin ring-2 ring-white"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                }}
                title={formatDistance(tick.distance)}
              />
            );
          })}
        </div>

        <div
          className="absolute inset-0 grid place-items-center transition-transform duration-150 ease-out"
          style={{ transform: `rotate(${relative}deg)` }}
        >
          <Navigation
            className={cn(
              "fill-blue text-blue drop-shadow-md",
              compact ? "size-20" : "size-24",
              mood.tone === "urgent" && "fill-red-500 text-red-500",
              mood.tone === "close" && "fill-orange-500 text-orange-500",
            )}
            strokeWidth={1.6}
          />
        </div>
      </div>

      <div
        className={cn(
          "rounded-full px-4 py-1.5 text-center text-sm font-extrabold",
          mood.tone === "urgent" && "bg-red-500/15 text-red-600",
          mood.tone === "close" && "bg-orange-500/15 text-orange-700",
          mood.tone === "ok" && "bg-blue-soft text-blue",
          mood.tone === "calm" && "bg-card text-navy",
        )}
      >
        {mood.label}
        <span className="mt-0.5 block text-[11px] font-semibold text-muted">{mood.hint}</span>
      </div>
    </div>
  );
}
