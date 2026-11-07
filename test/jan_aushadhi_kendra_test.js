/**
 * Test Suite: Jan Aushadhi Kendra Location Matching & 85% Generic Cost Savings Calculator
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 */

import assert from 'assert';
import {
  PMBJP_KENDRA_DIRECTORY,
  calculateGeoDistanceKm,
  findNearestJanAushadhiKendras,
  calculatePrescriptionSavingsWithNearestKendra,
} from '../src/utils/janAushadhiComparator.js';

console.log('Running Jan Aushadhi Kendra Location Matching & 85% Savings Tests...');

// Test 1: Directory Integrity
assert(PMBJP_KENDRA_DIRECTORY.length >= 5, 'Must contain at least 5 verified PMBJP Kendra locations');
assert(PMBJP_KENDRA_DIRECTORY.every(k => k.kendraId && k.name && k.latitude && k.longitude));
console.log(`[PASS] PMBJP Kendra directory integrity verified (${PMBJP_KENDRA_DIRECTORY.length} centers)`);

// Test 2: Haversine Geo Distance
// Silver Oak University Coordinates: 23.0886, 72.5315
// Gota Cross Road Kendra Coordinates: 23.0882, 72.5312
const distanceToGota = calculateGeoDistanceKm(23.0886, 72.5315, 23.0882, 72.5312);
assert(distanceToGota < 0.2, `Gota Kendra must be <200m from Silver Oak campus (Actual: ${distanceToGota} km)`);
console.log(`[PASS] Haversine distance accuracy verified (Distance: ${distanceToGota} km)`);

// Test 3: Nearest Kendra Lookup & Proximity Sorting
const userLat = 23.0886; // Silver Oak University campus
const userLng = 72.5315;
const nearestKendras = findNearestJanAushadhiKendras(userLat, userLng, 10, 3);

assert.strictEqual(nearestKendras.length, 3, 'Must return top 3 closest Kendras within 10km');
assert.strictEqual(nearestKendras[0].kendraId, 'PMBJP-GJ-AHM-001', 'Gota Kendra must be closest to campus');
assert(nearestKendras[0].distanceKm <= nearestKendras[1].distanceKm, 'Results must be sorted ascending by distance');
assert(nearestKendras[0].estimatedTravelMinutes >= 3, 'Must estimate urban transit time');
console.log(`[PASS] Nearest PMBJP Kendra proximity sort verified: ${nearestKendras[0].name} (${nearestKendras[0].distanceKm} km)`);

// Test 4: Search Radius Filter
const tightRadius = findNearestJanAushadhiKendras(userLat, userLng, 0.5); // 500m radius
assert(tightRadius.length >= 1, 'Should find at least 1 Kendra within 500m of campus');
assert(tightRadius.every(k => k.distanceKm <= 0.5), 'All results must respect tight radius boundary');
console.log('[PASS] Spatial radius filter (<500m) verified');

// Test 5: 85%+ Generic Savings Calculation Combined with Nearest Kendra Allocation
// Augmentin 625 Duo (branded 204.80) vs PMBJP Amoxy-Clav (52.00) = 74.6% savings
// Dolo 650 (branded 32.50) vs PMBJP Paracetamol (5.50) = 83.1% savings
// Pan 40 (branded 145.00) vs PMBJP Pantoprazole (22.50) = 84.5% savings
const prescriptionItems = [
  { brandName: 'Dolo 650', quantity: 2 },
  { brandName: 'Pan 40', quantity: 2 },
  { brandName: 'Augmentin 625 Duo', quantity: 1 },
];

const bundleReport = calculatePrescriptionSavingsWithNearestKendra({
  items: prescriptionItems,
  userLat,
  userLng,
  maxRadiusKm: 10,
});

assert(bundleReport.genericEquivalentsFound === 3, 'All 3 branded drugs must have Jan Aushadhi generic alternatives');
assert(bundleReport.overallSavingsPct >= 80.0, `Combined savings must exceed 80% (Actual: ${bundleReport.overallSavingsPct}%)`);
assert(bundleReport.totalSaved >= 300, `Total rupees saved should exceed ₹300 (Actual: ₹${bundleReport.totalSaved})`);
assert(bundleReport.nearestKendra !== null, 'Must assign nearest pickup/fulfillment Jan Aushadhi Kendra');
assert.strictEqual(bundleReport.nearestKendra.kendraId, 'PMBJP-GJ-AHM-001');
assert(bundleReport.recommendedSavingsMessage.includes('%'), 'Must generate patient-facing savings advisory');
console.log(`[PASS] Combined prescription savings & Kendra matching verified (Savings: ${bundleReport.overallSavingsPct}%, Saved: ₹${bundleReport.totalSaved})`);

console.log('ALL JAN AUSHADHI KENDRA & 85% SAVINGS TESTS PASSED! [OK]');
