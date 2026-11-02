/**
 * Test Suite: Native Helpers (Ponytail Pragmatic Engine)
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 */

import assert from 'assert';
import {
  formatINR,
  formatRelativeTime,
  debounce,
  throttle,
} from '../src/utils/nativeHelpers.js';

console.log('Running Ponytail Native Helpers Unit Tests...');

// Test 1: Indian Rupee Formatter
const formatted1 = formatINR(1450);
assert(formatted1.includes('1,450'), `INR format should contain Indian grouping 1,450, got: ${formatted1}`);

const formattedNoSymbol = formatINR(250000, false);
assert.strictEqual(formattedNoSymbol, '2,50,000', 'Should follow Lakh format 2,50,000');
console.log('[PASS] Indian Rupee (INR) native Intl formatter verified');

// Test 2: Native Relative Time Formatter (Intl.RelativeTimeFormat)
const now = new Date();
const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
const relTimePast = formatRelativeTime(fiveMinutesAgo, now);
assert(relTimePast.includes('5 minutes ago') || relTimePast.includes('5 min'), `Expected 5 minutes ago, got: ${relTimePast}`);

const tenMinutesFuture = new Date(now.getTime() + 10 * 60 * 1000);
const relTimeFuture = formatRelativeTime(tenMinutesFuture, now);
assert(relTimeFuture.includes('in 10 minutes') || relTimeFuture.includes('10 min'), `Expected in 10 minutes, got: ${relTimeFuture}`);

const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
const relTimeYesterday = formatRelativeTime(yesterday, now);
assert(relTimeYesterday.includes('yesterday') || relTimeYesterday.includes('1 day ago'), `Expected yesterday, got: ${relTimeYesterday}`);
console.log('[PASS] Native Relative Time Formatter verified without moment/date-fns');

// Test 3: Debounce Function
let debounceCount = 0;
const testDebounced = debounce(() => {
  debounceCount++;
}, 50);

testDebounced();
testDebounced();
testDebounced();

setTimeout(() => {
  assert.strictEqual(debounceCount, 1, 'Debounce should only trigger once after delay');
  console.log('[PASS] Zero-dependency debounce verified');

  // Test 4: Throttle Function
  let throttleCount = 0;
  const testThrottled = throttle(() => {
    throttleCount++;
  }, 50);

  testThrottled();
  testThrottled();
  testThrottled();
  assert.strictEqual(throttleCount, 1, 'Throttle should execute immediate first call and drop subsequent calls in interval');
  console.log('[PASS] Zero-dependency throttle verified');

  console.log('ALL PONYTAIL NATIVE HELPER TESTS PASSED SUCCESSFULLY! [OK]');
}, 100);
