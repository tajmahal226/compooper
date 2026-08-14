import { createServerFn } from "@tanstack/react-start";
import { fallbackNear, parseOverpassElement, type Toilet } from "./toilets";

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

type PlaceHit = { label: string; lat: number; lng: number };

export const searchPlace = createServerFn({ method: "GET" })
  .validator((q: string) => q.trim().slice(0, 120))
  .handler(async ({ data: q }): Promise<PlaceHit[]> => {
    if (q.length < 2) return [];
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "CompisserToiletFinder/1.0 (web finder)",
      },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
    }>;
    return json.map((r) => ({
      label: r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
    }));
  });

export const fetchToiletsNear = createServerFn({ method: "GET" })
  .validator((input: { lat: number; lng: number; radiusKm?: number }) => input)
  .handler(async ({ data }): Promise<{ toilets: Toilet[]; areaLabel: string; live: boolean }> => {
    const lat = Number(data.lat);
    const lng = Number(data.lng);
    const radiusKm = Math.min(8, Math.max(0.6, data.radiusKm ?? 2.4));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { ...fallbackNear(51.5074, -0.1278), live: false };
    }
    const d = radiusKm / 111;
    const s = lat - d;
    const n = lat + d;
    const w = lng - d;
    const e = lng + d;
    const query = `[out:json][timeout:18];(node["amenity"="toilets"](${s},${w},${n},${e});way["amenity"="toilets"](${s},${w},${n},${e}););out center tags;`;
    for (const endpoint of OVERPASS_URLS) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
          body: `data=${encodeURIComponent(query)}`,
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) continue;
        const text = await res.text();
        if (text.trimStart().startsWith("<")) continue;
        const json = JSON.parse(text) as { elements?: unknown[] };
        const toilets = (json.elements ?? [])
          .map((el) => parseOverpassElement(el as Parameters<typeof parseOverpassElement>[0]))
          .filter((t): t is Toilet => t != null);
        if (toilets.length > 0) {
          return { toilets, areaLabel: "Nearby", live: true };
        }
      } catch {
        // try next endpoint
      }
    }
    return { ...fallbackNear(lat, lng), live: false };
  });
