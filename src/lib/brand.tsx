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
      blurb: "Sister of Compisser, the emergency toilet finder.",
    },
  },
};

const BrandContext = createContext<BrandId>("compooper");

export function BrandProvider({ brand = "compooper", children }: { brand?: BrandId; children: ReactNode }) {
  return (
    <BrandContext.Provider value={brand}>
      <div data-brand={brand} className="min-h-dvh">
        {children}
      </div>
    </BrandContext.Provider>
  );
}

export function useBrandId(): BrandId {
  return useContext(BrandContext);
}

export function useBrand(): Brand {
  return BRANDS[useContext(BrandContext)];
}
