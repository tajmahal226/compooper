import { createFileRoute } from "@tanstack/react-router";
import { FinderApp } from "@/components/finder/finder-app";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/map")({
  component: MapPage,
  head: () => ({
    meta: [
      { title: "Find a nice bathroom — Compooper" },
      {
        name: "description",
        content: "Search any town or follow the compass to a bathroom worth sitting in.",
      },
    ],
  }),
});

function MapPage() {
  return (
    <div className="finder-page-mobile flex min-h-dvh flex-col overflow-hidden">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="hidden lg:block">
        <SiteHeader current="map" />
      </div>
      <main id="main-content" className="min-h-0 flex-1">
        <FinderApp />
      </main>
    </div>
  );
}
