import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({ meta: [{ title: "About Compooper & data attribution" }] }),
});

function AboutPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader current="about" />
      <main id="main-content" className="site-wrap py-14">
        <article className="mx-auto max-w-[640px] rounded-xl border border-card-border bg-card p-8 shadow-(--shadow-sm) sm:p-10">
          <p className="mb-2 text-sm font-bold tracking-wide text-brand uppercase">
            About Compooper
          </p>
          <h1 className="mb-4 text-[clamp(1.8rem,4vw,2.4rem)] font-extrabold">
            A better way to pick a bathroom.
          </h1>
          <p className="text-muted">
            Compooper is a <strong>compass</strong> for finding somewhere to <strong>poo</strong> —
            hence the name. It ranks the bathrooms around you by whether they are worth sitting in,
            then swings the needle to the winner. Cleanliness is the axis: a hotel, a high-end
            department store or a proper restaurant beats a council block in a park, even when the
            park one is closer.
          </p>
          <p className="text-muted">
            Compooper is free, with no ads and no subscriptions. Needing a few unhurried minutes is
            normal, and knowing where to take them should not be guesswork.
          </p>

          <h2 className="mt-8 mb-3 text-xl font-extrabold">Data sources & attribution</h2>
          <p className="text-muted">
            Compooper combines live public-toilet records from OpenStreetMap with a small curated
            set used when the live feed is unreachable. Source information is kept with each place.
          </p>

          <h3 className="mt-5 mb-2 text-base font-bold">Toilet data</h3>
          <p className="text-muted">
            ©{" "}
            <a href="https://www.openstreetmap.org/copyright" className="font-semibold text-brand">
              OpenStreetMap contributors
            </a>
            . OpenStreetMap data is available under the{" "}
            <a
              href="https://opendatacommons.org/licenses/odbl/1-0/"
              className="font-semibold text-brand"
            >
              Open Database Licence
            </a>
            . Compooper selects public toilet records, excludes facilities tagged as private, and
            normalises facilities, seating type, paper supply and access rules for the finder.
          </p>
          <p className="text-muted">
            UK coverage is also inspired by the excellent open{" "}
            <a href="https://www.toiletmap.org.uk/dataset" className="font-semibold text-brand">
              Toilet Map
            </a>{" "}
            dataset (CC BY 4.0).
          </p>

          <h3 className="mt-5 mb-2 text-base font-bold">Web map and place search</h3>
          <p className="text-muted">
            The finder is rendered with{" "}
            <a href="https://maplibre.org/" className="font-semibold text-brand">
              MapLibre GL JS
            </a>
            . Tiles and style come from{" "}
            <a href="https://openfreemap.org/" className="font-semibold text-brand">
              OpenFreeMap
            </a>{" "}
            / OpenMapTiles and © OpenStreetMap contributors. Place search uses{" "}
            <a href="https://nominatim.org/" className="font-semibold text-brand">
              Nominatim
            </a>
            .
          </p>

          <h3 className="mt-5 mb-2 text-base font-bold">Community additions</h3>
          <p className="text-muted">
            Signed-in visitors can leave loo-roll cleanliness ratings and short live condition
            reports (open, closed, queueing, out of paper, out of order). Reports fade after six
            hours. Favourites stay on your device.
          </p>

          <p className="mt-8 text-sm text-muted">
            <Link to="/privacy" className="font-semibold text-brand">
              Privacy
            </Link>
            {" · "}
            <Link to="/help" className="font-semibold text-brand">
              Help
            </Link>
            {" · "}
            <Link to="/map" className="font-semibold text-brand">
              Open the finder
            </Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
