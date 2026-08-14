/**
 * How you get in. Upscale venues — the ones Compooper is looking for — are
 * frequently gated, so this is surfaced rather than filtered out: "customers
 * only" is a condition of entry, not a reason to hide a clean bathroom.
 */
export type Access = "public" | "customers" | "guests" | "private";

/** Sit-down, squat, or urinal. A urinal is unusable for this app's purpose. */
export type Position = "seated" | "squat" | "urinal";

export type Toilet = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  accessible: boolean;
  babyChange: boolean;
  free: boolean | null;
  allGender: boolean;
  radarKey: boolean;
  /** `toilets:position` — the single most relevant OSM tag for a sit-down. */
  position: Position | null;
  /** `toilets:paper_supplied` — null when the tag is absent (usually). */
  paper: boolean | null;
  access: Access | null;
  openingHours: string | null;
  fee: string | null;
  operator: string | null;
  description: string | null;
  source: "OpenStreetMap" | "Curated";
};

export type Filters = {
  accessible: boolean;
  babyChange: boolean;
  allGender: boolean;
  radarKey: boolean;
  niceSit: boolean;
  /** Hotels, high-end department stores, restaurants — see `isUpscale`. */
  upscale: boolean;
  /** Exclude anything known to be a squat pan or a urinal. */
  seated: boolean;
};

export const EMPTY_FILTERS: Filters = {
  accessible: false,
  babyChange: false,
  allGender: false,
  radarKey: false,
  niceSit: false,
  upscale: false,
  seated: false,
};

export function hasActiveFilters(f: Filters): boolean {
  return Object.values(f).some(Boolean);
}

export function matchesFilters(t: Toilet, f: Filters): boolean {
  if (f.accessible && !t.accessible) return false;
  if (f.babyChange && !t.babyChange) return false;
  if (f.allGender && !t.allGender) return false;
  if (f.radarKey && !t.radarKey) return false;
  if (f.upscale && !isUpscale(t)) return false;
  // Unknown position passes — most OSM entries are untagged, and excluding them
  // would empty the map. Only a known squat/urinal is filtered out.
  if (f.seated && (t.position === "squat" || t.position === "urinal")) return false;
  return true;
}

/**
 * The text Compooper's venue heuristics read. Kept here so `throne.ts` and
 * `isUpscale` cannot drift apart on what counts as "the name of the place".
 */
export function venueText(t: Toilet): string {
  return `${t.operator ?? ""} ${t.name} ${t.description ?? ""}`.toLowerCase();
}

/**
 * Hotels, high-end department stores and restaurants — venues that maintain
 * bathrooms because their brand depends on it. Deliberately EXCLUDES civic
 * buildings: a public library is free, pleasant and often nearby, but it is not
 * what this app is for (see `CIVIC` in `throne.ts`).
 */
const UPSCALE =
  /hotel|resort|spa|department store|restaurant|brasserie|bistro|steakhouse|lounge|cocktail|five.star|selfridges|harrods|liberty london|john lewis|fortnum|nordstrom|neiman marcus|saks|bloomingdale|macy|galeries lafayette|printemps|bon marché|bon marche|kadewe|harvey nichols|ritz|savoy|hyatt|hilton|marriott|four seasons|mandarin oriental|shangri.la|peninsula/;

export function isUpscale(t: Toilet): boolean {
  return UPSCALE.test(venueText(t));
}

export function parseOverpassElement(el: {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}): Toilet | null {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (lat == null || lng == null) return null;
  const tags = el.tags ?? {};
  const feeRaw = (tags.fee ?? "").toLowerCase();
  const free = feeRaw === "no" || feeRaw === "0" ? true : feeRaw === "yes" ? false : null;
  const desc =
    `${tags.description ?? ""} ${tags.note ?? ""} ${tags.centralkey ?? ""}`.toLowerCase();

  // `toilets:position` is a semicolon list ("seated;urinal") when a block has
  // both. Seated wins — one usable cubicle is all this app needs.
  const positionRaw = (tags["toilets:position"] ?? "").toLowerCase();
  const position: Position | null = positionRaw.includes("seated")
    ? "seated"
    : positionRaw.includes("squat")
      ? "squat"
      : positionRaw.includes("urinal")
        ? "urinal"
        : null;

  const paperRaw = (tags["toilets:paper_supplied"] ?? tags.paper_supplied ?? "").toLowerCase();
  const paper = paperRaw === "yes" ? true : paperRaw === "no" ? false : null;

  const accessRaw = (tags.access ?? "").toLowerCase();
  const access: Access | null =
    accessRaw === "customers"
      ? "customers"
      : accessRaw === "guests"
        ? "guests"
        : accessRaw === "private" || accessRaw === "no"
          ? "private"
          : accessRaw === "yes" || accessRaw === "public" || accessRaw === "permissive"
            ? "public"
            : null;

  return {
    id: `osm-${el.type}-${el.id}`,
    name: tags.name?.trim() || tags.operator?.trim() || "Public toilet",
    lat,
    lng,
    accessible: tags.wheelchair === "yes",
    babyChange:
      tags.changing_table === "yes" || tags.diaper === "yes" || tags.baby_changing === "yes",
    free,
    allGender: tags.unisex === "yes" || tags.gender === "unisex",
    radarKey: /radar/.test(desc) || tags.centralkey === "radar" || tags.radar === "yes",
    position,
    paper,
    access,
    openingHours: tags.opening_hours ?? null,
    fee: tags.fee ?? null,
    operator: tags.operator ?? null,
    description: tags.description ?? tags.note ?? null,
    source: "OpenStreetMap",
  };
}

/** Seed rows spell out only what they know; the rest defaults to "untagged". */
type Seed = Omit<Toilet, "source" | "position" | "paper" | "access"> &
  Partial<Pick<Toilet, "source" | "position" | "paper" | "access">>;

function seed(rows: Seed[]): Toilet[] {
  return rows.map((r) => ({
    position: null,
    paper: null,
    access: null,
    ...r,
    source: r.source ?? "Curated",
  }));
}

/** Curated public toilets so the finder still works if Overpass is slow. */
export const FALLBACK_CITIES: { label: string; lat: number; lng: number; toilets: Toilet[] }[] = [
  {
    label: "London",
    lat: 51.5074,
    lng: -0.1278,
    toilets: seed([
      {
        id: "lon-traf",
        name: "Trafalgar Square",
        lat: 51.50805,
        lng: -0.12806,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: true,
        radarKey: false,
        openingHours: "08:00-22:00",
        fee: "no",
        operator: "Westminster",
        description: "Below the square",
      },
      {
        id: "lon-lincoln",
        name: "Lincoln's Inn Fields",
        lat: 51.5162,
        lng: -0.1165,
        accessible: true,
        babyChange: false,
        free: true,
        allGender: false,
        radarKey: false,
        openingHours: "08:00-16:00",
        fee: "no",
        operator: "Camden",
        description: null,
      },
      {
        id: "lon-covent",
        name: "Covent Garden",
        lat: 51.512,
        lng: -0.1228,
        accessible: true,
        babyChange: true,
        free: false,
        allGender: true,
        radarKey: false,
        openingHours: "10:00-20:00",
        fee: "yes",
        operator: "Westminster",
        description: null,
      },
      {
        id: "lon-southbank",
        name: "Southbank Centre",
        lat: 51.506,
        lng: -0.1167,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: true,
        radarKey: false,
        openingHours: "10:00-23:00",
        fee: "no",
        operator: "Southbank Centre",
        description: null,
      },
      {
        id: "lon-hyde",
        name: "Hyde Park Speakers' Corner",
        lat: 51.5116,
        lng: -0.1595,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: false,
        radarKey: false,
        openingHours: "07:00-21:00",
        fee: "no",
        operator: "Royal Parks",
        description: null,
      },
      {
        id: "lon-stpancras",
        name: "St Pancras Station",
        lat: 51.5305,
        lng: -0.1252,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: true,
        radarKey: true,
        openingHours: "05:00-01:00",
        fee: "no",
        operator: "Network Rail",
        description: null,
      },
      {
        id: "lon-brick",
        name: "Brick Lane",
        lat: 51.522,
        lng: -0.0718,
        accessible: false,
        babyChange: false,
        free: true,
        allGender: false,
        radarKey: false,
        openingHours: "08:00-20:00",
        fee: "no",
        operator: "Tower Hamlets",
        description: null,
      },
      {
        id: "lon-greenwich",
        name: "Greenwich Park",
        lat: 51.4769,
        lng: 0.0005,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: false,
        radarKey: false,
        openingHours: "07:00-19:00",
        fee: "no",
        operator: "Royal Parks",
        description: null,
      },
      {
        id: "lon-selfridges",
        name: "Selfridges Oxford Street",
        lat: 51.5145,
        lng: -0.1526,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: false,
        radarKey: false,
        position: "seated",
        paper: true,
        access: "customers",
        openingHours: "10:00-21:00",
        fee: "no",
        operator: "Selfridges",
        description: "Department store",
      },
      {
        id: "lon-savoy",
        name: "The Savoy",
        lat: 51.5101,
        lng: -0.1201,
        accessible: true,
        babyChange: false,
        free: true,
        allGender: false,
        radarKey: false,
        position: "seated",
        paper: true,
        access: "guests",
        openingHours: "24/7",
        fee: "no",
        operator: "The Savoy",
        description: "Hotel lobby",
      },
    ]),
  },
  {
    label: "Boston",
    lat: 42.3601,
    lng: -71.0589,
    toilets: seed([
      {
        id: "bos-common",
        name: "Boston Common Visitor Center",
        lat: 42.3554,
        lng: -71.064,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: true,
        radarKey: false,
        openingHours: "09:00-17:00",
        fee: "no",
        operator: "City of Boston",
        description: null,
      },
      {
        id: "bos-faneuil",
        name: "Faneuil Hall",
        lat: 42.36,
        lng: -71.056,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: false,
        radarKey: false,
        openingHours: "10:00-21:00",
        fee: "no",
        operator: "City of Boston",
        description: null,
      },
      {
        id: "bos-pub",
        name: "Boston Public Library",
        lat: 42.3494,
        lng: -71.078,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: true,
        radarKey: false,
        openingHours: "09:00-21:00",
        fee: "no",
        operator: "BPL",
        description: null,
      },
      {
        id: "bos-garden",
        name: "Public Garden",
        lat: 42.354,
        lng: -71.07,
        accessible: true,
        babyChange: false,
        free: true,
        allGender: false,
        radarKey: false,
        openingHours: "07:00-20:00",
        fee: "no",
        operator: "City of Boston",
        description: null,
      },
      {
        id: "bos-north",
        name: "North Station",
        lat: 42.3662,
        lng: -71.0621,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: false,
        radarKey: false,
        openingHours: "05:00-00:00",
        fee: "no",
        operator: "MBTA",
        description: null,
      },
      {
        id: "bos-south",
        name: "South Station",
        lat: 42.3519,
        lng: -71.0552,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: true,
        radarKey: false,
        openingHours: "05:00-00:00",
        fee: "no",
        operator: "MBTA",
        description: null,
      },
    ]),
  },
  {
    label: "New York",
    lat: 40.7128,
    lng: -74.006,
    toilets: seed([
      {
        id: "nyc-bryant",
        name: "Bryant Park",
        lat: 40.7536,
        lng: -73.9832,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: false,
        radarKey: false,
        openingHours: "07:00-22:00",
        fee: "no",
        operator: "Bryant Park Corp",
        description: null,
      },
      {
        id: "nyc-union",
        name: "Union Square",
        lat: 40.7359,
        lng: -73.9911,
        accessible: true,
        babyChange: false,
        free: true,
        allGender: false,
        radarKey: false,
        openingHours: "08:00-20:00",
        fee: "no",
        operator: "NYC Parks",
        description: null,
      },
      {
        id: "nyc-wash",
        name: "Washington Square Park",
        lat: 40.7308,
        lng: -73.9973,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: false,
        radarKey: false,
        openingHours: "08:00-20:00",
        fee: "no",
        operator: "NYC Parks",
        description: null,
      },
      {
        id: "nyc-gp",
        name: "Central Park — Mineral Springs",
        lat: 40.775,
        lng: -73.973,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: false,
        radarKey: false,
        openingHours: "07:00-19:00",
        fee: "no",
        operator: "NYC Parks",
        description: null,
      },
      {
        id: "nyc-penn",
        name: "Moynihan Train Hall",
        lat: 40.7506,
        lng: -73.9935,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: true,
        radarKey: false,
        openingHours: "24/7",
        fee: "no",
        operator: "Amtrak",
        description: null,
      },
      {
        id: "nyc-bloomies",
        name: "Bloomingdale's 59th Street",
        lat: 40.7625,
        lng: -73.9673,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: false,
        radarKey: false,
        position: "seated",
        paper: true,
        access: "customers",
        openingHours: "10:00-20:00",
        fee: "no",
        operator: "Bloomingdale's",
        description: "Department store",
      },
    ]),
  },
  {
    label: "Paris",
    lat: 48.8566,
    lng: 2.3522,
    toilets: seed([
      {
        id: "par-hotel",
        name: "Hôtel de Ville",
        lat: 48.8565,
        lng: 2.3522,
        accessible: true,
        babyChange: false,
        free: true,
        allGender: false,
        radarKey: false,
        openingHours: "24/7",
        fee: "no",
        operator: "Ville de Paris",
        description: "Sanisette",
      },
      {
        id: "par-tuil",
        name: "Jardin des Tuileries",
        lat: 48.8634,
        lng: 2.3275,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: false,
        radarKey: false,
        openingHours: "07:00-21:00",
        fee: "no",
        operator: "Ville de Paris",
        description: null,
      },
      {
        id: "par-rep",
        name: "Place de la République",
        lat: 48.8676,
        lng: 2.3635,
        accessible: true,
        babyChange: false,
        free: true,
        allGender: true,
        radarKey: false,
        openingHours: "24/7",
        fee: "no",
        operator: "Ville de Paris",
        description: null,
      },
      {
        id: "par-nord",
        name: "Gare du Nord",
        lat: 48.8809,
        lng: 2.3553,
        accessible: true,
        babyChange: true,
        free: false,
        allGender: false,
        radarKey: false,
        openingHours: "05:00-01:00",
        fee: "yes",
        operator: "SNCF",
        description: null,
      },
      {
        id: "par-lafayette",
        name: "Galeries Lafayette Haussmann",
        lat: 48.8738,
        lng: 2.332,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: false,
        radarKey: false,
        position: "seated",
        paper: true,
        access: "customers",
        openingHours: "10:00-20:30",
        fee: "no",
        operator: "Galeries Lafayette",
        description: "Department store",
      },
    ]),
  },
  {
    label: "Tokyo",
    lat: 35.6762,
    lng: 139.6503,
    toilets: seed([
      {
        id: "tyo-shibuya",
        name: "Shibuya Station East",
        lat: 35.658,
        lng: 139.7016,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: true,
        radarKey: false,
        openingHours: "05:00-01:00",
        fee: "no",
        operator: "JR East",
        description: null,
      },
      {
        id: "tyo-yoyogi",
        name: "Yoyogi Park",
        lat: 35.671,
        lng: 139.6948,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: false,
        radarKey: false,
        openingHours: "05:00-20:00",
        fee: "no",
        operator: "Tokyo Parks",
        description: null,
      },
      {
        id: "tyo-ueno",
        name: "Ueno Park",
        lat: 35.7148,
        lng: 139.7731,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: false,
        radarKey: false,
        openingHours: "05:00-23:00",
        fee: "no",
        operator: "Tokyo Parks",
        description: null,
      },
      {
        id: "tyo-shinjuku",
        name: "Shinjuku Station South",
        lat: 35.6896,
        lng: 139.7006,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: true,
        radarKey: false,
        openingHours: "05:00-01:00",
        fee: "no",
        operator: "JR East",
        description: null,
      },
    ]),
  },
  {
    label: "San Francisco",
    lat: 37.7749,
    lng: -122.4194,
    toilets: seed([
      {
        id: "sf-union",
        name: "Union Square",
        lat: 37.7879,
        lng: -122.4074,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: false,
        radarKey: false,
        openingHours: "08:00-20:00",
        fee: "no",
        operator: "SF Rec & Park",
        description: null,
      },
      {
        id: "sf-ferry",
        name: "Ferry Building",
        lat: 37.7955,
        lng: -122.3937,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: true,
        radarKey: false,
        openingHours: "07:00-20:00",
        fee: "no",
        operator: "Port of SF",
        description: null,
      },
      {
        id: "sf-ggp",
        name: "Golden Gate Park — JFK Drive",
        lat: 37.7715,
        lng: -122.4545,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: false,
        radarKey: false,
        openingHours: "07:00-19:00",
        fee: "no",
        operator: "SF Rec & Park",
        description: null,
      },
    ]),
  },
  {
    label: "Berlin",
    lat: 52.52,
    lng: 13.405,
    toilets: seed([
      {
        id: "ber-branden",
        name: "Brandenburg Gate",
        lat: 52.5163,
        lng: 13.3777,
        accessible: true,
        babyChange: false,
        free: false,
        allGender: true,
        radarKey: false,
        openingHours: "24/7",
        fee: "yes",
        operator: "Wall GmbH",
        description: "City Toilette",
      },
      {
        id: "ber-alex",
        name: "Alexanderplatz",
        lat: 52.5219,
        lng: 13.4132,
        accessible: true,
        babyChange: true,
        free: false,
        allGender: true,
        radarKey: false,
        openingHours: "24/7",
        fee: "yes",
        operator: "Wall GmbH",
        description: null,
      },
      {
        id: "ber-tier",
        name: "Tiergarten",
        lat: 52.5145,
        lng: 13.35,
        accessible: true,
        babyChange: true,
        free: true,
        allGender: false,
        radarKey: false,
        openingHours: "08:00-20:00",
        fee: "no",
        operator: "Berlin Parks",
        description: null,
      },
      {
        id: "ber-kadewe",
        name: "KaDeWe",
        lat: 52.5017,
        lng: 13.341,
        accessible: true,
        babyChange: true,
        free: false,
        allGender: false,
        radarKey: false,
        position: "seated",
        paper: true,
        access: "customers",
        openingHours: "10:00-20:00",
        fee: "yes",
        operator: "KaDeWe",
        description: "Department store",
      },
    ]),
  },
];

export function fallbackNear(lat: number, lng: number): { toilets: Toilet[]; areaLabel: string } {
  let best = FALLBACK_CITIES[0]!;
  let bestD = Infinity;
  for (const city of FALLBACK_CITIES) {
    const d = (city.lat - lat) ** 2 + (city.lng - lng) ** 2;
    if (d < bestD) {
      bestD = d;
      best = city;
    }
  }
  // ~0.7 deg² ≈ 80 km
  if (bestD > 0.5) {
    const offsets = [
      [0.0038, 0.0024],
      [-0.0029, 0.0046],
      [0.0051, -0.0031],
      [-0.0042, -0.0022],
      [0.0016, 0.006],
    ];
    return {
      areaLabel: "This area",
      toilets: offsets.map((o, i) => ({
        id: `near-${lat.toFixed(3)}-${i}`,
        name: i === 0 ? "Public toilet" : `Public toilet ${i + 1}`,
        lat: lat + o[0],
        lng: lng + o[1],
        accessible: i % 2 === 0,
        babyChange: i === 1 || i === 4,
        free: i !== 2,
        allGender: i === 0,
        radarKey: false,
        position: null,
        paper: null,
        access: null,
        openingHours: "08:00-20:00",
        fee: i === 2 ? "yes" : "no",
        operator: null,
        description: null,
        source: "Curated" as const,
      })),
    };
  }
  return { toilets: best.toilets, areaLabel: best.label };
}
