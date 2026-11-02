# Contributing to MediQ OPD

Thank you for contributing to MediQ OPD. We welcome contributions that improve queue estimation algorithms, clinical UI accessibility, and backend reliability.

## Contribution Rules
1. **Role-Based Access Control**: Never bypass router guards or relax least-privilege permission checks on clinical/patient routes.
2. **Zero Fake Medical Compliance**: Do not claim HIPAA or medical certifications in pull requests unless formal certification documentation is provided.
3. **Queue Concurrency**: Any changes to queue token advancement must use Redis distributed locks to prevent race conditions.
4. **Testing**: All unit tests must pass before opening PRs:
   ```bash
   npm test
   ```
5. **Branching**: Submit changes on dedicated feature branches, never directly to `main`.
