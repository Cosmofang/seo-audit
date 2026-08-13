# LCP playbook — the levers that took a real site from 7.5 s → ~1.5 s mobile LCP

Distilled from a production campaign on the reference site (mobile PageSpeed LCP 7.5 s baseline → ~1.5 s field / ~0.9–1.2 s lab). Every lever below shipped and was **measured before/after** under the same lab conditions. Use this when the audit (or PageSpeed) says LCP is the problem; gates alone won't fix a slow LCP.

The measured gains belong to that site, page set, hosting path and test profile. Use the sequence as a diagnosis playbook, not a promise that the same change produces the same improvement elsewhere.

## Contents

- Diagnose before changing code
- Measured levers, ranked by impact on the reference site
- CLS guardrails
- CI and field-data lock-in

---

## 0. Diagnose before touching anything

1. **Identify the actual LCP element** (DevTools Performance panel / PSI "LCP element"). It is often **text**, not an image — here it was the hero subtitle paragraph. Text-LCP and image-LCP have different fixes; don't optimize images when the LCP is a `<p>`.
2. **Break LCP into its 4 phases** — TTFB → resource load delay → resource load time → **render delay**. This campaign was render-delay-bound: the fixes are CSS/fonts/DOM, not bytes-on-the-wire.
3. **Choose one repeatable lab profile** and use a median of at least 3 runs. The reference campaign used DevTools applied throttling (4x CPU + Slow 4G) because Lantern simulation on its localhost server diverged materially from traces. Simulated testing remains useful when calibrated against field data; do not switch methods mid-comparison.
4. **Do not optimize a composite score in isolation.** Verify each change in traces and compare with CrUX/RUM when available. Lab and field results answer different questions.

---

## The levers, ranked by measured impact

### 1. Kill render-blocking CSS round-trips (~1.7 s)
On the reference site, multiple stylesheet requests were on the render path. Inlining removed those round-trips (Astro: `build.inlineStylesheets: 'always'`). This trades away shared-cache reuse and increases HTML, so measure multi-page/repeat navigation before adopting it globally.
- CSP note: inline `<style>` needs `style-src 'unsafe-inline'` (low risk); keep **scripts** external and strict.
- Pitfall: bundlers name shared CSS chunks after the first entry alphabetically — a chunk called `electronics.*.css` was actually the site-wide fonts/nav/footer CSS. Inspect chunk *bodies* before deciding what to cut.

### 2. Critical-CSS split (inline ~88 KB → ~37 KB; lab LCP → ~1.2 s)
If the inlined CSS is large, most of it styles below-the-fold sections and still parses before first paint. Split:
- `page.critical.css` — global reset + nav + hero + everything visible at first paint (incl. their responsive rules/keyframes) → inlined.
- `page.deferred.css` — the rest → emitted as a hashed external asset, `<link rel="preload" as="style">` (non-blocking), flipped to `rel="stylesheet"` by a small **external** script on the first rAF after the hero paints (CSP-safe — no inline `onload`).
- **Cascade-order pitfall (this bit us):** the preload `<link>` sits *before* the inline `<style>`; flipping it in place puts deferred rules *earlier* in the cascade, so equal-specificity critical resets win and break below-fold layout. Fix: **append the link to the end of `<head>` before flipping** — re-uses the preloaded bytes, restores critical→deferred order.

### 3. Font discipline (~300 ms + ~148 KB off the critical path)
In order of audit:
1. **Delete unused font files** — 12 static-weight woff2 (~650 KB) shipped but no `@font-face` referenced them.
2. **Preload only files actually declared in `@font-face`** — an orphan preload is downloaded at high priority, then discarded.
3. **Then question every remaining preload.** With `font-display: swap`, text-LCP paints immediately in the fallback font; the webfont swaps in a beat later. Font preloads at high priority can occupy the whole critical path (here: 3 preloads ≈ 3× the size of HTML+CSS). Dropping them cut render delay ~300 ms. Trade-off: a more visible swap flash on slow connections — acceptable for mobile; re-add a preload only if a face is genuinely render-blocking.
4. **Mobile-only system-font swap for decorative faces** — a `@media (max-width: …)` that points labels at `ui-monospace`/system stacks means the webfont is *never fetched* on mobile; desktop keeps the brand face.

### 4. Defer heavy non-LCP DOM that shares the viewport (~230 ms)
A decorative hero mockup (~140 nodes of gradients/shadows/transforms) was laid out *before* the LCP text could paint. Pattern:
- Mark it `[data-defer]`; under the mobile media query its interior is `display: none` at first paint.
- The parent keeps its **fixed height** so the box reserves space — CLS stays 0.
- A post-paint script (2× `requestAnimationFrame`, i.e. after the LCP frame) removes the attribute to render it.
- Desktop media query never matches → visually unchanged where the budget allows it.

### 5. Image-LCP pages: eager hero, lazy everything else
Where the LCP *is* an image: `loading="eager"` + `fetchpriority="high"` on it (a lazy-loaded hero cost one page 3.2 s → fixed to <2.5 s), `loading="lazy"` on all others, AVIF with WebP fallback, responsive `widths`/`sizes` so mobile never downloads desktop pixels, recompress anything near the 500 KB gate. (Overlaps gate 7 — the playbook point is *which* image gets priority.)

### 6. Third-party JS: keep nonessential code off the critical path
The reference site injected analytics on `requestIdleCallback` or first interaction (`pointerdown`/`keydown`/`touchstart`), with a queueing `dataLayer`. Consent, attribution and event-loss requirements differ by site; verify them rather than assuming deferral is free.

### 7. Below-fold JS init: idle + IntersectionObserver
Defer widget initialization (accordions, carousels) to `requestIdleCallback`, or an `IntersectionObserver` with `rootMargin: '200px'` — the framework-free equivalent of `client:visible`. Init work stops competing with the hero render. Also: cache `getBoundingClientRect` results instead of reading per-mousemove; rAF-coalesce resize handlers.

### 8. Animations: compositor-only, paused off-screen
- Animate only `transform`/`opacity` (e.g. SVG radius pulse → `transform: scale()` with `transform-box: fill-box`); slide elements via `translate3d` not `style.left`, with `will-change: transform`.
- An `IntersectionObserver` toggles `animation-play-state: paused` on sections that scroll out of view — looping decorative animations stop billing the main thread.

### 9. Long-cache stable assets
`Cache-Control: max-age=31536000, immutable` on hashed and stable static dirs (fonts/images). Doesn't move first-visit LCP but locks in repeat-visit wins (~370 KB saved per repeat view here).

---

## CLS guardrails while you optimize LCP

Every deferral trades paint order for layout risk. Rules that kept CLS at 0 throughout:
- **Reserve space for anything deferred** — fixed height on the deferred container; `width`+`height` on every image (gate 7).
- **Dynamic text reserves its maximum footprint** — a typing effect sized by its longest phrase took CLS 0.40 → 0.03.
- Re-measure CLS after *every* LCP change; an LCP win that ships CLS regression is a net loss.

---

## Lock it in (CI) — wins evaporate without gates

- **Lighthouse CI gate**: mobile, using the calibrated lab method selected in diagnosis, with hard assertions `LCP < 2.5 s` / `CLS < 0.1` on representative heavy pages and a median of 3 runs. Keep TBT advisory until the environment has a stable baseline.
- **Per-page external-JS byte budget** (reference site: ≤40 KB/page, worst page 23.5 KB) — catches "a new dependency crept onto the page" before it reaches the field. Don't raise the threshold to pass; defer or cut the JS.
- These complement gate 10 (500 KB total): the JS budget is the dedicated regression tripwire for the metric that actually moves LCP/INP.
- Track field LCP, INP and CLS by template, device and geography. CI catches regressions before release; it cannot represent every real user.
