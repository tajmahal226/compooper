export type LatLng = { lat: number; lng: number };

const EARTH_M = 6371000;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Initial bearing from A to B, degrees clockwise from north (0–360). */
export function bearingDegrees(from: LatLng, to: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const φ1 = toRad(from.lat);
  const φ2 = toRad(to.lat);
  const Δλ = toRad(to.lng - from.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return "—";
  if (meters < 950) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}

/** Walking time at ~1.35 m/s (about 4.9 km/h). */
export function formatWalk(meters: number): string {
  const minutes = Math.max(1, Math.round(meters / 81));
  if (minutes < 60) return `${minutes} min walk`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min walk` : `${h} h walk`;
}

export function mapsWalkUrl(to: LatLng): string {
  if (typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
    return `https://maps.apple.com/?daddr=${to.lat},${to.lng}&dirflg=w`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${to.lat},${to.lng}&travelmode=walking`;
}

export type Mood = {
  label: string;
  hint: string;
  tone: "calm" | "ok" | "close" | "urgent";
};

export function distanceMood(meters: number): Mood {
  if (meters > 700)
    return { label: "Stay Cool", hint: "You've got time.", tone: "calm" };
  if (meters > 350)
    return { label: "Keep Going", hint: "A comfortable stroll.", tone: "ok" };
  if (meters > 140)
    return { label: "You've Got This", hint: "Closing in.", tone: "ok" };
  if (meters > 55)
    return { label: "Getting Close", hint: "Almost there.", tone: "close" };
  return { label: "Clench Mode", hint: "Do not pass go.", tone: "urgent" };
}
