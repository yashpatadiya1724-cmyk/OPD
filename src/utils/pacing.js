/**
 * MediQ OPD Dynamic Pacing & Clinical Triage Queue Engine
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 * 
 * Mathematical Foundations:
 * 1. Exponentially Weighted Moving Average (EWMA) with outlier suppression
 * 2. Reverse-ETA Leave-Now Navigation Engine
 * 3. Multi-tier Emergency & Clinical Triage Priority Scoring with starvation guard
 */

/**
 * Calculates EWMA smoothed consultation duration with anomalous outlier suppression.
 * 
 * Formula: S_t = alpha * Y_t + (1 - alpha) * S_{t-1}
 * Suppresses outliers outside [1.0, 45.0] minutes to prevent temporary anomalies from distorting queue pacing.
 * 
 * @param {number} alpha - Smoothing factor between 0.0 and 1.0 (default: 0.35)
 * @param {number} currentAverage - Current EWMA rolling consultation duration in minutes
 * @param {number} newObservation - Newly observed doctor-patient consultation duration in minutes
 * @returns {number} Updated smoothed average rounded to 2 decimal places
 */
export function calculateEWMA(alpha, currentAverage, newObservation) {
  if (newObservation < 1.0 || newObservation > 45.0) {
    return currentAverage;
  }
  return Number((alpha * newObservation + (1 - alpha) * currentAverage).toFixed(2));
}

/**
 * Calculates reverse ETA "Leave-Now" departure timestamp for patient doorstep arrival.
 * 
 * @param {Date} appointmentTimestamp - Scheduled appointment datetime
 * @param {number} transitMinutes - Estimated driving/transit time via maps
 * @param {number} [parkingBuffer=8] - Estimated parking & hospital entry buffer in minutes
 * @param {number} [triageBuffer=4] - Clinical triage check-in buffer in minutes
 * @returns {Date} Recommended leave-now departure timestamp
 */
export function calculateLeaveNowTime(appointmentTimestamp, transitMinutes, parkingBuffer = 8, triageBuffer = 4) {
  const totalLeadTimeMs = (transitMinutes + parkingBuffer + triageBuffer) * 60 * 1000;
  return new Date(appointmentTimestamp.getTime() - totalLeadTimeMs);
}

/**
 * Multi-tier priority scoring table
 */
export const TRIAGE_LANES = {
  EMERGENCY: 1000,
  CRITICAL_CARE: 800,
  MATERNITY: 200,
  INFANT_PEDIATRIC: 150,
  SENIOR_CITIZEN: 100,
  DISABLED: 100,
  GENERAL: 0,
};

/**
 * Calculates multi-tier triage priority score for hospital queue ordering.
 * Includes anti-starvation aging bonus to ensure lower-priority patients are not indefinitely starved.
 * 
 * @param {string} lane - Clinical triage lane (EMERGENCY, CRITICAL_CARE, MATERNITY, INFANT_PEDIATRIC, SENIOR_CITIZEN, DISABLED, GENERAL)
 * @param {boolean} isPreBooked - Whether patient holds an advance booked appointment slot
 * @param {number} waitMinutes - Elapsed waiting time in minutes
 * @returns {number} Composite priority score (higher score = next called)
 */
export function calculatePriorityScore(lane, isPreBooked, waitMinutes = 0) {
  const normalizedLane = (lane || 'GENERAL').toUpperCase();
  const laneWeight = TRIAGE_LANES[normalizedLane] !== undefined
    ? TRIAGE_LANES[normalizedLane]
    : (['SENIOR', 'PREGNANT', 'DISABLED'].includes(normalizedLane) ? 50 : 0);

  const slotBonus = isPreBooked ? 30 : 0;
  // Anti-starvation aging bonus: +1 point per 2.5 minutes elapsed
  const agingBonus = Math.floor(waitMinutes / 2.5);

  return laneWeight + slotBonus + agingBonus;
}

/**
 * Estimates waiting time based on active queue position and doctor pacing.
 * 
 * @param {number} queuePosition - Patient's 1-based position in doctor queue
 * @param {number} doctorEWMA - Current EWMA consultation duration for the doctor
 * @param {number} parallelCounters - Active consulting doctors/desks (default: 1)
 * @returns {{ estimatedWaitMinutes: number, estimatedCallTime: Date }}
 */
export function estimateWaitTime(queuePosition, doctorEWMA, parallelCounters = 1) {
  const safePosition = Math.max(0, queuePosition - 1);
  const safeCounters = Math.max(1, parallelCounters);
  const estimatedWaitMinutes = Number(((safePosition * doctorEWMA) / safeCounters).toFixed(1));
  const estimatedCallTime = new Date(Date.now() + estimatedWaitMinutes * 60 * 1000);

  return { estimatedWaitMinutes, estimatedCallTime };
}
