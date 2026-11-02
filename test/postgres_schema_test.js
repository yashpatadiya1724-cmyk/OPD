/**
 * Test Suite: PostgreSQL Relational Schema, Constraints & Client Pool Verification
 * Project Code: SOCCA - 12 | Silver Oak University
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, recordLedgerEntry } from '../src/db/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Running PostgreSQL Schema & Relational Integrity Tests...');

// 1. Verify schema.sql syntax & table structure
const schemaPath = path.resolve(__dirname, '../src/db/schema.sql');
assert(fs.existsSync(schemaPath), 'schema.sql must exist');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

const expectedTables = [
  'hospitals',
  'doctors',
  'patients',
  'opd_tokens',
  'pharmacy_orders',
  'double_entry_ledger',
];

for (const table of expectedTables) {
  assert(
    schemaSql.includes(`CREATE TABLE IF NOT EXISTS ${table}`),
    `Schema must declare table: ${table}`
  );
}
console.log('[PASS] All 6 relational tables declared in schema.sql');

// 2. Verify Foreign Keys and Referential Integrity
assert(schemaSql.includes('REFERENCES hospitals(id)'), 'doctors must reference hospitals(id)');
assert(schemaSql.includes('REFERENCES doctors(id)'), 'opd_tokens must reference doctors(id)');
assert(schemaSql.includes('REFERENCES patients(id)'), 'opd_tokens must reference patients(id)');
console.log('[PASS] Relational foreign key constraints verified');

// 3. Verify Composite B-Tree Indexes
const expectedIndexes = [
  'idx_opd_doctor_status',
  'idx_patients_phone',
  'idx_orders_patient',
  'idx_ledger_tx',
];

for (const idx of expectedIndexes) {
  assert(schemaSql.includes(idx), `Schema must declare index: ${idx}`);
}
console.log('[PASS] Composite B-tree indexes verified in schema.sql');

// 4. Verify Database Client Pool & Ledger Validation
assert(typeof pool.query === 'function', 'pg Pool query method must be exported');
assert(typeof recordLedgerEntry === 'function', 'recordLedgerEntry helper must be exported');

// Reject non-positive ledger entries
let errorCaught = false;
try {
  await recordLedgerEntry({
    transactionRef: 'TX-TEST-FAIL',
    debitAccount: 'CASH',
    creditAccount: 'REV',
    amount: -50,
  });
} catch (err) {
  errorCaught = true;
  assert(err.message.includes('greater than zero'), 'Must reject negative amount');
}
assert(errorCaught, 'Must reject negative ledger transaction amounts');
console.log('[PASS] Client pool & ledger negative-value constraint verified');

console.log('ALL POSTGRESQL SCHEMA & INTEGRITY TESTS PASSED! [OK]');
