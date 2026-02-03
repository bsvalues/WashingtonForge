## Summary

<!-- Brief description of what this PR does -->

## Type

- [ ] `feat`: New feature or enhancement
- [ ] `fix`: Bug fix
- [ ] `chore`: Maintenance, refactor, deps, lint
- [ ] `docs`: Documentation only
- [ ] `release`: Release PR (dev → main)

## Scope

<!-- What changed (e.g., material system, cockpit UX, pilot logic) -->

## What Changed

<!-- List specific changes -->

-
-
-

## What Did NOT Change

<!-- Explicitly state what was untouched (e.g., "no logic changes", "no API contract changes") -->

-

## Risk Assessment

- [ ] **Low risk**: styling/tokens/wrappers only, no logic mutation
- [ ] **Medium risk**: new component, refactor with tests
- [ ] **High risk**: core logic change, API contract change, migration

## Evidence Chain

### Build & Lint

- [ ] `pnpm lint` passes (0 errors)
- [ ] `pnpm build` succeeds
- [ ] Warnings tracked (if new warnings introduced, explain)

### Smoke Test (90-second demo path)

- [ ] `/login` → Demo Mode works
- [ ] `/dashboard` → Primary CTAs render
- [ ] `/ingest` → Preview → Publish flow stable
- [ ] `/calibration` → Simulate → Apply flow stable
- [ ] `/cockpit` → Hover tooltip stable, selection ring locks, cursor intent works, drawer count smooth
- [ ] Pilot + Trace drawers open (glass depth visible)
- [ ] `/ratio-studies` → Run Study modal works

### Commit Discipline

- [ ] Micro-commits used (one intent per commit)
- [ ] Each commit validated with lint + build before committing

## How to Verify

<!-- Step-by-step instructions for reviewer to validate changes -->

1.
2.
3.

## Rollback Plan

<!-- How to revert if this causes issues -->

- [ ] This PR can be cleanly reverted
- [ ] Revert command: `git revert <commit-sha>`

## Related Issues

<!-- Link to related issues, if any -->

Closes #

## Screenshots (if applicable)

<!-- Paste screenshots of UI changes, especially for material/UX work -->

---

**TerraFusion Principles**: Truth over theatre. Micro-commits. Layer separation. Evidence chain. Merge points matter.
