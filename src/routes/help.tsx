import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/help")({
  component: HelpPage,
  head: () => ({ meta: [{ title: "Help — Compisser" }] }),
});

const FAQS: { q: string; a: ReactNode }[] = [
  {
    q: "Why does Compisser need my location?",
    a: (
      <>
        To work out which toilet is closest and which way to point you. Your precise location is used
        entirely on your device — it is never stored as a movement history. Place searches send only
        the words you type to Nominatim. See the{" "}
        <Link to="/privacy" className="font-semibold text-blue">
          privacy page
        </Link>
        .
      </>
    ),
  },
  {
    q: "How do I read the compass?",
    a: "The big arrow in the centre points to the nearest toilet and turns as you do — walk in the direction it's facing. The outer dial shows N/E/S/W. Smaller dots around the ring are other nearby toilets at their real bearing.",
  },
  {
    q: "The arrow points the wrong way / spins around",
    a: "Compisser uses your phone's magnetometer, the same sensor as the built-in Compass app. On iPhone, tap Compass once so Safari can ask for Motion & Orientation Access — if you declined, enable it in Settings → Safari → Motion & Orientation Access. If it's jumpy, move away from metal and magnetic cases, then wave the phone in a figure-of-eight. Hold the phone flat. On a desktop the dial is north-up.",
  },
  {
    q: "How do I add Compisser to my iPhone Home Screen?",
    a: "Open Compisser in Safari, tap the Share button (square with an arrow), then Add to Home Screen. It will open full-screen without Safari chrome, which is the best way to use the compass.",
  },
  {
    q: "What do the badges mean?",
    a: "Accessible — step-free / disabled facilities. Baby changing — a changing table. Free — no payment required. RADAR key — locked to the UK National Key Scheme. All-gender — gender-neutral facilities. Use filters to show only the toilets that match.",
  },
  {
    q: "What are live conditions?",
    a: "On a toilet's details you'll see community reports — open, closed, out of order, queueing or out of paper. Reports stop counting after about six hours. Anyone can read them; adding one needs a free account.",
  },
  {
    q: "How do ratings work?",
    a: "Cleanliness is measured in loo rolls, one to five, instead of stars. Everyone can see the average; leaving a rating needs a free account.",
  },
  {
    q: "Can I check toilets somewhere else before I go?",
    a: "Yes — type a postcode, town or station in the search box. Sort by Nearest, Free first or Accessible first. The compass keeps pointing at whatever is nearest to your current origin.",
  },
  {
    q: "What's the difference between Compooper and Compisser?",
    a: (
      <>
        Compisser is the emergency sister — nearest toilet, now. Compooper is this app: bathrooms
        ranked for a proper sit. Compisser lives at{" "}
        <a href="https://github.com/tajmahal226/compisser" className="font-semibold text-blue">
          github.com/tajmahal226/compisser
        </a>
        .
      </>
    ),
  },
];

function HelpPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader current="help" />
      <main id="main-content" className="site-wrap py-14">
        <div className="mx-auto max-w-[680px]">
          <h1 className="mb-2 text-[clamp(1.8rem,4vw,2.4rem)] font-extrabold">Help & FAQ</h1>
          <p className="mb-8 text-muted">Everything you need to get the most out of Compisser.</p>
          <div className="space-y-3">
            {FAQS.map((item) => (
              <article
                key={item.q}
                className="rounded-xl border border-card-border bg-card p-5 shadow-(--shadow-sm)"
              >
                <h2 className="mb-2 text-base font-bold">{item.q}</h2>
                <p className="m-0 text-[0.95rem] text-muted">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
