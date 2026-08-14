import { Link } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function AuthSlot({ compact = false }: { compact?: boolean }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="size-8 animate-pulse rounded-full bg-ink/10" />;
  }
  if (user) {
    return (
      <div
        className={
          compact ? "max-w-[140px] [&_span.text-sm]:hidden sm:[&_span.text-sm]:inline" : undefined
        }
      >
        <UserButton />
      </div>
    );
  }
  return (
    <Link
      to="/login"
      className="inline-flex h-11 items-center rounded-xl px-3 text-sm font-semibold text-muted hover:bg-card hover:text-ink"
    >
      Sign in
    </Link>
  );
}
