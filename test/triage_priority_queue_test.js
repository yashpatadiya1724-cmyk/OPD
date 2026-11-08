/**
 * Test Suite: MediQ Multi-Tier Clinical Triage Priority & Starvation Prevention Engine
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 * 
 * Verifies:
 * 1. Immediate preemption for EMERGENCY (1000) and CRITICAL_CARE (800) lanes
 * 2. Vulnerable cohort priority (MATERNITY, INFANT_PEDIATRIC, SENIOR_CITIZEN)
 * 3. Anti-starvation aging bonus progression over elapsed waiting time
 * 4. Multi-counter parallel desk queue estimation
 */

import assert from 'assert';
import {
  calculatePriorityScore,
  estimateWaitTime,
  TRIAGE_LANES,
} from '../src/utils/pacing.js';

console.log('--- Running MediQ Clinical Triage & Queue Pacing Unit Tests ---');

// 1. Emergency Preemption
const emergencyScore = calculatePriorityScore('EMERGENCY', false, 0);
const generalScore = calculatePriorityScore('GENERAL', true, 60); // pre-booked + 60 mins waiting
assert.ok(
  emergencyScore > generalScore,
  `Emergency (${emergencyScore}) must preempt pre-booked waiting general patient (${generalScore})`
);
console.log(`✅ Emergency lane preemption verified: ${emergencyScore} > ${generalScore}`);

// 2. Vulnerable Cohort Ordering
const criticalScore = calculatePriorityScore('CRITICAL_CARE', false, 0);
const maternityScore = calculatePriorityScore('MATERNITY', false, 5);
const pediatricScore = calculatePriorityScore('INFANT_PEDIATRIC', false, 5);
const seniorScore = calculatePriorityScore('SENIOR_CITIZEN', false, 5);
const standardGeneralScore = calculatePriorityScore('GENERAL', false, 5);

assert.ok(criticalScore > maternityScore, 'Critical care must precede maternity');
assert.ok(maternityScore > pediatricScore, 'Maternity must precede standard pediatric');
assert.ok(pediatricScore > seniorScore, 'Pediatric must precede senior');
assert.ok(seniorScore > standardGeneralScore, 'Senior must precede standard general');
console.log('✅ Vulnerable cohort hierarchy verified (Critical > Maternity > Pediatric > Senior > General)');

// 3. Anti-Starvation Aging Bonus
const zeroWaitScore = calculatePriorityScore('GENERAL', false, 0);
const tenMinWaitScore = calculatePriorityScore('GENERAL', false, 10);
const twentyFiveMinWaitScore = calculatePriorityScore('GENERAL', false, 25);

assert.strictEqual(zeroWaitScore, 0);
assert.strictEqual(tenMinWaitScore, 4); // 10 / 2.5 = 4
assert.strictEqual(twentyFiveMinWaitScore, 10); // 25 / 2.5 = 10
assert.ok(twentyFiveMinWaitScore > zeroWaitScore, 'Aging bonus must increase monotonically');
console.log('✅ Anti-starvation aging bonus verified (+1 pt per 2.5 mins)');

// 4. Multi-Counter Queue Estimation
const singleDeskEst = estimateWaitTime(5, 6.0, 1); // 4 patients ahead * 6 mins / 1 counter = 24 mins
assert.strictEqual(singleDeskEst.estimatedWaitMinutes, 24.0);

const dualDeskEst = estimateWaitTime(5, 6.0, 2); // 4 patients ahead * 6 mins / 2 counters = 12 mins
assert.strictEqual(dualDeskEst.estimatedWaitMinutes, 12.0);
console.log('✅ Multi-counter parallel desk queue wait estimation verified (1 desk: 24m vs 2 desks: 12m)');

console.log('--- Clinical Triage & Queue Pacing Unit Tests: ALL PASSED ---');
