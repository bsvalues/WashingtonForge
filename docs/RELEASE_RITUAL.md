# TerraFusion Release Ritual

**Defensible Spine Workflow**  
Every release must be: **observable**, **reversible**, **demoable**, **auditable**.

This ritual is optimized for TerraFusion prototypes that still need government-grade discipline.

---

## 0) Principles

### The TerraFusion Way

1. **Truth over theatre**: we only claim what we can prove.
2. **Micro-commits**: smallest possible diffs, individually reviewable.
3. **Layer separation**: styling layer (tokens/wrappers) must not mutate logic layer.
4. **Evidence chain**: build + lint + demo path = acceptance.
5. **Merge points matter**: ship when it's _credible_, not when it's perfect.

---

## 1) Branching Model

### Branches

- `main`: released, demo-safe
- `dev`: integration branch for features
- `feat/*`: feature branches
- `chore/*`: refactors, lint, deps, maintenance

### Rules

- Feature work **never lands directly** on `main`.
- All merges to `main` come from `dev` via a **release PR**.
- Prefer **merge commits** for releases (best audit + rollback).

---

## 2) "Definition of Done" (DoD)

A change is "done" when all are true:

### Functional

- `pnpm build` succeeds
- runtime navigation works on the demo path
- no breaking UI regressions on key routes

### Quality Gate

- `pnpm lint` has **0 errors**  
  (warnings allowed only if pre-existing and tracked)

### Auditability

- change is reversible (revert commit or revert PR cleanly)
- PR description includes: scope, risk level, and how to verify

---

## 3) Micro-Commit Discipline (Feature Branch)

### Commit sizing

- One intent per commit
- One surface area when possible (e.g., cockpit-only, pilot-only)
- Avoid drive-by refactors

### Required per micro-commit

Run:

```bash
pnpm lint
pnpm build
```

Then commit with a message that states intent:

- `feat(material): ...`
- `feat(ux): ...`
- `chore(css): ...`

---

## 4) Smoke Test (90-Second Demo Path)

This is the standard "instrument panel" proof run.

### Start

- `/login` → **Enter Demo Mode**
- `/county` → pick a county + role (if required)

### Demo Path

1. `/dashboard` (primary CTAs render)
2. `/ingest` → Preview → Publish (primary CTA flow)
3. `/calibration` → Simulate → Apply (primary CTA flow)
4. `/cockpit`:
   - hover tooltip stability
   - selection ring lock
   - lasso/box cursor intent
   - drawer count stability
5. Pilot + Trace drawers open (glass depth + "defensible spine")
6. `/ratio-studies` → Run Study modal (primary CTA)

### Pass/Fail Criteria

PASS if:

- no runtime overlays
- glass/CTAs consistent
- cockpit tooltip stable (no strobe/jitter)
- selection feedback clear and "locked"
- routes load

FAIL if:

- any route hard-crashes
- cockpit interaction flickers/strobes
- primary CTAs lose styling consistency
- obvious layout break

---

## 5) PR Ritual (feat → dev)

### PR requirements

- Title: clear scope (e.g., `feat(material): Phase 1A + 1B polish`)
- Description must include:
  - what changed
  - what did NOT change (e.g., "no logic changes")
  - how to verify (smoke steps)
  - risk assessment

### Merge

- Merge into `dev` after CI green + smoke pass.

---

## 6) Release PR Ritual (dev → main)

### Preconditions

- `dev` is clean and reproducible:
  - clean working tree
  - `pnpm lint` 0 errors
  - `pnpm build` success

### Create PR

- base: `main`
- compare: `dev`
- Title: `release: <short descriptor>`

### Merge Method

- Prefer **Merge commit** to preserve the evidence chain.

---

## 7) Post-Merge Verification (main)

Immediately after merge to `main`:

```bash
git checkout main
git pull
pnpm install
pnpm build
pnpm dev
```

Quick route sanity:

- `/dashboard`
- `/cockpit`
- `/ratio-studies`
- Pilot + Trace open

If anything fails: revert the merge commit.

---

## 8) Evidence Chain Template (paste into PR / release notes)

**Release Evidence**

- Feature branch micro-commits: `<N>` (each validated)
- `pnpm lint`: 0 errors (warnings: `<N>`, pre-existing)
- `pnpm build`: success
- Demo path: stable (Dashboard → Ingest → Calibration → Cockpit → Pilot/Trace → Ratio Studies)
- Merge method: merge commit (rollback-friendly)

---

## 9) Cleanup PRs (always separate)

Do not mix cleanup with release polish.

### Standard follow-ups

- `chore/lint-warnings-pass`: remove unused vars/imports, console rules
- `chore/deps-*`: dependency warnings and non-blocking noise
- `chore/tests-smoke`: add minimal Playwright route smoke (optional)

---

## 10) "Truth Clause"

We do not claim:

- that we visually inspected environments we did not open
- that a tool verified UI unless it actually rendered and was observed
- that "prod-ready" means security-ready (unless hardening is complete)

We claim only what the evidence proves.
