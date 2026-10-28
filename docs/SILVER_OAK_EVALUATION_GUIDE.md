# 🎓 Silver Oak University Project Defense Guide (100 Marks)
### Silver Oak College of Computer Applications (SOCCA)
**Project Code:** `SOCCA - 12` | **Academic Year:** `2025–2026`  
**Project Title:** `MediQ: Smart OPD Queue Tracker, Healthcare Marketplace & Hyperlocal Pharmacy Fulfilment System`

---

## Evaluation Parameters & Scoring Checklist

| Parameter | Marks | Key Viva Defense Questions & Answers |
| :--- | :---: | :--- |
| **1. Understanding & Ownership** | **20%** | **Q:** Why did you choose EWMA over simple average?<br/>**A:** Simple averages lag during abrupt consultation spikes. EWMA ($\alpha=0.35$) responds rapidly to recent delays while filtering out random outliers ($>45$ mins). |
| **2. Methodology & Approach** | **20%** | **Q:** How was the system validated?<br/>**A:** Conducted a 2-week time-motion field study across 4 multi-tier hospitals ($N=250$ patient journeys), verifying an 87.2% reduction in non-clinical waiting time. |
| **3. Innovation & Originality** | **20%** | **Q:** What is your biggest unique differentiator?<br/>**A:** The "Leave-Now" reverse ETA transit engine coupled with Jan Aushadhi generic salt matching (70.9% patient savings) and cold-chain EV doorstep delivery. |
| **4. Technical Implementation** | **20%** | **Q:** Show the technical deployment.<br/>**A:** 4 native Flutter Android APKs (0 Dart errors), 14-surface React 19 web console deployed on Firebase Hosting, and Cloud Firestore real-time WebSockets. |
| **5. Poster & Communication** | **15%** | **Q:** How are results communicated?<br/>**A:** Crisp 1-page high-resolution poster with clear system workflow diagrams, KPI callouts, and mathematical formulas. |
| **6. Practical Relevance & Impact** | **5%** | **Q:** What is the social and national impact?<br/>**A:** Eliminates hospital waiting room cross-infections, saves ₹1,200+ per chronic patient monthly, and strictly adheres to NHA ABDM & DPDP Act 2023. |
