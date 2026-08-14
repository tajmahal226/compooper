import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Accessibility,
  Armchair,
  Baby,
  ChevronDown,
  Compass,
  Gem,
  KeyRound,
  LocateFixed,
  Map as MapIcon,
  Navigation,
  Search,
  Users,
  X,
} from "lucide-react";
import { CompassDial } from "@/components/compass-dial";
import { IosInstallHint } from "@/components/ios-install-hint";
import { useBrand } from "@/lib/brand";
import {
  getToiletStats,
  submitRating,
  submitReport,
  type ConditionStatus,
  type ToiletStats,
} from "@/lib/community";
import { loadFavorites, toggleFavorite } from "@/lib/favorites";
import {
  bearingDegrees,
  formatDistance,
  formatWalk,
  haversineMeters,
  mapsWalkUrl,
  type LatLng,
} from "@/lib/geo";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { throneLabel, throneScore } from "@/lib/throne";
import {
  EMPTY_FILTERS,
  FALLBACK_CITIES,
  hasActiveFilters,
  isUpscale,
  matchesFilters,
  type Filters,
  type Toilet,
} from "@/lib/toilets";
import { fetchToiletsNear, searchPlace } from "@/lib/toilet-api";
import { cn } from "@/lib/utils";
import { FacilityBadges } from "./facility-badges";
import { MapCanvas } from "./map-canvas";
import { DetailBody, ToiletDetail } from "./toilet-detail";

const LONDON: LatLng = { lat: 51.5074, lng: -0.1278 };

type SortKey = "distance" | "upscale" | "accessible" | "nicest";

export function FinderApp() {
  const brand = useBrand();
  const { user } = useCurrentUserState();
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [heading, setHeading] = useState(0);
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>(brand.defaultSort);
  const [areaLabel, setAreaLabel] = useState("Nearby");
  const [status, setStatus] = useState("Finding your location…");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"map" | "compass">("map");
  const [query, setQuery] = useState("");
  const [stats, setStats] = useState<Record<string, ToiletStats>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [liveData, setLiveData] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [motionDenied, setMotionDenied] = useState(false);
  const fetchOriginRef = useRef<LatLng | null>(null);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const loadAround = useCallback(async (pt: LatLng, label?: string) => {
    setLoading(true);
    setStatus("Scouting for a decent throne…");
    fetchOriginRef.current = pt;
    try {
      const res = await fetchToiletsNear({ data: { lat: pt.lat, lng: pt.lng } });
      setToilets(res.toilets);
      setLiveData(res.live);
      setAreaLabel(label ?? res.areaLabel);
      setStatus(
        res.live
          ? `${res.toilets.length} candidates from OpenStreetMap`
          : `Showing curated picks in ${res.areaLabel}`,
      );
      setOrigin(pt);
      const ids = res.toilets.map((t) => t.id);
      if (ids.length) {
        const s = await getToiletStats({ data: ids });
        setStats(s);
      }
    } catch {
      const fb = FALLBACK_CITIES[0]!;
      setToilets(fb.toilets);
      setAreaLabel(fb.label);
      setLiveData(false);
      setOrigin(pt);
      setStatus("Couldn’t reach live data — showing curated picks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let watchId = -1;
    if (!navigator.geolocation) {
      void loadAround(LONDON, "London");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        const start = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        void loadAround(start);
        watchId = navigator.geolocation.watchPosition(
          (p) => {
            if (cancelled) return;
            const next = { lat: p.coords.latitude, lng: p.coords.longitude };
            setOrigin(next);
            const last = fetchOriginRef.current;
            if (last && haversineMeters(last, next) > 650) {
              void loadAround(next);
            }
          },
          () => undefined,
          { enableHighAccuracy: true, maximumAge: 3000, timeout: 20_000 },
        );
      },
      () => {
        if (cancelled) return;
        void loadAround(LONDON, "London");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
    );
    return () => {
      cancelled = true;
      if (watchId >= 0) navigator.geolocation.clearWatch(watchId);
    };
  }, [loadAround]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: DeviceOrientationEvent) => {
      const webkit = event as DeviceOrientationEvent & { webkitCompassHeading?: number };
      let next: number | null = null;
      if (typeof webkit.webkitCompassHeading === "number") {
        next = webkit.webkitCompassHeading;
      } else if (event.alpha != null) {
        next = (360 - event.alpha) % 360;
      }
      if (next == null) return;
      setHeading((prev) => {
        const delta = ((next! - prev + 540) % 360) - 180;
        return (prev + delta * 0.28 + 360) % 360;
      });
    };
    window.addEventListener("deviceorientationabsolute", handler as EventListener, true);
    window.addEventListener("deviceorientation", handler, true);
    return () => {
      window.removeEventListener("deviceorientationabsolute", handler as EventListener, true);
      window.removeEventListener("deviceorientation", handler, true);
    };
  }, []);

  const ranked = useMemo(() => {
    if (!origin) return [];
    const withDist = toilets
      .filter((t) => {
        if (!matchesFilters(t, filters)) return false;
        if (filters.niceSit && throneScore(t, stats[t.id]) < 55) return false;
        return true;
      })
      .map((t) => ({
        toilet: t,
        distance: haversineMeters(origin, t),
        bearing: bearingDegrees(origin, t),
        score: throneScore(t, stats[t.id]),
      }));
    withDist.sort((a, b) => {
      if (sort === "nicest") {
        const adjA = a.score - a.distance / 80;
        const adjB = b.score - b.distance / 80;
        if (adjA !== adjB) return adjB - adjA;
      }
      if (sort === "upscale") {
        const af = isUpscale(a.toilet) ? 0 : 1;
        const bf = isUpscale(b.toilet) ? 0 : 1;
        if (af !== bf) return af - bf;
      }
      if (sort === "accessible") {
        const af = a.toilet.accessible ? 0 : 1;
        const bf = b.toilet.accessible ? 0 : 1;
        if (af !== bf) return af - bf;
      }
      return a.distance - b.distance;
    });
    return withDist;
  }, [toilets, filters, sort, origin, stats]);

  const nearest = ranked[0] ?? null;
  const selected = toilets.find((t) => t.id === selectedId) ?? null;
  const compassTarget = selected
    ? {
        toilet: selected,
        distance: origin ? haversineMeters(origin, selected) : 0,
        bearing: origin ? bearingDegrees(origin, selected) : 0,
      }
    : nearest;

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    setStatus("Searching…");
    (e.currentTarget.querySelector("input") as HTMLInputElement | null)?.blur();
    const hits = await searchPlace({ data: q });
    const hit = hits[0];
    if (!hit) {
      setStatus("No place found — try a city or postcode");
      return;
    }
    const short = hit.label.split(",")[0] ?? hit.label;
    await loadAround({ lat: hit.lat, lng: hit.lng }, short);
    setSheetOpen(true);
    setSheetOpen(true);
  }

  function locateMe() {
    if (!navigator.geolocation) return;
    setStatus("Locating…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void loadAround({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setStatus("Location is off — search a place instead"),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  async function enableCompass() {
    const doe = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof doe.requestPermission === "function") {
      try {
        const res = await doe.requestPermission();
        setMotionDenied(res !== "granted");
      } catch {
        setMotionDenied(true);
      }
    }
    setView("compass");
    setSheetOpen(false);
    setMobileDetail(false);
  }

  async function refreshStats(ids: string[]) {
    const s = await getToiletStats({ data: ids });
    setStats(s);
  }

  async function onRate(rolls: number) {
    if (!selectedId) return;
    try {
      await submitRating({ data: { toiletId: selectedId, rolls } });
      await refreshStats([selectedId]);
    } catch {
      window.location.href = "/login";
    }
  }

  async function onReport(statusValue: ConditionStatus) {
    if (!selectedId) return;
    try {
      await submitReport({ data: { toiletId: selectedId, status: statusValue } });
      await refreshStats([selectedId]);
    } catch {
      window.location.href = "/login";
    }
  }

  function pick(id: string) {
    setSelectedId(id);
    setMobileDetail(true);
    setSheetOpen(false);
  }

  const filterDefs: { key: keyof Filters; label: string; icon: typeof Accessibility }[] = [
    { key: "niceSit", label: "Worth a sit", icon: Armchair },
    { key: "upscale", label: "Upscale", icon: Gem },
    { key: "seated", label: "Sit-down", icon: Armchair },
    { key: "accessible", label: "Accessible", icon: Accessibility },
    { key: "babyChange", label: "Baby changing", icon: Baby },
    { key: "allGender", label: "All-gender", icon: Users },
    { key: "radarKey", label: "RADAR key", icon: KeyRound },
  ];

  return (
    <div
      className={cn(
        "finder-root overflow-x-hidden",
        selected && "has-detail",
        ranked.length > 0 && "has-results",
        sheetOpen && "is-sheet-open",
        view === "compass" && "is-compass",
      )}
    >
      {view === "map" ? (
        <MapCanvas
          origin={origin}
          toilets={ranked.map((r) => r.toilet)}
          selectedId={selectedId}
          nearestId={nearest?.toilet.id ?? null}
          onSelect={pick}
        />
      ) : (
        <div className="absolute inset-0 bg-linear-to-b from-bg-top to-bg-bottom">
          {compassTarget ? (
            <CompassDial
              heading={heading}
              targetBearing={compassTarget.bearing}
              distance={compassTarget.distance}
              name={compassTarget.toilet.name}
              nearby={ranked.slice(1, 7).map((r) => ({
                id: r.toilet.id,
                bearing: r.bearing,
                distance: r.distance,
              }))}
            />
          ) : (
            <div className="grid h-full place-items-center text-muted">No thrones in view</div>
          )}
        </div>
      )}

      <div className="pointer-events-none absolute top-[max(8px,env(safe-area-inset-top))] right-3 left-3 z-20 flex items-center justify-between gap-2 lg:hidden">
        <Link
          to={brand.home}
          className="pointer-events-auto inline-flex h-11 items-center gap-2 rounded-full border border-card-border bg-card/95 px-3 font-extrabold text-ink no-underline shadow-(--shadow-sm) backdrop-blur-xl"
        >
          <img src={brand.mascot} alt="" className="size-6 object-contain" />
          {brand.name}
        </Link>
        <div className="pointer-events-auto flex h-11 overflow-hidden rounded-full border border-card-border bg-card/95 shadow-(--shadow-sm) backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setView("map")}
            className={cn(
              "inline-flex h-11 items-center gap-1 px-3.5 text-sm font-bold",
              view === "map" ? "bg-panel-invert text-panel-invert-fg" : "text-ink",
            )}
          >
            <MapIcon className="size-4" /> Map
          </button>
          <button
            type="button"
            onClick={() => void enableCompass()}
            className={cn(
              "inline-flex h-11 items-center gap-1 px-3.5 text-sm font-bold",
              view === "compass" ? "bg-panel-invert text-panel-invert-fg" : "text-ink",
            )}
          >
            <Compass className="size-4" /> Compass
          </button>
        </div>
      </div>

      <section
        className={cn(
          "pointer-events-auto absolute top-[max(60px,calc(env(safe-area-inset-top)+52px))] right-3 left-3 z-10 max-w-[400px] overflow-hidden rounded-[18px] border border-card-border bg-card/95 p-2 shadow-(--shadow) backdrop-blur-xl lg:top-3 lg:left-4",
          view === "compass" && "hidden lg:block",
        )}
      >
        <form className="flex items-center gap-1.5" onSubmit={onSearch} role="search">
          <label className="sr-only" htmlFor="place-query">
            Search a town, postcode or station
          </label>
          <Search className="ml-2 size-4 shrink-0 text-muted" />
          <input
            id="place-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={brand.searchPlaceholder}
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent py-2.5 text-ink outline-none placeholder:text-ink-faint"
          />
          <button
            type="submit"
            className="h-11 rounded-xl bg-brand px-3 text-sm font-bold text-on-brand hover:bg-brand-dark"
          >
            Search
          </button>
          <button
            type="button"
            onClick={locateMe}
            aria-label="Use my location"
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-card-border bg-card text-ink"
          >
            <LocateFixed className="size-4" />
          </button>
        </form>
        <div className="mt-1.5 flex min-w-0 gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filterDefs.map(({ key, label, icon: Icon }) => (
            <label
              key={key}
              className={cn(
                "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 text-xs font-bold",
                filters[key]
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-card-border bg-card text-muted",
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={filters[key]}
                onChange={() => setFilters((f) => ({ ...f, [key]: !f[key] }))}
              />
              <Icon className="size-3.5" />
              {label}
            </label>
          ))}
          {hasActiveFilters(filters) && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="h-9 rounded-xl px-2.5 text-xs font-bold text-brand"
            >
              Clear
            </button>
          )}
        </div>
        <div className="mt-1.5 hidden gap-1 lg:flex">
          <button
            type="button"
            onClick={() => setView("map")}
            className={cn(
              "inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-bold",
              view === "map" ? "bg-panel-invert text-panel-invert-fg" : "bg-bg-top text-ink",
            )}
          >
            <MapIcon className="size-4" /> Map
          </button>
          <button
            type="button"
            onClick={() => void enableCompass()}
            className={cn(
              "inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-bold",
              view === "compass" ? "bg-panel-invert text-panel-invert-fg" : "bg-bg-top text-ink",
            )}
          >
            <Compass className="size-4" /> Compass
          </button>
        </div>
      </section>

      {status && view === "map" && (
        <div className="pointer-events-none absolute top-[calc(env(safe-area-inset-top)+168px)] right-3 left-3 z-10 max-w-[400px] lg:top-[148px] lg:left-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-card-border bg-card/90 px-3 py-1.5 text-[11px] font-semibold text-muted shadow-(--shadow-sm)">
            <span
              className={cn(
                "size-1.5 rounded-full",
                loading ? "animate-pulse bg-amber-400" : "bg-pin",
              )}
            />
            {status}
          </p>
        </div>
      )}

      {view === "compass" && motionDenied && (
        <div className="absolute top-[calc(env(safe-area-inset-top)+198px)] right-3 left-3 z-10 max-w-[400px] rounded-2xl border border-card-border bg-card p-3 text-sm shadow-(--shadow) lg:left-4">
          <p className="m-0 font-bold text-ink">Turn on motion access</p>
          <p className="mt-1 mb-0 text-muted">
            iPhone: Settings → Safari → Motion & Orientation Access, then tap Compass again.
          </p>
        </div>
      )}

      {view === "map" && (
        <aside
          className={cn(
            "pointer-events-auto absolute right-0 bottom-0 left-0 z-10 flex flex-col rounded-t-[22px] border border-card-border bg-card/95 shadow-(--shadow) backdrop-blur-xl transition-[height] duration-200 ease-out lg:top-auto lg:right-auto lg:bottom-4 lg:left-4 lg:h-auto lg:max-h-[calc(100%-220px)] lg:w-[400px] lg:rounded-[20px]",
            sheetOpen ? "h-[min(72dvh,640px)]" : "h-[168px]",
          )}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <button
            type="button"
            className="flex w-full flex-col items-center pt-2 pb-1 lg:pointer-events-none"
            onClick={() => setSheetOpen((v) => !v)}
            aria-expanded={sheetOpen}
            aria-label={sheetOpen ? "Collapse toilet list" : "Expand toilet list"}
          >
            <span className="h-1 w-10 rounded-full bg-ink-faint/40" />
            <ChevronDown
              className={cn(
                "mt-1 size-4 text-ink-faint transition-transform lg:hidden",
                !sheetOpen && "rotate-180",
              )}
            />
          </button>
          <div className="flex items-end justify-between gap-3 px-4 pb-2">
            <div>
              <span className="text-[11px] font-bold tracking-wide text-brand uppercase">
                {areaLabel}
              </span>
              <h1 className="m-0 text-[1.15rem] font-extrabold">
                <span className="tabular-nums">{ranked.length}</span> {brand.countNoun}
              </h1>
            </div>
            <label className="text-[11px] font-semibold text-muted">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="ml-1.5 h-11 rounded-lg border border-card-border bg-card px-2 font-bold text-ink"
              >
                <option value="nicest">Nicest sit</option>
                <option value="upscale">Upscale first</option>
                <option value="distance">Nearest</option>
                <option value="accessible">Accessible first</option>
              </select>
            </label>
          </div>
          <ol className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2">
            {ranked.length === 0 && !loading && (
              <li className="px-4 py-8 text-center">
                <p className="mb-1 font-extrabold text-ink">Nothing worth the walk</p>
                <p className="mb-3 text-sm text-muted">
                  Nowhere here clears the bar. Drop a filter, or search a busier neighbourhood —
                  department stores and hotels are the reliable finds.
                </p>
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="h-11 rounded-xl bg-brand px-3 font-bold text-on-brand"
                >
                  Clear filters
                </button>
              </li>
            )}
            {ranked.map(({ toilet, distance, score }) => (
              <li
                key={toilet.id}
                className={cn(
                  "border-t border-card-border",
                  selectedId === toilet.id && "bg-brand-soft/40",
                )}
              >
                <div className="grid grid-cols-[1fr_auto] items-center gap-2 px-1 py-1">
                  <button
                    type="button"
                    onClick={() => pick(toilet.id)}
                    className="flex min-h-14 min-w-0 items-center gap-2.5 text-left"
                  >
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-full text-on-brand",
                        isUpscale(toilet) || toilet.id === nearest?.toilet.id
                          ? "bg-brand"
                          : "bg-pin",
                      )}
                    >
                      <Compass className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-baseline justify-between gap-2">
                        <strong className="truncate text-[0.95rem] text-ink">{toilet.name}</strong>
                        <b className="shrink-0 text-[0.85rem] font-extrabold text-ink tabular-nums">
                          {formatDistance(distance)}
                        </b>
                      </span>
                      <span className="block text-xs text-muted">
                        {formatWalk(distance)}
                        {` · ${throneLabel(score)} · ${score}`}
                      </span>
                      <span className="mt-1 block">
                        <FacilityBadges toilet={toilet} />
                      </span>
                    </span>
                  </button>
                  <a
                    href={mapsWalkUrl(toilet)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Walking directions to ${toilet.name}`}
                    className="grid size-11 place-items-center rounded-xl bg-brand text-on-brand no-underline"
                  >
                    <Navigation className="size-4" />
                  </a>
                </div>
              </li>
            ))}
          </ol>
          <p className="hidden px-4 pb-3 text-[10px] text-ink-faint lg:block">
            {liveData ? (
              <>
                Live toilets from{" "}
                <a href="https://www.openstreetmap.org/copyright" className="underline">
                  OpenStreetMap
                </a>{" "}
                contributors. Map: OpenFreeMap.
              </>
            ) : (
              <>
                Curated sample plus OpenStreetMap when reachable. Map:{" "}
                <a href="https://openfreemap.org/" className="underline">
                  OpenFreeMap
                </a>
                .
              </>
            )}
          </p>
        </aside>
      )}

      {view === "compass" && compassTarget && (
        <a
          href={mapsWalkUrl(compassTarget.toilet)}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-3 left-3 z-20 flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand font-extrabold text-on-brand no-underline shadow-(--shadow) lg:hidden"
          style={{ bottom: "max(16px, calc(env(safe-area-inset-bottom) + 10px))" }}
        >
          <Navigation className="size-4" />
          {brand.walkCta} · {formatDistance(compassTarget.distance)}
        </a>
      )}

      <ToiletDetail
        toilet={selected}
        origin={origin}
        stats={selected ? stats[selected.id] : undefined}
        signedIn={Boolean(user)}
        favorited={selected ? favorites.includes(selected.id) : false}
        onClose={() => setSelectedId(null)}
        onFavorite={() => {
          if (!selected) return;
          setFavorites(toggleFavorite(selected.id));
        }}
        onRate={onRate}
        onReport={onReport}
      />

      {mobileDetail && selected && (
        <div className="absolute inset-x-0 bottom-0 top-[18%] z-20 flex flex-col overflow-hidden rounded-t-[22px] border border-card-border bg-card shadow-(--shadow) lg:hidden">
          <button
            type="button"
            onClick={() => setMobileDetail(false)}
            aria-label="Close details"
            className="absolute top-[max(12px,env(safe-area-inset-top))] left-3 z-10 grid size-11 place-items-center rounded-full border border-card-border bg-card"
          >
            <X className="size-4" />
          </button>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <DetailBody
              toilet={selected}
              origin={origin}
              stats={stats[selected.id]}
              signedIn={Boolean(user)}
              favorited={favorites.includes(selected.id)}
              onFavorite={() => setFavorites(toggleFavorite(selected.id))}
              onRate={onRate}
              onReport={onReport}
            />
          </div>
        </div>
      )}

      {view === "map" && <IosInstallHint />}
    </div>
  );
}
