# 🎨 PriBite & Shahi Luxury Design System
### Design Token Specifications for MediQ Mobile & Web Suites

This document defines the visual tokens, micro-elevation scales, and color hierarchies implemented across MediQ's 4 Flutter mobile applications and 14-surface React 19 web executive panel.

---

## 1. Color Tokens & Semantic Roles

| Token Name | Hex Code | Semantic Role |
| :--- | :--- | :--- |
| `--pribite-bg-canvas` | `#0B0F17` | Root background for executive consoles & dark themes |
| `--pribite-surface-card` | `#0F172A` | Elevated cards, navigation sidecars & modals |
| `--pribite-surface-border` | `#1E293B` | Structural boundary lines and dividers |
| `--shahi-emerald-primary` | `#059669` | Clinical status, active queues & confirmation triggers |
| `--shahi-emerald-light` | `#DCFCE7` | Background badge for in-stock and confirmed states |
| `--shahi-cyan-accent` | `#0284C7` | Navigation waypoints, telemetry lines & cold-chain badges |
| `--shahi-gold-amber` | `#F59E0B` | Priority warnings, rating stars & express slot indicators |
| `--shahi-rose-danger` | `#E11D48` | Emergency SOS triage & temperature threshold alerts |

---

## 2. Typography Hierarchy

- **Headings (Display):** `'Outfit', sans-serif` — High-contrast geometric sans-serif for token codes, statistics, and university titles.
- **Body & Controls:** `'Plus Jakarta Sans', sans-serif` — Clean, legible modern sans-serif optimized for mobile touch targets and medical dosages.
- **Telemetry & Numbers:** `'JetBrains Mono', monospace` — Fixed-width digits for stopwatches, OTPs, and GPS coordinates.

---

## 3. Elevation & Glassmorphism Rules
- **Subtle Surface:** `box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);`
- **Elevated Interactive Card:** `box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);`
- **Glowing Accent Card:** `box-shadow: 0 0 20px rgba(5, 150, 105, 0.25);`
