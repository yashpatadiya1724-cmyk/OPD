/**
 * Convenient facade hook for MediQ routing controls.
 */
import { useRouter } from './RouterContext.jsx';
import { ROUTES, ROUTE_PATHS, USER_ROLES } from './routeConstants.js';
import { canAccessRoute, getRouteById, ROUTE_DEFINITIONS, NAVIGATION_GROUPS } from './routeConfig.js';

export {
  useRouter,
  ROUTES,
  ROUTE_PATHS,
  USER_ROLES,
  canAccessRoute,
  getRouteById,
  ROUTE_DEFINITIONS,
  NAVIGATION_GROUPS,
};

export default useRouter;
