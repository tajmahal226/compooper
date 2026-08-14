import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/help")({
  component: HelpPage,
  head: () => ({ meta: [{ title: "Help — Compooper" }] }),
});

const FAQS: { q: string; a: ReactNode }[] = [
  {
    q: "Why does Compooper need my location?",
    a: (
      <>
        To rank the bathrooms around you and point the compass at the best one. Distance is only a
        tie-break here, so we need a rough origin to measure from. Your precise location is used
        entirely on your device — it is never stored as a movement history. Place searches send only
        the words you type to Nominatim. See the{" "}
        <Link to="/privacy" className="font-semibold text-brand">
          privacy page
        </Link>
        .
      </>
    ),
  },
  {
    q: "How do I read the compass?",
    a: "The big arrow in the centre points at your chosen throne — by default the best-scoring one nearby, not the closest — and turns as you do. The outer dial shows N/E/S/W. Smaller dots around the ring are other candidates at their real bearing.",
  },
  {
    q: "The arrow points the wrong way / spins around",
    a: "Compooper uses your phone's magnetometer, the same sensor as the built-in Compass app. On iPhone, tap Compass once so Safari can ask for Motion & Orientation Access — if you declined, enable it in Settings → Safari → Motion & Orientation Access. If it's jumpy, move away from metal and magnetic cases, then wave the phone in a figure-of-eight. Hold the phone flat. On a desktop the dial is north-up.",
  },
  {
    q: "How do I add Compooper to my iPhone Home Screen?",
    a: "Open Compooper in Safari, tap the Share button (square with an arrow), then Add to Home Screen. It will open full-screen without Safari chrome, which is the best way to use the compass.",
  },
  {
    q: "What do the badges mean?",
    a: "Upscale — a hotel, high-end department store or restaurant, where the bathrooms are maintained because the brand depends on it. Sit-down — OpenStreetMap says it is a seated pan, not a squat or a urinal. Paper — paper is supplied. Customers only / Hotel guests — you may need to buy something or be staying there. Accessible — step-free / disabled facilities. Baby changing — a changing table. RADAR key — locked to the UK National Key Scheme. All-gender — gender-neutral facilities.",
  },
  {
    q: "What are live conditions?",
    a: "On a throne's details you'll see community reports — clean and open, closed, out of order, queueing or no paper. Reports stop counting after about six hours, and a fresh \"no paper\" report drops the score hard. Anyone can read them; adding one needs a free account.",
  },
  {
    q: "How do ratings work?",
    a: "Cleanliness is measured in loo rolls, one to five, instead of stars — and it outranks every guess the app makes from map tags. Everyone can see the average; leaving a rating needs a free account.",
  },
  {
    q: "Can I scout somewhere else before I go?",
    a: "Yes — type a postcode, town or station in the search box. Sort by Nicest sit, Upscale first, Nearest or Accessible first. Worth doing before a long sit: department stores and hotels cluster in shopping districts.",
  },
  {
    q: "What's the difference between Compooper and Compisser?",
    a: (
      <>
        Compisser is the emergency sister — nearest toilet, now, when you just need to pee.
        Compooper is this app: bathrooms ranked for a proper sit, where clean beats close and a
        department store beats a park block. Compisser lives at{" "}
        <a href="https://github.com/tajmahal226/compisser" className="font-semibold text-brand">
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
          <p className="mb-8 text-muted">
            Everything you need to find a bathroom worth sitting in.
          </p>
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
