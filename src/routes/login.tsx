import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({ meta: [{ title: "Sign in — Compooper" }] }),
});

function Login() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="site-wrap grid min-h-[70dvh] place-items-center py-16">
        <div className="w-full max-w-sm rounded-xl border border-card-border bg-card p-8 shadow-(--shadow-sm)">
          <img src="/assets/mascot.png" alt="" className="mb-3 size-14 object-contain" />
          <h1 className="mb-1 text-2xl font-extrabold">Sign in</h1>
          <p className="mb-6 text-sm text-muted">
            Leave loo-roll ratings and live condition reports. Finding toilets never needs an
            account.
          </p>
          {authEnabled ? (
            <div className="space-y-2.5">
              {GROK_PROVIDERS.map((p) => (
                <button
                  key={p.providerId}
                  type="button"
                  onClick={() => signIn(p.providerId, { callbackURL: "/map" })}
                  className="h-12 w-full rounded-[14px] border border-card-border bg-card px-4 font-bold text-ink hover:bg-brand-soft"
                >
                  Continue with {p.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Sign-in is disabled.</p>
          )}
          <p className="mt-6 text-center text-sm">
            <Link to="/map" className="font-semibold text-brand">
              Skip — just find a toilet
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
