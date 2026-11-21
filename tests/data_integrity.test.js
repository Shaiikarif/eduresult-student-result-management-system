/**
 * EduResult - Data Integrity & Validation Test Suite
 * Tests duplicate prevention, schema validation, LocalStorage safety, and CSV export.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = global;
global.document = {
  getElementById: () => ({ style: {}, classList: { add(){}, remove(){}, toggle(){} }, innerHTML: '', value: '', appendChild: () => {}, removeChild: () => {} }),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

const mockStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};
global.localStorage = mockStorage;
global.EduResult = { state: { students: [], subjects: [], results: [], settings: {} }, currentUser: null };

const jsDir = path.resolve(__dirname, '../js');
['data.js', 'storage.js', 'ui.js', 'auth.js', 'students.js', 'subjects.js', 'results.js', 'rankings.js', 'export.js'].forEach(f => {
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

console.log('\n--- Running: data_integrity.test.js ---');

// 1. Storage Self-Healing
Storage.clear();
Storage.init();
assert(EduResult.state.students.length === 30, 'Storage.init heals empty localStorage with 30 demo students');
assert(EduResult.state.subjects.length === 10, 'Storage.init heals empty localStorage with 10 demo subjects');
assert(EduResult.state.results.length >= 50, 'Storage.init loads full results history');

// 2. Student Validation & Duplicate Prevention
const validStudent = {
  name: 'New Candidate',
  rollNo: '9999',
  className: 'B.Tech CSE',
  section: 'A',
  academicYear: '2026-2027',
  email: 'valid@example.com',
  phone: '9876543210'
};
const v1 = Students.validate(validStudent);
assert(v1.valid === true, 'Valid student record passes validation');

// Duplicate roll number rejection
const duplicateStudent = { ...validStudent, rollNo: '1001' }; // 1001 already exists
const v2 = Students.validate(duplicateStudent);
assert(v2.valid === false && v2.errors.rollNo, 'Duplicate roll number (1001) rejected with error');

// Invalid email rejection
const badEmailStudent = { ...validStudent, email: 'not-an-email' };
const v3 = Students.validate(badEmailStudent);
assert(v3.valid === false && v3.errors.email, 'Malformed email rejected with error');

// Invalid phone rejection
const badPhoneStudent = { ...validStudent, phone: '123' };
const v4 = Students.validate(badPhoneStudent);
assert(v4.valid === false && v4.errors.phone, 'Non-10-digit phone rejected with error');

// 3. Subject Validation
const validSubject = {
  name: 'Cloud Computing',
  code: 'CS405',
  maxMarks: 100,
  passMarks: 40
};
const subV1 = Subjects.validate(validSubject);
assert(subV1.valid === true, 'Valid subject passes validation');

// Duplicate subject code rejection
const duplicateSub = { ...validSubject, code: 'CS101' }; // CS101 exists in demo data
const subV2 = Subjects.validate(duplicateSub);
assert(subV2.valid === false && subV2.errors.code, 'Duplicate subject code (CS101) rejected');

// Pass marks greater than max marks
const badMarksSub = { ...validSubject, maxMarks: 50, passMarks: 60 };
const subV3 = Subjects.validate(badMarksSub);
assert(subV3.valid === false && subV3.errors.passMarks, 'Pass marks exceeding max marks rejected');

// 4. CSV Generator Verification
const resultsSubset = EduResult.state.results.slice(0, 5);
let capturedCsv = '';
global.Blob = function(parts) {
  capturedCsv = parts.join('');
};
global.URL = { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} };
global.document.createElement = (tag) => ({
  click() {},
  style: {}
});
global.document.body = { appendChild() {}, removeChild() {} };

Export.toCSV(resultsSubset, 'test.csv');
assert(capturedCsv.includes('Roll No,Student Name,Class,Section,Academic Year,Exam'), 'CSV includes proper header row');
assert(capturedCsv.includes('Total Marks,Maximum Marks,Percentage,Grade,Result,Rank'), 'CSV includes all calculated columns');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
