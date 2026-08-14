import { createContext, useContext, type ReactNode } from "react";

export type BrandId = "compooper";

export type Brand = {
  id: BrandId;
  name: string;
  tagline: string;
  home: "/";
  map: "/map";
  download: "/download";
  mascot: string;
  favicon: string;
  themeColor: string;
  countNoun: string;
  walkCta: string;
  detailCta: string;
  searchPlaceholder: string;
  defaultSort: "nicest";
  sister: { name: string; href: string; blurb: string };
};

export const BRANDS: Record<BrandId, Brand> = {
  compooper: {
    id: "compooper",
    name: "Compooper",
    tagline: "Nice bathrooms for a proper sit",
    home: "/",
    map: "/map",
    download: "/download",
    mascot: "/assets/compooper-mascot.png",
    favicon: "/compooper-favicon.svg",
    themeColor: "#f4e6d4",
    countNoun: "thrones nearby",
    walkCta: "Walk to the throne",
    detailCta: "Walk to this throne",
    searchPlaceholder: "Find a nice bathroom",
    defaultSort: "nicest",
    sister: {
      name: "Compisser",
      href: "https://github.com/tajmahal226/compisser",
      blurb: "Sister of Compisser, the emergency finder for when you just need to pee.",
    },
  },
};

const BrandContext = createContext<BrandId>("compooper");

/**
 * Brand context only — the `data-brand` ATTRIBUTE lives on `<html>` in
 * `__root.tsx`, not on a wrapper div here. `body` paints the page gradient from
 * `--bg-top`/`--bg-bottom`, so scoping the tokens to a div left `body` reading
 * `:root` (Compisser's blue-green) and shipped warm cards on a cold page.
 * Setting it on `<html>` during SSR also avoids a first-paint flash.
 */
export function BrandProvider({
  brand = "compooper",
  children,
}: {
  brand?: BrandId;
  children: ReactNode;
}) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrandId(): BrandId {
  return useContext(BrandContext);
}

export function useBrand(): Brand {
  return BRANDS[useContext(BrandContext)];
}
