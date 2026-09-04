# Brand assets

The app currently uses an original "Lapis & Gilt" identity because the foundation's brand files were not reachable when it was built. Swapping in the real brand touches three places:

1. **Colours** → `css/brand.css`. Replace the hex values. Grounds should stay dark and the accent warm and desaturated; run `node tools/contrast-check.mjs` afterwards, which fails if any text/background pair drops below WCAG AA.
2. **Logo** → `js/brand.js`. Paste the mark as an inline SVG string into `markSvg` (square viewBox, `fill="currentColor"` so it recolours) and the wordmark into `wordmarkSvg`. Put the source files in this folder for safekeeping.
3. **App icons** → run `node tools/make-icons.mjs`. It renders `icons/icon.svg`; replace that file with the mark on the brand ground first.

Fonts: the type system is Cormorant Garamond (display), IBM Plex Sans (UI) and IBM Plex Mono (meta). If the brand specifies other faces, add the WOFF2 files to `fonts/`, update the `@font-face` rules at the top of `css/base.css`, and the `--font-*` tokens in `css/tokens.css`.
