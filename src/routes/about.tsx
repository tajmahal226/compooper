import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({ meta: [{ title: "About Compisser & data attribution" }] }),
});

function AboutPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader current="about" />
      <main id="main-content" className="site-wrap py-14">
        <article className="mx-auto max-w-[640px] rounded-xl border border-card-border bg-card p-8 shadow-(--shadow-sm) sm:p-10">
          <p className="mb-2 text-sm font-bold tracking-wide text-blue uppercase">About Compisser</p>
          <h1 className="mb-4 text-[clamp(1.8rem,4vw,2.4rem)] font-extrabold">A simpler way to find a toilet.</h1>
          <p className="text-muted">
            Compisser is a worldwide public toilet finder. Use the web map to explore an area, or open
            the compass and follow the arrow to the closest public toilet.
          </p>
          <p className="text-muted">
            Compisser is free, with no ads and no subscriptions. Finding an essential facility should be
            quick, calm and available to everyone.
          </p>

          <h2 className="mt-8 mb-3 text-xl font-extrabold">Data sources & attribution</h2>
          <p className="text-muted">
            Compisser combines live public-toilet records from OpenStreetMap with a small curated set
            used when the live feed is unreachable. Source information is kept with each place.
          </p>

          <h3 className="mt-5 mb-2 text-base font-bold">Toilet data</h3>
          <p className="text-muted">
            ©{" "}
            <a href="https://www.openstreetmap.org/copyright" className="font-semibold text-blue">
              OpenStreetMap contributors
            </a>
            . OpenStreetMap data is available under the{" "}
            <a href="https://opendatacommons.org/licenses/odbl/1-0/" className="font-semibold text-blue">
              Open Database Licence
            </a>
            . Compisser selects public toilet records, excludes facilities tagged as private, and
            normalises facilities and opening information for the finder.
          </p>
          <p className="text-muted">
            UK coverage is also inspired by the excellent open{" "}
            <a href="https://www.toiletmap.org.uk/dataset" className="font-semibold text-blue">
              Toilet Map
            </a>{" "}
            dataset (CC BY 4.0).
          </p>

          <h3 className="mt-5 mb-2 text-base font-bold">Web map and place search</h3>
          <p className="text-muted">
            The finder is rendered with{" "}
            <a href="https://maplibre.org/" className="font-semibold text-blue">
              MapLibre GL JS
            </a>
            . Tiles and style come from{" "}
            <a href="https://openfreemap.org/" className="font-semibold text-blue">
              OpenFreeMap
            </a>{" "}
            / OpenMapTiles and © OpenStreetMap contributors. Place search uses{" "}
            <a href="https://nominatim.org/" className="font-semibold text-blue">
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
            <Link to="/privacy" className="font-semibold text-blue">
              Privacy
            </Link>
            {" · "}
            <Link to="/help" className="font-semibold text-blue">
              Help
            </Link>
            {" · "}
            <Link to="/map" className="font-semibold text-blue">
              Open the finder
            </Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
