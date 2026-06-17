# WashingtonForge

Washington State county assessor work surface — parcel review, valuation, and ratio study tooling.

## Local setup

**Prerequisites:** Node.js 20+, pnpm 10+

```bash
# 1. Install dependencies
pnpm install

# 2. Create your local env file
cp .env.example .env.local
# Edit .env.local if you need to point at a real backend (see comments inside)

# 3. Start the dev server
pnpm dev
# → http://localhost:3000
```

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | _(empty — uses local API routes)_ | Backend API base URL |
| `NEXT_PUBLIC_APP_VERSION` | `dev` | Version string in audit events |
| `NEXT_PUBLIC_DEMO_MODE` | `false` | Use demo data instead of real API |
| `ENFORCE_NO_LEGACY_API` | `false` | Throw on deprecated `@/lib/api` shim calls (CI use) |

Set `NEXT_PUBLIC_DEMO_MODE=true` when working without a running backend.

## Development commands

```bash
pnpm dev          # Next.js dev server (port 3000)
pnpm build        # Production build — requires clean type-check
pnpm lint         # ESLint (must reach 0 errors before merge)
pnpm test         # Vitest — governance + contract tests
pnpm test:run     # Same, non-watch mode
```

## Architecture notes

- **Data layer** — all reads and writes go through `dataSuiteHub` in `lib/data-suite/hub.ts`. Do not import from `@/lib/api` in new code; that module is a deprecated shim tracked for burn-down.
- **Types** — canonical types live in `lib/wa-data/types.ts`. `lib/data-suite/types.ts` re-exports from there and adds IDS-specific types.
- **Governance docs** — `docs/golive/` contains the Phase XXIV-A pilot package. Contract tests in `lib/governance/` enforce their content.
- **V0 scope** — see `V0_SCOPE.md`. UI spikes are allowed only in `components/cockpit/`, `components/pilot/`, `components/trace/`, `components/material/`, and `lib/gis/`.
