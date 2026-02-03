# TerraFusion Pilot Status Dashboard Guide

> **Classification:** INTERNAL — Operations Reference  
> **Version:** 1.0.0  
> **Generated:** 2026-02-03  
> **Content Hash:** `sha256:dashboard_guide_v1`  
> **Audience:** Pilot Coordinators, War Room Operators, Agency Leadership

---

## 1. Dashboard Overview

The Pilot Status Dashboard provides real-time visibility into pilot operations. This guide explains how to read and interpret each panel.

### 1.1 Dashboard Access

| Role | Access Level | URL |
|------|--------------|-----|
| Pilot Coordinator | Full | `/cockpit?view=pilot-status` |
| Agency Leadership | Summary | `/dashboard?view=executive` |
| War Room Operator | Full | `/cockpit?view=war-room` |
| Auditor | Read-only | `/audit?view=pilot` |

---

## 2. Readiness Panel

### 2.1 Panel Location
Top-left quadrant of the dashboard.

### 2.2 Indicators

| Indicator | Green | Yellow | Red |
|-----------|-------|--------|-----|
| **System Health** | All services operational | Degraded performance | Critical failure |
| **Data Freshness** | < 24 hours | 24-72 hours | > 72 hours |
| **Compliance Status** | All metrics in range | Warning thresholds | Breach detected |
| **Dual Approval Queue** | 0 pending | 1-3 pending | > 3 pending |

### 2.3 Reading the Readiness Score

```
┌─────────────────────────────────────┐
│  PILOT READINESS                    │
│  ████████████████████░░░░  85%      │
│                                     │
│  ✓ System Health      [GREEN]       │
│  ✓ Data Freshness     [GREEN]       │
│  ⚠ Compliance Status  [YELLOW]      │
│  ✓ Approval Queue     [GREEN]       │
└─────────────────────────────────────┘
```

**Interpretation:**
- **85%+**: Proceed with normal operations
- **70-84%**: Review yellow indicators before critical actions
- **<70%**: Halt non-essential operations, escalate to War Room

---

## 3. Exception Panel

### 3.1 Panel Location
Top-right quadrant of the dashboard.

### 3.2 Exception Categories

| Category | Description | Severity |
|----------|-------------|----------|
| **STOP** | Stop condition triggered | Critical |
| **BREACH** | Compliance threshold exceeded | High |
| **ALERT** | Approaching threshold | Medium |
| **INFO** | Notable event, no action needed | Low |

### 3.3 Exception Card Format

```
┌─────────────────────────────────────┐
│ ⚠ ALERT — COD Approaching Threshold │
│                                     │
│ Current: 14.2%   Threshold: 15.0%   │
│ Trend: ↑ (+0.3% from yesterday)     │
│                                     │
│ Affected: Neighborhood sha256:nb_03 │
│ Recommended: Review calibration     │
│                                     │
│ [Acknowledge]  [Escalate]  [Snooze] │
└─────────────────────────────────────┘
```

### 3.4 Exception Actions

| Action | Effect |
|--------|--------|
| **Acknowledge** | Marks as seen, remains in log |
| **Escalate** | Creates War Room ticket |
| **Snooze** | Hides for 4 hours (max 2x) |
| **Resolve** | Closes with resolution note |

---

## 4. Stop Watch Panel

### 4.1 Panel Location
Center of the dashboard.

### 4.2 Stop Condition Indicators

```
┌─────────────────────────────────────────────────────┐
│  STOP CONDITION MONITOR                             │
│                                                     │
│  STOP-001  Availability    ████████████  99.7%  ✓  │
│  STOP-002  MTTR            ████████░░░░  18 min ✓  │
│  STOP-003  Rollback        ████████████  100%   ✓  │
│  STOP-004  DR Freshness    ████████████  14d    ✓  │
│  STOP-005  Compliance      ████████████  PASS   ✓  │
│                                                     │
│  All stop conditions: NORMAL                        │
└─────────────────────────────────────────────────────┘
```

### 4.3 Stop Condition Thresholds

| Code | Metric | Warning | Trigger |
|------|--------|---------|---------|
| STOP-001 | Availability | < 99.7% | < 99.5% for 15 min |
| STOP-002 | MTTR | > 25 min | > 30 min |
| STOP-003 | Rollback Success | < 97% | < 95% |
| STOP-004 | DR Freshness | > 60 days | > 90 days |
| STOP-005 | Compliance | WARNING state | BREACH state |

### 4.4 Triggered Stop Condition Display

```
┌─────────────────────────────────────────────────────┐
│  🔴 STOP CONDITION TRIGGERED                        │
│                                                     │
│  STOP-002: MTTR Exceeded                            │
│  Current MTTR: 34 minutes                           │
│  Threshold: 30 minutes                              │
│                                                     │
│  Triggered: 2026-02-03T14:22:00Z                    │
│  Duration: 12 minutes                               │
│                                                     │
│  SAFE MODE ACTIVE — New deployments blocked         │
│                                                     │
│  [View Incident]  [War Room]  [Resolve]             │
└─────────────────────────────────────────────────────┘
```

---

## 5. DR Freshness Panel

### 5.1 Panel Location
Bottom-left quadrant of the dashboard.

### 5.2 Freshness Timeline

```
┌─────────────────────────────────────────────────────┐
│  DISASTER RECOVERY STATUS                           │
│                                                     │
│  Last Backup: 2026-01-20T02:00:00Z                  │
│  Freshness: 14 days                                 │
│  Next Scheduled: 2026-02-03T02:00:00Z               │
│                                                     │
│  ├────────────────────────────────────────────┤     │
│  0d            30d            60d           90d     │
│  ▲ Current (14d)                        ▲ Limit    │
│                                                     │
│  Status: COMPLIANT                                  │
│  Last Validation: PASS (2026-01-20T04:15:33Z)       │
└─────────────────────────────────────────────────────┘
```

### 5.3 DR Status Colors

| Days Since Backup | Status | Color |
|-------------------|--------|-------|
| 0-30 | Optimal | Green |
| 31-60 | Acceptable | Green |
| 61-75 | Aging | Yellow |
| 76-89 | Warning | Orange |
| 90+ | BREACH | Red |

---

## 6. KPI Metrics Panel

### 6.1 Panel Location
Bottom-right quadrant of the dashboard.

### 6.2 KPI Cards

```
┌─────────────────────────────────────────────────────┐
│  PILOT KPI METRICS (14-Day Window)                  │
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐│
│  │ MTTR    │  │ ROLLBACK│  │ AVAIL   │  │ DR FRESH││
│  │ 18 min  │  │ 100%    │  │ 99.7%   │  │ 14 days ││
│  │ ≤30 min │  │ ≥95%    │  │ ≥99.5%  │  │ ≤90 days││
│  │ ✓ PASS  │  │ ✓ PASS  │  │ ✓ PASS  │  │ ✓ PASS  ││
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘│
│                                                     │
│  Pilot Day: 7 of 14                                 │
│  Exit Gates Passed: 11 of 14                        │
└─────────────────────────────────────────────────────┘
```

### 6.3 KPI Definitions

| KPI | Definition | Calculation |
|-----|------------|-------------|
| **MTTR** | Mean Time to Recovery | Average time from incident detection to resolution |
| **Rollback Success** | Deployment rollback rate | Successful rollbacks / Attempted rollbacks |
| **Availability** | System uptime percentage | Uptime minutes / Total minutes |
| **DR Freshness** | Days since last validated backup | Current date - Last backup date |

---

## 7. IAAO Compliance Panel

### 7.1 Panel Location
Secondary tab: "Compliance Details"

### 7.2 Compliance Gauges

```
┌─────────────────────────────────────────────────────┐
│  IAAO COMPLIANCE METRICS                            │
│                                                     │
│  Median Ratio          COD                          │
│  ┌───────────┐        ┌───────────┐                 │
│  │   0.982   │        │   12.4%   │                 │
│  │ 0.90-1.10 │        │  ≤15.0%   │                 │
│  │  ✓ PASS   │        │  ✓ PASS   │                 │
│  └───────────┘        └───────────┘                 │
│                                                     │
│  PRD                   PRB                          │
│  ┌───────────┐        ┌───────────┐                 │
│  │   1.01    │        │  -0.02    │                 │
│  │ 0.98-1.03 │        │ ±0.05     │                 │
│  │  ✓ PASS   │        │  ✓ PASS   │                 │
│  └───────────┘        └───────────┘                 │
│                                                     │
│  Overall: COMPLIANT                                 │
└─────────────────────────────────────────────────────┘
```

### 7.3 Compliance Status Meanings

| Status | Visual | Meaning |
|--------|--------|---------|
| COMPLIANT | Green check | All metrics within IAAO standards |
| WARNING | Yellow triangle | One or more metrics approaching threshold |
| NON-COMPLIANT | Red X | One or more metrics exceed threshold |

---

## 8. Quick Reference Card

### 8.1 Daily Checklist

| Time | Action | Dashboard Panel |
|------|--------|-----------------|
| 08:00 | Review overnight exceptions | Exception Panel |
| 08:15 | Verify system readiness | Readiness Panel |
| 08:30 | Check stop condition status | Stop Watch Panel |
| 12:00 | Midday KPI review | KPI Metrics Panel |
| 17:00 | End-of-day compliance check | Compliance Panel |
| 17:30 | Acknowledge all exceptions | Exception Panel |

### 8.2 Escalation Triggers

| Condition | Action | Contact |
|-----------|--------|---------|
| Any RED indicator | Escalate immediately | War Room hotline |
| 3+ YELLOW indicators | Review within 1 hour | Pilot Coordinator |
| Stop condition triggered | Activate safe mode | War Room lead |
| Compliance breach | Freeze operations | Agency Director |

---

_This guide is part of the Phase XXIV-B Stakeholder & Audit Launch Package._
