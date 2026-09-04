# Avicenna

The scholars' app for the Avicenna Foundation: events and retreats, the five-strand development programme (coaching, curriculum, project, mentorship, chaplaincy), the Adam Hub in Westminster, the Journal, and the cross-cohort scholar network.

A no-build progressive web app: plain HTML, CSS and ES modules, a service worker for offline use, and a manifest so it installs to the home screen on iOS and Android without an app store. Backend is Supabase (email OTP auth, Postgres with row-level security, storage).

## Run it
Any static server over HTTPS (or localhost) works. No build step.

```sh
python3 -m http.server 8080
# open http://localhost:8080
```

With `js/config.js` empty the app runs in **demo mode** against `js/demo-data.js`, with RSVPs, bookings and posts persisted in localStorage. Point it at a Supabase project by filling in `SUPABASE_URL` and `SUPABASE_ANON_KEY`; see [`supabase/README.md`](supabase/README.md).

## Layout
```
index.html               app shell
manifest.webmanifest     PWA manifest (icons in icons/)
sw.js                    service worker: precache shell + fonts, stale-while-revalidate for data
css/                     tokens → base → components → views
js/app.js                bootstrap, header, tab bar, routes
js/router.js             hash router
js/data.js               picks demo or Supabase API at start-up
js/data/demo.js          demo API (same surface as the Supabase one)
js/views/                one module per screen (js/views/staff/ holds the staff console sections)
css/brand.css · js/brand.js   the brand swap point: colours and logo (see brand/README.md)
supabase/functions/      calendar feed Edge Function and the shared ICS builder
js/components/index.js   shared render functions (ledger row, pass, cadence dots, spine, rail…)
design/styletile.html    living style tile of the design system
supabase/                migrations, seed, setup guide
tools/                   dev scripts (icon rasteriser, screenshot smoke test)
```

## Design
"Lapis & Gilt": lapis-ink grounds, a single gilt accent, turquoise for success. Cormorant Garamond for display and date numerals, IBM Plex Sans for UI, IBM Plex Mono for times and tags. Geometry from the eight-pointed khatam is used structurally (the mark, progress, dividers), not as decoration. Open `design/styletile.html` to see every token and component.

## Dev scripts
```sh
node tools/make-icons.mjs        # regenerate PNG icons from icons/icon.svg
node tools/screenshot.mjs out/   # screenshot every route at iPhone size and fail on console errors (needs a server on :8080)
node tools/flows-check.mjs out/  # click through booking, RSVP, posting, staff approvals, uploads and assert each state change
node tools/mock-supabase-check.mjs  # run every route against a mocked Supabase host to exercise the real data layer
node tools/contrast-check.mjs    # WCAG contrast for every text/surface token pair
node tools/ics-check.mjs         # validate the calendar feed output
```
Both use the globally installed Playwright.

## Licences
Fonts are under the SIL Open Font License (see `fonts/LICENSE-fonts.txt`). `js/vendor/supabase.js` is the MIT-licensed supabase-js UMD build.
