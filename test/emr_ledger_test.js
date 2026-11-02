/**
 * Test Suite: EMR Double-Entry Ledger & Settlement Engine
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 */

import assert from 'assert';
import { EmrLedgerService } from '../src/db/emrLedger.js';

console.log('Running EMR Ledger & Financial Settlement Unit Tests...');

// Test 1: Balanced Settlement Construction
const entries = EmrLedgerService.createPharmacySettlement({
  orderId: 'ORDER-8821',
  patientPaidAmount: 350.00,
  pharmacyDisbursement: 280.00,
  riderFee: 50.00,
  platformFee: 20.00,
});

assert.strictEqual(entries.length, 3, 'Must create 3 disbursement legs');
assert.strictEqual(entries[0].amount, 280.00);
assert.strictEqual(entries[1].amount, 50.00);
assert.strictEqual(entries[2].amount, 20.00);
console.log('[PASS] Balanced settlement legs constructed');

// Test 2: Double-Entry Validation
const validation = EmrLedgerService.validateJournalBatch(entries);
assert.strictEqual(validation.balanced, true, 'Journal batch must be balanced');
assert.strictEqual(validation.difference, 0);
console.log('[PASS] Double-entry mathematical balance verified');

// Test 3: Imbalance Rejection
assert.throws(() => {
  EmrLedgerService.createPharmacySettlement({
    orderId: 'ORDER-8822',
    patientPaidAmount: 500.00, // Imbalance: 500 vs 280+50+20=350
    pharmacyDisbursement: 280.00,
    riderFee: 50.00,
    platformFee: 20.00,
  });
}, /Settlement imbalance/, 'Must throw error on financial imbalance');
console.log('[PASS] Financial imbalance error thrown and caught');

console.log('ALL EMR LEDGER TESTS PASSED SUCCESSFULLY! [OK]');
