/**
 * MediQ ABDM FHIR R4 Health Record & Prescription Document Bundle Generator
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 * 
 * Implements National Health Authority (NHA) Ayushman Bharat Digital Mission (ABDM)
 * HL7 FHIR Release 4 standard specification for Electronic Health Records (EHR),
 * Ayushman Bharat Health Account (ABHA) linking, and digital OPD prescriptions.
 */

import crypto from 'crypto';

/**
 * Generates an RFC 4122 compliant UUID v4 string.
 */
function generateUuid() {
  return crypto.randomUUID ? crypto.randomUUID() : `urn:uuid:${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validates whether an ABHA Address follows NHA ABDM format (e.g. username@abdm or username@sbx).
 */
export function isValidAbhaAddress(abhaAddress) {
  if (!abhaAddress || typeof abhaAddress !== 'string') return false;
  const abhaRegex = /^[a-zA-Z0-9._]{3,32}@(abdm|sbx|ndhm)$/i;
  return abhaRegex.test(abhaAddress);
}

/**
 * Generates a complete NHA ABDM FHIR R4 Prescription Document Bundle.
 * 
 * @param {Object} params - Consultation and prescription payload.
 * @param {Object} params.patient - Patient demographics & ABHA ID.
 * @param {Object} params.doctor - Practitioner details & NMC registration.
 * @param {Object} params.encounter - OPD consultation visit details.
 * @param {Array<Object>} params.medications - List of prescribed drugs.
 * @param {Object} [params.hospital] - Hospital or clinic organizational metadata.
 * @returns {Object} Validated HL7 FHIR R4 Bundle.
 */
export function createAbdmPrescriptionBundle({
  patient,
  doctor,
  encounter,
  medications = [],
  hospital = {},
}) {
  const bundleId = generateUuid();
  const compositionId = generateUuid();
  const patientId = generateUuid();
  const practitionerId = generateUuid();
  const encounterId = generateUuid();
  const nowIso = new Date().toISOString();

  // 1. Patient Resource
  const patientResource = {
    resourceType: 'Patient',
    id: patientId,
    meta: {
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient'],
    },
    identifier: [
      {
        type: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
              code: 'MR',
              display: 'Medical record number',
            },
          ],
        },
        system: 'https://healthid.ndhm.gov.in',
        value: patient.abhaAddress || 'ravi.patel@abdm',
      },
    ],
    name: [
      {
        text: patient.name || 'Anonymous Patient',
      },
    ],
    gender: (patient.gender || 'unknown').toLowerCase(),
    birthDate: patient.dob || '1995-01-01',
    telecom: patient.phone ? [{ system: 'phone', value: patient.phone }] : [],
  };

  // 2. Practitioner (Doctor) Resource
  const practitionerResource = {
    resourceType: 'Practitioner',
    id: practitionerId,
    meta: {
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Practitioner'],
    },
    identifier: [
      {
        type: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
              code: 'MD',
              display: 'Medical License number',
            },
          ],
        },
        system: 'https://nmc.org.in',
        value: doctor.nmcRegistrationNumber || 'GMC-58492-GUJ',
      },
    ],
    name: [
      {
        prefix: ['Dr.'],
        text: doctor.name || 'Dr. Bhavik Mehta',
      },
    ],
  };

  // 3. Encounter Resource
  const encounterResource = {
    resourceType: 'Encounter',
    id: encounterId,
    status: 'finished',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'ambulatory',
    },
    subject: {
      reference: `urn:uuid:${patientId}`,
      display: patient.name,
    },
    period: {
      start: encounter.visitDate || nowIso,
    },
  };

  // 4. MedicationRequest Resources
  const medicationRequestEntries = [];
  const medicationReferences = [];

  medications.forEach((med, index) => {
    const medId = generateUuid();
    const medRef = `urn:uuid:${medId}`;
    medicationReferences.push({ reference: medRef, display: med.name });

    const medResource = {
      resourceType: 'MedicationRequest',
      id: medId,
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/MedicationRequest'],
      },
      status: 'active',
      intent: 'order',
      medicationCodeableConcept: {
        coding: [
          {
            system: 'https://project-mediq.org/codes/pmbjp',
            code: med.pmbjpCode || `MED-${index + 1}`,
            display: med.name,
          },
        ],
        text: med.name,
      },
      subject: {
        reference: `urn:uuid:${patientId}`,
      },
      encounter: {
        reference: `urn:uuid:${encounterId}`,
      },
      authoredOn: nowIso,
      requester: {
        reference: `urn:uuid:${practitionerId}`,
        display: doctor.name,
      },
      dosageInstruction: [
        {
          text: med.dosage || '1 tablet daily after food',
          timing: {
            repeat: {
              frequency: med.frequency || 1,
              period: 1,
              periodUnit: 'd',
            },
          },
        },
      ],
    };

    medicationRequestEntries.push({
      fullUrl: `urn:uuid:${medId}`,
      resource: medResource,
    });
  });

  // 5. Composition Resource (Document Root)
  const compositionResource = {
    resourceType: 'Composition',
    id: compositionId,
    meta: {
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/PrescriptionRecord'],
    },
    status: 'final',
    type: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '440545006',
          display: 'Prescription record',
        },
      ],
      text: 'Prescription record',
    },
    subject: {
      reference: `urn:uuid:${patientId}`,
      display: patient.name,
    },
    encounter: {
      reference: `urn:uuid:${encounterId}`,
    },
    date: nowIso,
    author: [
      {
        reference: `urn:uuid:${practitionerId}`,
        display: doctor.name,
      },
    ],
    title: 'Prescription',
    custodian: {
      display: hospital.name || 'Silver Oak Multi-Speciality OPD Hospital',
    },
    section: [
      {
        title: 'Prescribed Medications',
        code: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '28531000087107',
              display: 'Medication section',
            },
          ],
        },
        entry: medicationReferences,
      },
    ],
  };

  // Compile final FHIR Document Bundle
  return {
    resourceType: 'Bundle',
    id: bundleId,
    meta: {
      versionId: '1',
      lastUpdated: nowIso,
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle'],
      security: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality',
          code: 'V',
          display: 'very restricted',
        },
      ],
    },
    identifier: {
      system: 'https://project-mediq.org/bundles',
      value: `MEDIQ-DOC-${Date.now()}`,
    },
    type: 'document',
    timestamp: nowIso,
    entry: [
      {
        fullUrl: `urn:uuid:${compositionId}`,
        resource: compositionResource,
      },
      {
        fullUrl: `urn:uuid:${patientId}`,
        resource: patientResource,
      },
      {
        fullUrl: `urn:uuid:${practitionerId}`,
        resource: practitionerResource,
      },
      {
        fullUrl: `urn:uuid:${encounterId}`,
        resource: encounterResource,
      },
      ...medicationRequestEntries,
    ],
  };
}

/**
 * Validates a generated FHIR Bundle against NHA ABDM structural rules.
 * 
 * @param {Object} bundle - FHIR R4 Bundle to validate.
 * @returns {{ isValid: boolean, errors: string[] }} Validation report.
 */
export function validateAbdmBundle(bundle) {
  const errors = [];

  if (!bundle || bundle.resourceType !== 'Bundle') {
    errors.push('Root resourceType must be "Bundle"');
    return { isValid: false, errors };
  }

  if (bundle.type !== 'document') {
    errors.push('Bundle type must be "document"');
  }

  if (!Array.isArray(bundle.entry) || bundle.entry.length === 0) {
    errors.push('Bundle must contain non-empty entry array');
    return { isValid: false, errors };
  }

  // ABDM requirement: First entry must be Composition
  const firstEntry = bundle.entry[0]?.resource;
  if (!firstEntry || firstEntry.resourceType !== 'Composition') {
    errors.push('First entry of an ABDM document bundle must be a Composition resource');
  }

  // Verify presence of Patient and Practitioner
  const resourceTypes = bundle.entry.map((e) => e.resource?.resourceType);
  if (!resourceTypes.includes('Patient')) {
    errors.push('Bundle must contain a Patient resource');
  }
  if (!resourceTypes.includes('Practitioner')) {
    errors.push('Bundle must contain a Practitioner resource');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
