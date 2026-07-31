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
- [ ] Patient list (select existing / start new)
- [ ] Digital checklist
- [ ] Automated scoring
- [ ] AI clinical narrative
- [ ] Caregiver-friendly report
- [ ] Formatted report view

## Running it locally

This is a plain static site — no build step, no install required.

Open `index.html` directly in a browser, or serve the folder with any
static file server if your browser blocks module scripts from the local
file system.

## API key

AI features call the Anthropic API. The key is never hardcoded or
committed to this repo. Configuration details will be added here once the
key-entry panel is built.

## Deployment

Deployed as a static site (Netlify). Deployment steps will be added here
once the app is ready to publish.
