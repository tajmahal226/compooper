import { Link } from "@tanstack/react-router";
import { useBrand } from "@/lib/brand";

export function SiteFooter() {
  const brand = useBrand();
  return (
    <footer className="border-t border-card-border py-10 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+1.5rem))]">
      <div className="site-wrap flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 font-extrabold text-ink">
          <img src={brand.mascot} alt="" className="size-7 object-contain" />
          {brand.name}
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-4 gap-y-0 text-sm font-semibold text-muted"
        >
          <Link to="/" className="inline-flex min-h-11 items-center hover:text-ink">
            Home
          </Link>
          <Link to="/map" className="inline-flex min-h-11 items-center hover:text-ink">
            Find a throne
          </Link>
          <a
            href={brand.sister.href}
            className="inline-flex min-h-11 items-center hover:text-ink"
            rel="noreferrer"
          >
            {brand.sister.name}
          </a>
          <Link to="/about" className="inline-flex min-h-11 items-center hover:text-ink">
            About & data
          </Link>
          <Link to="/help" className="inline-flex min-h-11 items-center hover:text-ink">
            Help
          </Link>
          <Link to="/privacy" className="inline-flex min-h-11 items-center hover:text-ink">
            Privacy
          </Link>
          <Link to="/download" className="inline-flex min-h-11 items-center hover:text-ink">
            Download
          </Link>
        </nav>
        <p className="text-xs text-ink-faint">
          © {new Date().getFullYear()} {brand.name}. {brand.sister.blurb}
        </p>
      </div>
    </footer>
  );
}
