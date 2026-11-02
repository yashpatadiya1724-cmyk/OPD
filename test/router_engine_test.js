/**
 * Test Suite: MediQ Centralized Routing & RBAC Engine
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 */

import assert from 'assert';
import { ROUTES, ROUTE_PATHS, USER_ROLES } from '../src/routes/routeConstants.js';
import {
  ROUTE_DEFINITIONS,
  NAVIGATION_GROUPS,
  getRouteById,
  resolveRoute,
  canAccessRoute,
} from '../src/routes/routeConfig.js';

console.log('Running MediQ Centralized Router & RBAC Unit Tests...');

// Test 1: Route Constants Integrity
assert.strictEqual(ROUTES.HOSPITALS, 'hospitals');
assert.strictEqual(ROUTES.DOCTOR, 'doctor');
assert.strictEqual(ROUTES.PHARMACY, 'pharmacy');
assert.strictEqual(ROUTES.SUPER_ADMIN, 'super_admin');
assert.strictEqual(ROUTES.TV, 'tv');
console.log('[PASS] Route constants verified');

// Test 2: Route Definitions Coverage
const routeIds = Object.keys(ROUTE_DEFINITIONS);
assert(routeIds.length >= 14, `Expected at least 14 route definitions, found ${routeIds.length}`);

// Verify every route definition has required metadata
for (const id of routeIds) {
  const def = ROUTE_DEFINITIONS[id];
  assert.strictEqual(def.id, id, `Route definition id mismatch for ${id}`);
  assert(def.path.startsWith('/'), `Path for ${id} must begin with /`);
  assert(def.title && def.title.length > 5, `Title missing for ${id}`);
  assert(def.section && def.section.length > 0, `Section missing for ${id}`);
  assert(def.category && def.category.length > 0, `Category missing for ${id}`);
  assert(Array.isArray(def.allowedRoles), `allowedRoles must be an array for ${id}`);
}
console.log(`[PASS] All ${routeIds.length} route definitions validated with complete metadata`);

// Test 3: Public Surface Access (TV & Showcase)
const tvRoute = getRouteById(ROUTES.TV);
assert.strictEqual(tvRoute.authRequired, false, 'Waiting TV display must be public with zero login requirement');
assert.strictEqual(canAccessRoute(ROUTES.TV, USER_ROLES.PUBLIC), true, 'Public user should access TV');

const overviewRoute = getRouteById(ROUTES.OVERVIEW);
assert.strictEqual(overviewRoute.authRequired, false, 'Project overview should be publicly viewable');
assert.strictEqual(canAccessRoute(ROUTES.OVERVIEW, USER_ROLES.PUBLIC), true);
console.log('[PASS] Public display & showcase zero-login routes confirmed');

// Test 4: Role-Based Access Control (RBAC)
// Patient should NOT access Super Admin or Doctor Console
assert.strictEqual(canAccessRoute(ROUTES.SUPER_ADMIN, USER_ROLES.PATIENT), false, 'Patient must not access Super Admin');
assert.strictEqual(canAccessRoute(ROUTES.DOCTOR, USER_ROLES.PATIENT), false, 'Patient must not access Doctor console');

// Doctor SHOULD access Doctor Console
assert.strictEqual(canAccessRoute(ROUTES.DOCTOR, USER_ROLES.DOCTOR), true, 'Doctor must access Doctor console');

// Super Admin SHOULD access Super Admin Console
assert.strictEqual(canAccessRoute(ROUTES.SUPER_ADMIN, USER_ROLES.SUPER_ADMIN), true, 'Super Admin must access Super Admin console');

// Pharmacy should access Pharmacy Console
assert.strictEqual(canAccessRoute(ROUTES.PHARMACY, USER_ROLES.PHARMACY), true, 'Pharmacy must access Pharmacy console');
console.log('[PASS] RBAC permission boundaries strictly enforced');

// Test 5: Route Resolver (by ID, by Path, by Query param)
const resolvedById = resolveRoute('doctor');
assert.strictEqual(resolvedById.id, ROUTES.DOCTOR);

const resolvedByPath = resolveRoute('/super-admin');
assert.strictEqual(resolvedByPath.id, ROUTES.SUPER_ADMIN);

const resolvedFallback = resolveRoute(null);
assert.strictEqual(resolvedFallback.id, ROUTES.HOSPITALS);

const resolvedUnknown = resolveRoute('non_existent_route');
assert.strictEqual(resolvedUnknown, null, 'Unknown route should return null');
console.log('[PASS] Route resolver handles ID, path and fallback cleanly');

// Test 6: Navigation Groups Verification
assert.strictEqual(NAVIGATION_GROUPS.length, 5, 'Must have 5 distinct operational navigation groups');
const allGroupRoutes = NAVIGATION_GROUPS.flatMap((g) => g.routeIds);
assert(allGroupRoutes.includes(ROUTES.PATIENT), 'Navigation must include Patient route');
assert(allGroupRoutes.includes(ROUTES.PHARMACY), 'Navigation must include Pharmacy route');
assert(allGroupRoutes.includes(ROUTES.RIDER), 'Navigation must include Rider route');
console.log('[PASS] Navigation grouping structure verified for UI sidebar');

console.log('ALL ROUTER & RBAC UNIT TESTS PASSED SUCCESSFULLY! [OK]');
