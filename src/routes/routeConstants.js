/**
 * MediQ Centralized Route Constants
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 * 
 * Provides type-safe constants for all platform route IDs and path mappings.
 * Eliminates magic strings across Sidebar, TopBar, and view renderers.
 */

export const ROUTES = Object.freeze({
  // Clinical Operations
  HOSPITALS: 'hospitals',
  PATIENT: 'patient',
  HISTORY: 'history',
  DOCTOR: 'doctor',

  // Facility Operations
  PHARMACY: 'pharmacy',
  RECEPTION: 'reception',
  TV: 'tv',

  // Poster Innovations (SOCCA-12 Showcase)
  OCR: 'ocr',
  ABDM: 'abdm',
  FULFILLMENT: 'fulfillment',
  RIDER: 'rider',

  // Project Exhibition
  OVERVIEW: 'overview',

  // Governance & Ledger
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  ACCOUNT: 'account',
});

export const ROUTE_PATHS = Object.freeze({
  [ROUTES.HOSPITALS]: '/hospitals',
  [ROUTES.PATIENT]: '/patient',
  [ROUTES.HISTORY]: '/history',
  [ROUTES.DOCTOR]: '/doctor',
  [ROUTES.PHARMACY]: '/pharmacy',
  [ROUTES.RECEPTION]: '/reception',
  [ROUTES.TV]: '/tv',
  [ROUTES.OCR]: '/ocr',
  [ROUTES.ABDM]: '/abdm',
  [ROUTES.FULFILLMENT]: '/fulfillment',
  [ROUTES.RIDER]: '/rider',
  [ROUTES.OVERVIEW]: '/overview',
  [ROUTES.ADMIN]: '/admin',
  [ROUTES.SUPER_ADMIN]: '/super-admin',
  [ROUTES.ACCOUNT]: '/account',
});

export const USER_ROLES = Object.freeze({
  PUBLIC: 'public',
  PATIENT: 'patient',
  SENIOR: 'senior',
  DOCTOR: 'doctor',
  PHARMACY: 'pharmacy',
  RECEPTION: 'reception',
  RIDER: 'rider',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
});
