# V0 Scope Contract (WashingtonForge)

V0 is used ONLY for UI/UX spikes and interaction polish. VS Code + GitHub is the source of truth.

## Allowed paths

- components/cockpit/\*\*
- components/pilot/\*\*
- components/trace/\*\*
- components/material/\*\*
- lib/gis/\*\*
- styles/tokens.css
- app/cockpit/\*\* (only if needed for wiring UI shells)

## Forbidden

- lib/selection/\*\*
- lib/api/\*\*
- app routing, auth, build/tooling, configs
- package.json / deps (unless explicitly approved)

## Rules

- No new dependencies.
- Output patch-shaped changes only:
  - Provide full contents of ONLY changed files.
- No refactors.
- No logic changes outside cockpit/pilot/trace/map display wiring.
