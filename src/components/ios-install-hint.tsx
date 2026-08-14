import { Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useBrand } from "@/lib/brand";
import { isIosDevice, isStandaloneApp } from "@/lib/device";

const KEY = "compooper-a2hs-dismissed";

export function IosInstallHint() {
  const brand = useBrand();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!isIosDevice() || isStandaloneApp()) return;
      if (localStorage.getItem(`${KEY}-${brand.id}`) === "1") return;
      setShow(true);
    } catch {
      /* ignore */
    }
  }, [brand.id]);

  if (!show) return null;

  return (
    <aside className="pointer-events-auto absolute right-3 bottom-[calc(var(--sheet-h)+12px)] left-3 z-20 max-w-[400px] rounded-2xl border border-card-border bg-card p-3 shadow-(--shadow) lg:hidden">
      <div className="flex items-start gap-2">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <Share className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-sm font-extrabold text-ink">Add to Home Screen</p>
          <p className="mt-0.5 mb-0 text-xs text-muted">
            Tap Share, then <strong>Add to Home Screen</strong> — {brand.name} opens like an app.
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          className="grid size-11 shrink-0 place-items-center rounded-full text-muted"
          onClick={() => {
            setShow(false);
            try {
              localStorage.setItem(`${KEY}-${brand.id}`, "1");
            } catch {
              /* ignore */
            }
          }}
        >
          <X className="size-4" />
        </button>
      </div>
    </aside>
  );
}
