# TerraFusion War Room Cadence

> **Classification:** INTERNAL — Operations Reference  
> **Version:** 1.0.0  
> **Generated:** 2026-02-03  
> **Content Hash:** `sha256:war_room_v1`  
> **Phase:** XXIV-A (Sealed)  
> **Dual Approval Required:** Yes (`REQUIRED_APPROVALS=2`)

---

## 1. Daily War Room Schedule

### 1.1 Standard Timing

| Time (PT) | Time (ET) | Duration | Purpose                     |
| --------- | --------- | -------- | --------------------------- |
| 08:00     | 11:00     | 30 min   | Daily standup               |
| 12:00     | 15:00     | 15 min   | Midday check (optional)     |
| 16:00     | 19:00     | 15 min   | End-of-day wrap (as needed) |

### 1.2 Escalation Timing

| Severity      | Response Window | War Room Activation |
| ------------- | --------------- | ------------------- |
| P0 (Critical) | 15 minutes      | Immediate           |
| P1 (High)     | 1 hour          | Within 30 min       |
| P2 (Medium)   | 4 hours         | Next scheduled      |
| P3 (Low)      | 24 hours        | Async               |

---

## 2. 7-Step Daily Agenda

### Step 1: Stop Condition Review (3 min)

**Owner:** Technical Lead

| Check                 | Status                       | Notes |
| --------------------- | ---------------------------- | ----- |
| STOP-001 Availability | [ ] Green [ ] Yellow [ ] Red |       |
| STOP-002 MTTR         | [ ] Green [ ] Yellow [ ] Red |       |
| STOP-003 Rollback     | [ ] Green [ ] Yellow [ ] Red |       |
| STOP-004 DR Freshness | [ ] Green [ ] Yellow [ ] Red |       |
| STOP-005 Compliance   | [ ] Green [ ] Yellow [ ] Red |       |

### Step 2: Exception Triage (5 min)

**Owner:** War Room Lead

| Exception ID | Category | Severity | Assigned | Status |
| ------------ | -------- | -------- | -------- | ------ |
|              |          |          |          |        |
|              |          |          |          |        |
|              |          |          |          |        |

**Triage Actions:**

- Acknowledge (no action needed)
- Assign (needs investigation)
- Escalate (needs leadership)
- Resolve (close with note)

### Step 3: KPI Status (3 min)

**Owner:** Pilot Coordinator

| KPI          | Current     | Target   | Trend | Status |
| ------------ | ----------- | -------- | ----- | ------ |
| MTTR         | \_\_\_ min  | ≤30 min  | ↑↓→   |        |
| Rollback     | \_\_\_%     | ≥95%     | ↑↓→   |        |
| Availability | \_\_\_%     | ≥99.5%   | ↑↓→   |        |
| DR Freshness | \_\_\_ days | ≤90 days | ↑↓→   |        |

### Step 4: Compliance Check (3 min)

**Owner:** Compliance Officer

| Metric       | Current | Target    | Status |
| ------------ | ------- | --------- | ------ |
| Median Ratio |         | 0.90-1.10 |        |
| COD          |         | ≤15%      |        |
| PRD          |         | 0.98-1.03 |        |
| PRB          |         | ±0.05     |        |

### Step 5: Open Issues (10 min)

**Owner:** All Participants

| Issue | Owner | Due | Blockers | Update |
| ----- | ----- | --- | -------- | ------ |
|       |       |     |          |        |
|       |       |     |          |        |
|       |       |     |          |        |

### Step 6: Action Items (4 min)

**Owner:** War Room Lead

| Action | Owner | Due | Priority |
| ------ | ----- | --- | -------- |
|        |       |     |          |
|        |       |     |          |
|        |       |     |          |

### Step 7: Next Day Preview (2 min)

**Owner:** Pilot Coordinator

| Tomorrow              | Details |
| --------------------- | ------- |
| Planned deployments   |         |
| Scheduled maintenance |         |
| Key milestones        |         |
| Risks to monitor      |         |

---

## 3. Participation Roster

### 3.1 Required Attendees

| Role               | Name | Backup |
| ------------------ | ---- | ------ |
| War Room Lead      |      |        |
| Technical Lead     |      |        |
| Pilot Coordinator  |      |        |
| Compliance Officer |      |        |

### 3.2 Optional Attendees

| Role           | When to Include        |
| -------------- | ---------------------- |
| Agency Liaison | Agency-specific issues |
| Security Lead  | Security incidents     |
| Executive      | Escalations            |

---

## 4. Escalation Matrix

### 4.1 Escalation Triggers

| Condition                     | Trigger    | Escalation Target  |
| ----------------------------- | ---------- | ------------------ |
| Stop condition active >30 min | Automatic  | Program Director   |
| Exception unresolved >4 hours | Manual     | Technical Lead     |
| KPI trending to breach        | Predictive | Pilot Coordinator  |
| Compliance warning            | Immediate  | Compliance Officer |

### 4.2 Escalation Actions

| Level           | Contact Method | Response SLA |
| --------------- | -------------- | ------------ |
| L1 (Team)       | Slack          | 15 min       |
| L2 (Management) | Phone + Email  | 30 min       |
| L3 (Executive)  | Phone + SMS    | 1 hour       |

---

## 5. Documentation Requirements

### 5.1 War Room Minutes

| Field                 | Required |
| --------------------- | -------- |
| Date/Time             | Yes      |
| Attendees             | Yes      |
| Stop condition status | Yes      |
| Exceptions triaged    | Yes      |
| KPI summary           | Yes      |
| Action items          | Yes      |
| Next meeting          | Yes      |

### 5.2 Distribution

| Recipient         | Timing        | Format        |
| ----------------- | ------------- | ------------- |
| All attendees     | Immediate     | Email         |
| Agency leadership | Within 1 hour | Summary email |
| Audit log         | Automatic     | System record |

---

## 6. Attestation

| Field           | Value                |
| --------------- | -------------------- |
| Cadence Version | 1.0.0                |
| Last Updated    | 2026-02-03           |
| Approved By     | Program Director     |
| Content Hash    | `sha256:war_room_v1` |

---

_This cadence document is part of the Phase XXIV-A Pilot Operations Package._
