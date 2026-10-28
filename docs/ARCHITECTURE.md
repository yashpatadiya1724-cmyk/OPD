# 🏛️ MediQ System Architecture & Technical Specifications
### Project Code: SOCCA - 12 | Silver Oak College of Computer Applications (SOCCA)

This document provides the definitive architectural blueprint for **MediQ**, an intelligent healthcare Outpatient Department (OPD) queue tracking, healthcare marketplace, and hyperlocal pharmacy fulfillment ecosystem.

---

## 1. High-Level Architectural Topology

MediQ is architected as a decentralized, reactive client-server ecosystem designed to handle thousands of concurrent patients across multiple hospital tiers:

```mermaid
flowchart TD
    subgraph Clients["Multi-Platform Client Ecosystem"]
        P[Patient Mobile App<br/>Flutter Android]
        D[Doctor Console App<br/>Flutter Android]
        Ph[Pharmacy Dark-Store App<br/>Flutter Android]
        R[EV Rider App<br/>Flutter Android]
        W[Web Executive Console<br/>React 19 + Vite 6]
        TV[Public Waiting Room Display<br/>Zero-Login 10-ft TV]
    end

    subgraph Cloud["Serverless Cloud Infrastructure (Mumbai asia-south1)"]
        CF[13 Firebase Cloud Functions v2]
        DB[(Cloud Firestore NoSQL)]
        AUTH[Firebase Authentication & RBAC]
        FCM[Firebase Cloud Messaging v1]
        RZP[Razorpay Payment Ledger]
    end

    P <-->|Real-time WebSockets| DB
    D <-->|Real-time WebSockets| DB
    Ph <-->|Real-time WebSockets| DB
    R <-->|Real-time WebSockets| DB
    W <-->|Real-time WebSockets| DB
    TV <--|Read-Only Stream| DB

    P -->|HTTPS Callable| CF
    D -->|HTTPS Callable| CF
    Ph -->|HTTPS Callable| CF
    R -->|HTTPS Callable| CF
    
    CF --> DB
    CF --> FCM
    CF --> RZP
```

---

## 2. Core Mathematical Engines

### 2.1 Dynamic EWMA Clinical Pacing Engine
Static consultation queuing assumes a constant $k$ minutes per consultation, resulting in cascading delays. MediQ utilizes an **Exponential Weighted Moving Average (EWMA)** engine with adaptive outlier filtering:

$$\Delta \hat{t}_t = \alpha \cdot t_{\text{recent}} + (1 - \alpha) \cdot \Delta \hat{t}_{t-1}$$

Where:
- $\alpha = 0.35$: Calibrated smoothing coefficient prioritizing recent clinical velocity while dampening temporary anomalies.
- Outlier Suppression: Observations where $t_{\text{consult}} < 1\text{ min}$ or $t_{\text{consult}} > 45\text{ min}$ are quarantined.
- Total Predicted Wait Time for patient at position $N$:

$$W(N) = \sum_{i=1}^{N} \Delta \hat{t}_i \pm \sigma_{\text{clinical}}$$

### 2.2 Transit-Aware Reverse-ETA Engine
To prevent physical hospital waiting hall congestion and nosocomial cross-infection, MediQ calculates departure urgency in real time:

$$T_{\text{leave}} = T_{\text{appointment}} - (T_{\text{transit}} + T_{\text{parking}} + T_{\text{triage}})$$

Where:
- $T_{\text{transit}}$: Live GPS commute duration calculated via Haversine and Google Distance Matrix API.
- $T_{\text{parking}} = 8\text{ mins}$: Standardized hospital parking buffer.
- $T_{\text{triage}} = 4\text{ mins}$: Front-desk biometric check and vital screening.

---

## 3. Concurrency Control & ACID Pharmacy Transactions
To eliminate duplicate prescription dispensing across partner pharmacies, inventory deductions are wrapped inside Firestore `runTransaction` blocks enforcing snapshot isolation and optimistic locking:

1. **Snapshot Read:** Inspect `availableQty` of all prescribed chemical salt equivalents.
2. **Stock Condition:** If `availableQty < requestedQty`, transaction aborts without mutating state.
3. **Atomic Decrement:** Decrement stock, create order document (`status: 'received'`), and append immutable movement entry to `/audit_logs`.
4. **Commit:** Cryptographically broadcast dispatch trigger to nearby EV riders.

---

## 4. National Health Compliance (ABDM & DPDP Act 2023)
- **14-Digit ABHA ID:** Supports national Ayushman Bharat Digital Mission identifiers.
- **Data Minimization:** Waiting room TV displays mask patient identities (`A*** K***`).
- **Encrypted Health Lockers:** All prescription attachments are stored using AES-256 encryption.
