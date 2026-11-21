/**
 * EduResult - Unit Calculations Test Suite
 * Tests grade boundary mappings, percentage math, and pass/fail logic.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Mock browser globals
global.window = global;
global.document = {
  getElementById: () => ({ style: {}, classList: { add(){}, remove(){}, toggle(){} }, innerHTML: '', value: '' }),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} };

const jsDir = path.resolve(__dirname, '../js');
['data.js', 'storage.js', 'ui.js', 'auth.js', 'students.js', 'subjects.js', 'results.js'].forEach(f => {
  vm.runInThisContext(fs.readFileSync(path.join(jsDir, f), 'utf8'));
});

global.EduResult = { state: { settings: { defaultPassPercentage: 40 }, results: [], subjects: [], students: [] } };

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('\n--- Running: unit_calculations.test.js ---');

// 1. Grade Boundary Tests
const boundaries = [
  { pct: 100, expected: 'A+' },
  { pct: 90.0, expected: 'A+' },
  { pct: 89.99, expected: 'A' },
  { pct: 80.0, expected: 'A' },
  { pct: 79.99, expected: 'B' },
  { pct: 70.0, expected: 'B' },
  { pct: 69.99, expected: 'C' },
  { pct: 60.0, expected: 'C' },
  { pct: 59.99, expected: 'D' },
  { pct: 50.0, expected: 'D' },
  { pct: 49.99, expected: 'E' },
  { pct: 40.0, expected: 'E' },
  { pct: 39.99, expected: 'F' },
  { pct: 0.0, expected: 'F' }
];

boundaries.forEach(b => {
  const resultGrade = Results.calculateGrade(b.pct);
  assert(resultGrade === b.expected, `Grade at ${b.pct}% should be ${b.expected} (got: ${resultGrade})`);
});

// 2. Pass/Fail Calculation with 5 Subjects
const mockSubjects = [
  { id: 'S1', name: 'Subject 1', maxMarks: 100, passMarks: 40 },
  { id: 'S2', name: 'Subject 2', maxMarks: 100, passMarks: 40 },
  { id: 'S3', name: 'Subject 3', maxMarks: 100, passMarks: 40 },
  { id: 'S4', name: 'Subject 4', maxMarks: 100, passMarks: 40 },
  { id: 'S5', name: 'Subject 5', maxMarks: 100, passMarks: 40 }
];

// All Pass
const allPassMarks = { S1: 85, S2: 90, S3: 75, S4: 80, S5: 70 };
const calcPass = Results.calculate(allPassMarks, mockSubjects);
assert(calcPass.total === 400, 'Total marks calculation: 400/500');
assert(calcPass.percentage === 80, 'Percentage calculation: 80%');
assert(calcPass.grade === 'A', 'Grade calculation: A');
assert(calcPass.result === 'PASS', 'Overall result: PASS');
assert(calcPass.failedSubjects.length === 0, 'No failed subjects');

// Single Subject Fail (< 40 in S3)
const singleFailMarks = { S1: 95, S2: 90, S3: 35, S4: 90, S5: 90 };
const calcFail = Results.calculate(singleFailMarks, mockSubjects);
assert(calcFail.percentage === 80, 'High overall percentage (80%) preserved');
assert(calcFail.result === 'FAIL', 'Result FAIL due to single subject below passMarks');
assert(calcFail.failedSubjects.includes('S3'), 'Identified S3 as failed subject');

// Boundary Pass (all exactly at 40)
const boundaryPassMarks = { S1: 40, S2: 40, S3: 40, S4: 40, S5: 40 };
const calcBoundary = Results.calculate(boundaryPassMarks, mockSubjects);
assert(calcBoundary.percentage === 40, 'Boundary pass percentage: 40%');
assert(calcBoundary.result === 'PASS', 'Result PASS at exact minimum threshold');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
