/**
 * Render scripts/og-card.html to public/og.jpg at 1200x630.
 *
 * The card is what iMessage, Slack and X show when someone pastes a link, so it
 * carries the wordmark and tagline — rerun this after changing either.
 * `scripts/brand-check.mjs` fails the card over 600 KB; quality 92 lands ~60 KB.
 */
import { chromium } from "playwright";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { statSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const cardHtml = join(here, "og-card.html");
const out = join(here, "..", "public", "og.jpg");

const browser = await chromium.launch({
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.goto(pathToFileURL(cardHtml).href, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);

// The wordmark is the brand signature — fail loudly rather than shipping a card
// that silently fell back to Georgia.
const wordmarkFont = await page.evaluate(() => {
  const h1 = document.querySelector("h1");
  return document.fonts.check(`${getComputedStyle(h1).fontSize} Fraunces`);
});
if (!wordmarkFont) {
  await browser.close();
  throw new Error("[og-card] Fraunces did not load — refusing to write an off-brand card.");
}

// Guard the one thing that silently degrades the card: a tagline too long for
// its column gets clipped by the nowrap rule rather than wrapping.
const fit = await page.evaluate(() => {
  const p = document.querySelector("p");
  return { needed: p.scrollWidth, available: p.parentElement.clientWidth };
});
if (fit.needed > fit.available) {
  console.warn(
    `[og-card] tagline needs ${fit.needed}px but only ${fit.available}px is available — ` +
      "reduce the font-size in og-card.html or shorten the tagline.",
  );
}

await page.screenshot({ path: out, type: "jpeg", quality: 92 });
await browser.close();
console.log(`[og-card] wrote ${out} (${(statSync(out).size / 1024).toFixed(1)} KB)`);
