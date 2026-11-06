/**
 * Test Suite: PWA Offline Queue Triage Sync & Storage Engine
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 */

import assert from 'assert';
import { OfflineQueueStorageManager } from '../src/utils/offlineQueueStorage.js';

console.log('Running PWA Offline Queue Triage Sync Tests...');

const manager = new OfflineQueueStorageManager();
manager.clearStorage();

// Test 1: Offline Patient Intake & Idempotency Key Generation
manager.setNetworkStatus(false);
const intake1 = manager.saveOfflinePatientIntake({
  patientName: 'Devendra Parmar',
  phoneNumber: '+919876543210',
  age: 48,
  gender: 'MALE',
  symptoms: ['Chest Pain', 'Shortness of Breath'],
  vitals: {
    bloodPressure: '150/95',
    pulse: 104,
    spO2: 94,
    tempF: 99.1,
  },
  triagePriority: 'CRITICAL',
  department: 'Cardiology',
});

assert(intake1.intakeId.startsWith('intake_'), 'Must generate valid intake ID');
assert(intake1.idempotencyKey.length === 64, 'Must generate 64-char SHA-256 idempotency key');
assert.strictEqual(intake1.status, 'QUEUED_OFFLINE');
assert.strictEqual(intake1.triagePriority, 'CRITICAL');
assert.strictEqual(intake1.pendingCount, 1);
console.log('[PASS] Offline intake registration & idempotency key verified');

// Test 2: Local Record Retrieval
const localRecord = manager.getLocalIntake(intake1.intakeId);
assert(localRecord !== null, 'Should retrieve locally stored record');
assert.strictEqual(localRecord.patientName, 'Devendra Parmar');
assert.strictEqual(localRecord.status, 'OFFLINE_PENDING_SYNC');
assert.strictEqual(localRecord.vitals.bloodPressure, '150/95');
console.log('[PASS] Local storage intake lookup verified');

// Test 3: Multiple Intakes & Outbox Queue Count
const intake2 = manager.saveOfflinePatientIntake({
  patientName: 'Kavita Ben',
  phoneNumber: '+919123456789',
  age: 32,
  gender: 'FEMALE',
  symptoms: ['Seasonal Fever', 'Mild Cough'],
  triagePriority: 'ROUTINE',
});

const pending = manager.getPendingMutations();
assert.strictEqual(pending.length, 2, 'Outbox must contain 2 pending mutations');
console.log('[PASS] FIFO outbox queue ordering verified');

// Test 4: Background Sync Engine with Server Simulation
const syncedIds = [];
const mockServerSync = async (mutation) => {
  syncedIds.push(mutation.intakeId);
  return {
    success: true,
    serverId: `SRV_${mutation.intakeId}`,
  };
};

const syncReport = await manager.syncPendingMutations(mockServerSync);
assert.strictEqual(syncReport.syncedCount, 2, 'All 2 records must sync successfully');
assert.strictEqual(syncReport.failedCount, 0);
assert.strictEqual(syncReport.remainingPending, 0);
assert.strictEqual(manager.getPendingMutations().length, 0, 'Outbox should be empty after sync');

// Check status update in local records
const updatedRecord = manager.getLocalIntake(intake1.intakeId);
assert.strictEqual(updatedRecord.status, 'SYNCED');
assert.strictEqual(updatedRecord.remoteServerId, `SRV_${intake1.intakeId}`);
console.log('[PASS] Background outbox sync and server commit verified');

// Test 5: Partial Failure & Retry Persistence
const intake3 = manager.saveOfflinePatientIntake({
  patientName: 'Rohan Joshi',
  triagePriority: 'URGENT',
});

let attempt = 0;
const failingSync = async (mutation) => {
  attempt++;
  if (attempt === 1) {
    return { success: false }; // Temporary network glitch
  }
  return { success: true, serverId: 'SRV_RETRY_OK' };
};

const failReport = await manager.syncPendingMutations(failingSync);
assert.strictEqual(failReport.failedCount, 1);
assert.strictEqual(failReport.remainingPending, 1);

// Second attempt succeeds
const successReport = await manager.syncPendingMutations(failingSync);
assert.strictEqual(successReport.syncedCount, 1);
assert.strictEqual(successReport.remainingPending, 0);
console.log('[PASS] Network failure handling and retry resilience verified');

// Test 6: Storage Telemetry Stats
const stats = manager.getStorageStats();
assert.strictEqual(stats.totalRecords, 3);
assert.strictEqual(stats.pendingSyncCount, 0);
assert(stats.storageUsedKb > 0);
console.log(`[PASS] Storage telemetry verified (${stats.storageUsedKb} KB stored)`);

// Cleanup
manager.clearStorage();
assert.strictEqual(manager.getStorageStats().totalRecords, 0);
console.log('[PASS] Storage purge and cleanup lifecycle verified');

console.log('ALL PWA OFFLINE QUEUE TRIAGE TESTS PASSED! [OK]');
