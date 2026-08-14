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
          className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-muted"
        >
          <Link to="/" className="hover:text-ink">
            Home
          </Link>
          <Link to="/map" className="hover:text-ink">
            Find a throne
          </Link>
          <a href={brand.sister.href} className="hover:text-ink" rel="noreferrer">
            {brand.sister.name}
          </a>
          <Link to="/about" className="hover:text-ink">
            About & data
          </Link>
          <Link to="/help" className="hover:text-ink">
            Help
          </Link>
          <Link to="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link to="/download" className="hover:text-ink">
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
