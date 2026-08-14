import { Link } from "@tanstack/react-router";
import { Heart, X } from "lucide-react";
import { useBrand } from "@/lib/brand";
import { formatDistance, formatWalk, haversineMeters, mapsWalkUrl, type LatLng } from "@/lib/geo";
import type { ConditionStatus, ToiletStats } from "@/lib/community";
import { throneLabel, throneScore } from "@/lib/throne";
import type { Toilet } from "@/lib/toilets";
import { FacilityBadges, LooRolls } from "./facility-badges";

const CONDITIONS: { id: ConditionStatus; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "closed", label: "Closed" },
  { id: "queueing", label: "Queueing" },
  { id: "out_of_paper", label: "Out of paper" },
  { id: "out_of_order", label: "Out of order" },
];

type Props = {
  toilet: Toilet | null;
  origin: LatLng | null;
  stats: ToiletStats | undefined;
  signedIn: boolean;
  favorited: boolean;
  onClose: () => void;
  onFavorite: () => void;
  onRate: (rolls: number) => void;
  onReport: (status: ConditionStatus) => void;
};

export function ToiletDetail({
  toilet,
  origin,
  stats,
  signedIn,
  favorited,
  onClose,
  onFavorite,
  onRate,
  onReport,
}: Props) {
  const brand = useBrand();
  return (
    <aside className="pointer-events-auto absolute top-4 right-4 bottom-4 z-10 hidden w-[336px] overflow-y-auto rounded-[22px] border border-card-border bg-card/95 shadow-(--shadow) backdrop-blur-xl lg:block">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close toilet details"
        className="absolute top-3 left-3 z-10 grid size-9 place-items-center rounded-full border border-card-border bg-card text-navy shadow-(--shadow-sm)"
      >
        <X className="size-4" />
      </button>
      {!toilet ? (
        <div className="grid h-full place-items-center content-center px-8 text-center">
          <img src={brand.mascot} alt="" className="mb-4 w-[108px] drop-shadow-lg" />
          <h2 className="mb-2 text-[1.35rem] font-extrabold">
            {brand.id === "compooper" ? "Pick a throne" : "Choose a toilet"}
          </h2>
          <p className="m-0 text-[0.82rem] text-muted">
            Select one from the map or nearby list to see its facilities and directions.
          </p>
        </div>
      ) : (
        <DetailBody
          toilet={toilet}
          origin={origin}
          stats={stats}
          signedIn={signedIn}
          favorited={favorited}
          onFavorite={onFavorite}
          onRate={onRate}
          onReport={onReport}
        />
      )}
    </aside>
  );
}

export function DetailBody({
  toilet,
  origin,
  stats,
  signedIn,
  favorited,
  onFavorite,
  onRate,
  onReport,
}: Omit<Props, "onClose"> & { toilet: Toilet }) {
  const brand = useBrand();
  const meters = origin ? haversineMeters(origin, toilet) : null;
  const distLabel = meters != null ? formatDistance(meters) : "—";
  const walkLabel = meters != null ? formatWalk(meters) : "";
  const sit = throneScore(toilet, stats);

  return (
    <div>
      <div
        className={
          brand.id === "compooper"
            ? "relative flex h-[200px] items-end justify-center overflow-hidden rounded-b-[38%] bg-linear-to-b from-orange-200 to-amber-600 dark:from-stone-800 dark:to-amber-950"
            : "relative flex h-[200px] items-end justify-center overflow-hidden rounded-b-[38%] bg-linear-to-b from-sky-200 to-lime-400 dark:from-slate-700 dark:to-emerald-900"
        }
      >
        <span className="absolute top-6 right-8 size-10 rounded-full bg-amber-300 shadow-[0_0_0_10px_rgba(251,191,36,0.18)]" />
        <img src={brand.mascot} alt="" className="relative z-1 h-[160px] object-contain drop-shadow-lg" />
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex rounded-full bg-blue-soft px-2 py-1 text-[10px] font-extrabold text-blue">
            {brand.id === "compooper" ? `${throneLabel(sit)} · ${sit}` : toilet.source === "OpenStreetMap" ? "OpenStreetMap" : "Compisser"}
          </span>
          <button
            type="button"
            onClick={onFavorite}
            aria-label={favorited ? "Remove from favourites" : "Save to favourites"}
            className="grid size-11 place-items-center rounded-full border border-card-border bg-card"
          >
            <Heart className={`size-4 ${favorited ? "fill-red-500 text-red-500" : "text-muted"}`} />
          </button>
        </div>
        <h2 className="mt-2 mb-1 text-[1.4rem] font-extrabold">{toilet.name}</h2>
        <p className="mb-3 text-[0.85rem] text-muted">
          <strong className="text-navy">{distLabel}</strong>
          {walkLabel ? ` · ${walkLabel}` : ""}
        </p>
        <div className="mb-4">
          <FacilityBadges toilet={toilet} />
        </div>
        <section className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-card-border bg-bg-top/50 p-3.5">
          <div>
            <h3 className="m-0 text-[0.88rem] font-bold text-navy">Cleanliness</h3>
            <p className="m-0 mt-0.5 text-[0.67rem] text-muted">
              {stats?.ratingCount
                ? `Rated in loo rolls by ${stats.ratingCount} ${stats.ratingCount === 1 ? "person" : "people"}`
                : "No community rating yet"}
            </p>
          </div>
          <LooRolls value={stats?.avgRolls ?? null} count={stats?.ratingCount ?? 0} />
        </section>
        <dl className="mb-4 divide-y divide-card-border border-y border-card-border">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-[0.72rem] text-muted">Opening information</dt>
            <dd className="m-0 text-right text-[0.72rem] font-bold text-navy">
              {toilet.openingHours ?? "Hours not listed"}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-[0.72rem] text-muted">Cost</dt>
            <dd className="m-0 text-right text-[0.72rem] font-bold text-navy">
              {toilet.free === true ? "Free" : toilet.fee ? toilet.fee : "Unknown"}
            </dd>
          </div>
          {toilet.operator && (
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-[0.72rem] text-muted">Operator</dt>
              <dd className="m-0 text-right text-[0.72rem] font-bold text-navy">{toilet.operator}</dd>
            </div>
          )}
        </dl>
        {stats?.condition && (
          <p className="mb-3 rounded-xl bg-amber-100 px-3 py-2 text-[12px] font-semibold text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
            Reported {stats.condition.replaceAll("_", " ")}
            {stats.conditionAgeMin != null ? ` · ${stats.conditionAgeMin} min ago` : ""}
          </p>
        )}
        {signedIn ? (
          <div className="mb-4 space-y-3">
            <div>
              <p className="mb-1.5 text-[0.72rem] font-bold text-navy">Rate cleanliness</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onRate(n)}
                    className="h-11 min-w-11 rounded-lg border border-card-border bg-card px-3 text-sm font-bold hover:bg-blue-soft"
                    aria-label={`Rate ${n} loo rolls`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[0.72rem] font-bold text-navy">Update conditions</p>
              <div className="flex flex-wrap gap-1">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onReport(c.id)}
                    className="h-11 min-w-11 rounded-lg border border-card-border bg-card px-3 text-sm font-bold hover:bg-blue-soft"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Link
            to="/login"
            className="mb-4 flex items-center gap-2.5 rounded-[13px] border border-card-border bg-blue-soft/60 p-3 no-underline"
          >
            <span className="grid size-8 place-items-center rounded-[9px] bg-blue-soft text-xs font-extrabold text-blue">
              ···
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-[0.72rem] text-navy">Sign in to contribute</strong>
              <small className="text-[0.6rem] leading-snug text-muted">
                Leave a loo-roll rating or a live condition report.
              </small>
            </span>
          </Link>
        )}
        <a
          href={mapsWalkUrl({ lat: toilet.lat, lng: toilet.lng })}
          target="_blank"
          rel="noopener noreferrer"
          className="sticky bottom-0 z-1 -mx-5 mt-2 flex h-12 items-center justify-between bg-blue px-5 font-extrabold text-white no-underline hover:bg-blue-dark"
          style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))", minHeight: "calc(3rem + env(safe-area-inset-bottom))" }}
        >
          {brand.detailCta}
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  );
}
