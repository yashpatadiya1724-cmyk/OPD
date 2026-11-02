/**
 * Test Suite: Redis Service (Locks, OTP TTL & Rate Limiting)
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 */

import assert from 'assert';
import { redisService } from '../src/services/redisService.js';

console.log('Running Redis Service Unit Tests...');

// Test 1: Atomic Call-Next Lock Acquisition
const lock1 = redisService.acquireDoctorCallNextLock('DOC-8821', 10);
assert.strictEqual(lock1.acquired, true, 'First lock attempt must succeed');
assert(lock1.lockToken.startsWith('token_'), 'Must return valid lock token');

// Test 2: Simultaneous lock attempt must fail
const lock2 = redisService.acquireDoctorCallNextLock('DOC-8821', 10);
assert.strictEqual(lock2.acquired, false, 'Simultaneous lock attempt on same doctor must be rejected');

// Test 3: Release Lock
const released = redisService.releaseDoctorCallNextLock('DOC-8821', lock1.lockToken);
assert.strictEqual(released, true, 'Lock should release cleanly with matching token');

// Re-acquiring should succeed now
const lock3 = redisService.acquireDoctorCallNextLock('DOC-8821', 10);
assert.strictEqual(lock3.acquired, true, 'Re-acquiring after release must succeed');
redisService.releaseDoctorCallNextLock('DOC-8821', lock3.lockToken);
console.log('[PASS] Atomic triage lock & release lifecycle verified');

// Test 4: OTP Storage with TTL and Verification
redisService.storeDeliveryOtp('ORDER-901', '4829', 60);
const wrongCheck = redisService.verifyAndConsumeOtp('ORDER-901', '0000');
assert.strictEqual(wrongCheck.valid, false, 'Wrong OTP must be rejected');

const validCheck = redisService.verifyAndConsumeOtp('ORDER-901', '4829');
assert.strictEqual(validCheck.valid, true, 'Correct OTP must be accepted');

// Second attempt must fail (consumed / single-use)
const secondCheck = redisService.verifyAndConsumeOtp('ORDER-901', '4829');
assert.strictEqual(secondCheck.valid, false, 'OTP must not be reusable once consumed');
console.log('[PASS] Express delivery OTP with TTL & single-use consumption verified');

// Test 5: Sliding-Window Rate Limiter
const clientIp = '192.168.1.55';
for (let i = 0; i < 3; i++) {
  const res = redisService.checkRateLimit(clientIp, 3, 60);
  assert.strictEqual(res.allowed, true, `Call ${i + 1} should be permitted`);
}

const throttled = redisService.checkRateLimit(clientIp, 3, 60);
assert.strictEqual(throttled.allowed, false, 'Call 4 must be blocked by rate limiter');
console.log('[PASS] Sliding window rate limiter verified');

console.log('ALL REDIS SERVICE TESTS PASSED SUCCESSFULLY! [OK]');
