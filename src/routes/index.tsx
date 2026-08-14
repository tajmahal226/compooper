import { createFileRoute, Link } from "@tanstack/react-router";
import { Armchair, Compass, MapPinned, Sparkles, Wind } from "lucide-react";
import { CompassDial } from "@/components/compass-dial";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/")({
  component: CompooperHome,
});

function CompooperHome() {
  return (
    <div className="min-h-dvh pb-20 lg:pb-0">
      <SiteHeader current="home" />
      <main>
        <Hero />
        <Why />
        <How />
      </main>
      <SiteFooter />
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-card-border bg-bg-bottom/90 px-3 pt-2 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
      >
        <Link
          to="/map"
          className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-brand font-extrabold text-on-brand no-underline"
        >
          <Armchair className="size-4" />
          Find a nice bathroom
        </Link>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="py-12 sm:py-16">
      <div className="site-wrap grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <img
            src="/assets/compooper-mascot.png"
            alt="Compooper, a crowned toilet holding a newspaper"
            className="mascot-float mb-3 block w-[96px] drop-shadow-lg"
          />
          <span className="mb-4 inline-block rounded-full bg-brand-soft px-3 py-1.5 text-[0.78rem] font-bold tracking-[0.08em] text-brand uppercase">
            A sit, not a sprint
          </span>
          <h1 className="mb-4 text-[clamp(2.1rem,5vw,3.5rem)] font-extrabold">
            Find a bathroom worth taking a poo in.
          </h1>
          <p className="mb-6 max-w-[36ch] text-lg text-muted">
            Not the nearest — the nicest. Compooper ranks bathrooms by how clean and comfortable the
            sit will be, favouring hotels, department stores and proper restaurants over whatever
            happens to be closest.
          </p>
          <div className="flex flex-col items-start gap-3">
            <Link
              to="/map"
              className="inline-flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-[14px] bg-brand px-[22px] font-bold text-on-brand shadow-(--shadow) no-underline hover:bg-brand-dark"
            >
              <MapPinned className="size-4" />
              Find a nice bathroom
            </Link>
            <a
              href="https://github.com/tajmahal226/compisser"
              className="text-sm font-semibold text-muted no-underline hover:text-ink"
            >
              Just need to pee? Compisser lives next door →
            </a>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="phone-frame">
            <div className="absolute inset-0 bg-linear-to-b from-bg-top to-bg-bottom">
              <CompassDial
                heading={22}
                targetBearing={48}
                distance={186}
                name="Boston Public Library"
                nearby={[
                  { id: "a", bearing: 100, distance: 240 },
                  { id: "b", bearing: 210, distance: 380 },
                ]}
                compact
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Why() {
  const cards = [
    {
      icon: Sparkles,
      title: "Nicest sit first",
      copy: "Every bathroom gets a score out of 100 for the sit itself — the kind of venue, a seated cubicle, paper on the roll, and what other people reported. Distance is only the tie-break.",
    },
    {
      icon: Armchair,
      title: "Built for the sit",
      copy: "Filter to upscale venues, seated cubicles or step-free access. Squat pans, urinals and porta-loos are pushed to the bottom where they belong.",
    },
    {
      icon: Wind,
      title: "Then follow the arrow",
      copy: "The dial points at the throne you picked, not the nearest hole in the wall, and tells you how long the walk is. Go when you’re ready — nobody is rushing you.",
    },
  ];
  return (
    <section className="pb-12">
      <div className="site-wrap grid gap-4 sm:grid-cols-3">
        {cards.map(({ icon: Icon, title, copy }) => (
          <article
            key={title}
            className="rounded-xl border border-card-border bg-card p-6 shadow-(--shadow-sm)"
          >
            <Icon className="mb-3 size-6 text-brand" />
            <h2 className="mb-2 text-lg font-bold">{title}</h2>
            <p className="m-0 text-[0.95rem] text-muted">{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function How() {
  return (
    <section className="pb-16">
      <div className="site-wrap">
        <div className="rounded-xl bg-panel-invert px-8 py-12 text-center text-panel-invert-fg shadow-(--shadow)">
          <Compass className="mx-auto mb-4 size-8 text-[color:#e8955a]" />
          <h2 className="mb-2 text-[clamp(1.5rem,3vw,2.1rem)] font-extrabold text-panel-invert-fg">
            Never settle for a grim stall again
          </h2>
          <p className="mx-auto mb-6 max-w-[42ch] text-panel-invert-muted">
            Allow location and we’ll rank every bathroom around you, then point the compass at the
            best one.
          </p>
          <Link
            to="/map"
            className="inline-flex h-12 items-center gap-2 rounded-[14px] bg-brand px-6 font-bold text-on-brand no-underline hover:bg-brand-dark"
          >
            Find a throne
          </Link>
        </div>
      </div>
    </section>
  );
}
