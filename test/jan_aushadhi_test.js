/**
 * Test Suite: Jan Aushadhi (PMBJP) Generic Salt Equivalence Engine
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 */

import assert from 'assert';
import {
  findGenericAlternative,
  calculatePrescriptionSavings,
  searchBySaltOrCategory,
  JAN_AUSHADHI_CATALOG,
} from '../src/utils/janAushadhiComparator.js';

console.log('Running Jan Aushadhi Comparator Unit Tests...');

// Test 1: Catalog Integrity
assert(JAN_AUSHADHI_CATALOG.length >= 20, 'Catalog should contain at least 20 essential formulations');
const sample = JAN_AUSHADHI_CATALOG[0];
assert(sample.pmbjpProductCode.startsWith('PMBJP-'), 'Product code must follow PMBJP convention');
assert(sample.brandedMrp > sample.pmbjpPrice, 'Generic price must be cheaper than branded MRP');

// Test 2: Find Generic Alternative by Brand Name (Dolo 650)
const doloAlternative = findGenericAlternative('Dolo 650');
assert.notStrictEqual(doloAlternative, null, 'Must find alternative for Dolo 650');
assert.strictEqual(doloAlternative.genericName, 'Paracetamol Tablets IP 650mg');
assert.strictEqual(doloAlternative.pmbjpPrice, 5.50);
assert(doloAlternative.percentageSavings > 80, 'Dolo 650 generic savings must be > 80%');
console.log(`[PASS] Dolo 650 -> PMBJP: Saved ${doloAlternative.percentageSavings}%`);

// Test 3: Find Generic Alternative by Active Salt query
const augmentinAlternative = findGenericAlternative('Amoxicillin 500mg');
assert.notStrictEqual(augmentinAlternative, null, 'Must find alternative for Amoxicillin salt query');
assert.strictEqual(augmentinAlternative.brandName, 'Augmentin 625 Duo');
assert.strictEqual(augmentinAlternative.pmbjpPrice, 52.00);
console.log(`[PASS] Amoxicillin salt query matched Augmentin (Saved ${augmentinAlternative.percentageSavings}%)`);

// Test 4: Prescription Cart Savings Calculator
const patientCart = [
  { brandName: 'Dolo 650', quantity: 2 },        // 2 x 32.50 = 65.00 vs 2 x 5.50 = 11.00
  { brandName: 'Pan 40', quantity: 1 },          // 1 x 145.00 = 145.00 vs 1 x 22.50 = 22.50
  { brandName: 'Augmentin 625 Duo', quantity: 1 },// 1 x 204.80 = 204.80 vs 1 x 52.00 = 52.00
];

const savings = calculatePrescriptionSavings(patientCart);
console.log('Prescription Savings Summary:');
console.log(`- Branded Cost: Rs. ${savings.totalBrandedCost}`);
console.log(`- Jan Aushadhi Cost: Rs. ${savings.totalGenericCost}`);
console.log(`- Total Patient Savings: Rs. ${savings.totalSaved} (${savings.overallSavingsPct}%)`);

assert.strictEqual(savings.totalItems, 3);
assert.strictEqual(savings.genericEquivalentsFound, 3);
assert.strictEqual(savings.totalBrandedCost, 414.80);
assert.strictEqual(savings.totalGenericCost, 85.50);
assert.strictEqual(savings.totalSaved, 329.30);
assert(savings.overallSavingsPct > 75, 'Overall savings should exceed 75%');

// Test 5: Search by therapeutic category
const antibiotics = searchBySaltOrCategory('Antibiotic');
assert(antibiotics.length >= 3, 'Must return multiple antibiotic formulations');
console.log(`[PASS] Category Search: Found ${antibiotics.length} antibiotic formulations`);

console.log('ALL Jan Aushadhi Comparator TESTS PASSED SUCCESSFULLY! [OK]');
