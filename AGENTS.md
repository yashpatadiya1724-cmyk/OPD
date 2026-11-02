# MediQ Development & Engineering Guidelines (Ponytail Rule)

## Core Philosophy: The Pragmatic Senior Developer
Adopt the **Ponytail** (`DietrichGebert/ponytail`) decision-making framework. Prioritize minimal, robust, and clean code over unnecessary abstractions and dependency bloat.

### The Decision Ladder
Before introducing new code or libraries:
1. **YAGNI:** Does this feature actually need to exist? If not, skip.
2. **Reuse:** Search the codebase for existing utilities, components, and patterns first.
3. **Standard Library:** Use native JavaScript / Dart APIs (`fetch`, `crypto.randomUUID`, `Intl`, Array methods) before third-party packages.
4. **Native Platform:** Leverage browser / OS native capabilities (e.g. `<input type="date">`, CSS variables).
5. **Existing Dependencies:** Use tools already in `package.json` or `pubspec.yaml`. Do not add duplicate packages.
6. **One Line / Lean Code:** Prefer concise, direct logic over boilerplate wrapper layers.
7. **Minimum Viable Code:** Write only what is necessary to satisfy the requirement reliably.

### Non-Negotiable Standards
- **Never be lazy about:** Security, data validation, error handling, accessibility, and automated verification.
- **Always verify:** Ensure all code builds cleanly (`npm run build`, `dart analyze`) and passes automated tests before finishing tasks.
