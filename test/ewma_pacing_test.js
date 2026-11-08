/**
 * Test Suite: MediQ EWMA Pacing & Reverse-ETA Mathematical Engines
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 */

import assert from 'assert';
import {
  calculateEWMA,
  calculateLeaveNowTime,
  calculatePriorityScore,
} from '../src/utils/pacing.js';

// Execute Tests
console.log('Running MediQ Algorithmic Unit Tests...');

// Test 1: EWMA Smoothing
let rollingAvg = 6.5; // baseline minutes
const alpha = 0.35;
rollingAvg = calculateEWMA(alpha, rollingAvg, 8.0);
assert.strictEqual(rollingAvg, 7.03, 'EWMA should smooth upwards to 7.03');

// Test 2: Outlier Suppression
const suppressedAvg = calculateEWMA(alpha, rollingAvg, 120.0); // 120 min anomaly
assert.strictEqual(suppressedAvg, 7.03, 'Outlier > 45 mins must be suppressed');

// Test 3: Reverse ETA Calculation
const apptTime = new Date('2026-10-29T10:30:00Z');
const leaveTime = calculateLeaveNowTime(apptTime, 15, 8, 4); // 27 mins lead time
assert.strictEqual(leaveTime.toISOString(), '2026-10-29T10:03:00.000Z', 'Leave time must be 27 mins prior');

// Test 4: Priority Scoring
const emergencyScore = calculatePriorityScore('EMERGENCY', false, 0);
assert.strictEqual(emergencyScore, 1000, 'Emergency lane base weight is 1000');

const seniorPreBookedScore = calculatePriorityScore('SENIOR', true, 10);
// 50 (lane) + 30 (pre-booked) + 4 (10 / 2.5) = 84
assert.strictEqual(seniorPreBookedScore, 84, 'Senior pre-booked after 10 mins waiting gets 84 points');

console.log('ALL MEDIQ ALGORITHMIC UNIT TESTS PASSED!');
