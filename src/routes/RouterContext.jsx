import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ROUTES, ROUTE_PATHS } from './routeConstants.js';
import { resolveRoute, ROUTE_DEFINITIONS, getRouteById } from './routeConfig.js';

const RouterContext = createContext(null);

/**
 * Extracts route identifier and URL search params from current window location.
 */
function parseLocation() {
  if (typeof window === 'undefined') {
    return {
      routeId: ROUTES.HOSPITALS,
      params: {},
    };
  }

  const url = new URL(window.location.href);
  const searchParams = url.searchParams;

  // 1. Check query parameter '?role=...' or '?view=...'
  const roleParam = searchParams.get('role') || searchParams.get('view');
  if (roleParam) {
    const matched = resolveRoute(roleParam);
    if (matched) {
      const paramsObj = Object.fromEntries(searchParams.entries());
      return { routeId: matched.id, params: paramsObj };
    }
  }

  // 2. Check pathname (e.g., '/doctor', '/patient')
  const pathname = url.pathname.replace(/^\/+|\/+$/g, '');
  if (pathname) {
    const matched = resolveRoute(pathname);
    if (matched) {
      const paramsObj = Object.fromEntries(searchParams.entries());
      return { routeId: matched.id, params: paramsObj };
    }
  }

  // 3. Fallback default route
  const defaultParams = Object.fromEntries(searchParams.entries());
  return {
    routeId: ROUTES.HOSPITALS,
    params: defaultParams,
  };
}

export function RouterProvider({ children, initialRoute = null }) {
  const [currentRouteId, setCurrentRouteId] = useState(() => {
    if (initialRoute) return initialRoute;
    return parseLocation().routeId;
  });

  const [params, setParams] = useState(() => parseLocation().params);
  const [historyStack, setHistoryStack] = useState([currentRouteId]);

  // Current active route definition
  const currentRoute = useMemo(() => {
    return getRouteById(currentRouteId) || ROUTE_DEFINITIONS[ROUTES.HOSPITALS];
  }, [currentRouteId]);

  // Sync document title on route change
  useEffect(() => {
    if (typeof document !== 'undefined' && currentRoute) {
      document.title = currentRoute.title || 'MediQ – Smart OPD Queue & Pharmacy Fulfilment System';
    }
  }, [currentRoute]);

  // Listen to browser popstate (Back / Forward buttons)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const { routeId, params: newParams } = parseLocation();
      setCurrentRouteId(routeId);
      setParams(newParams);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  /**
   * Programmatic Navigation function with HTML5 History API integration.
   * 
   * @param {string} targetRouteId - Target route ID (e.g., ROUTES.DOCTOR).
   * @param {Object} [queryParams={}] - Query parameters to append.
   * @param {Object} [options={}] - Navigation options ({ replace: boolean, preserveParams: boolean }).
   */
  const navigate = useCallback((targetRouteId, queryParams = {}, options = {}) => {
    const targetDef = resolveRoute(targetRouteId);
    const validRouteId = targetDef ? targetDef.id : targetRouteId;

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);

      // Handle query params
      const mergedParams = options.preserveParams
        ? { ...params, ...queryParams, role: validRouteId }
        : { ...queryParams, role: validRouteId };

      url.search = '';
      Object.entries(mergedParams).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') {
          url.searchParams.set(key, String(val));
        }
      });

      if (options.replace) {
        window.history.replaceState({ routeId: validRouteId }, '', url.toString());
      } else {
        window.history.pushState({ routeId: validRouteId }, '', url.toString());
      }

      // Smooth scroll to top on navigation
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        // Fallback for environments where scrollTo options aren't supported
      }

      setParams(mergedParams);
    }

    setCurrentRouteId(validRouteId);
    setHistoryStack((prev) => [...prev, validRouteId]);
  }, [params]);

  /**
   * Mutates or sets a specific query parameter in the current URL without changing route.
   */
  const setParam = useCallback((key, value) => {
    navigate(currentRouteId, { [key]: value }, { replace: true, preserveParams: true });
  }, [currentRouteId, navigate]);

  /**
   * Navigates back to the previous screen or specified fallback.
   */
  const goBack = useCallback((fallbackRoute = ROUTES.HOSPITALS) => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      navigate(fallbackRoute);
    }
  }, [navigate]);

  const contextValue = useMemo(() => ({
    currentRoute,
    currentRouteId,
    params,
    navigate,
    setParam,
    goBack,
    isRouteActive: (id) => currentRouteId === id,
  }), [currentRoute, currentRouteId, params, navigate, setParam, goBack]);

  return (
    <RouterContext.Provider value={contextValue}>
      {children}
    </RouterContext.Provider>
  );
}

/**
 * Hook to access router controls across any component.
 */
export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a <RouterProvider>');
  }
  return context;
}
