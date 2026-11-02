/**
 * MediQ Native Platform Utilities (Ponytail Pragmatic Engine)
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 * 
 * Provides lean, zero-dependency utilities leveraging modern browser/Node standard
 * APIs (Intl, crypto, Storage) instead of installing heavy npm packages (lodash, moment, uuid).
 */

/**
 * Formats monetary amounts into Indian Rupee (INR) representation using standard Intl.
 * 
 * @param {number|string} amount - Monetary figure to format.
 * @param {boolean} [showSymbol=true] - Whether to prepend ₹ currency symbol.
 * @returns {string} E.g., "₹1,450.00" or "1,450"
 */
export function formatINR(amount, showSymbol = true) {
  const numeric = typeof amount === 'number' ? amount : Number(amount) || 0;
  
  if (!showSymbol) {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: numeric % 1 !== 0 ? 2 : 0,
    }).format(numeric);
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: numeric % 1 !== 0 ? 2 : 0,
  }).format(numeric);
}

/**
 * Zero-dependency debounce function for search bars, filters, and window resizing.
 * 
 * @param {Function} fn - Target function to execute.
 * @param {number} delayMs - Delay threshold in milliseconds.
 * @returns {Function} Debounced closure.
 */
export function debounce(fn, delayMs = 250) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delayMs);
  };
}

/**
 * Zero-dependency throttle function for scroll events, GPS polling, and animations.
 * 
 * @param {Function} fn - Target function to execute.
 * @param {number} limitMs - Minimum interval between calls.
 * @returns {Function} Throttled closure.
 */
export function throttle(fn, limitMs = 200) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limitMs) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

/**
 * Relative time formatter using browser's native Intl.RelativeTimeFormat (replaces moment/date-fns).
 * 
 * @param {Date|string|number} dateInput - Target timestamp.
 * @param {Date} [referenceDate=new Date()] - Reference point (default now).
 * @returns {string} E.g., "3 minutes ago", "in 12 minutes", "yesterday".
 */
export function formatRelativeTime(dateInput, referenceDate = new Date()) {
  const target = new Date(dateInput);
  if (isNaN(target.getTime())) return 'recently';

  const diffSeconds = Math.round((target.getTime() - referenceDate.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const cutoffs = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ];

  for (const { unit, seconds } of cutoffs) {
    const value = Math.round(diffSeconds / seconds);
    if (Math.abs(value) >= 1 || unit === 'second') {
      return rtf.format(value, unit);
    }
  }

  return 'just now';
}

/**
 * Safe LocalStorage abstraction that handles private browsing security blocks and quota errors.
 */
export const safeStorage = {
  get(key, fallback = null) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return fallback;
      const item = window.localStorage.getItem(key);
      if (item === null) return fallback;
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
      return true;
    } catch {
      // Gracefully handles QuotaExceededError or private mode restrictions
      return false;
    }
  },

  remove(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignored
    }
  },
};
