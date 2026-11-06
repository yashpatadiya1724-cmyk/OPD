/**
 * MediQ Hyperlocal 15-Minute Pharmacy Dispatch & Generic Medicine Cost Pilot Engine
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 * 
 * Computes sub-15 minute delivery routing, partner pharmacy stock allocation,
 * Jan Aushadhi generic substitution cost pilots, and rider dispatch tracking.
 */

import { findGenericAlternative, calculatePrescriptionSavings } from './janAushadhiComparator.js';

/**
 * Hospital Campus & Pilot Corridor Coordinates (Silver Oak University, Ahmedabad)
 */
export const PILOT_CENTERS = {
  SILVER_OAK_HOSPITAL: { lat: 23.0841, lon: 72.5358, name: 'Silver Oak Super-Speciality Hospital OPD' },
  PMBJP_GOTA: { lat: 23.0912, lon: 72.5312, name: 'Jan Aushadhi Kendra Gota Chowk', id: 'PMBJP-01' },
  PMBJP_SOLA: { lat: 23.0784, lon: 72.5298, name: 'PMBJP Sola Civil Road Partner', id: 'PMBJP-02' },
  PMBJP_SCIENCE_CITY: { lat: 23.0792, lon: 72.5085, name: 'Jan Aushadhi Science City Store', id: 'PMBJP-03' },
};

/**
 * Calculates Haversine great-circle distance between two GPS coordinates in kilometers.
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Estimates delivery transit time in minutes given distance in km.
 * Assumes 3.5 min packing/verification buffer and 22 km/h average delivery scooter transit in urban corridor.
 */
export function estimateDeliveryTimeMinutes(distanceKm, packagingMinutes = 3.5) {
  const averageSpeedKmH = 22.0;
  const transitMinutes = (distanceKm / averageSpeedKmH) * 60;
  return Number((packagingMinutes + transitMinutes).toFixed(1));
}

/**
 * Evaluates whether an address is within the 15-Minute SLA Delivery Radius (<= 3.8 km).
 */
export function isEligibleFor15MinDelivery(distanceKm) {
  const estimatedTime = estimateDeliveryTimeMinutes(distanceKm);
  return estimatedTime <= 15.0;
}

/**
 * Finds the optimal Jan Aushadhi partner pharmacy capable of fulfilling the prescription within SLA.
 * 
 * @param {Object} params
 * @param {Object} params.deliveryLocation - { lat, lon, address }
 * @param {Array<Object>} params.prescriptionItems - Cart of prescribed medicines
 * @param {Array<Object>} [params.pharmacies] - List of registered partner stores
 * @returns {Object} Selected partner, route metrics, and generic savings summary
 */
export function allocateOptimalPharmacyPartner({
  deliveryLocation,
  prescriptionItems = [],
  pharmacies = null,
}) {
  const partnerList = pharmacies || [
    { ...PILOT_CENTERS.PMBJP_GOTA, inventoryCoverage: 0.98, operational: true },
    { ...PILOT_CENTERS.PMBJP_SOLA, inventoryCoverage: 0.92, operational: true },
    { ...PILOT_CENTERS.PMBJP_SCIENCE_CITY, inventoryCoverage: 0.95, operational: true },
  ];

  if (!deliveryLocation || typeof deliveryLocation.lat !== 'number' || typeof deliveryLocation.lon !== 'number') {
    throw new Error('Invalid delivery location coordinates');
  }

  // Calculate prescription savings
  const savingsAnalysis = calculatePrescriptionSavings(prescriptionItems);

  // Evaluate candidate partners
  const candidates = partnerList
    .filter((p) => p.operational)
    .map((pharmacy) => {
      const distanceKm = calculateHaversineDistanceKm(
        pharmacy.lat,
        pharmacy.lon,
        deliveryLocation.lat,
        deliveryLocation.lon
      );
      const estimatedMinutes = estimateDeliveryTimeMinutes(distanceKm);
      const within15MinSla = estimatedMinutes <= 15.0;

      return {
        pharmacyId: pharmacy.id,
        pharmacyName: pharmacy.name,
        distanceKm,
        estimatedMinutes,
        within15MinSla,
        inventoryCoverage: pharmacy.inventoryCoverage,
      };
    })
    .sort((a, b) => {
      // Prioritize 15-min SLA first, then distance
      if (a.within15MinSla && !b.within15MinSla) return -1;
      if (!a.within15MinSla && b.within15MinSla) return 1;
      return a.distanceKm - b.distanceKm;
    });

  const selected = candidates[0] || null;

  return {
    allocated: !!selected,
    selectedPartner: selected,
    allCandidates: candidates,
    savingsAnalysis,
    pilotCorridor: 'Silver Oak - Gota Hyperlocal Cluster',
  };
}

/**
 * Generates an immutable Hyperlocal 15-Minute Dispatch Order.
 */
export function createHyperlocalDispatchOrder({
  prescriptionId,
  patient,
  deliveryLocation,
  prescriptionItems,
  targetSlaMinutes = 15,
}) {
  const allocation = allocateOptimalPharmacyPartner({
    deliveryLocation,
    prescriptionItems,
  });

  if (!allocation.allocated) {
    throw new Error('No operational Jan Aushadhi partner available in corridor');
  }

  const orderId = `DISPATCH-15M-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const now = new Date();
  const slaTargetTime = new Date(now.getTime() + targetSlaMinutes * 60 * 1000);

  return {
    orderId,
    prescriptionId,
    patient: {
      name: patient.name,
      phone: patient.phone,
      address: deliveryLocation.address || 'Ahmedabad, Gujarat',
    },
    selectedPartner: allocation.selectedPartner,
    orderTimestamp: now.toISOString(),
    slaTargetTimestamp: slaTargetTime.toISOString(),
    status: 'ALLOCATED_TO_PARTNER',
    lifecycle: [
      { status: 'PRESCRIPTION_VERIFIED', timestamp: now.toISOString() },
      { status: 'ALLOCATED_TO_PARTNER', timestamp: now.toISOString(), partnerId: allocation.selectedPartner.pharmacyId },
    ],
    pricingSummary: {
      brandedMrpTotal: allocation.savingsAnalysis.totalBrandedCost,
      janAushadhiPriceTotal: allocation.savingsAnalysis.totalGenericCost,
      patientSavedAmount: allocation.savingsAnalysis.totalSaved,
      savingsPercentage: allocation.savingsAnalysis.overallSavingsPct,
      deliveryFee: 0.0, // Subsidized in 15-min pilot
    },
  };
}
