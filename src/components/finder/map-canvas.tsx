import { useEffect, useRef } from "react";
import { isUpscale, type Toilet } from "@/lib/toilets";
import type { LatLng } from "@/lib/geo";

const STYLE = "https://tiles.openfreemap.org/styles/liberty";

const PIN_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v2a2 2 0 0 0 2 2h12"/><path d="M8 12V7a4 4 0 0 1 8 0v5"/><path d="M7 16v2a2 2 0 0 0 2 2h0"/><circle cx="16" cy="19" r="1"/></svg>`;

type Props = {
  origin: LatLng | null;
  toilets: Toilet[];
  selectedId: string | null;
  nearestId: string | null;
  onSelect: (id: string) => void;
};

export function MapCanvas({ origin, toilets, selectedId, nearestId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markersRef = useRef<import("maplibre-gl").Marker[]>([]);
  const userRef = useRef<import("maplibre-gl").Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const readyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const el = containerRef.current;
    if (!el) return;

    void (async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelled || !containerRef.current) return;
      const center: [number, number] = origin ? [origin.lng, origin.lat] : [-0.1278, 51.5074];
      const map = new maplibre.Map({
        container: containerRef.current,
        style: STYLE,
        center,
        zoom: 15,
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        fadeDuration: 0,
      });
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), "bottom-right");
      mapRef.current = map;
      map.on("load", () => {
        readyRef.current = true;
      });
    })();

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      userRef.current?.remove();
      userRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // origin only used as initial center
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !origin) return;
    map.easeTo({ center: [origin.lng, origin.lat], duration: 700 });
  }, [origin?.lat, origin?.lng]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const maplibre = await import("maplibre-gl");
      const map = mapRef.current;
      if (cancelled || !map) return;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      for (const t of toilets) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = [
          "toilet-marker",
          isUpscale(t) ? "is-upscale" : "",
          t.id === nearestId ? "is-nearest" : "",
          t.id === selectedId ? "is-selected" : "",
        ]
          .filter(Boolean)
          .join(" ");
        btn.innerHTML = PIN_SVG;
        btn.setAttribute("aria-label", t.name);
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectRef.current(t.id);
        });
        const marker = new maplibre.Marker({ element: btn, anchor: "center" })
          .setLngLat([t.lng, t.lat])
          .addTo(map);
        markersRef.current.push(marker);
      }

      if (origin) {
        if (!userRef.current) {
          const dot = document.createElement("div");
          dot.className = "user-dot";
          dot.setAttribute("aria-label", "Your location");
          userRef.current = new maplibre.Marker({ element: dot, anchor: "center" })
            .setLngLat([origin.lng, origin.lat])
            .addTo(map);
        } else {
          userRef.current.setLngLat([origin.lng, origin.lat]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toilets, selectedId, nearestId, origin]);

  useEffect(() => {
    const map = mapRef.current;
    const selected = toilets.find((t) => t.id === selectedId);
    if (!map || !selected) return;
    map.easeTo({ center: [selected.lng, selected.lat], duration: 450 });
  }, [selectedId, toilets]);

  return <div ref={containerRef} className="finder-map" aria-label="Map of nearby bathrooms" />;
}
