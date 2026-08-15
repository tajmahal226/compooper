import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

/** Kept in sync with the pre-paint boot script in `__root.tsx`. */
const THEME_KEY = "compooper-theme";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    // Compooper's warm ground, not Compisser's blue.
    if (themeMeta) themeMeta.setAttribute("content", next ? "#1a100c" : "#f4e6d4");
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid size-11 place-items-center rounded-full border border-card-border bg-card text-ink shadow-(--shadow-sm) transition-transform duration-150 hover:-translate-y-px"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
