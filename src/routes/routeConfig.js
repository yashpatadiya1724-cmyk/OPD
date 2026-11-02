/**
 * MediQ Central Route Registry & Navigation Architecture
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 * 
 * Defines metadata, role-based access control (RBAC), breadcrumb hierarchies,
 * and navigation grouping for all 15 operational surfaces in the MediQ platform.
 */

import { ROUTES, ROUTE_PATHS, USER_ROLES } from './routeConstants.js';

export const ROUTE_DEFINITIONS = Object.freeze({
  [ROUTES.HOSPITALS]: {
    id: ROUTES.HOSPITALS,
    path: ROUTE_PATHS[ROUTES.HOSPITALS],
    title: 'Discover Top Hospitals & OPD Queues | MediQ Marketplace',
    shortTitle: 'Hospital Directory',
    section: 'Marketplace',
    category: 'CLINICAL OPERATIONS',
    icon: 'Building2',
    authRequired: false,
    allowedRoles: [USER_ROLES.PUBLIC, USER_ROLES.PATIENT, USER_ROLES.SENIOR, USER_ROLES.DOCTOR, USER_ROLES.RECEPTION, USER_ROLES.PHARMACY, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    description: 'Explore verified hospitals, doctor OPD queues, and specialty clinics.',
  },

  [ROUTES.PATIENT]: {
    id: ROUTES.PATIENT,
    path: ROUTE_PATHS[ROUTES.PATIENT],
    title: 'Patient OPD Live Token & Slot Tracker | MediQ',
    shortTitle: 'Patient Queue & Tokens',
    section: 'Clinical Operations',
    category: 'CLINICAL OPERATIONS',
    icon: 'User',
    authRequired: true,
    allowedRoles: [USER_ROLES.PATIENT, USER_ROLES.SENIOR, USER_ROLES.RECEPTION, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    description: 'Real-time token generation, EWMA estimated wait time, and priority queues.',
  },

  [ROUTES.HISTORY]: {
    id: ROUTES.HISTORY,
    path: ROUTE_PATHS[ROUTES.HISTORY],
    title: 'My OPD Visit & Booking History | MediQ',
    shortTitle: 'My Visit History',
    section: 'Patient Records',
    category: 'CLINICAL OPERATIONS',
    icon: 'Clock',
    authRequired: true,
    allowedRoles: [USER_ROLES.PATIENT, USER_ROLES.SENIOR, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    description: 'Digital consultation slips, prescription archives, and past OPD tokens.',
  },

  [ROUTES.DOCTOR]: {
    id: ROUTES.DOCTOR,
    path: ROUTE_PATHS[ROUTES.DOCTOR],
    title: 'Doctor Consultation Console & KYC Portal | MediQ',
    shortTitle: 'Doctor Console',
    section: 'Clinical Console',
    category: 'CLINICAL OPERATIONS',
    icon: 'Stethoscope',
    authRequired: true,
    allowedRoles: [USER_ROLES.DOCTOR, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    description: 'Triage call-next queue manager, consultation timer, and NMC registration KYC.',
  },

  [ROUTES.PHARMACY]: {
    id: ROUTES.PHARMACY,
    path: ROUTE_PATHS[ROUTES.PHARMACY],
    title: 'Hospital Pharmacy Dispense Counter & Prices | MediQ',
    shortTitle: 'Pharmacy & Dispense',
    section: 'Facility Operations',
    category: 'FACILITY OPERATIONS',
    icon: 'Pill',
    authRequired: true,
    allowedRoles: [USER_ROLES.PHARMACY, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    description: 'Live prescription dispense, Jan Aushadhi generic substitution, and inventory.',
  },

  [ROUTES.RECEPTION]: {
    id: ROUTES.RECEPTION,
    path: ROUTE_PATHS[ROUTES.RECEPTION],
    title: 'Hospital Reception Queue Desk | MediQ',
    shortTitle: 'Reception Queue Desk',
    section: 'Front Desk',
    category: 'FACILITY OPERATIONS',
    icon: 'ClipboardList',
    authRequired: true,
    allowedRoles: [USER_ROLES.RECEPTION, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    description: 'Walk-in patient check-in, priority lane token issue, and daily quota overview.',
  },

  [ROUTES.TV]: {
    id: ROUTES.TV,
    path: ROUTE_PATHS[ROUTES.TV],
    title: 'Waiting-Room Live Token TV Display | MediQ',
    shortTitle: 'Waiting Room TV Display',
    section: 'Waiting Area',
    category: 'FACILITY OPERATIONS',
    icon: 'Tv',
    authRequired: false, // Public surface: TV display requires zero login
    allowedRoles: Object.values(USER_ROLES),
    description: 'Large-screen waiting room token broadcaster with multi-language audio chime.',
  },

  [ROUTES.OCR]: {
    id: ROUTES.OCR,
    path: ROUTE_PATHS[ROUTES.OCR],
    title: 'Handwritten Prescription OCR & AI Vision | MediQ',
    shortTitle: 'Prescription OCR (AI)',
    section: 'AI Vision & Diagnostics',
    category: 'POSTER INNOVATIONS (LIVE)',
    icon: 'Scan',
    badge: 'AI VISION',
    authRequired: true,
    allowedRoles: Object.values(USER_ROLES),
    description: 'Computer vision digitizer for doctor prescriptions with generic drug matching.',
  },

  [ROUTES.ABDM]: {
    id: ROUTES.ABDM,
    path: ROUTE_PATHS[ROUTES.ABDM],
    title: 'Ayushman Bharat ABHA Card & Health Locker | MediQ',
    shortTitle: 'ABDM & ABHA Locker',
    section: 'National Health Mission',
    category: 'POSTER INNOVATIONS (LIVE)',
    icon: 'ShieldCheck',
    badge: 'ABHA',
    authRequired: true,
    allowedRoles: Object.values(USER_ROLES),
    description: 'Govt. Ayushman Bharat Digital Mission health records & ABHA profile linking.',
  },

  [ROUTES.FULFILLMENT]: {
    id: ROUTES.FULFILLMENT,
    path: ROUTE_PATHS[ROUTES.FULFILLMENT],
    title: 'Scheduled Rider Medicine Delivery & EV Fleet | MediQ',
    shortTitle: 'Scheduled Rider Delivery',
    section: 'Doorstep Fulfillment',
    category: 'POSTER INNOVATIONS (LIVE)',
    icon: 'Bike',
    badge: 'HOME RIDER',
    authRequired: true,
    allowedRoles: Object.values(USER_ROLES),
    description: '15-minute express cold-chain delivery of vital medications to patient doorstep.',
  },

  [ROUTES.RIDER]: {
    id: ROUTES.RIDER,
    path: ROUTE_PATHS[ROUTES.RIDER],
    title: 'MediQ Rider Terminal & Delivery Console | MediQ',
    shortTitle: 'Rider Mobile Console',
    section: 'Rider Operations',
    category: 'POSTER INNOVATIONS (LIVE)',
    icon: 'Bike',
    badge: 'RIDER APP',
    authRequired: true,
    allowedRoles: [USER_ROLES.RIDER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    description: 'Real-time GPS routing, cold-chain temperature telemetry, and doorstep OTP verification.',
  },

  [ROUTES.OVERVIEW]: {
    id: ROUTES.OVERVIEW,
    path: ROUTE_PATHS[ROUTES.OVERVIEW],
    title: 'MediQ – Smart OPD Queue & Pharmacy Fulfilment System | Project SOCCA-12',
    shortTitle: 'Poster & Methodology',
    section: 'Project Exhibition',
    category: 'PROJECT EXHIBITION (SOCCA-12)',
    icon: 'Sparkles',
    badge: 'SOCCA-12',
    authRequired: false, // Public project evaluation poster
    allowedRoles: Object.values(USER_ROLES),
    description: 'Academic presentation, 5-step problem solving methodology, and live architecture showcase.',
  },

  [ROUTES.ADMIN]: {
    id: ROUTES.ADMIN,
    path: ROUTE_PATHS[ROUTES.ADMIN],
    title: 'Hospital Console & Analytics | MediQ',
    shortTitle: 'Analytics & KYC Approval',
    section: 'Governance',
    category: 'GOVERNANCE & LEDGER',
    icon: 'BarChart3',
    authRequired: true,
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    description: 'Hospital queue KPIs, doctor KYC approvals, and patient satisfaction metrics.',
  },

  [ROUTES.SUPER_ADMIN]: {
    id: ROUTES.SUPER_ADMIN,
    path: ROUTE_PATHS[ROUTES.SUPER_ADMIN],
    title: 'Platform Super Admin & Settlement Ledger | MediQ',
    shortTitle: 'Super Admin Console',
    section: 'Platform Admin',
    category: 'GOVERNANCE & LEDGER',
    icon: 'Activity',
    authRequired: true,
    allowedRoles: [USER_ROLES.SUPER_ADMIN],
    description: 'Multi-hospital registry, double-entry financial ledger, and platform audit logs.',
  },

  [ROUTES.ACCOUNT]: {
    id: ROUTES.ACCOUNT,
    path: ROUTE_PATHS[ROUTES.ACCOUNT],
    title: 'My Clinical Profile & Security Settings | MediQ',
    shortTitle: 'My Clinical Profile',
    section: 'Profile & Security',
    category: 'GOVERNANCE & LEDGER',
    icon: 'ShieldCheck',
    authRequired: true,
    allowedRoles: Object.values(USER_ROLES),
    description: 'User profile, notification preferences, connected devices, and session security.',
  },
});

/**
 * Structured navigation sidebar groupings for dynamic UI rendering.
 */
export const NAVIGATION_GROUPS = [
  {
    group: 'CLINICAL OPERATIONS',
    routeIds: [ROUTES.HOSPITALS, ROUTES.PATIENT, ROUTES.HISTORY, ROUTES.DOCTOR],
  },
  {
    group: 'FACILITY OPERATIONS',
    routeIds: [ROUTES.PHARMACY, ROUTES.RECEPTION, ROUTES.TV],
  },
  {
    group: 'POSTER INNOVATIONS (LIVE)',
    routeIds: [ROUTES.OCR, ROUTES.ABDM, ROUTES.FULFILLMENT, ROUTES.RIDER],
  },
  {
    group: 'PROJECT EXHIBITION (SOCCA-12)',
    routeIds: [ROUTES.OVERVIEW],
  },
  {
    group: 'GOVERNANCE & LEDGER',
    routeIds: [ROUTES.ADMIN, ROUTES.SUPER_ADMIN, ROUTES.ACCOUNT],
  },
];

/**
 * Resolves a route definition by its identifier or path.
 */
export function getRouteById(routeId) {
  return ROUTE_DEFINITIONS[routeId] || null;
}

/**
 * Resolves route identifier from a URL pathname or query param.
 */
export function resolveRoute(identifier) {
  if (!identifier) return ROUTE_DEFINITIONS[ROUTES.HOSPITALS];

  // Try direct ID match
  if (ROUTE_DEFINITIONS[identifier]) {
    return ROUTE_DEFINITIONS[identifier];
  }

  // Try path match
  const matchedEntry = Object.values(ROUTE_DEFINITIONS).find(
    (def) => def.path === identifier || def.path === `/${identifier}`
  );

  return matchedEntry || null;
}

/**
 * Checks whether a user role has permission to access a specific route.
 */
export function canAccessRoute(routeId, userRole = USER_ROLES.PUBLIC) {
  const route = getRouteById(routeId);
  if (!route) return false;

  // Public surface
  if (!route.authRequired) return true;

  // If user role is in allowedRoles list
  return route.allowedRoles.includes(userRole);
}
