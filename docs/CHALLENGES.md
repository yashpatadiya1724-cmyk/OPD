# Engineering Challenges & Technical Learnings
### Project Code: SOCCA - 12 | Silver Oak College of Computer Applications

## 1. Challenge: High-Concurrency Token Race Conditions
- **Problem:** In busy OPD waiting rooms with multiple assisting nurses and doctor assistants, pressing "Call Next Patient" at the same instant caused two patients to be called for the same doctor room simultaneously.
- **Root Cause:** Standard database updates without locking allowed two read operations to occur before the first write committed.
- **Solution:** Implemented Redis atomic locks with a 5-second auto-release TTL (`SET lock:queue:doctor_id client_id NX EX 5`). If a concurrent call arrives while the lock is held, it receives a 409 Conflict immediately, ensuring strict FIFO sequencing.

---

## 2. Challenge: Initial Bundle Bloat on Low-End Reception Terminals
- **Problem:** The original single-bundle Vite output exceeded 1.54 MB. On 4G dongles and hospital reception terminals, Time-To-Interactive (TTI) was over 4.2 seconds.
- **Root Cause:** All administrative, patient, and doctor screens were bundled together into one monolithic chunk.
- **Solution:** Applied the Ponytail "Code Minimizer" standard. Replaced static imports with `React.lazy()` and `Suspense`, configured Vite's `manualChunks` to split vendor dependencies (Firebase, Lucide, Recharts). The initial bundle dropped to 146 kB (a 90.5% reduction) with sub-second page loads.

---

## 3. Challenge: Jan Aushadhi Generic Medicine Matching
- **Problem:** Branded doctor prescriptions (e.g. Crocin, Augmentin) cost 3x-5x more than Jan Aushadhi equivalents, but fuzzy matching generic salt names (e.g. *Paracetamol 500mg* vs *Acetaminophen*) often failed.
- **Solution:** Built a standardized generic salt mapping index adhering to Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) chemical formulas, showing verified generic savings of over 60% per prescription.
