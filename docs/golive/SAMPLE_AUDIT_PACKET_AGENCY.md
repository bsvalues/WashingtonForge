# TerraFusion Sample Audit Packet

> **Classification:** CONFIDENTIAL — Audit Use Only  
> **Agency:** [SAMPLE — PII Redacted]  
> **Version:** 1.0.0  
> **Generated:** 2026-02-03  
> **Content Hash:** `sha256:audit_packet_sample_v1`  
> **Redaction Confirmation:** All PII replaced with `sha256:` prefixed identifiers

---

## 1. Packet Overview

This sample demonstrates the structure and content of a TerraFusion audit packet. All personally identifiable information has been redacted and replaced with cryptographic hashes.

### 1.1 Scope

| Field             | Value                         |
| ----------------- | ----------------------------- |
| Agency ID         | `sha256:agency_benton_wa_001` |
| Roll Year         | 2025                          |
| Audit Period      | 2025-01-01 to 2025-12-31      |
| Packet Type       | Compliance Verification       |
| Generation Method | Automated (TerraDossier)      |

### 1.2 Redaction Summary

| Data Type       | Count | Replacement Format |
| --------------- | ----- | ------------------ |
| User IDs        | 12    | `sha256:user_*`    |
| Parcel IDs      | 847   | `sha256:parcel_*`  |
| Taxpayer Names  | 847   | `[REDACTED_NAME]`  |
| SSN/TIN         | 0     | `[REDACTED_SSN]`   |
| Email Addresses | 0     | `[REDACTED_EMAIL]` |
| Phone Numbers   | 0     | `[REDACTED_PHONE]` |

---

## 2. Compliance Evidence

### 2.1 IAAO Ratio Study Results

| Metric       | Value | Target Range  | Status    |
| ------------ | ----- | ------------- | --------- |
| Median Ratio | 0.982 | 0.90 – 1.10   | COMPLIANT |
| COD          | 12.4% | ≤ 15.0%       | COMPLIANT |
| PRD          | 1.01  | 0.98 – 1.03   | COMPLIANT |
| PRB          | -0.02 | -0.05 – +0.05 | COMPLIANT |
| Sample Size  | 847   | ≥ 30          | COMPLIANT |

**Evidence Hash:** `sha256:ratio_study_2025_benton_847parcels`

### 2.2 Uniformity by Property Class

| Property Class | Median Ratio | COD   | Sample Size | Status    |
| -------------- | ------------ | ----- | ----------- | --------- |
| Residential SF | 0.978        | 11.2% | 623         | COMPLIANT |
| Residential MF | 0.991        | 13.8% | 89          | COMPLIANT |
| Commercial     | 1.004        | 16.2% | 78          | COMPLIANT |
| Industrial     | 0.987        | 14.1% | 57          | COMPLIANT |

### 2.3 Uniformity by Neighborhood

| Neighborhood ID   | Median Ratio | COD   | Sample Size |
| ----------------- | ------------ | ----- | ----------- |
| `sha256:nbhd_001` | 0.975        | 10.8% | 142         |
| `sha256:nbhd_002` | 0.984        | 12.1% | 198         |
| `sha256:nbhd_003` | 0.991        | 11.5% | 167         |
| `sha256:nbhd_004` | 0.988        | 13.2% | 156         |
| `sha256:nbhd_005` | 0.972        | 14.8% | 184         |

---

## 3. Operational Evidence

### 3.1 System Availability

| Period  | Uptime | Target  | Status    |
| ------- | ------ | ------- | --------- |
| Q1 2025 | 99.72% | ≥ 99.5% | COMPLIANT |
| Q2 2025 | 99.68% | ≥ 99.5% | COMPLIANT |
| Q3 2025 | 99.81% | ≥ 99.5% | COMPLIANT |
| Q4 2025 | 99.74% | ≥ 99.5% | COMPLIANT |

**Evidence Hash:** `sha256:uptime_logs_2025_q1q4`

### 3.2 Incident Response

| Metric           | Value      | Target   | Status    |
| ---------------- | ---------- | -------- | --------- |
| Total Incidents  | 7          | —        | —         |
| MTTR (Mean)      | 18.4 min   | ≤ 30 min | COMPLIANT |
| MTTR (Max)       | 27 min     | ≤ 30 min | COMPLIANT |
| Rollback Success | 100% (3/3) | ≥ 95%    | COMPLIANT |

### 3.3 Data Recovery

| Metric         | Value      | Target    | Status    |
| -------------- | ---------- | --------- | --------- |
| DR Freshness   | 14 days    | ≤ 90 days | COMPLIANT |
| Last DR Test   | 2025-12-15 | —         | —         |
| DR Test Result | PASS       | —         | —         |

**Evidence Hash:** `sha256:dr_validation_2025_12_15`

---

## 4. Access Control Evidence

### 4.1 RBAC Summary

| Role     | User Count | Permissions          |
| -------- | ---------- | -------------------- |
| Assessor | 3          | Full write access    |
| Analyst  | 5          | Read + ratio studies |
| Viewer   | 4          | Read only            |

### 4.2 Dual Approval Enforcement

| Action Type       | Total Actions | Dual Approved | Compliance |
| ----------------- | ------------- | ------------- | ---------- |
| Snapshot Publish  | 4             | 4 (100%)      | COMPLIANT  |
| Calibration Apply | 12            | 12 (100%)     | COMPLIANT  |
| Data Import       | 8             | 8 (100%)      | COMPLIANT  |

**Evidence Hash:** `sha256:approval_log_2025_full`

### 4.3 Audit Trail Sample

| Timestamp            | Actor             | Action             | Resource           | Hash               |
| -------------------- | ----------------- | ------------------ | ------------------ | ------------------ |
| 2025-03-15T09:14:22Z | `sha256:user_001` | RATIO_RUN_CREATE   | `sha256:study_001` | `sha256:trace_001` |
| 2025-03-15T09:18:47Z | `sha256:user_001` | RATIO_RUN_COMPLETE | `sha256:study_001` | `sha256:trace_002` |
| 2025-06-22T14:33:11Z | `sha256:user_002` | SNAPSHOT_CREATE    | `sha256:snap_001`  | `sha256:trace_003` |
| 2025-06-22T15:01:33Z | `sha256:user_003` | SNAPSHOT_PUBLISH   | `sha256:snap_001`  | `sha256:trace_004` |

---

## 5. Stop Condition Verification

### 5.1 Stop Condition Status (Audit Period)

| Code     | Description          | Triggered | Resolution |
| -------- | -------------------- | --------- | ---------- |
| STOP-001 | Availability < 99.5% | 0 times   | N/A        |
| STOP-002 | MTTR > 30 min        | 0 times   | N/A        |
| STOP-003 | Rollback < 95%       | 0 times   | N/A        |
| STOP-004 | DR > 90 days         | 0 times   | N/A        |
| STOP-005 | Compliance breach    | 0 times   | N/A        |

**Evidence Hash:** `sha256:stop_condition_log_2025`

---

## 6. Attestation Chain

### 6.1 Document Generation

| Field                | Value                          |
| -------------------- | ------------------------------ |
| Generated By         | TerraDossier v2.1.0            |
| Generation Timestamp | 2026-02-03T12:00:00Z           |
| Source Data Hash     | `sha256:source_data_2025_full` |
| Template Version     | audit_packet_v1.0.0            |

### 6.2 Approval Signatures

| Role       | ID                | Date       | Signature Hash          |
| ---------- | ----------------- | ---------- | ----------------------- |
| Assessor   | `sha256:user_001` | 2026-02-03 | `sha256:sig_assessor`   |
| Supervisor | `sha256:user_004` | 2026-02-03 | `sha256:sig_supervisor` |

---

## 7. Cross-Document References

| Document                 | Hash                        | Relationship                   |
| ------------------------ | --------------------------- | ------------------------------ |
| Pilot Selection Template | `sha256:pilot_selection_v1` | Defines pilot criteria         |
| War Room Cadence         | `sha256:war_room_v1`        | Defines operational procedures |
| Exit Criteria Matrix     | `sha256:exit_criteria_v1`   | Defines completion gates       |
| MOU Agreement            | `sha256:mou_agency_001`     | Legal authorization            |

---

_This packet is machine-generated with automated PII redaction. The evidence hashes are reproducible from source data._
