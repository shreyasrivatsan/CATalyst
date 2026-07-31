# CAT — Communication Assessment Tool

A digital assessment platform for speech-language clinicians and special
educators. CAT digitizes the Present/Absent communication checklist,
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

All P0 items above have a working first pass. The checklist content is a
generic, SCERTS-structure-inspired sample (not a licensed instrument) —
see `js/data/checklist.js`. Teaching video links in `js/data/videoMap.js`
were sourced via live search; spot-check them before a live demo.

## Running it locally

This is a plain static site — no build step, no install required.

Open `index.html` directly in a browser, or serve the folder with any
static file server if your browser blocks module scripts from the local
file system.

## API key

AI features call the Anthropic API directly from the browser. The key is
never hardcoded or committed to this repo.

To use the AI features: click **Settings** in the header, paste your
Anthropic API key, and click **Save**. The key is held only in this
browser tab's `sessionStorage` — it is never written to disk and is
cleared when the tab closes or when you click **Clear**.

## Deployment

Deployed as a static site (Netlify). Deployment steps will be added here
once the app is ready to publish.
