/**
 * Test Suite: Hyperlocal 15-Minute Pharmacy Dispatch & Generic Medicine Cost Pilot
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 */

import assert from 'assert';
import {
  calculateHaversineDistanceKm,
  estimateDeliveryTimeMinutes,
  isEligibleFor15MinDelivery,
  allocateOptimalPharmacyPartner,
  createHyperlocalDispatchOrder,
  PILOT_CENTERS,
} from '../src/utils/pharmacyDispatchEngine.js';

console.log('Running Hyperlocal 15-Minute Pharmacy Dispatch Tests...');

// Test 1: Haversine distance accuracy
const distanceToGota = calculateHaversineDistanceKm(
  PILOT_CENTERS.SILVER_OAK_HOSPITAL.lat,
  PILOT_CENTERS.SILVER_OAK_HOSPITAL.lon,
  PILOT_CENTERS.PMBJP_GOTA.lat,
  PILOT_CENTERS.PMBJP_GOTA.lon
);
assert(distanceToGota > 0.5 && distanceToGota < 1.5, `Distance should be ~0.9 km, got ${distanceToGota} km`);
console.log(`[PASS] Haversine Distance Silver Oak -> Gota PMBJP: ${distanceToGota} km`);

// Test 2: 15-Minute SLA Time Estimation
const timeMinutes = estimateDeliveryTimeMinutes(distanceToGota);
assert(timeMinutes <= 15.0, `Delivery to nearby partner must be <= 15 min, got ${timeMinutes} min`);
assert.strictEqual(isEligibleFor15MinDelivery(distanceToGota), true);

// Far distance (> 5 km) should exceed 15-min SLA
assert.strictEqual(isEligibleFor15MinDelivery(6.5), false);
console.log(`[PASS] Delivery SLA calculated: ${timeMinutes} minutes (under 15-minute threshold)`);

// Test 3: Optimal Pharmacy Partner Allocation
const patientLocation = {
  lat: 23.0855,
  lon: 72.5342,
  address: 'Near Silver Oak Campus, SG Highway, Gota, Ahmedabad',
};

const prescriptionCart = [
  { brandName: 'Dolo 650', quantity: 2 },
  { brandName: 'Pan 40', quantity: 1 },
  { brandName: 'Augmentin 625 Duo', quantity: 1 },
];

const allocation = allocateOptimalPharmacyPartner({
  deliveryLocation: patientLocation,
  prescriptionItems: prescriptionCart,
});

assert.strictEqual(allocation.allocated, true);
assert.notStrictEqual(allocation.selectedPartner, null);
assert.strictEqual(allocation.selectedPartner.within15MinSla, true);
assert(allocation.savingsAnalysis.totalSaved > 300, 'Must reflect generic cost pilot savings');
console.log(`[PASS] Optimal partner selected: ${allocation.selectedPartner.pharmacyName} (${allocation.selectedPartner.distanceKm} km, ETA: ${allocation.selectedPartner.estimatedMinutes} min)`);

// Test 4: Dispatch Order Generation
const dispatchOrder = createHyperlocalDispatchOrder({
  prescriptionId: 'RX-2026-9081',
  patient: {
    name: 'Ketan Trivedi',
    phone: '+919825012345',
  },
  deliveryLocation: patientLocation,
  prescriptionItems: prescriptionCart,
});

assert(dispatchOrder.orderId.startsWith('DISPATCH-15M-'));
assert.strictEqual(dispatchOrder.status, 'ALLOCATED_TO_PARTNER');
assert.strictEqual(dispatchOrder.pricingSummary.janAushadhiPriceTotal, 85.5);
assert.strictEqual(dispatchOrder.pricingSummary.brandedMrpTotal, 414.8);
assert(dispatchOrder.pricingSummary.savingsPercentage > 75);
assert.strictEqual(dispatchOrder.pricingSummary.deliveryFee, 0.0);
console.log(`[PASS] Hyperlocal 15-Minute Dispatch Order Generated: ${dispatchOrder.orderId}`);
console.log(`- Patient generic savings: Rs. ${dispatchOrder.pricingSummary.patientSavedAmount} (${dispatchOrder.pricingSummary.savingsPercentage}%)`);

console.log('ALL HYPERLOCAL 15-MINUTE PHARMACY DISPATCH TESTS PASSED! [OK]\n');
