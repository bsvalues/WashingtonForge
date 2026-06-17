# TerraFusion Exit Criteria Matrix

> **Classification:** INTERNAL — Operations Reference  
> **Version:** 1.0.0  
> **Generated:** 2026-02-03  
> **Content Hash:** `sha256:exit_criteria_v1`  
> **Phase:** XXIV-A (Sealed)  
> **Dual Approval Required:** Yes (`REQUIRED_APPROVALS=2`)

---

## 1. Exit Gate Summary

### 1.1 Gate Categories

| Category | Gates | Weight |
|----------|-------|--------|
| Operational | 1-4 | 40% |
| Compliance | 5-8 | 30% |
| Documentation | 9-11 | 15% |
| Approval | 12-14 | 15% |

### 1.2 Passing Requirements

| Outcome | Requirement |
|---------|-------------|
| **PASS** | All 14 gates green |
| **CONDITIONAL** | 12+ gates green, remaining yellow |
| **FAIL** | Any gate red OR <12 gates green |

---

## 2. Operational Gates (1-4)

### Gate 1: Availability

| Metric | Threshold | Measurement |
|--------|-----------|-------------|
| System Availability | ≥99.5% | Uptime over 14-day window |
| Measurement Window | 14 days | Pilot duration |
| Data Source | Monitoring system | Automated |

**Pass Criteria:** Average availability ≥99.5% with no single day below 99.0%

| Status | Condition |
|--------|-----------|
| GREEN | ≥99.5% average, no day <99.0% |
| YELLOW | 99.0-99.5% average OR one day <99.0% |
| RED | <99.0% average OR multiple days <99.0% |

---

### Gate 2: MTTR

| Metric | Threshold | Measurement |
|--------|-----------|-------------|
| Mean Time to Recovery | ≤30 minutes | Average across all incidents |
| Max MTTR | ≤60 minutes | No single incident exceeds |
| Data Source | Incident log | Manual + automated |

**Pass Criteria:** Mean MTTR ≤30 min AND no incident >60 min

| Status | Condition |
|--------|-----------|
| GREEN | Mean ≤30 min, max ≤45 min |
| YELLOW | Mean ≤30 min, max 45-60 min |
| RED | Mean >30 min OR max >60 min |

---

### Gate 3: Rollback Success

| Metric | Threshold | Measurement |
|--------|-----------|-------------|
| Rollback Success Rate | ≥95% | Successful / Attempted |
| Minimum Sample | ≥3 rollbacks | Test or production |
| Data Source | Deployment log | Automated |

**Pass Criteria:** ≥95% success rate with ≥3 rollback events

| Status | Condition |
|--------|-----------|
| GREEN | ≥95% success, ≥3 events |
| YELLOW | ≥95% success, <3 events (insufficient sample) |
| RED | <95% success rate |

---

### Gate 4: DR Freshness

| Metric | Threshold | Measurement |
|--------|-----------|-------------|
| Backup Age | ≤90 days | Days since last validated backup |
| Validation Status | PASS | Last DR test result |
| Data Source | DR validation log | Automated |

**Pass Criteria:** Backup ≤90 days old AND last validation PASS

| Status | Condition |
|--------|-----------|
| GREEN | ≤60 days, validation PASS |
| YELLOW | 61-90 days, validation PASS |
| RED | >90 days OR validation FAIL |

---

## 3. Compliance Gates (5-8)

### Gate 5: Median Ratio

| Metric | Threshold | Measurement |
|--------|-----------|-------------|
| Median Ratio | 0.90 – 1.10 | IAAO standard |
| Sample Size | ≥30 sales | Qualified sales only |
| Data Source | Ratio study | Automated |

**Pass Criteria:** Median ratio within range with sufficient sample

| Status | Condition |
|--------|-----------|
| GREEN | 0.92-1.08, ≥50 sales |
| YELLOW | 0.90-0.92 or 1.08-1.10, ≥30 sales |
| RED | <0.90 or >1.10 OR <30 sales |

---

### Gate 6: COD

| Metric | Threshold | Measurement |
|--------|-----------|-------------|
| Coefficient of Dispersion | ≤15% (residential) | IAAO standard |
| Alternate Threshold | ≤20% (commercial) | By property type |
| Data Source | Ratio study | Automated |

**Pass Criteria:** COD within threshold for property type

| Status | Condition |
|--------|-----------|
| GREEN | ≤12% (res) or ≤17% (comm) |
| YELLOW | 12-15% (res) or 17-20% (comm) |
| RED | >15% (res) or >20% (comm) |

---

### Gate 7: PRD

| Metric | Threshold | Measurement |
|--------|-----------|-------------|
| Price-Related Differential | 0.98 – 1.03 | IAAO standard |
| Interpretation | 1.0 = perfect equity | Lower = progressive, higher = regressive |
| Data Source | Ratio study | Automated |

**Pass Criteria:** PRD within IAAO range

| Status | Condition |
|--------|-----------|
| GREEN | 0.99-1.02 |
| YELLOW | 0.98-0.99 or 1.02-1.03 |
| RED | <0.98 or >1.03 |

---

### Gate 8: PRB

| Metric | Threshold | Measurement |
|--------|-----------|-------------|
| Price-Related Bias | -0.05 to +0.05 | IAAO standard |
| Interpretation | 0 = no bias | Negative = progressive, positive = regressive |
| Data Source | Ratio study | Automated |

**Pass Criteria:** PRB within IAAO range

| Status | Condition |
|--------|-----------|
| GREEN | -0.03 to +0.03 |
| YELLOW | -0.05 to -0.03 or +0.03 to +0.05 |
| RED | <-0.05 or >+0.05 |

---

## 4. Documentation Gates (9-11)

### Gate 9: Audit Packets Generated

| Requirement | Verification |
|-------------|--------------|
| Pilot audit packet exists | File exists in system |
| PII redaction confirmed | Automated scan passed |
| Evidence hashes valid | Hash verification passed |
| Cross-references intact | Link validation passed |

**Pass Criteria:** All audit packet requirements met

| Status | Condition |
|--------|-----------|
| GREEN | All requirements met |
| YELLOW | Minor deficiencies identified |
| RED | Packet missing or invalid |

---

### Gate 10: MOU Signed

| Requirement | Verification |
|-------------|--------------|
| Agency MOU signed | Digital signature present |
| All signatories complete | 3 agency + 3 TerraFusion |
| Signature hashes recorded | Hash in audit log |
| Effective date valid | Within pilot window |

**Pass Criteria:** MOU fully executed with valid signatures

| Status | Condition |
|--------|-----------|
| GREEN | All signatures present and valid |
| YELLOW | Pending 1 signature |
| RED | Missing multiple signatures or invalid |

---

### Gate 11: Attestations Complete

| Requirement | Verification |
|-------------|--------------|
| Pilot coordinator attestation | Signed |
| Technical lead attestation | Signed |
| Compliance officer attestation | Signed |
| All attestations hash-stamped | Hashes recorded |

**Pass Criteria:** All required attestations signed and recorded

| Status | Condition |
|--------|-----------|
| GREEN | All attestations complete |
| YELLOW | 1 attestation pending |
| RED | Multiple attestations missing |

---

## 5. Approval Gates (12-14)

### Gate 12: Dual Approval on Exit

| Requirement | Verification |
|-------------|--------------|
| First approver signed | Signature hash recorded |
| Second approver signed | Signature hash recorded |
| Approvers are distinct | Different user IDs |
| Approvers are authorized | In designated signatory list |

**Pass Criteria:** Two distinct authorized approvers have signed

| Status | Condition |
|--------|-----------|
| GREEN | Both approvals complete |
| YELLOW | One approval pending |
| RED | No approvals or invalid approvers |

---

### Gate 13: War Room Sign-Off

| Requirement | Verification |
|-------------|--------------|
| Final war room held | Meeting minutes exist |
| All stop conditions reviewed | Documented in minutes |
| No unresolved P0/P1 issues | Issue tracker verified |
| War Room lead signed | Signature recorded |

**Pass Criteria:** Final war room complete with all items resolved

| Status | Condition |
|--------|-----------|
| GREEN | All requirements met |
| YELLOW | Minor items pending resolution |
| RED | P0/P1 issues unresolved |

---

### Gate 14: Executive Acceptance

| Requirement | Verification |
|-------------|--------------|
| Executive brief reviewed | Acknowledgment recorded |
| Exit criteria reviewed | Presented in meeting |
| Production authorization signed | Signature hash recorded |
| Effective date confirmed | In authorization document |

**Pass Criteria:** Executive has reviewed and authorized production

| Status | Condition |
|--------|-----------|
| GREEN | Full authorization signed |
| YELLOW | Authorization pending review |
| RED | Authorization denied or not requested |

---

## 6. Exit Decision Matrix

### 6.1 Decision Rules

| Gate Count | Red Gates | Decision |
|------------|-----------|----------|
| 14 GREEN | 0 | **GRADUATE** to production |
| 12-13 GREEN | 0 | **CONDITIONAL** — address yellow items |
| 11+ GREEN | 1 RED | **EXTEND** — remediate and re-evaluate |
| <11 GREEN | Any | **EXTEND** — significant remediation needed |
| Any | ≥2 RED | **ROLLBACK** — return to previous state |

### 6.2 Extension Rules

| Extension | Max Duration | Requirements |
|-----------|--------------|--------------|
| First | 7 days | Remediation plan approved |
| Second | 7 days | Executive approval required |
| Third | Not allowed | Must rollback |

---

## 7. Stop Condition Alignment (XXIV-C)

Gates 1–4 map directly to the Phase XXIV-C stop conditions:

| Stop Code | Condition | Linked Gate |
|-----------|-----------|-------------|
| **STOP-001** | Availability < 99.5% for 15+ min | Gate 1 |
| **STOP-002** | MTTR > 30 minutes | Gate 2 |
| **STOP-003** | Rollback success < 95% | Gate 3 |
| **STOP-004** | DR backup > 90 days old | Gate 4 |
| **STOP-005** | Compliance breach detected | Gate 5 |

A triggered stop condition causes immediate gate failure, overriding all other scores.

---

## 8. Attestation

| Field | Value |
|-------|-------|
| Matrix Version | 1.0.0 |
| Last Updated | 2026-02-03 |
| Approved By | Program Director |
| Content Hash | `sha256:exit_criteria_v1` |
| Total Gates | 14 |

---

_This matrix is part of the Phase XXIV-A Pilot Operations Package._
