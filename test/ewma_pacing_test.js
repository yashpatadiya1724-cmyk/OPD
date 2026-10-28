/**
 * Test Suite: MediQ EWMA Pacing & Reverse-ETA Mathematical Engines
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 */

import assert from 'assert';

// 1. EWMA Pacing Function
export function calculateEWMA(alpha, currentAverage, newObservation) {
  // Outlier suppression filter (1 min to 45 min)
  if (newObservation < 1.0 || newObservation > 45.0) {
    return currentAverage;
  }
  return Number((alpha * newObservation + (1 - alpha) * currentAverage).toFixed(2));
}

// 2. Reverse ETA Leave-Now Function
export function calculateLeaveNowTime(appointmentTimestamp, transitMinutes, parkingBuffer = 8, triageBuffer = 4) {
  const totalLeadTime = (transitMinutes + parkingBuffer + triageBuffer) * 60 * 1000;
  return new Date(appointmentTimestamp.getTime() - totalLeadTime);
}

// 3. Priority Lane Score Function
export function calculatePriorityScore(lane, isPreBooked, waitMinutes) {
  let laneWeight = 0;
  if (lane === 'EMERGENCY') laneWeight = 1000;
  else if (['SENIOR', 'PREGNANT', 'DISABLED'].includes(lane)) laneWeight = 50;
  
  const slotBonus = isPreBooked ? 30 : 0;
  const agingBonus = Math.floor(waitMinutes / 5);
  
  return laneWeight + slotBonus + agingBonus;
}

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
const expectedLeaveTime = new Date('2026-10-29T10:03:00Z');
assert.strictEqual(leaveTime.toISOString(), expectedLeaveTime.toISOString(), 'Leave-Now must be exactly 27 mins before appointment');

// Test 4: Priority Lane Triage
const emergencyScore = calculatePriorityScore('EMERGENCY', false, 2);
const seniorScore = calculatePriorityScore('SENIOR', true, 15);
const normalScore = calculatePriorityScore('NORMAL', false, 60);

assert.ok(emergencyScore >= 1000, 'Emergency triage score must be at least 1000');
assert.strictEqual(seniorScore, 50 + 30 + 3, 'Senior booked with 15m wait should have 83 points');
assert.strictEqual(normalScore, 12, 'Normal walk-in waiting 60 mins should accumulate 12 aging points');

console.log('✓ All 4 algorithmic test cases passed successfully!');
