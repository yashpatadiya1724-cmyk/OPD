# MediQ Architecture & System Design Document
### Project Code: SOCCA - 12 | Silver Oak College of Computer Applications

## 1. System Overview
MediQ is an intelligent Outpatient Department (OPD) queue optimization, clinical triage, and hyperlocal pharmacy delivery prototype platform. Designed to eliminate chaotic hospital waiting rooms and long pharmacy queues in Tier-1 and Tier-2 Indian healthcare facilities.

---

## 2. Core Architecture Decisions

### 2.1 Centralized RBAC Routing & Bundle Splitting
- **Problem:** Monolithic single-page applications leak administrative surfaces and suffer from slow initial page loads on low-end hospital reception terminals.
- **Solution:** Designed a declarative route configuration with strict Role-Based Access Control (`PATIENT`, `DOCTOR`, `PHARMACY`, `RIDER`, `ADMIN`, `SUPER_ADMIN`).
- **Performance Optimization (Ponytail Philosophy):** Leveraged Vite Rollup code splitting with `React.lazy()` and `React.Suspense`. Reduced initial JS bundle payload from **1,543 kB** to **146 kB** (**90.5% reduction**).

### 2.2 Dynamic EWMA Clinical Pacing Engine & Alpha Choice ($\alpha = 0.35$)
- **Problem:** Static consultation slots (e.g., fixed 10-minute intervals) cause waiting room chaos because real clinical consultation times vary widely based on patient severity. Conversely, simple moving averages lag severely behind operational shifts (e.g., a doctor running behind schedule).
- **Mathematical Model:**
  $$S_t = \alpha \cdot Y_t + (1 - \alpha) \cdot S_{t-1}$$
  where $Y_t$ is the actual duration of the latest completed consultation, $S_{t-1}$ is the prior estimated duration, and $\alpha$ is the smoothing factor.
- **Why $\alpha = 0.35$ was Selected:**
  - **Effective Lookback Window:** In exponential smoothing, the equivalent simple moving average window is:
    $$N_{\text{eff}} \approx \frac{2 - \alpha}{\alpha} = \frac{2 - 0.35}{0.35} \approx 4.7 \text{ consultations}$$
  - **Half-Life ($k_{1/2}$):**
    $$k_{1/2} = \frac{\ln(0.5)}{\ln(1 - \alpha)} = \frac{-0.693}{-0.431} \approx 1.6 \text{ consultations}$$
    This means the last 2 consultations account for over 50% of the prediction weight, and the last 5 consultations account for over 88% of the total predictive signal.
  - **Trade-Off Analysis:**
    - **Hypersensitivity ($\alpha \ge 0.6$):** If a single patient requires an extended 30-minute consultation (e.g. suture removal or complex differential diagnosis), a high $\alpha$ causes downstream token wait estimates to spike abruptly, inducing unnecessary patient panic and no-shows.
    - **Sluggish Lag ($\alpha \le 0.15$):** A low $\alpha$ requires 10+ consultations to adapt to a genuine clinic pacing change (e.g., morning shift handoff or new lab diagnostic procedure).
    - **Optimal Damping ($\alpha = 0.35$):** Provides the optimal balance between rapid responsiveness (adapts to pace shifts within 2 to 4 consultations) and statistical damping against temporary consultation volatility.
- **Outlier Clamping Guardrails:**
  - **Lower Clamp ($t_{\text{min}} = 1\text{ min}$):** Discards accidental receptionist clicks or immediate document sign-offs from skewing the pace artificially fast.
  - **Upper Clamp ($t_{\text{max}} = 45\text{ min}$):** Clamps emergency procedures or unpaused lunch breaks, ensuring an anomalous delay does not propagate through the entire daily queue.

### 2.3 Redis Distributed Locks for Queue Advancement
- When multiple doctors or nursing triage staff simultaneously call the next patient token, race conditions can cause duplicate tokens or out-of-order calls.
- MediQ implements atomic Redis `SET NX EX` locks (`redisService.js`) ensuring exactly-once queue progression.

### 2.4 Double-Entry EMR Settlement Ledger
- Financial settlements for OPD consultations and Jan Aushadhi generic pharmacy orders follow a double-entry accounting ledger (`emrLedger.js`) where every debit has an equal balancing credit, guaranteeing zero discrepancy in hospital audits.

---

### 2.5 PostgreSQL Relational Architecture (Interview Deep-Dive)
- **Problem:** NoSQL document stores (like Firestore) rely on eventual consistency. When multiple reception desks issue tokens simultaneously, race conditions can produce duplicate token numbers or phantom rows. Additionally, billing settlements require absolute mathematical guarantees (`SUM(debit) == SUM(credit)`).
- **Why PostgreSQL:** ACID compliance, strict foreign key constraints (`ON DELETE RESTRICT`), and native CHECK constraints. Also enables advanced analytical queries (window functions for dynamic waiting times, `FILTER (WHERE ...)` aggregations) without pulling thousands of raw documents to the client.
- **Alternative Considered:** MongoDB with multi-document transactions. Rejected because MongoDB transactions introduce significant write-lock overhead without providing declarative schema constraints or relational foreign-key cascades.
- **Trade-offs:** Structured schemas require deliberate migration scripts (`scripts/migrate.js`) compared to schemaless NoSQL; however, financial and clinical data integrity far outweighs schemaless flexibility.
- **How Tested:**
  - Automated relational schema verification (`test/postgres_schema_test.js` & `test/emr_ledger_test.js`) passing in 0.68s.
  - `EXPLAIN ANALYZE` profiling documented in `docs/sql-notes.md`, showing 58.6% execution time reduction using composite B-Tree index `idx_opd_doctor_status`.
- **At 10x Scale:**
  - Implement read-replicas for waiting room TV displays via PostgreSQL streaming replication.
  - Apply table partitioning on `opd_tokens` by date (`PARTITION BY RANGE (appointment_date)`) so historical records are segregated from live daily clinic flow.
  - Deploy PgBouncer for transaction-level connection pooling.

---

## 3. Security, Privacy & ABDM Compliance

### 3.1 Role-Based Access Audit (Patient Record Access)
- **Patient:** Can view only their own medical history, active tokens, and pharmacy orders.
- **Doctor:** Can access only the records of patients actively assigned to their OPD queue for the current consultation date.
- **Pharmacy / Rider:** Can view only prescribed medication names, delivery address, and contact numbers — zero access to diagnostic history or clinical consultation notes.
- **Admin:** System audit logs track every record view (`timestamp`, `actor_id`, `role`, `action`, `resource_id`).

### 3.2 Ayushman Bharat Digital Mission (ABDM) & FHIR R4
- MediQ produces standardized HL7 FHIR R4 DiagnosticReport and Bundle JSON structures, enabling interoperability with the Ayushman Bharat Health Account (ABHA) ecosystem.

---

## 4. Database Backup & Disaster Recovery Guide

### PostgreSQL Database Backup
```bash
# Automated Daily Backup Dump
docker exec -t mediq_db pg_dump -U postgres mediq_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore from Backup
gunzip < backup_20261102_000000.sql.gz | docker exec -i mediq_db psql -U postgres -d mediq_db
```

### Redis In-Memory Persistence
- MediQ configures Redis with Append-Only File (`AOF`) and hourly RDB snapshots (`save 3600 1`) ensuring zero queue loss during system reboots.
