# TerraFusion AI Copilot Operating Manual

This document defines the invariants, constraints, and rules of engagement for AI-assisted development on TerraFusion.

---

## 🔒 TerraFusion Invariants (Prototype-Safe)

These rules are **non-negotiable**. Any AI-generated code must preserve them:

### 1. Tenant Boundary Isolation

- **No cross-county data mixing** — `countyId` is required in all reads/writes
- Tenant context must flow through all API calls
- Never hardcode county IDs or assume single-tenant mode

### 2. TerraPilot Gating

- RBAC + allowlist split must remain intact
- Feature flags gate experimental tools
- Policy checks happen at executor level, not UI level

### 3. TerraTrace Append-Only

- Trace records are **immutable** once written
- Emit `invoked`, `succeeded`, and `failed` events consistently
- **Trace payloads must be PII-safe** — sanitize summaries before logging
- Never delete or modify existing trace entries

### 4. Demo Mode Resilience

- **Demo mode never crashes** if API endpoints are missing
- Gracefully degrade with fixture data
- No HTML → JSON parse errors (handle non-JSON responses)
- Loading states must be visible and consistent

---

## 📋 Copilot Rules of Engagement

### Before Making Changes

1. **"Change only these files"** — Always specify exact file paths
2. **Read context first** — Understand the component/module before editing
3. **Check for existing patterns** — Follow established conventions in the codebase

### File Organization

| Change Type      | Location             |
| ---------------- | -------------------- |
| Types/interfaces | `/lib/.../types.ts`  |
| API calls        | `/lib/api/...`       |
| UI components    | `/components/...`    |
| Shared utilities | `/lib/utils.ts`      |
| Feature logic    | `/lib/<feature>/...` |

### Testing Requirements

Tests are **required** for any changes touching:

- ✅ Tenant boundary logic
- ✅ RBAC/gating/policy checks
- ✅ Trace emission
- ✅ Data validation

### Styling Rules

- Use design system tokens from `globals.css`
- Prefer semantic wrappers (`GlassCard`, `MatteCard`, `SignalBadge`) over raw Tailwind
- Respect `prefers-reduced-motion` for animations
- Dark mode is the default — ensure contrast ratios

---

## 🎯 Prompt Patterns That Work

### A) Styling Task (No Logic Changes)

```
Update only these files: X, Y, Z.
No logic changes.
Replace inline Tailwind with GlassCard/MatteCard wrappers.
Must preserve props/state.
Must respect prefers-reduced-motion.
```

### B) Gating/Trace Task

```
Update only executor/tools.
Add tests.
Must keep RBAC+allowlist split.
Must emit invoked+succeeded/failed.
Must sanitize summaries.
```

### C) UI Component Task

```
Update only component file.
Do not add routes.
Do not touch API calls.
Keep types stable.
```

### D) API Integration Task

```
Update only lib/api/<feature>.ts.
Add proper error handling for non-JSON responses.
Include loading/error states in the hook.
Must pass countyId in all requests.
```

---

## 🚫 Anti-Patterns to Avoid

| ❌ Don't                                | ✅ Do Instead                         |
| --------------------------------------- | ------------------------------------- |
| Hardcode `countyId: "benton"`           | Use `useCounty()` hook or context     |
| `catch (e) { console.log(e) }`          | Proper error boundary + user feedback |
| Parse response as JSON without checking | Check `content-type` header first     |
| Add new routes without loading states   | Always include `loading.tsx`          |
| Mix feature logic into UI components    | Extract to `/lib/<feature>/`          |
| Delete trace records                    | Append new status events instead      |

---

## 📁 Branch Naming Convention

| Prefix      | Purpose        | Example                     |
| ----------- | -------------- | --------------------------- |
| `feat/`     | New feature    | `feat/material-system-pass` |
| `fix/`      | Bug fix        | `fix/trace-emission-gap`    |
| `chore/`    | Tooling/config | `chore/add-prettier`        |
| `refactor/` | Code cleanup   | `refactor/api-layer`        |
| `docs/`     | Documentation  | `docs/api-reference`        |

---

## ✅ PR Checklist

Before submitting a PR, verify:

- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
- [ ] No console errors in browser
- [ ] Demo mode still works
- [ ] Types are properly defined
- [ ] Loading/error states handled
- [ ] Trace events emit correctly (if applicable)
- [ ] CountyId flows through all data access

---

## 🏗️ Architecture Quick Reference

```
app/                    # Next.js App Router pages
├── (routes)/           # Feature routes
│   ├── page.tsx        # Route component
│   └── loading.tsx     # Suspense fallback

components/
├── ui/                 # Design system primitives
├── <feature>/          # Feature-specific components
└── pilot/              # TerraPilot components

lib/
├── api/                # API client functions
├── <feature>/          # Feature logic/hooks
├── tenant/             # Multi-tenancy utilities
└── utils.ts            # Shared utilities

docs/                   # Documentation
```

---

_Last updated: 2026-02-02_
