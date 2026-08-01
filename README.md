# CATalyst — Communication Assessment Tool

A digital assessment platform for speech-language clinicians and special
educators. Catalyst digitizes the Present/Absent communication checklist,
computes domain and composite scores automatically, and uses generative AI
to draft a clinical narrative and a caregiver-friendly version of the same
report for families.

Built for SmartAbility 2026 — AI/AR/VR Innovation Challenge, Problem
Statement 4 (REC × NIEPMD). See `docs/CAT_Abstract.pdf` for the full project
abstract.

## Status

Work in progress — this README is updated as features are built.

- [x] App skeleton
- [x] Patient list (select existing / start new)
- [x] Digital checklist
- [x] Automated scoring
- [x] AI clinical narrative
- [x] Caregiver-friendly report
- [x] Formatted report view
- [x] Clinician dashboard shell (sidebar: Dashboard / Patients / New
      Assessment / Clinical Reports), patient detail with score history,
      and persisted/reopenable reports

All P0 items above have a working first pass. The checklist content is a
generic, SCERTS-structure-inspired sample (not a licensed instrument) —
see `js/data/checklist.js`. Teaching video links in `js/data/videoMap.js`
were sourced via live search; spot-check them before a live demo.

## Running it locally

This is a plain static site — no build step, no install required. However,
most browsers (Chrome especially) block the JavaScript modules this app
uses when you open `index.html` directly from disk (`file://...`) — the
page will load but buttons won't respond. Serve the folder instead:

1. Open **Terminal** (Spotlight search → "Terminal").
2. Move into the project folder:
   ```
   cd "/path/to/cat-prototype"
   ```
3. Start a local server (Python comes preinstalled on macOS):
   ```
   python3 -m http.server 8000
   ```
4. Open **http://localhost:8000** in your browser.

Leave the Terminal window open while testing — it's what's serving the
page. Stop it anytime with `Control+C` in that window.

## API key

The key is never hardcoded or committed to this repo, in either mode below.

**On the deployed Netlify site**, AI features work with no key entry at all.
A Netlify serverless function (`netlify/functions/claude.js`) holds the real
Anthropic API key server-side, read from a Netlify environment variable
(`ANTHROPIC_API_KEY`, set in the Netlify dashboard — see Deployment below).
The browser calls that function instead of calling Anthropic directly, so
the real key never reaches the browser.

**When running locally** with the plain `python3 -m http.server` setup above,
that serverless function isn't available, so the app falls back to a
manually entered key: click **Settings** in the header, paste your Anthropic
API key, and click **Save**. The key is held only in that browser tab's
`sessionStorage` — never written to disk — and is cleared when the tab
closes or when you click **Clear**.

## Architecture

Plain static HTML/CSS/JS — no build step, no framework, no bundler. Every
`.js` file is loaded as an ES module directly by the browser. `js/main.js` is
the only entry point (`<script type="module" src="js/main.js">` in
`index.html`); every other module is imported from there or from each other.

**Screens.** The whole app is one `index.html` with five `<section
class="app-section">` blocks (login, patients, checklist, report, settings).
`main.js`'s `showSection(id)` shows one and hides the rest — there's no
router, no page reloads, no URL changes. Add a new screen by adding a
`<section>` to `index.html` and a `showX()` function in `main.js` that calls
`showSection`.

**Data flow, one assessment end to end:**
1. `js/auth/auth.js` — a name-only "login" stub (no password), stored in
   `sessionStorage`. Swap this out later for real auth without touching any
   calling code; `main.js` only calls `getCurrentUser()` / `login()`.
2. `js/store/patientStore.js` — patients and their assessments, persisted in
   `localStorage` (`cat_patients_v1`). This is the one place that touches
   storage for patient data; swapping in a real backend later means rewriting
   just this file's five exported functions.
3. `js/data/checklist.js` — the checklist content itself (`DEFAULT_CHECKLIST`):
   domains, each with weighted items. This is sample content inspired by the
   SCERTS framework's structure, not a licensed instrument — see the comment
   at the top of that file before using it clinically.
4. `js/checklistUI.js` — renders the checklist form (Present / Absent / Not
   Observed radios per item, with a teaching-video link from
   `js/data/videoMap.js` when one exists) and the live score summary.
5. `js/scoring.js` — pure function, `computeScores(checklist, itemScores)` →
   `{ domainScores, composite }`. No DOM, no side effects — easy to unit-test
   or reuse (e.g. for the trend-chart stretch goal).
6. `js/ai/client.js` — the single call-site for the Claude API
   (`callClaude(messages, options)`). Every AI feature goes through this one
   function. It tries the Netlify proxy first, falls back to a
   Settings-provided key — see "API key" above. **If you're adding a new AI
   feature, call this function; don't call Anthropic or `fetch` directly from
   feature code.**
7. `js/ai/narrative.js` and `js/ai/caregiverReport.js` — one function each,
   both thin wrappers around `callClaude()` with a specific system prompt.
   `narrative.js` turns scores into a clinical write-up; `caregiverReport.js`
   takes that narrative and re-expresses it for a parent. Neither sends the
   patient's name or other identifying info in the prompt — only "the
   individual" / "your child" — identity is added back in the browser when
   displaying the report. **Follow this pattern for any new AI feature: no
   PII in the prompt.**
8. `js/report.js` — renders the scores table and the clinical/caregiver tab
   switcher on the report screen.
9. `netlify/functions/claude.js` — the serverless proxy (see "API key" and
   "Deployment" above). Runs on Netlify's servers, not in the browser.

**Adding a new checklist domain or item:** edit `js/data/checklist.js` only —
everything else (rendering, scoring, AI prompts) reads from that data
structure and needs no changes.

**Adding a new AI-powered feature:** add a new file under `js/ai/` that
imports `callClaude` from `js/ai/client.js`, following the pattern in
`narrative.js` (system prompt + user content in, text out). Wire it up from
`main.js`.

## Deployment

Deployed as a static site on Netlify, connected to this GitHub repo — every
push to `main` auto-redeploys.

- **Build command**: none
- **Publish directory**: `.` (repo root)
- **Functions directory**: `netlify/functions` (declared in `netlify.toml`)

One manual, one-time setup step in the Netlify dashboard: go to **Site
settings → Environment variables** and add `ANTHROPIC_API_KEY` with a real
Anthropic API key as the value. This is never stored in the repo — only in
Netlify's environment variable store — and is what powers the AI features on
the live site with no key entry required from visitors.

## License

MIT — see `LICENSE`.
