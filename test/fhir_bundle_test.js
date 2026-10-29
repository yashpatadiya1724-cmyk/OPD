/**
 * Test Suite: ABDM FHIR R4 Bundle Generator & Validation
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 */

import assert from 'assert';
import {
  createAbdmPrescriptionBundle,
  validateAbdmBundle,
  isValidAbhaAddress,
} from '../src/utils/fhirBundleGenerator.js';

console.log('Running ABDM FHIR R4 Bundle Generator Unit Tests...');

// Test 1: ABHA Address validation
assert.strictEqual(isValidAbhaAddress('ravi.patel@abdm'), true);
assert.strictEqual(isValidAbhaAddress('patel_123@sbx'), true);
assert.strictEqual(isValidAbhaAddress('invalid@gmail.com'), false);
assert.strictEqual(isValidAbhaAddress(''), false);
console.log('[PASS] ABHA Address syntax validator verified');

// Test 2: Generate valid prescription bundle
const sampleConsultation = {
  patient: {
    name: 'Ravi Kumar Patel',
    abhaAddress: 'ravi.patel@abdm',
    gender: 'male',
    dob: '1996-04-12',
    phone: '+919876543210',
  },
  doctor: {
    name: 'Dr. Bhavik Mehta',
    nmcRegistrationNumber: 'GMC-58492-GUJ',
  },
  encounter: {
    visitDate: '2026-10-29T10:15:00Z',
  },
  medications: [
    {
      name: 'Paracetamol Tablets IP 650mg',
      pmbjpCode: 'PMBJP-TAB-014',
      dosage: '1 tablet thrice daily after food',
      frequency: 3,
    },
    {
      name: 'Pantoprazole Gastro-resistant Tablets IP 40mg',
      pmbjpCode: 'PMBJP-TAB-212',
      dosage: '1 tablet once daily before breakfast',
      frequency: 1,
    },
  ],
  hospital: {
    name: 'Silver Oak Super-Speciality Hospital OPD',
  },
};

const bundle = createAbdmPrescriptionBundle(sampleConsultation);

// Test 3: Structural verification
assert.strictEqual(bundle.resourceType, 'Bundle');
assert.strictEqual(bundle.type, 'document');
assert(bundle.entry.length === 6, 'Should have 6 entries: 1 Composition + 1 Patient + 1 Practitioner + 1 Encounter + 2 MedicationRequests');

// Composition is 1st entry per NHA specification
const composition = bundle.entry[0].resource;
assert.strictEqual(composition.resourceType, 'Composition');
assert.strictEqual(composition.status, 'final');
assert.strictEqual(composition.type.coding[0].code, '440545006'); // SNOMED CT for Prescription Record

// Verify Patient resource
const patientEntry = bundle.entry.find((e) => e.resource.resourceType === 'Patient');
assert.notStrictEqual(patientEntry, undefined);
assert.strictEqual(patientEntry.resource.identifier[0].value, 'ravi.patel@abdm');

// Verify Practitioner resource
const practitionerEntry = bundle.entry.find((e) => e.resource.resourceType === 'Practitioner');
assert.notStrictEqual(practitionerEntry, undefined);
assert.strictEqual(practitionerEntry.resource.identifier[0].value, 'GMC-58492-GUJ');

// Verify MedicationRequests
const medicationEntries = bundle.entry.filter((e) => e.resource.resourceType === 'MedicationRequest');
assert.strictEqual(medicationEntries.length, 2);
assert.strictEqual(medicationEntries[0].resource.medicationCodeableConcept.coding[0].code, 'PMBJP-TAB-014');

// Test 4: Run Bundle Validator
const validationResult = validateAbdmBundle(bundle);
assert.strictEqual(validationResult.isValid, true);
assert.strictEqual(validationResult.errors.length, 0);
console.log(`[PASS] Generated FHIR R4 Bundle conforms to ABDM standard with ${bundle.entry.length} entries`);

console.log('ALL ABDM FHIR R4 TESTS PASSED SUCCESSFULLY! [OK]');
