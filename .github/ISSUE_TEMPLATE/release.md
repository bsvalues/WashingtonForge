---
name: Release Checklist
about: Track a release from dev → main using TerraFusion Release Ritual
title: "release: [short descriptor]"
labels: release
assignees: ""
---

## Release Overview

<!-- Brief summary of what's included in this release -->

**Release scope:**

- **Target release date:**

- ***

## Pre-Release Checklist (on `dev`)

### Branch Health

- [ ] `dev` branch has clean working tree (`git status`)
- [ ] `dev` is up to date with remote (`git pull origin dev`)

### Quality Gate

- [ ] `pnpm lint` → 0 errors
- [ ] `pnpm build` → success
- [ ] All CI checks pass (if configured)

### Evidence Chain

- [ ] Feature branch micro-commits: `<N>` (each validated)
- [ ] Warnings tracked: `<N>` (all pre-existing, none introduced)
- [ ] Demo path validated (see smoke test below)

---

## Smoke Test (90-Second Demo Path)

### Launch

- [ ] `pnpm dev` starts successfully
- [ ] `http://localhost:3000` loads without runtime overlays

### Demo Path

- [ ] `/login` → Enter Demo Mode works
- [ ] `/county` → County + role selection works
- [ ] `/dashboard` → Primary CTAs render with consistent styling
- [ ] `/ingest` → Preview → Publish flow stable
- [ ] `/calibration` → Simulate → Apply flow stable
- [ ] `/cockpit`:
  - [ ] Hover tooltip stable (no strobe)
  - [ ] Selection ring locks on selected parcels
  - [ ] Cursor changes to crosshair in lasso/box mode
  - [ ] Drawer count uses tabular-nums and transitions smoothly
- [ ] Pilot + Trace drawers open with strong glass depth
- [ ] `/ratio-studies` → Run Study modal renders with primary CTA

### Pass/Fail

- [ ] ✅ PASS: No runtime errors, routes stable, interactions smooth
- [ ] ❌ FAIL: (describe what failed and block merge)

---

## Release PR

### PR Creation

- [ ] Created PR: dev → main
- [ ] PR title: `release: [descriptor]`
- [ ] PR description includes:
  - [ ] What changed
  - [ ] What did NOT change
  - [ ] Evidence chain (build/lint/smoke results)
  - [ ] Risk assessment

### PR Link

<!-- Paste PR URL here -->

- PR: #

---

## Merge Execution

### Merge Settings

- [ ] Merge method: **Merge commit** (preferred for audit trail)
- [ ] Base: `main`
- [ ] Compare: `dev`

### Merge

- [ ] PR #\_\_\_ merged to `main`
- [ ] Merge commit SHA: `<sha>`

---

## Post-Merge Verification (on `main`)

### Checkout & Build

- [ ] `git checkout main`
- [ ] `git pull origin main`
- [ ] `pnpm install` (refresh deps)
- [ ] `pnpm build` → success

### Quick Sanity Routes

- [ ] `/dashboard` loads
- [ ] `/cockpit` loads
- [ ] `/ratio-studies` loads
- [ ] Pilot + Trace drawers open

### Rollback Plan (if needed)

- [ ] If verification fails: `git revert <merge-commit-sha>`
- [ ] Rollback executed: (leave blank if not needed)

---

## Post-Release Cleanup PRs

### Scheduled Follow-ups

- [ ] `chore/lint-warnings-pass` → Remove unused imports/vars, fix console rules
- [ ] `chore/deps-*` → Address dependency warnings (if needed)
- [ ] `chore/tests-smoke` → Add Playwright smoke tests (optional)

---

## Evidence Summary (paste into PR/release notes)

**Release Evidence**

- Feature branch micro-commits: `<N>` (each validated)
- `pnpm lint`: 0 errors (warnings: `<N>`, pre-existing)
- `pnpm build`: success
- Demo path: stable (Dashboard → Ingest → Calibration → Cockpit → Pilot/Trace → Ratio Studies)
- Merge method: merge commit (rollback-friendly)
- Merge commit: `<sha>`

---

**TerraFusion Release Ritual**: Observable. Reversible. Demoable. Auditable.
See [RELEASE_RITUAL.md](../../docs/RELEASE_RITUAL.md) for full workflow.
