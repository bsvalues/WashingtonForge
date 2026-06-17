# TerraFusion FAQ for Agency Leadership

> **Classification:** INTERNAL — Leadership Reference  
> **Version:** 1.0.0  
> **Generated:** 2026-02-03  
> **Content Hash:** `sha256:faq_leadership_v1`  
> **Dual Approval Required:** Yes (`REQUIRED_APPROVALS=2`)

---

## 1. Incident Response

### Q: What happens when something breaks?

**A: The system has five automated stop conditions that trigger protective responses:**

| If This Happens...                        | The System Does This...                      | You Need To...             |
| ----------------------------------------- | -------------------------------------------- | -------------------------- |
| Availability drops below 99.5% for 15 min | Enters **safe mode** — halts new deployments | Await War Room resolution  |
| Mean time to recovery exceeds 30 min      | Triggers **War Room escalation**             | Join escalation call       |
| Rollback success drops below 95%          | **Blocks new deployments** until resolved    | Approve resolution plan    |
| Disaster recovery backup exceeds 90 days  | **Blocks production writes**                 | Authorize emergency backup |
| Compliance breach detected                | **Immediate freeze** + automatic audit       | Review audit findings      |

**Key Point:** The system protects itself first, then notifies you. You never need to manually halt operations — that's automatic.

---

### Q: How do I know if something is wrong right now?

**A: Check the Pilot Status Dashboard at `/dashboard?view=executive`**

| Color            | Meaning               | Your Action             |
| ---------------- | --------------------- | ----------------------- |
| All Green        | Normal operations     | None required           |
| Yellow indicator | Approaching threshold | Review at next check-in |
| Red indicator    | Threshold breached    | Immediate attention     |
| STOP banner      | Stop condition active | Join War Room           |

The dashboard updates every 60 seconds. If you see red, the War Room is already activated.

---

### Q: Who gets notified when something goes wrong?

**A: Notification cascade:**

1. **Automatic** — System enters safe mode (immediate)
2. **15 seconds** — War Room operators notified
3. **5 minutes** — Pilot Coordinator notified
4. **15 minutes** — Agency leadership notified (if unresolved)
5. **30 minutes** — Executive escalation (if still unresolved)

You will receive notifications via email and the dashboard. You do not need to monitor continuously.

---

## 2. Compliance Proof

### Q: How do we prove compliance to auditors?

**A: Three levels of evidence are automatically maintained:**

| Level             | What It Contains                            | How To Access                        |
| ----------------- | ------------------------------------------- | ------------------------------------ |
| **Attestation**   | Signed MOU + completion certificates        | `docs/golive/` folder                |
| **Audit Packets** | Full compliance evidence with PII redaction | Generated on-demand via TerraDossier |
| **Hash Trail**    | Cryptographic proof of every action         | TerraTrace logs (immutable)          |

**To generate an audit packet:**

1. Navigate to `/audit`
2. Select "Generate Audit Packet"
3. Choose date range and agency
4. Download PII-redacted PDF

The packet includes IAAO metrics, operational KPIs, and stop condition history — everything an auditor needs.

---

### Q: What makes our evidence "defensible"?

**A: Four properties of TerraFusion evidence:**

| Property          | How It's Achieved                                                 |
| ----------------- | ----------------------------------------------------------------- |
| **Immutable**     | TerraTrace is append-only — entries cannot be modified or deleted |
| **Reproducible**  | Every evidence hash can be regenerated from source data           |
| **PII-Safe**      | All personal data replaced with `sha256:` prefixed identifiers    |
| **Dual-Approved** | Every significant action requires two authorized approvers        |

**Key Point:** If an auditor challenges our evidence, we can regenerate it from source data and prove the hashes match. This is cryptographic proof, not just documentation.

---

### Q: What IAAO standards do we meet?

**A: All four primary IAAO uniformity standards:**

| Standard         | Our Threshold                       | What It Measures                                                |
| ---------------- | ----------------------------------- | --------------------------------------------------------------- |
| **Median Ratio** | 0.90 – 1.10                         | Assessment level (are we assessing at market value?)            |
| **COD**          | ≤ 15% residential, ≤ 20% commercial | Uniformity (are similar properties assessed similarly?)         |
| **PRD**          | 0.98 – 1.03                         | Vertical equity (are high-value properties treated fairly?)     |
| **PRB**          | -0.05 to +0.05                      | Price-related bias (is there systematic over/under assessment?) |

We run ratio studies monthly and flag warnings before breaches occur.

---

## 3. Safe Mode & Rollback

### Q: What is "safe mode" and when does it activate?

**A: Safe mode is a protective state that prevents new changes while preserving existing operations.**

**Safe mode activates when:**

- **STOP-001** — Availability drops below 99.5% for 15 consecutive minutes
- **STOP-002** — Mean time to recovery exceeds 30 minutes
- **STOP-003** — Rollback success rate drops below 95%
- **STOP-004** — Disaster recovery backup exceeds 90-day freshness threshold
- **STOP-005** — Compliance breach detected by automated audit
- Manual activation by War Room lead
- Executive override

**In safe mode:**

- No new deployments or data imports
- No calibration changes
- Read-only access continues normally
- Existing scheduled jobs pause

**To exit safe mode:**

1. Resolve the triggering condition
2. War Room lead confirms resolution
3. Dual approval from designated signatories
4. System automatically resumes normal operations

---

### Q: How does rollback work?

**A: TerraFusion maintains versioned snapshots of all data and can restore any previous state.**

| Rollback Type        | Time to Execute | Data Loss              |
| -------------------- | --------------- | ---------------------- |
| **Configuration**    | < 1 minute      | None                   |
| **Code Deployment**  | < 5 minutes     | None                   |
| **Data Snapshot**    | 15-30 minutes   | Changes since snapshot |
| **Full DR Recovery** | 45-60 minutes   | Up to 24 hours         |

**Our KPI:** ≥ 95% rollback success rate (we're currently at 100%)

**Key Point:** Every deployment can be reversed. We test rollback capability monthly.

---

### Q: Who can authorize a rollback?

**A: Rollback requires dual approval from designated signatories:**

| Severity            | Required Approvers                   | Time Limit |
| ------------------- | ------------------------------------ | ---------- |
| Minor (config only) | Any 2 Pilot Coordinators             | 4 hours    |
| Standard (code)     | 1 Technical Lead + 1 Coordinator     | 2 hours    |
| Critical (data)     | 1 Agency Director + 1 Technical Lead | 1 hour     |
| Emergency (DR)      | Agency Director + Program Director   | Immediate  |

**The approval workflow:**

1. War Room creates rollback request
2. First approver reviews and signs
3. Second approver reviews and signs
4. System executes rollback
5. Confirmation sent to all stakeholders

---

## 4. Pilot Operations

### Q: What is the 14-day pilot window?

**A: The pilot runs for exactly 14 calendar days with daily War Room check-ins.**

| Day   | Focus            | Key Activities                            |
| ----- | ---------------- | ----------------------------------------- |
| 1-3   | Stabilization    | System monitoring, baseline establishment |
| 4-7   | Validation       | Feature testing, compliance verification  |
| 8-11  | Optimization     | Performance tuning, issue resolution      |
| 12-14 | Exit preparation | Documentation, attestation signing        |

At the end of 14 days, we either:

- **Graduate:** Move to production with full confidence
- **Extend:** Continue pilot with specific improvement goals
- **Rollback:** Revert to previous state if issues unresolved

---

### Q: What are the 14 exit gates?

**A: Exit gates are checkpoints that must all pass before pilot completion:**

| Gate  | Category          | Requirement                                                    |
| ----- | ----------------- | -------------------------------------------------------------- |
| 1-4   | **Operational**   | Availability ≥99.5%, MTTR ≤30 min, Rollback ≥95%, DR ≤90d      |
| 5-8   | **Compliance**    | All IAAO metrics in range, no stop conditions triggered        |
| 9-11  | **Documentation** | Audit packets generated, MOU signed, attestations complete     |
| 12-14 | **Approval**      | Dual approval on exit, War Room sign-off, Executive acceptance |

**Current status is visible on the dashboard:** "Exit Gates Passed: X of 14"

---

### Q: What happens during the daily War Room?

**A: A 30-minute structured check-in with 7 agenda items:**

| #   | Item                  | Duration | Owner              |
| --- | --------------------- | -------- | ------------------ |
| 1   | Stop condition review | 3 min    | Technical Lead     |
| 2   | Exception triage      | 5 min    | War Room Lead      |
| 3   | KPI status            | 3 min    | Pilot Coordinator  |
| 4   | Compliance check      | 3 min    | Compliance Officer |
| 5   | Open issues           | 10 min   | All                |
| 6   | Action items          | 4 min    | War Room Lead      |
| 7   | Next day preview      | 2 min    | Pilot Coordinator  |

**You are invited to attend** but not required for daily check-ins. You will receive a summary email after each session.

---

## 5. Your Responsibilities

### Q: What do I need to sign?

**A: Three documents require your signature during the pilot:**

| Document                      | When       | Purpose                        |
| ----------------------------- | ---------- | ------------------------------ |
| **MOU**                       | Day 1      | Authorizes pilot participation |
| **Exit Criteria Attestation** | Day 14     | Confirms all gates passed      |
| **Production Authorization**  | Post-pilot | Approves move to production    |

All signatures are captured electronically with timestamp and hash.

---

### Q: Who should I designate as my approval delegate?

**A: You need to designate two backup approvers for dual-approval actions:**

| Role               | Responsibilities                   | Suggested       |
| ------------------ | ---------------------------------- | --------------- |
| Primary Delegate   | Full authority during your absence | Deputy Director |
| Secondary Delegate | Backup if Primary unavailable      | Senior Manager  |

Delegates can approve rollbacks, data imports, and emergency actions. They cannot sign MOUs or attestations — those require your signature.

---

### Q: What meetings should I attend?

**A: Three key touchpoints:**

| Meeting              | Frequency | Duration | Your Role                                  |
| -------------------- | --------- | -------- | ------------------------------------------ |
| **Day 1 Kickoff**    | Once      | 1 hour   | Opening remarks, MOU signing               |
| **Mid-Pilot Review** | Day 7     | 30 min   | Status review, decision on any adjustments |
| **Exit Review**      | Day 14    | 1 hour   | Final review, attestation signing          |

Daily War Rooms are optional for you. You'll receive email summaries.

---

## 6. Quick Reference

### Key Contacts

| Role              | Contact                  | When To Use          |
| ----------------- | ------------------------ | -------------------- |
| Pilot Coordinator | pilot@terrafusion.gov    | Day-to-day questions |
| War Room Hotline  | war-room@terrafusion.gov | Active incidents     |
| Technical Lead    | tech@terrafusion.gov     | System questions     |
| Program Director  | director@terrafusion.gov | Executive escalation |

### Key Documents

| Document        | Location                                      | Purpose                      |
| --------------- | --------------------------------------------- | ---------------------------- |
| Executive Brief | `docs/golive/EXECUTIVE_BRIEF.md`              | One-page overview            |
| Dashboard Guide | `docs/golive/PILOT_STATUS_DASHBOARD_GUIDE.md` | How to read the dashboard    |
| Exit Criteria   | `docs/golive/EXIT_CRITERIA_MATRIX.md`         | 14-gate completion checklist |
| This FAQ        | `docs/golive/FAQ_FOR_AGENCY_LEADERSHIP.md`    | Common questions             |

### Key Thresholds

| Metric       | Safe     | Warning    | Danger   |
| ------------ | -------- | ---------- | -------- |
| Availability | ≥99.7%   | 99.5-99.7% | <99.5%   |
| MTTR         | ≤25 min  | 25-30 min  | >30 min  |
| Rollback     | ≥97%     | 95-97%     | <95%     |
| DR Freshness | ≤60 days | 60-90 days | >90 days |

---

_This FAQ is part of the Phase XXIV-B Stakeholder & Audit Launch Package. For technical details, see the companion documents in `docs/golive/`._
