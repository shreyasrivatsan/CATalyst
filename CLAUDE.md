# CATalyst — Communication Assessment Tool

## What this project is

Catalyst is a digital assessment platform for speech-language clinicians and special
educators who assess communication behaviors in individuals with disabilities.
Today that work is manual: paper checklists, hand-calculated scores, and reports
typed from scratch. Catalyst digitizes that pipeline and applies generative AI at the
points where clinicians lose the most time — writing narrative reports and
translating clinical findings for families.

Full abstract: see `docs/CAT_Abstract.pdf` in this folder. Read it before
starting work.

Built for: SmartAbility 2026 — AI/AR/VR Innovation Challenge, Problem Statement 4
(REC × NIEPMD).

## Context for how to work on this

This is a **hackathon build under a hard clock**, not a production system.

- Window 1: ~7–8 hours to produce a working prototype for initial selection.
- Window 2: a further ~10 hours for tweaks before final submission.

The primary developer is a college student with **little to no terminal, git, or
local dev experience**. Therefore:

- Explain what you are doing in plain language as you go. Do not assume she knows
  git, npm, shell commands, or build tooling.
- Prefer one small verifiable step over a large refactor. After each meaningful
  change, tell her exactly how to see the result (usually: refresh the browser).
- If something requires a command, give the exact command and say what it does.
- Never leave the app in a broken state at the end of a step. **It must be
  demoable at all times.** A partial feature that runs beats a complete feature
  that doesn't.

## Hard constraints on the stack

- **Plain static HTML / CSS / JavaScript. No bundler, no build step, no npm
  install.** No React toolchain, no Vite, no Webpack, no TypeScript compilation.
- Multiple files are fine and encouraged (`index.html`, `js/*.js` as ES modules,
  `css/styles.css`), but the app must run by opening `index.html` or serving the
  folder statically.
- Third-party libraries come in via CDN `<script>` tags only (A-Frame, a chart
  library, jsPDF if needed). Keep the number of dependencies small.
- Deployment target is a static host (Netlify drag-and-drop or repo connect).
  Nothing should require a server to run the core demo.

Reason for these constraints: build failures and toolchain debugging are the most
common way a hackathon team loses three hours. Removing the build step removes
that entire class of risk.

## API key rules — important

The AI features call the Anthropic API. The key handling rules are absolute:

- **Never hardcode an API key in any file in this project.**
- **Never commit a key**, not even a placeholder that looks real, and not in a
  `.env` that isn't gitignored. Add `.env` and `.env.*` to `.gitignore`
  immediately.
- The key must not be readable in client-side source shipped to a browser.

Two acceptable patterns, in order of preference:

1. **Serverless proxy (preferred if time allows).** A Netlify function reads the
   key from a platform environment variable; the browser calls the function via a
   relative path and never sees the key. Implement this in window 2 if window 1
   runs tight.
2. **Runtime key entry (acceptable fallback).** A settings panel where the user
   pastes their own key, held in `sessionStorage` only. Clearly labelled, easy to
   clear. Nothing persisted to disk, nothing in the repo.

Build the app so the call site is abstracted behind a single function (e.g.
`callClaude(messages)`), so switching between these two patterns is a one-file
change.

## Scope priority

Build strictly in this order. Do not start a P1 item until every P0 item works.

**P0 — required for a working prototype**
1. Digital Present/Absent checklist — structured, editable, administered on-screen.
2. Automated scoring engine — domain-wise and composite scores computed live.
3. AI-generated clinical narrative — LLM turns raw domain scores into a
   professionally worded clinical summary.
4. Caregiver-friendly report mode — the same results re-expressed by the AI in
   plain, empathetic language for parents.
5. Formatted report view produced as soon as scoring completes.

**P1 — strong differentiators, do next**
6. AI-assisted scoring from free-text notes — clinician types observations in
   natural language, system suggests Present/Absent values, clinician confirms.
   The confirm step is not optional; the AI never silently sets a score.
7. Linked teaching videos — each checklist item maps to a short instructional
   video. A static map of item → URL is sufficient to demonstrate this.

**P2 — stretch, only if genuinely ahead of schedule**
8. Session-over-session trend chart.
9. Voice-to-text note input (Web Speech API).
10. Browser VR module via A-Frame: a single 360° scenario with 2–3 interactive
    hotspots feeding observations into the same scoring engine.

Item 10 is worth real credit in an AI/AR/VR challenge but can consume hours.
Do not begin it unless P0 and P1 are complete and stable.

## Repo readiness

The decision on whether to push to GitHub is deferred, but the project must be
ready to push at any moment:

- `git init` locally at the start. Commit after each working feature with a clear
  message. This is the rollback mechanism if something breaks late.
- Maintain `README.md` **as you go**, not at the end. It must cover: what the
  project is, how to run it locally, how to configure the API key, and how to
  deploy. Assume the reader is a judge who has never seen the project.
- Keep `.gitignore` correct from commit one.

## Domain sensitivity

This tool concerns people with disabilities and the families supporting them.
Clinical language in the app should be accurate and respectful; caregiver-facing
language should be warm, plain, and free of jargon. The AI output is a draft for
a clinician to review and edit — never present it as a final clinical judgement,
and make that reviewability visible in the UI.

## Working agreement

- Ask before introducing any new dependency.
- Ask before restructuring files that already work.
- When a decision has a speed/quality tradeoff, name the tradeoff and recommend
  the faster option unless quality is load-bearing for the demo.
- Track remaining scope against the clock and say so if the plan is slipping.
