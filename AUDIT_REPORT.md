# Washington Forge — Deep-Dive Audit Report

> **Scope note:** Washington Forge is a **separate project** from TerraFusion OS and the PACS modernization. This audit covers only `D:\WashingtonForge`.
>
> **Verification status legend** (per Runtime Verification Standard):
>
> - ✅ **Runtime-verified** — running app inspected, data visible
> - 🔲 **Code/test-verified** — tests pass, types clean, build green (safe to inspect, NOT safe to bless)
> - ❓ **Doc-claimed** — plan/code says it's done, not yet runtime-proven

---

## 1. Executive Summary

Washington Forge is a **Washington-state county assessor work surface** built on Next.js 16 (App Router) + React 19 + TypeScript. It presents a polished, production-shaped UI for parcel assessment workflows: a map "Cockpit," a 7-tab "Intelligent Data Suite," ratio studies, calibration, snapshots, audit, and an agentic "TerraPilot" tool layer with risk gating and an append-only trace.

**The single most important finding:** the entire application is a **high-fidelity demo**. There is **no real backend**. Every data path is simulated in-browser (mock fixtures, in-memory Maps, `localStorage`, fake delays, fake hashes). This is by design for the current pilot phase — but it is **hardcoded on**, not toggled by environment, which is the one structural risk that could mislead a stakeholder into believing live data is flowing.

**Bottom line:**

- Architecture and governance design are **genuinely strong** — the data-delivery contract, lineage, risk policy, and IAAO compliance engine are well-thought-out and well-tested at the contract level.
- The **demo/production boundary is the key gap**: `DEMO_MODE` is hardcoded `true`, so the real HTTP client is dead code and no env var can switch the app to live mode.
- Code quality is high: clean module boundaries enforced by ESLint, contract tests that pin critical invariants, and a frozen public API surface.

---

## 2. Technology Stack

| Layer           | Choice                                          | Notes                                         |
| --------------- | ----------------------------------------------- | --------------------------------------------- |
| Framework       | Next.js **16.0.10** (App Router)                | `typescript.ignoreBuildErrors=false` (strict) |
| UI              | React **19.2.0**, TypeScript **5.9.3**          |                                               |
| Styling         | Tailwind CSS **4**, Radix UI, shadcn/ui pattern | Custom `tf-glass` material classes            |
| Design tokens   | `styles/tokens.css`                             | TerraFusion 2026 Material Tokens              |
| Mapping         | maplibre-gl **5.17.0**                          | OSM raster + CartoDB dark-matter tiles        |
| Charts          | recharts 2.15.4                                 |                                               |
| Validation      | zod 3.25.76                                     |                                               |
| Testing         | Vitest 3, @testing-library/react, jsdom         |                                               |
| Package mgr     | pnpm (lockfile v9)                              | CI: pnpm 10 / Node 22                         |
| Local toolchain | Node **24.19.0** (Volta), pnpm **12.3.4**       | ⚠️ version skew vs CI                         |

**Version skew risk:** Local dev runs Node 24 / pnpm 12; CI runs Node 22 / pnpm 10. This is a real reproducibility hazard (see §9 Toolchain).

---

## 3. Architecture Overview

### 3.1 Module map

```
app/                      # Next.js App Router pages (thin wrappers)
  page.tsx                # Splash → /login (1.5s)
  login/ county/          # Auth + county/role selection
  dashboard/ cockpit/     # Main work surfaces
  data-suite/             # 7-tab Intelligent Data Suite (primary)
  ratio-studies/ calibration/ snapshots/ audit/ data-sources/
  ingest/ onboarding/     # HARD redirects → /data-suite?tab=...
  api/                    # Route handlers (notes, review-status, export, wa-fabric)

lib/
  api/                    # @deprecated compat SHIM (frozen surface, migration tracking)
  api-internal/           # Real client (api-client) + demo client + types
  data-suite/             # ★ Core: hub, repository, event-bus, storage, context
  wa-data/                # WA statewide parcel fabric + county status (demo)
  pilot/                  # TerraPilot: tools, executor, pii, risk policy
  compliance/             # IAAO compliance engine
  tenant/ selection/ audit/ notes/ review-status/
  fixtures/               # Canonical mock dataset
  map/                    # MapLibre styles + Benton County bounds
  governance/             # Stakeholder-launch contract test

components/
  app-shell.tsx           # Nav shell + CommandPalette + TraceFeed + PolicyDebug
  cockpit/ data-suite/ pilot/ trace/ material/ onboarding/ ratio-studies/ ...

docs/golive/              # Phase XXIV-A pilot governance package
__tests__/                # Contract + integration tests
```

### 3.2 The Data Suite (core)

`lib/data-suite/hub.ts` exposes `dataSuiteHub` — the **single entry point** for ingest/quality/versions/routing/audit. Pipeline:

```
Acquire → Fingerprint → Map → Validate → Join → Version → Publish → Route → Audit
```

**Four canonical data products** (`DATA_PRODUCTS`):

- `PARCEL_FABRIC`
- `COUNTY_ROLL`
- `SALES_STREAM`
- `BUILDINGS`

**Routing map** (product → subscribers):
| Product | Subscribers |
|---------|-------------|
| PARCEL_FABRIC | cockpit-map, comps-engine |
| COUNTY_ROLL | cockpit-map, comps-engine, ratio-studies, calibration, appeals |
| SALES_STREAM | comps-engine, ratio-studies, calibration |
| BUILDINGS | cockpit-map, comps-engine |

### 3.3 The Critical Delivery Contract ⭐

The most important invariant in the system, **pinned by `__tests__/data-plane.contract.test.ts`**:

> `routeToSubscribers()` must (1) **persist the RouteRecord FIRST**, (2) set the ActiveDatasetPointer, (3) **THEN** emit the event.

This guarantees that any subscriber reacting to a `routing.completed` event can always find a durable delivery receipt + active pointer. It is the difference between "an event fired" and "data was actually delivered and is readable." This is a genuinely correct design decision for an audit-grade system.

**Canonical read path for Cockpit:**

```ts
dataSuiteHub.getActiveDatasetForSubscriber("cockpit-map", countyFips, "COUNTY_ROLL");
```

Returns `null` if no data was delivered → Cockpit shows a `no_data` state. `__tests__/cockpit.integration.test.tsx` proves Cockpit reads from this path (not from a bypass).

### 3.4 Persistence (demo)

- `repository.ts` — `DemoRepository`: in-memory `Map`s + `localStorage` persistence.
- `storage.ts` — `localStorage`-backed, prefix `datasuite_`, version `v1`.
- `event-bus.ts` — in-process pub/sub (max 1000 events). Production intent: table-backed + worker.
- `initializeDemoCounty()` seeds Benton County with **random** parcel counts (~45,000 + random), versions, and route records for all 5 subscribers.

---

## 4. CRITICAL FINDINGS

### 🔴 F1 — `DEMO_MODE` is hardcoded `true` (highest priority)

`lib/api-internal/index.ts`:

```ts
export const DEMO_MODE = true; // ← HARDCODED
// The documented production path is NOT wired:
// export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
```

**Impact:**

- The app is **always** in demo mode, regardless of `NEXT_PUBLIC_DEMO_MODE`.
- `api-client.ts` (the real HTTP client, `API_BASE = NEXT_PUBLIC_API_URL || "/api"`) is **dead code** — never reached.
- A stakeholder flipping an env var to "go live" would see **no change** — a dangerous false sense of control.

**Recommendation:** Wire the documented env-driven expression. This is a one-line change but it is the single highest-leverage fix for the demo→production transition. (Note: `lib/api` is in the V0 forbidden-edit list, but `lib/api-internal/index.ts` is the actual location — confirm ownership before editing.)

### 🔴 F2 — The entire data layer is simulated

There is **no backend**. Every "real" operation is a browser-side simulation:

| Operation                                      | Reality                                                       |
| ---------------------------------------------- | ------------------------------------------------------------- |
| `login()`                                      | Returns `MOCK_USER` + `demo-token-${Date.now()}`              |
| `uploadDataset()`                              | Simulated row counts (15,000 base bulk / 1,500 base + random) |
| `validateDataset()`                            | Returns `MOCK_VALIDATION_RESULT` after 800ms                  |
| `detectFingerprint()`                          | **Filename-based** (not a real hash)                          |
| `validate()` (hub)                             | Random row counts, **always `isValid: true`**                 |
| `getQuality()` (hub)                           | **Random** joinMatchRate 0.94–0.99, hardcoded topIssues       |
| `getParcels()`                                 | Filters `MOCK_PARCELS` (5 parcels)                            |
| `runRatioStudy()`                              | Returns `MOCK_RATIO_STUDIES[0].results` after 1000ms          |
| `simulateCalibration()` / `applyCalibration()` | **Fake improvement** (hardcoded deltas)                       |
| Court-packet hash                              | `sha256:${Math.random()...}` — **not a real SHA-256**         |
| `generateParcelsForVersion()` (cockpit)        | Seeded-`Math.sin` random polygons                             |

**Impact:** Every number on screen (ratios, COD, PRD/PRB, quality scores, parcel counts) is **invented at render time**. This is acceptable for a UI/UX pilot, but it means **no metric in the app is trustworthy as a real measurement** until a backend exists.

**Recommendation:** Keep the simulation, but make the "simulated" nature **visually unambiguous** in every view (a persistent "DEMO DATA" banner, not just a dev-only `DataPlaneStatus`). The current `DataPlaneStatus` "receipt checker" is only shown when `NODE_ENV !== production` — in a production build the demo-ness disappears from view while the data is still fake. That inversion is the real risk.

### 🟠 F3 — Testing libraries in `dependencies`, not `devDependencies`

`package.json` lists `@testing-library/react`, `@testing-library/jest-dom`, `@vitejs/plugin-react` under `dependencies`. These ship to production bundle metadata and bloat install. **Packaging smell** — move to `devDependencies`. (Blocked by V0 scope on `package.json`; flag for a tooling task.)

### 🟠 F4 — `DataPlaneStatus` hidden in production

`app/cockpit/page.tsx` renders the data-plane "receipt checker" only when `NODE_ENV !== production`. Since the data is _always_ demo (F1/F2), the one component that would prove "this is simulated" is exactly the one that vanishes in a prod build. Invert the logic: show provenance status **always**, and let it report real delivery receipts once a backend exists.

### 🟡 F5 — Hardcoded identities

- `app/cockpit/page.tsx`: hardcoded user "Jane Doe, Assessor, Benton County."
- `app/data-suite/page.tsx`: hardcoded "Demo User, Assessor."
- `repository.ts` demo seed: `jane.assessor@county.gov`.

Fine for a demo, but these should flow from the (mock) auth session, not be string literals, so the audit trail is internally consistent.

### 🟡 F6 — `generateId()` uses `Date.now()` + random

`lib/wa-data/client.ts` `generateId()` is not collision-safe under concurrency. Comment already notes: use `crypto.randomUUID()` in production. (The notes/review-status stores already use `randomUUID()` — inconsistent.)

---

## 5. Governance & Pilot Design (strengths)

This is where the project is genuinely impressive.

### 5.1 TerraPilot (agentic tool layer) — `lib/pilot/`

- **Tool registry** with explicit `ToolRisk` tiers: `read_only` / `write_low` / `write_high` / `irreversible`.
- **Risk policy** (`defaultRiskPolicy`): read_only/write_low → no gate; write_high → confirm + reason code; irreversible → confirm + reason + **supervisor approval**.
- **RBAC via claims** + per-county tool allowlist + mode (pilot/muse) gating.
- **TerraTrace**: append-only, in-memory event log with `correlationId`, actor, risk, reason code, supervisor ref, and **PII redaction** (`pii.ts` strips SSN/email/phone before logging).
- **Executor** simulates async execution and emits `tool_invoked/succeeded/failed`, `permission_denied`, `policy_blocked` events.
- **PolicyDebugDrawer** lets an operator see _exactly why_ a tool would be blocked (mode/allowlist/RBAC/policy) — excellent for auditability.

### 5.2 IAAO Compliance Engine — `lib/compliance/`

- `computeComplianceStatus(value, min, max, warningBuffer)` → compliant / warning / non-compliant.
- `computeCODCompliance`, `evaluateCompliance` (ratio/COD/PRD/PRB, **worst-of-all** overall), `evaluateRatioStudyCompliance`, `evaluateDatasetCompliance`.
- Thresholds: residential & commercial IAAO sets (ratio 0.90–1.10, COD ≤15/20, PRD 0.98–1.03, PRB ±0.05).
- Maps to semantic UI tokens (`equity-fair` / `yellow-400` / `equity-regressive`).

### 5.3 Tenant boundary — `lib/tenant/`

- `TenantProvider` enforces **county-scoped** operations; `assertTenant()` throws `TenantBoundaryError` if not initialized. Prevents cross-county data bleed.

### 5.4 Go-live governance package — `docs/golive/`

- **Phase XXIV-A pilot package** (CONFIDENTIAL).
- **5 stop conditions** (STOP-001…STOP-005) with defined responses (safe mode, block writes, freeze+audit).
- **Dual approval** (`REQUIRED_APPROVALS=2`).
- **KPI thresholds**: 14-day pilot, MTTR ≤30min, rollback ≥95%, availability ≥99.5%, DR ≤90 days.
- **14 exit gates** weighted: Operational 40%, Compliance 30%, Documentation 15%, Approval 15%.
- **War-room cadence** (08:00/12:00/16:00 PT), escalation timing (P0 15min → P3 24hr).
- **Pilot selection template**: readiness scoring (Data Quality 30%, Technical 25%, Staff 20%, Executive 15%, Historical 10%), ≥85 = Eligible.
- **Contract test** (`lib/governance/stakeholder-launch.contract.test.ts`) **validates the docs themselves** — required approvals, stop-condition codes, KPI thresholds, and PII-leak patterns (`/sha256:[a-z0-9_]+/` clean; SSN/email/phone leak patterns). This is an unusual and excellent practice: the governance documents are test-asserted, not just prose.

---

## 6. Module Boundary Discipline (strength)

`eslint.config.mjs` encodes **PERMANENT DATA SUITE BOUNDARY RULES**:

- `data-suite` **cannot** import `lib/api` (prevents a cycle).
- `lib/api` **cannot** deep-import `api-internal` (barrel only).

`lib/api/index.ts` is a **`@deprecated` compatibility shim** with:

- `ENFORCE_NO_LEGACY_API` kill switch.
- **Migration tracking**: `callRecords` Map, mutator classification, call-site hashing, `deprecated.api_call` events.
- `getMigrationReport()`, `assertNoLegacyMutators()` (CI assertion), `isReadyToRemoveMutators()`.

`__tests__/api-shim.exports.test.ts` **freezes the public surface** of `@/lib/api` (allowlist → blacklist → regex backstop). This is a mature API-evolution strategy: the old surface is pinned so consumers can migrate safely, and a CI assertion gates removal.

---

## 7. Test Coverage

| Test                                                 | Proves                                                                                   |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `__tests__/data-plane.contract.test.ts`              | Routing persists RouteRecord **before** emitting events (the Critical Delivery Contract) |
| `__tests__/api-shim.exports.test.ts`                 | `@/lib/api` public surface is frozen (no accidental additions/removals)                  |
| `__tests__/cockpit.integration.test.tsx`             | Cockpit reads from the **canonical** data path (not a bypass)                            |
| `lib/governance/stakeholder-launch.contract.test.ts` | `docs/golive/` structure, approvals, stop codes, KPIs, PII patterns                      |

**Assessment:** The tests target the **right invariants** (delivery ordering, API stability, canonical read path, governance doc integrity). This is contract-first testing, not coverage-chasing. **Gap:** there are no tests for the compliance engine math, the pilot risk-policy guard, or the PII redactor — all pure functions that are trivially testable and high-value. (See §10 Recommendations.)

`__tests__/setup.ts` mocks `localStorage`, `window`, and `crypto.randomUUID` for jsdom.

---

## 8. Security Observations

- **PII redaction** in TerraTrace (`pii.ts`) is a genuine control — SSN/email/phone stripped before trace logging. Good.
- **No real auth**: `login()` issues `demo-token-${Date.now()}`. There is no token validation, no session, no real RBAC enforcement server-side (it's all in-browser). Acceptable for demo; **must not** be the production auth model.
- **No real hashing**: court-packet "certifications" use `Math.random()`-based fake SHA-256. For a court-ready export this is a **correctness** problem, not just a demo gap — a real deployment must compute actual hashes.
- **`localStorage` persistence** of data-suite state: fine for demo, but means data is per-browser and not durable/shared. Production needs a real store.
- **No secrets in repo** observed. Env vars are public (`NEXT_PUBLIC_*`) and non-sensitive.

---

## 9. Toolchain & Environment

### 9.1 Install (resolved this session)

- **Root cause of install failure:** pnpm 12.3.4 was not reading `node-linker` from user `.npmrc` on Windows → symlink failures. **Fix:** `--config.node-linker=hoisted`.
- **Flaky large-file download:** the SWC binary (`@next/swc-win32-x64-msvc`, 44.96 MB) repeatedly timed out. **Fix:** aggressive fetch retries, then a **direct download from the npm registry** and manual placement into `node_modules/@next/swc-win32-x64-msvc/` (143.98 MB `.node` file). ✅ SWC now present.
- **`ERR_PNPM_IGNORED_BUILDS` (exit 1):** pnpm 12 blocks postinstall scripts by default (supply-chain guard). Affected: `esbuild@0.27.2`, `sharp@0.34.5`, `unrs-resolver@1.11.1`. **Assessment:** NOT a real failure — the binaries are present and functional. The exit code 1 is pnpm refusing to run 3 postinstall verifications. Safe to ignore for test/lint/build. (To silence: `pnpm approve-builds` or `pnpm.onlyBuiltDependencies` — but the latter requires a `package.json` edit, blocked by V0 scope.)

### 9.2 Version skew (risk)

Local: **Node 24.19.0 / pnpm 12.3.4**. CI: **Node 22 / pnpm 10**. The install quirks hit this session are a direct symptom of the pnpm 10→12 gap. Recommend pinning local to match CI (Volta can pin Node; add a `packageManager` field or `.npmrc` for pnpm) to make "works on my machine" = "works in CI."

---

## 10. Recommendations (prioritized)

| #   | Priority | Action                                                                                                          | Effort             |
| --- | -------- | --------------------------------------------------------------------------------------------------------------- | ------------------ |
| 1   | 🔴 High  | Wire `DEMO_MODE` to `NEXT_PUBLIC_DEMO_MODE` (F1)                                                                | 1 line             |
| 2   | 🔴 High  | Make "simulated data" **always** visible (invert `DataPlaneStatus` gating, F2/F4)                               | Small              |
| 3   | 🟠 Med   | Move testing libs to `devDependencies` (F3) — tooling task                                                      | Trivial            |
| 4   | 🟠 Med   | Add unit tests for compliance math, pilot risk guard, PII redactor                                              | Small              |
| 5   | 🟠 Med   | Replace fake SHA-256 with real hashing in court-packet path (backend task)                                      | Med                |
| 6   | 🟡 Low   | Flow user identity from mock auth session instead of literals (F5)                                              | Small              |
| 7   | 🟡 Low   | Standardize ID generation on `crypto.randomUUID()` (F6)                                                         | Trivial            |
| 8   | 🟡 Low   | Pin local Node/pnpm to CI versions (Volta + `packageManager`)                                                   | Trivial            |
| 9   | 🟢 Info  | Plan the demo→production data-plane: real repository, table-backed event bus, real fingerprint/validate/quality | Large (next phase) |

---

## 11. Verification Log (filled as checks complete)

| Check               | Command                             | Status                | Result                                                                                                                                                    |
| ------------------- | ----------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit/contract tests | `node_modules\.bin\vitest.cmd run`  | 🔲 code/test-verified | **199/199 passed** across 6 files (stakeholder-launch 117, api-shim 45, notes 11, review-status 11, cockpit.integration 7, data-plane.contract 8). 30.2s. |
| Lint                | `node_modules\.bin\eslint.cmd .`    | 🔲 code/test-verified | **0 errors, 120 warnings** (all `no-unused-vars` / `no-console`).                                                                                         |
| Build               | `node_modules\.bin\next.cmd build`  | 🔲 code/test-verified | **Exit 0.** 19 routes: 15 static, 4 dynamic (`/api/export/court-packet`, `/api/notes`, `/api/review-status`, `/api/wa-fabric`).                           |
| Runtime (browser)   | `next start -p 3000` → browser walk | ✅ runtime-verified   | See evidence below.                                                                                                                                       |

### Runtime evidence (production build, `next start`, 2026-10-19)

| Surface          | Observed                                                                                                                                                                                                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/login`         | Renders. "Enter Demo Mode" path works (confirms F1: demo is the only viable entry).                                                                                                                                                                                                                                  |
| `/county`        | 10 WA counties with mock parcel counts (Benton 87,420 … King 542,000). Role picker (Admin/Assessor/Analyst/Viewer). "Setting up workspace…" fake delay observed.                                                                                                                                                     |
| `/dashboard`     | **Benton County Dashboard, Roll Year 2024, `v1 (dv-2024-001)`**: 87,420 parcels, $12.46B assessed, median ratio 0.965, COD 12.4%, equity distribution 72/18/10, PRD 1.020, PRB −0.008. All mock.                                                                                                                     |
| `/cockpit`       | Maplibre map renders over **real OSM tiles** (Benton City, WA). Filter panel functional. Version badge `v-1792427560` = **timestamp-based version (runtime proof of F6)**. "50 parcels loaded" (mock subset of claimed 42,800). **`DataPlaneStatus` absent from DOM in production build — F4 confirmed at runtime.** |
| `/data-suite`    | Hub renders: Data Readiness 75%, Fabric 53,595 / Roll 42,158 / Sales 2,842 records, 7 tabs, capability links. All mock.                                                                                                                                                                                              |
| `/ratio-studies` | 3 mock studies (2024 Residential 0.965/12.4%, 2024 Commercial 0.920/18.2%, 2023 Comprehensive 0.945/13.8%), PDF/Excel export buttons.                                                                                                                                                                                |
| API routes       | `/api/notes`, `/api/review-status`, `/api/wa-fabric` → 400 on GET (POST-only, live). `/api/export/court-packet` → 200, returns template catalog (boe_appeal, ratio_study, full_defense).                                                                                                                             |

> Per the Runtime Verification Standard: the app is now **runtime-verified** — the running app was inspected and its (mock) data is visible. What is verified is that **the UI works and the data is simulated**, not that any real data plane exists (F2). Merge/release remains a founder decision.

---

## 12. V0 Scope Compliance

`V0_SCOPE.md` restricts work to **UI/UX spikes** in: `components/cockpit`, `components/pilot`, `components/trace`, `components/material`, `lib/gis`, `styles/tokens.css`, `app/cockpit`.

**Forbidden:** `lib/selection`, `lib/api`, app routing/auth/build/tooling/configs, `package.json`/deps.

This audit is **read-only** — no source files were modified. The only writes this session were:

- Tooling fixes at the **user level** (pnpm CLI flags, SWC binary into `node_modules`) — no repo file touched.
- This report (`AUDIT_REPORT.md`) — a new documentation deliverable, not a code change.

All recommendations that touch forbidden paths (F1 `lib/api-internal`, F3 `package.json`) are **flagged for ownership assignment**, not executed.
