import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({ meta: [{ title: "Privacy — Compisser" }] }),
});

function PrivacyPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="main-content" className="site-wrap py-14">
        <article className="mx-auto max-w-[640px] rounded-xl border border-card-border bg-card p-8 shadow-(--shadow-sm) sm:p-10">
          <h1 className="mb-4 text-[clamp(1.8rem,4vw,2.4rem)] font-extrabold">Privacy</h1>
          <p className="text-sm text-slate-light">Last updated 13 August 2026</p>
          <h2 className="mt-6 mb-2 text-lg font-bold">Location</h2>
          <p className="text-muted">
            Precise coordinates are used on your device to measure distance and direction to toilets.
            Compisser does not store a trail of where you have been. When you search for a place, only
            the search text is sent to Nominatim so we can move the map.
          </p>
          <h2 className="mt-6 mb-2 text-lg font-bold">Without an account</h2>
          <p className="text-muted">
            You can find toilets, use the compass, filter and save favourites with no account.
            Favourites live in your browser. Map tiles are requested from OpenFreeMap; the tile
            coordinates you load can imply a coarse area.
          </p>
          <h2 className="mt-6 mb-2 text-lg font-bold">With an account</h2>
          <p className="text-muted">
            Optional sign-in uses Google or X. We store an account identifier, your loo-roll ratings,
            optional notes, and live condition reports. Reports do not include your coordinates.
          </p>
          <h2 className="mt-6 mb-2 text-lg font-bold">What we don't do</h2>
          <p className="text-muted">
            No ads, no sale of personal data, no movement profiling. Children under 13 should not use
            the community features.
          </p>
          <h2 className="mt-6 mb-2 text-lg font-bold">Your rights</h2>
          <p className="text-muted">
            You can sign out at any time. To erase ratings and reports attached to your account, sign
            in and contact us via the help page — we will delete associated rows.
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
