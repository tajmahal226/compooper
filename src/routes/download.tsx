import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Armchair, Share } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/download")({
  component: DownloadPage,
  head: () => ({ meta: [{ title: "Download Compooper" }] }),
});

function DownloadPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="main-content" className="site-wrap py-10 sm:py-16">
        <article className="mx-auto max-w-[520px] rounded-xl border border-card-border bg-card p-6 text-center shadow-(--shadow-sm) sm:p-10">
          <img src="/assets/compooper-mascot.png" alt="" className="mx-auto mb-4 size-[72px] object-contain" />
          <h1 className="mb-3 text-[clamp(1.8rem,4vw,2.2rem)] font-extrabold">Put Compooper on your iPhone</h1>
          <p className="text-muted">
            Add it to your Home Screen from Safari. Full-screen compass, no App Store, no ads — just a
            nicer place to sit.
          </p>
          <ol className="mt-6 space-y-3 text-left">
            <Step n={1} title="Open Compooper in Safari">
              Use Safari so Add to Home Screen is available.
            </Step>
            <Step n={2} title="Tap Share">
              The square with an arrow pointing up.
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-soft px-2 py-1 text-xs font-bold text-blue">
                <Share className="size-3.5" /> Share
              </span>
            </Step>
            <Step n={3} title="Add to Home Screen">
              Scroll the sheet, tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.
            </Step>
          </ol>
          <Link
            to="/map"
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-blue px-5 font-bold text-white no-underline hover:bg-blue-dark"
          >
            <Armchair className="size-4" />
            Open the finder
          </Link>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3 rounded-2xl border border-card-border bg-bg-top/40 p-3.5">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blue text-sm font-extrabold text-white">
        {n}
      </span>
      <span>
        <strong className="block text-navy">{title}</strong>
        <span className="mt-0.5 block text-sm text-muted">{children}</span>
      </span>
    </li>
  );
}
