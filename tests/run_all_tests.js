/**
 * EduResult - Master Test Suite Runner
 * Executes all unit, calculation, integrity, and security test files.
 */

const path = require('path');
const { spawnSync } = require('child_process');

const testSuites = [
  'unit_calculations.test.js',
  'rankings_analytics.test.js',
  'data_integrity.test.js',
  'security_xss.test.js'
];

console.log('========================================================');
console.log('         EDURESULT AUTOMATED TEST SUITE RUNNER          ');
console.log('========================================================');

let totalPassedSuites = 0;
let totalFailedSuites = 0;
const startTime = Date.now();

testSuites.forEach(suiteFile => {
  const fullPath = path.join(__dirname, suiteFile);
  const result = spawnSync('node', [fullPath], { encoding: 'utf8' });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.status === 0) {
    totalPassedSuites++;
  } else {
    totalFailedSuites++;
  }
});

const duration = Date.now() - startTime;

console.log('========================================================');
console.log(`TOTAL SUITES : ${testSuites.length}`);
console.log(`PASSED       : ${totalPassedSuites}`);
console.log(`FAILED       : ${totalFailedSuites}`);
console.log(`DURATION     : ${duration}ms`);
console.log('========================================================');

if (totalFailedSuites === 0) {
  console.log('🎉 ALL TEST SUITES PASSED SUCCESSFULLY!\n');
  process.exit(0);
} else {
  console.error(`💥 ${totalFailedSuites} SUITE(S) FAILED.\n`);
  process.exit(1);
}
