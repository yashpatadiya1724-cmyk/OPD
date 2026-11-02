# MediQ Architecture & System Design Document
### Project Code: SOCCA - 12 | Silver Oak College of Computer Applications

## 1. System Overview
MediQ is an intelligent Outpatient Department (OPD) queue optimization, clinical triage, and hyperlocal 15-minute pharmacy delivery platform. Designed to eliminate chaotic hospital waiting rooms and long pharmacy queues in Tier-1 and Tier-2 Indian healthcare facilities.

---

## 2. Core Architecture Decisions

### 2.1 Centralized RBAC Routing & Bundle Splitting
- **Problem:** Monolithic single-page applications leak administrative surfaces and suffer from slow initial page loads on low-end hospital reception terminals.
- **Solution:** Designed a declarative route configuration with strict Role-Based Access Control (`PATIENT`, `DOCTOR`, `PHARMACY`, `RIDER`, `ADMIN`, `SUPER_ADMIN`).
- **Performance Optimization (Ponytail Philosophy):** Leveraged Vite Rollup code splitting with `React.lazy()` and `React.Suspense`. Reduced initial JS bundle payload from **1,543 kB** to **146 kB** (**90.5% reduction**).

### 2.2 Dynamic EWMA Clinical Pacing Engine
- Rather than assuming static $k$-minute appointments, MediQ computes an Exponential Weighted Moving Average (EWMA, $\alpha = 0.35$) with outlier suppression ($t < 1\text{ min}$ or $t > 45\text{ min}$) to predict dynamic real-time waiting times for queue tokens.

### 2.3 Redis Distributed Locks for Queue Advancement
- When multiple doctors or nursing triage staff simultaneously call the next patient token, race conditions can cause duplicate tokens or out-of-order calls.
- MediQ implements atomic Redis `SET NX EX` locks (`redisService.js`) ensuring exactly-once queue progression.

### 2.4 Double-Entry EMR Settlement Ledger
- Financial settlements for OPD consultations and Jan Aushadhi generic pharmacy orders follow a double-entry accounting ledger (`emrLedger.js`) where every debit has an equal balancing credit, guaranteeing zero discrepancy in hospital audits.

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
