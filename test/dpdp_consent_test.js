/**
 * Test Suite: DPDP Act 2023 Digital Consent Architecture & FHIR R4 Data Minimization
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 */

import assert from 'assert';
import {
  maskPatientName,
  maskPhoneNumber,
  createPatientConsentReceipt,
  verifyConsentReceipt,
  revokeConsentReceipt,
  filterFhirBundleWithConsent,
  DPDP_PURPOSES,
} from '../src/utils/dpdpConsentManager.js';
import { createAbdmPrescriptionBundle } from '../src/utils/fhirBundleGenerator.js';

console.log('Running DPDP Act 2023 Digital Consent Architecture Tests...');

// Test 1: PII Masking Utilities
assert.strictEqual(maskPatientName('Ramesh Kumar Sharma'), 'R*** K*** S***');
assert.strictEqual(maskPatientName('Anya'), 'A***');
assert.strictEqual(maskPatientName(''), 'P***');

assert.strictEqual(maskPhoneNumber('+919876543210'), '+91987****210');
assert.strictEqual(maskPhoneNumber('123'), '***-***-****');
console.log('[PASS] PII Masking verified for TV display and public monitors');

// Test 2: Create Consent Receipt & Cryptographic Verification
const receipt = createPatientConsentReceipt({
  patientId: 'PT-AHM-9021',
  abhaAddress: 'ravi.patel@abdm',
  hospitalId: 'SOU-HOSP-01',
  doctorId: 'DOC-58492',
  purposes: [DPDP_PURPOSES.OPD_CONSULTATION, DPDP_PURPOSES.PHARMACY_DISPATCH],
  validDurationHours: 12,
});

assert(receipt.consentToken.startsWith('DPDP-'));
assert(receipt.cryptographicChecksum.length === 64, 'SHA-256 checksum must be 64 hex chars');
const verified = verifyConsentReceipt(receipt);
assert.strictEqual(verified.valid, true);
assert.strictEqual(verified.reason, 'CONSENT_ACTIVE_AND_VERIFIED');
console.log(`[PASS] Digital Consent Receipt created: ${receipt.consentToken} with SHA-256 integrity`);

// Test 3: Tamper Detection
const tamperedReceipt = { ...receipt, patientId: 'PT-HACKED-9999' };
const tamperCheck = verifyConsentReceipt(tamperedReceipt);
assert.strictEqual(tamperCheck.valid, false);
assert.strictEqual(tamperCheck.reason, 'TAMPER_DETECTED_HASH_MISMATCH');
console.log('[PASS] Cryptographic tamper detection prevented unauthorized consent alteration');

// Test 4: Revocation Lifecycle
const revoked = revokeConsentReceipt(receipt, 'PATIENT_REQUESTED_DATA_REMOVAL');
assert.strictEqual(revoked.revoked, true);
assert.strictEqual(revoked.revocationReason, 'PATIENT_REQUESTED_DATA_REMOVAL');
const verifyRevoked = verifyConsentReceipt(revoked);
assert.strictEqual(verifyRevoked.valid, false);
assert.strictEqual(verifyRevoked.reason, 'CONSENT_REVOKED');
console.log('[PASS] Consent revocation lifecycle per DPDP Section 6(4) verified');

// Test 5: Integration with HL7 FHIR R4 Bundle & Data Minimization
const sampleConsultation = {
  patient: {
    name: 'Suresh Patel',
    abhaAddress: 'suresh.patel@abdm',
    gender: 'male',
    dob: '1985-06-20',
    phone: '+919825100000',
  },
  doctor: {
    name: 'Dr. Bhavik Mehta',
    nmcRegistrationNumber: 'GMC-58492-GUJ',
  },
  encounter: {
    visitDate: '2026-11-07T10:00:00Z',
  },
  medications: [
    {
      name: 'Paracetamol Tablets IP 650mg',
      pmbjpCode: 'PMBJP-TAB-014',
      dosage: '1 tab thrice daily',
      frequency: 3,
    },
  ],
  hospital: {
    name: 'Silver Oak Super-Speciality Hospital',
  },
};

const fhirBundle = createAbdmPrescriptionBundle(sampleConsultation);

// 5a: Clinical Purpose (Full PII preserved with consent tag)
const clinicalReceipt = createPatientConsentReceipt({
  patientId: 'PT-001',
  hospitalId: 'SOU-HOSP-01',
  purposes: [DPDP_PURPOSES.OPD_CONSULTATION],
});

const clinicalExport = filterFhirBundleWithConsent(fhirBundle, clinicalReceipt);
const patientRes = clinicalExport.entry.find((e) => e.resource.resourceType === 'Patient').resource;
assert.strictEqual(patientRes.name[0].text, 'Suresh Patel');
assert(clinicalExport.meta.tag.some((t) => t.code === clinicalReceipt.consentToken));
console.log('[PASS] Clinical export preserves required medical identifiers with audit tag');

// 5b: Research Purpose (Anonymized PII per Section 9 Data Minimization)
const researchReceipt = createPatientConsentReceipt({
  patientId: 'PT-001',
  hospitalId: 'SOU-HOSP-01',
  purposes: [DPDP_PURPOSES.RESEARCH_ANALYTICS],
});

const researchExport = filterFhirBundleWithConsent(fhirBundle, researchReceipt);
const anonPatient = researchExport.entry.find((e) => e.resource.resourceType === 'Patient').resource;
assert.strictEqual(anonPatient.name[0].text, 'ANONYMIZED_PATIENT');
assert.strictEqual(anonPatient.telecom.length, 0);
assert.strictEqual(anonPatient.gender, 'male', 'Epidemiological non-identifying fields preserved');
assert.strictEqual(researchExport.meta.security[0].code, 'R');
console.log('[PASS] Research export applies Data Minimization (redacts PII, preserves clinical stats)');

// 5c: Deny Export on Revoked Consent
assert.throws(() => {
  filterFhirBundleWithConsent(fhirBundle, revoked);
}, /DPDP Consent Denied/);
console.log('[PASS] FHIR export automatically refused when consent is revoked or invalid');

console.log('ALL DPDP ACT 2023 CONSENT TESTS PASSED SUCCESSFULLY! [OK]\n');
