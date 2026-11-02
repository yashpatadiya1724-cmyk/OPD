/**
 * MediQ Unified Test Suite Runner
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 * 
 * Executes all algorithmic, router, ABDM, pharmacy, and native helper test suites.
 * Exit code 0 if all pass; exit code 1 if any failure occurs.
 */

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEST_FILES = [
  'router_engine_test.js',
  'native_helpers_test.js',
  'jan_aushadhi_test.js',
  'fhir_bundle_test.js',
  'ewma_pacing_test.js',
];

console.log('====================================================');
console.log('MediQ Automated Test Suite Runner (Ponytail Verified)');
console.log('Project Code: SOCCA - 12 | Silver Oak University');
console.log('====================================================\n');

let passedCount = 0;
let failedCount = 0;
const startTime = Date.now();

for (const testFile of TEST_FILES) {
  const fullPath = path.join(__dirname, testFile);
  process.stdout.write(`Executing [${testFile}]... `);

  const result = spawnSync('node', [fullPath], { encoding: 'utf-8' });

  if (result.status === 0) {
    passedCount++;
    console.log('\x1b[32mPASSED\x1b[0m');
  } else {
    failedCount++;
    console.log('\x1b[31mFAILED\x1b[0m');
    console.error(result.stderr || result.stdout);
  }
}

const duration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log('\n----------------------------------------------------');
console.log(`Summary: ${passedCount} passed, ${failedCount} failed (${duration}s)`);
console.log('----------------------------------------------------');

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32m✔ All test suites verified successfully!\x1b[0m\n');
  process.exit(0);
}
