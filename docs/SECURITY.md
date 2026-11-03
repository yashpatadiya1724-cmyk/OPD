# MediQ Security Policy & Data Governance
### Project Code: SOCCA - 12 | Silver Oak University

MediQ treats patient privacy, clinical record integrity, and infrastructure safety as first-class architectural priorities. This document details our security boundaries, credential management policies, vulnerability disclosure protocols, and compliance principles.

---

## 1. Vulnerability Reporting Protocol

If you discover a security vulnerability, data leakage risk, or authentication flaw within MediQ:
- **Do not open a public GitHub issue.**
- Email the project maintainer directly at: **[yashpatadiya1724@gmail.com](mailto:yashpatadiya1724@gmail.com)** with the subject line `[SECURITY] MediQ Vulnerability Report`.
- Include reproducible proof-of-concept steps, affected endpoints, and impact assessment.
- We acknowledge receipt within **48 hours** and provide regular progress updates through remediation.

---

## 2. Credential & Secret Management Policy

### 2.1 Client-Side vs. Server-Side Keys
- **Client Web Configuration (`VITE_FIREBASE_*`):**
  - Firebase web configurations (`apiKey`, `projectId`, `authDomain`) are public identifiers utilized by browser clients to route requests to Google Cloud.
  - Per [official Firebase documentation](https://firebase.google.com/docs/projects/api-keys), Firebase client API keys do not grant administrative access; access security is enforced strictly via server-side [Firestore Security Rules](../firestore.rules).
  - All client configurations are externalized into environment variables via `import.meta.env` (configured in `.env.example`).
- **Payment Gateway Keys (`VITE_RAZORPAY_KEY_ID`):**
  - Only public test keys (`rzp_test_*`) may be referenced in client code.
  - Payment secrets (`RAZORPAY_KEY_SECRET`) are strictly prohibited in client bundles or git history and reside solely in backend server environments.

### 2.2 GitHub Secret Scanning Resolution Guide (Alert #1)
GitHub Secret Scanning automatically flags any Google API key pattern (`AIzaSy...`). For maintainers resolving Alert #1:
1. Ensure `src/firebase.js` loads credentials from `import.meta.env.VITE_FIREBASE_API_KEY`.
2. In the Google Cloud Console / Firebase Console, confirm that the Web API key has:
   - **Application Restrictions:** Restricted to authorized HTTP referrers (e.g., `smart-opd-queue-tracker.web.app`, `localhost`).
   - **API Restrictions:** Restricted solely to Firebase Authentication, Cloud Firestore, and Cloud Storage.
3. In GitHub Security tab, mark Alert #1 as resolved:
   - Resolution reason: *Used in tests / Public client configuration* (or *Revoked* if regenerated).

---

## 3. Healthcare Security Perimeter & Least Privilege (RBAC)

MediQ isolates operational surfaces using Role-Based Access Control:

| Actor Role | Data Access Boundary | Security Control |
|---|---|---|
| **Patient** | Can read/write only their own consultation tokens, appointments, and prescriptions. | Token identity verification (`request.auth.uid == userId`) |
| **Doctor** | Can access clinical notes and issue prescriptions only for patients active in their daily roster. | Clinical staff role guard (`isClinicalStaff()`) |
| **Pharmacy** | Accesses generic salt names and dosage quantities; zero access to clinical diagnostic history. | Data unbundling in `firestore.rules` |
| **EV Rider** | Accesses order delivery address, recipient contact, and doorstep OTP verification only. | Delivery role guard (`isRider()`) |
| **Hospital Admin** | Manages hospital profiles, doctor accreditation, and audit telemetry; no clinical record tampering. | Administrative check (`isAdmin()`) |

---

## 4. Tamper-Proof Audit Trails & DPDP Principles

In alignment with India's Digital Personal Data Protection (DPDP) Act principles:
- **Append-Only Logging:** All security and access audit records in `/audit_logs/{logId}` are strictly immutable (`allow update, delete: if false;`). Once recorded, an access log cannot be modified or erased.
- **Clinical Prescription Integrity:** Prescriptions cannot be deleted by non-administrators (`allow delete: if false;`), ensuring complete electronic health record custody.
- **No PII in Server Telemetry:** Server logs record only HTTP method, status code, and latency — never patient diagnostic text or phone numbers.

---

## 5. Regulatory & Certification Notice

MediQ is an educational prototype and pilot platform developed at Silver Oak University. **No claim of HIPAA certification, NABH accreditation, or formal international medical device regulatory approval is made.**
