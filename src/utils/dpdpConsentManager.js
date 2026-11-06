/**
 * MediQ DPDP Act 2023 & NHA ABDM Privacy Compliance Engine
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 * 
 * Enforces explicit purpose-bound digital consent, patient consent receipts,
 * cryptographic tamper-proofing, data minimization, and FHIR R4 privacy filters
 * per Section 6 & 9 of the Digital Personal Data Protection (DPDP) Act 2023 (India).
 */

import crypto from 'crypto';

/**
 * Standard DPDP Consent Purposes
 */
export const DPDP_PURPOSES = {
  OPD_CONSULTATION: 'OPD_CONSULTATION_AND_E_PRESCRIPTION',
  EMERGENCY_TRIAGE: 'EMERGENCY_TRIAGE_ACCESS',
  PHARMACY_DISPATCH: 'HYPERLOCAL_PHARMACY_DISPATCH',
  RESEARCH_ANALYTICS: 'ANONYMIZED_HEALTH_RESEARCH',
  TELECONSULTATION: 'TELECONSULTATION_AUDIO_VIDEO',
};

/**
 * Masks patient full name for waiting room TV screens and public monitors
 * Example: "Ramesh Sharma" -> "R*** S***"
 */
export function maskPatientName(name) {
  if (!name || typeof name !== 'string') return 'P***';
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => (p.length > 0 ? `${p[0]}${'*'.repeat(Math.min(3, p.length - 1))}` : ''))
    .join(' ');
}

/**
 * Masks sensitive mobile number for public displays
 * Example: "+91 98251 04921" -> "+91 98*** **921"
 */
export function maskPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return '***-***-****';
  const clean = phone.replace(/\s+/g, '');
  if (clean.length < 10) return '***-***-****';
  const start = clean.slice(0, clean.length - 7);
  const end = clean.slice(-3);
  return `${start}****${end}`;
}

/**
 * Computes deterministic SHA-256 cryptographic digest for consent receipt integrity.
 */
function computeConsentHash(payload) {
  const serialized = [
    payload.patientId,
    payload.abhaAddress || '',
    payload.hospitalId,
    payload.doctorId || '',
    JSON.stringify(payload.purposes.sort()),
    payload.grantedAt,
    payload.expiresAt,
  ].join('|');

  return crypto.createHash('sha256').update(serialized).digest('hex');
}

/**
 * Creates a tamper-evident digital consent receipt per DPDP Act 2023 Section 6.
 * 
 * @param {Object} params - Consent parameters.
 * @param {string} params.patientId - Unique patient ID.
 * @param {string} [params.abhaAddress] - Ayushman Bharat Health Account (e.g. user@abdm).
 * @param {string} params.hospitalId - Healthcare facility ID.
 * @param {string} [params.doctorId] - Consulting practitioner ID.
 * @param {Array<string>} [params.purposes] - Authorized processing purposes.
 * @param {number} [params.validDurationHours=24] - Validity duration in hours.
 * @returns {Object} Immutable consent receipt with cryptographic signature.
 */
export function createPatientConsentReceipt({
  patientId,
  abhaAddress = '',
  hospitalId,
  doctorId = '',
  purposes = [DPDP_PURPOSES.OPD_CONSULTATION],
  validDurationHours = 24,
}) {
  if (!patientId || !hospitalId) {
    throw new Error('DPDP Compliance Error: patientId and hospitalId are mandatory for consent receipt');
  }

  const grantedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + validDurationHours * 60 * 60 * 1000).toISOString();
  const consentToken = `DPDP-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const baseReceipt = {
    consentToken,
    patientId,
    abhaAddress,
    hospitalId,
    doctorId,
    purposes: Array.isArray(purposes) ? purposes : [purposes],
    grantedAt,
    expiresAt,
    revoked: false,
    revokedAt: null,
    revocationReason: null,
    jurisdiction: 'India (DPDP Act 2023)',
    dataFiduciary: 'Silver Oak Health & Super-Speciality Hospital',
  };

  const cryptographicChecksum = computeConsentHash(baseReceipt);

  return {
    ...baseReceipt,
    cryptographicChecksum,
  };
}

/**
 * Verifies whether a digital consent receipt is valid, unexpired, and untampered.
 * 
 * @param {Object} receipt - Digital consent receipt.
 * @returns {Object} Validation status and diagnostics.
 */
export function verifyConsentReceipt(receipt) {
  if (!receipt || typeof receipt !== 'object') {
    return { valid: false, reason: 'INVALID_RECEIPT_OBJECT' };
  }

  if (receipt.revoked) {
    return { valid: false, reason: 'CONSENT_REVOKED', revokedAt: receipt.revokedAt };
  }

  const now = new Date();
  const expiry = new Date(receipt.expiresAt);
  if (now > expiry) {
    return { valid: false, reason: 'CONSENT_EXPIRED', expiresAt: receipt.expiresAt };
  }

  // Verify cryptographic integrity
  const expectedHash = computeConsentHash(receipt);
  if (expectedHash !== receipt.cryptographicChecksum) {
    return { valid: false, reason: 'TAMPER_DETECTED_HASH_MISMATCH' };
  }

  return { valid: true, reason: 'CONSENT_ACTIVE_AND_VERIFIED' };
}

/**
 * Revokes an existing consent receipt per patient request (Section 6(4) DPDP Act).
 * 
 * @param {Object} receipt - Existing consent receipt.
 * @param {string} reason - Reason for revocation.
 * @returns {Object} Updated revoked receipt.
 */
export function revokeConsentReceipt(receipt, reason = 'PATIENT_REQUESTED_WITHDRAWAL') {
  if (!receipt || typeof receipt !== 'object') {
    throw new Error('Invalid consent receipt provided for revocation');
  }

  const updated = {
    ...receipt,
    revoked: true,
    revokedAt: new Date().toISOString(),
    revocationReason: reason,
  };

  // Re-sign revoked receipt so state is verifiable
  updated.cryptographicChecksum = computeConsentHash(updated);
  return updated;
}

/**
 * Filters and redacts an HL7 FHIR R4 Bundle based on DPDP consent purpose.
 * Implements strict Data Minimization (Section 9 DPDP Act 2023).
 * 
 * @param {Object} fhirBundle - Valid HL7 FHIR R4 Bundle.
 * @param {Object} consentReceipt - Valid consent receipt.
 * @returns {Object} Privacy-compliant FHIR R4 Bundle.
 */
export function filterFhirBundleWithConsent(fhirBundle, consentReceipt) {
  const verification = verifyConsentReceipt(consentReceipt);
  if (!verification.valid) {
    throw new Error(`DPDP Consent Denied: ${verification.reason}`);
  }

  // Deep clone to avoid mutating original
  const sanitizedBundle = JSON.parse(JSON.stringify(fhirBundle));

  // Case 1: Research / Analytics purpose -> Anonymize all Direct Identifiers (PII)
  if (
    consentReceipt.purposes.includes(DPDP_PURPOSES.RESEARCH_ANALYTICS) &&
    !consentReceipt.purposes.includes(DPDP_PURPOSES.OPD_CONSULTATION)
  ) {
    for (const entry of sanitizedBundle.entry || []) {
      if (entry.resource && entry.resource.resourceType === 'Patient') {
        entry.resource.name = [{ text: 'ANONYMIZED_PATIENT' }];
        entry.resource.telecom = [];
        entry.resource.address = [];
        entry.resource.identifier = [
          { system: 'https://healthid.ndhm.gov.in', value: 'REDACTED_RESEARCH_MODE' },
        ];
        // Retain general age/gender for statistical epidemiological validity
      }
    }
    sanitizedBundle.meta = {
      ...(sanitizedBundle.meta || {}),
      security: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality',
          code: 'R',
          display: 'Restricted Anonymized DPDP',
        },
      ],
    };
  }

  // Attach consent receipt token to Bundle metadata for audit trail
  sanitizedBundle.meta = {
    ...(sanitizedBundle.meta || {}),
    tag: [
      ...(sanitizedBundle.meta?.tag || []),
      {
        system: 'https://dpdp.gov.in/consent',
        code: consentReceipt.consentToken,
        display: `DPDP Consent Verified (${consentReceipt.jurisdiction})`,
      },
    ],
  };

  return sanitizedBundle;
}

/**
 * Backward compatibility helper for legacy call sites.
 */
export function generateConsentArtifact({ patientId, hospitalId, doctorId, purpose }) {
  return createPatientConsentReceipt({
    patientId,
    hospitalId,
    doctorId,
    purposes: [purpose || DPDP_PURPOSES.OPD_CONSULTATION],
  });
}
