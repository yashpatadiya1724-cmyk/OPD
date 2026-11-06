/**
 * Test Suite: Real-Time Doctor Token Display Board (Redis Pub/Sub & WebSockets)
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 */

import assert from 'assert';
import { redisService } from '../src/services/redisService.js';

console.log('Running Real-Time Doctor Token Display Board Tests...');

// Test 1: Sub-10ms Token Call Broadcast & Subscriber Receiving
let receivedEvent = null;
const unsubscribe = redisService.subscribeTokenUpdates('hosp-silver-oak', (event) => {
  receivedEvent = event;
});

const t0 = performance.now();
const result = redisService.publishTokenCall({
  hospitalId: 'hosp-silver-oak',
  doctorId: 'DOC-NEURO-01',
  doctorName: 'Dr. Utkarsh Barad',
  roomNumber: '302',
  tokenNumber: 42,
  patientName: 'Ramesh Patel',
  priority: 'EMERGENCY',
  soundAlert: true,
});
const latency = performance.now() - t0;

assert.strictEqual(result.published, true, 'Token call must publish successfully');
assert.strictEqual(result.recipientCount, 1, 'Should reach registered subscriber');
assert(receivedEvent !== null, 'Subscriber must receive the published event');
assert.strictEqual(receivedEvent.tokenNumber, 42, 'Token number must match');
assert.strictEqual(receivedEvent.roomNumber, '302', 'Room number must match');
assert.strictEqual(receivedEvent.priority, 'EMERGENCY');
assert.strictEqual(receivedEvent.soundAlert, true);
assert(latency < 10.0, `Broadcast latency must be sub-10ms (Actual: ${latency.toFixed(2)}ms)`);
console.log(`[PASS] Sub-10ms token call broadcast verified (Latency: ${latency.toFixed(3)}ms)`);

// Test 2: DPDP Act Privacy Patient Name Masking
assert.strictEqual(
  receivedEvent.maskedPatientName,
  'R*** P***',
  'Patient name must be masked on public display (DPDP Act Section 9)'
);
assert.strictEqual(redisService.maskDisplayPatientName('Sanjay'), 'S***');
assert.strictEqual(redisService.maskDisplayPatientName(''), '—');
console.log('[PASS] DPDP Act patient name masking verified on display events');

// Test 3: Active Board State Snapshot
const boardState = redisService.getActiveBoardState('hosp-silver-oak');
assert.strictEqual(boardState.length, 1);
assert.strictEqual(boardState[0].doctorId, 'DOC-NEURO-01');
assert.strictEqual(boardState[0].roomStatus, 'ACTIVE_SERVING');
console.log('[PASS] Active waiting room board state verified');

// Test 4: Doctor Room Status Update (Emergency / Delay)
let roomStatusEvent = null;
const unsub2 = redisService.subscribeTokenUpdates('hosp-silver-oak', (event) => {
  if (event.type === 'ROOM_STATUS_CHANGED') {
    roomStatusEvent = event;
  }
});

redisService.updateDoctorRoomStatus(
  'hosp-silver-oak',
  'DOC-NEURO-01',
  '302',
  'EMERGENCY_IN_ROOM',
  'Code Red patient admitted'
);

assert(roomStatusEvent !== null, 'Room status update must be broadcast');
assert.strictEqual(roomStatusEvent.status, 'EMERGENCY_IN_ROOM');
assert.strictEqual(roomStatusEvent.reason, 'Code Red patient admitted');

const updatedBoard = redisService.getActiveBoardState('hosp-silver-oak');
assert.strictEqual(updatedBoard[0].roomStatus, 'EMERGENCY_IN_ROOM');
console.log('[PASS] Doctor room status change (Emergency/Delay) broadcast verified');

// Test 5: Unsubscribe Cleanup
unsubscribe();
unsub2();
const nextCall = redisService.publishTokenCall({
  hospitalId: 'hosp-silver-oak',
  doctorId: 'DOC-CARDIO-02',
  tokenNumber: 15,
});
assert.strictEqual(nextCall.recipientCount, 0, 'No events delivered after unsubscription');
console.log('[PASS] Subscriber cleanup and leak prevention verified');

console.log('ALL TOKEN DISPLAY BROADCASTER TESTS PASSED! [OK]');
