/**
 * EduResult - Rankings & Analytics Test Suite
 * Tests ranking order, tie handling, percentiles, and aggregate analytics.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = global;
global.document = {
  getElementById: () => ({ style: {}, classList: { add(){}, remove(){}, toggle(){} }, innerHTML: '', value: '' }),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} };
global.EduResult = { state: { students: [], subjects: [], results: [], settings: {} }, currentUser: null };

const jsDir = path.resolve(__dirname, '../js');
['data.js', 'storage.js', 'ui.js', 'auth.js', 'students.js', 'subjects.js', 'results.js', 'rankings.js', 'analytics.js'].forEach(f => {
  vm.runInThisContext(fs.readFileSync(path.join(jsDir, f), 'utf8'));
});

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

console.log('\n--- Running: rankings_analytics.test.js ---');

// Mock state for ranking tests
EduResult.state.students = [
  { id: 'S1', name: 'Student 1', rollNo: '101' },
  { id: 'S2', name: 'Student 2', rollNo: '102' },
  { id: 'S3', name: 'Student 3', rollNo: '103' },
  { id: 'S4', name: 'Student 4', rollNo: '104' },
  { id: 'S5', name: 'Student 5', rollNo: '105' }
];

EduResult.state.results = [
  { studentId: 'S1', examName: 'TestExam', percentage: 95.0, grade: 'A+', result: 'PASS' },
  { studentId: 'S2', examName: 'TestExam', percentage: 92.0, grade: 'A+', result: 'PASS' },
  { studentId: 'S3', examName: 'TestExam', percentage: 92.0, grade: 'A+', result: 'PASS' }, // Tie with S2
  { studentId: 'S4', examName: 'TestExam', percentage: 85.0, grade: 'A',  result: 'PASS' },
  { studentId: 'S5', examName: 'TestExam', percentage: 38.0, grade: 'F',  result: 'FAIL' }
];

const rankings = Rankings.calculate('TestExam');

assert(rankings.length === 5, 'Rankings calculated for all 5 participants');
assert(rankings[0].studentId === 'S1' && rankings[0].rank === 1, 'Rank #1 assigned to highest percentage (95.0%)');

// Tie handling check
assert(rankings[1].studentId === 'S2' && rankings[1].rank === 2, 'Rank #2 assigned to S2 (92.0%)');
assert(rankings[2].studentId === 'S3' && rankings[2].rank === 2, 'Tie handled: S3 also assigned Rank #2 (92.0%)');
assert(rankings[3].studentId === 'S4' && rankings[3].rank === 4, 'Dense rank skips to #4 after 2-way tie');

// Percentile check
const s1Rank = Rankings.getStudentRank('S1', 'TestExam');
assert(s1Rank.rank === 1, 'Student S1 rank retrieval correct');
assert(s1Rank.total === 5, 'Total cohort size: 5');
assert(s1Rank.percentile === 80, 'Top student percentile calculated (80%)');

// Analytics check
const overall = Analytics.getOverallStats('TestExam');
assert(overall.total === 5, 'Overall analytics recognizes cohort size of 5');
assert(overall.passed === 4, 'Correctly counted 4 passing students');
assert(overall.failed === 1, 'Correctly counted 1 failing student');
assert(overall.passRate === 80, 'Pass rate calculated accurately (80%)');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
