import { Link } from "@tanstack/react-router";
import { AuthSlot } from "@/components/auth-slot";
import { ThemeToggle } from "@/components/theme-toggle";
import { useBrand } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function SiteHeader({ current }: { current?: "home" | "map" | "about" | "help" }) {
  const brand = useBrand();
  return (
    <header className="sticky top-0 z-30 border-b border-card-border bg-bg-top/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="site-wrap flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-3">
        <Link to={brand.home} className="flex items-center gap-2.5 no-underline">
          <img src={brand.mascot} alt="" className="size-8 object-contain" />
          <span className="leading-tight font-extrabold text-navy">
            {brand.name}
            <small className="block text-[0.68rem] font-semibold tracking-wide text-slate-light">
              {brand.tagline}
            </small>
          </span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          <Link
            to={brand.home}
            aria-current={current === "home" ? "page" : undefined}
            className={cn(
              "hidden rounded-[10px] px-3 py-2 text-[0.95rem] font-semibold text-muted no-underline hover:bg-card hover:text-navy sm:inline-flex",
              current === "home" && "bg-card text-navy",
            )}
          >
            Home
          </Link>
          <Link
            to={brand.map}
            className="inline-flex h-11 items-center rounded-[10px] bg-blue px-3 text-[0.9rem] font-extrabold text-white no-underline hover:bg-blue-dark"
          >
            Find a throne
          </Link>
          <NavLink to="/about" active={current === "about"} className="hidden md:inline-flex">
            About
          </NavLink>
          <NavLink to="/help" active={current === "help"} className="hidden md:inline-flex">
            Help
          </NavLink>
          <ThemeToggle />
          <AuthSlot compact />
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  to,
  active,
  className,
  children,
}: {
  to: "/about" | "/help";
  active?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-[10px] px-3 py-2 text-[0.95rem] font-semibold text-muted no-underline hover:bg-card hover:text-navy",
        active && "bg-card text-navy",
        className,
      )}
    >
      {children}
    </Link>
  );
}
