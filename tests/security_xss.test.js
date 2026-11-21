/**
 * EduResult - Security & XSS Sanitization Test Suite
 * Tests HTML escaping, bot response formatting, and student data privacy.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = global;
global.document = {
  getElementById: () => ({ style: {}, classList: { add(){}, remove(){}, toggle(){} }, innerHTML: '', value: '' }),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: (tag) => {
    let text = '';
    return {
      set textContent(v) { text = v; },
      get textContent() { return text; },
      get innerHTML() {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }
    };
  }
};
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} };
global.EduResult = { state: { students: [], subjects: [], results: [], settings: {} }, currentUser: null };

const jsDir = path.resolve(__dirname, '../js');
['data.js', 'storage.js', 'ui.js', 'auth.js', 'students.js', 'subjects.js', 'results.js', 'rankings.js', 'analytics.js', 'ai.js'].forEach(f => {
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

console.log('\n--- Running: security_xss.test.js ---');

// 1. UI.escapeHtml tests
const rawPayload = '<script>alert("XSS")</script>&"\'';
const escaped = UI.escapeHtml(rawPayload);

assert(!escaped.includes('<script>'), 'Script opening tag escaped');
assert(escaped.includes('&lt;script&gt;'), '< and > converted to &lt; and &gt;');
assert(!escaped.includes('\"'), 'Double quotes escaped to &quot;');
assert(!escaped.includes('\''), 'Single quotes escaped to &#039;');
assert(escaped.includes('&amp;'), 'Ampersand converted to &amp;');

// 2. AI.formatResponse sanitization
const maliciousBotMessage = 'Great job! <img src="x" onerror="alert(1)"> Review **Data Structures**';
const formatted = AI.formatResponse(maliciousBotMessage);

assert(!formatted.includes('<img'), 'Dangerous img/onerror tag neutralized');
assert(formatted.includes('<strong>Data Structures</strong>'), 'Markdown **bold** safely transformed to <strong>');

// 3. Student Privacy Barrier in AI Assistant
EduResult.state.students = [
  { id: 'S1', rollNo: '1001', name: 'Rahul Kumar', className: 'B.Tech CSE' },
  { id: 'S2', rollNo: '1002', name: 'Priya Sharma', className: 'B.Tech CSE' }
];
EduResult.state.subjects = [
  { id: 'SUB1', name: 'Programming in C', maxMarks: 100, passMarks: 40 }
];
EduResult.state.results = [
  { studentId: 'S1', examName: 'Semester 1', percentage: 85, grade: 'A', result: 'PASS', total: 85, maxTotal: 100, marks: { SUB1: 85 } },
  { studentId: 'S2', examName: 'Semester 1', percentage: 95, grade: 'A+', result: 'PASS', total: 95, maxTotal: 100, marks: { SUB1: 95 } }
];

// Student S1 asks about themselves
const selfReply = AI.ask('What is my percentage?', 'student', 'S1');
assert(selfReply.includes('85%'), 'Student S1 successfully accesses own percentage');

// Student S1 attempts to inquire about Priya Sharma (S2)
const spyReply1 = AI.ask('What are Priya Sharma\'s marks?', 'student', 'S1');
assert(spyReply1.includes('I can only provide information about your own academic records'), 'Privacy gate: Blocked by name query');

const spyReply2 = AI.ask('Show me roll 1002 results', 'student', 'S1');
assert(spyReply2.includes('I can only provide information about your own academic records'), 'Privacy gate: Blocked by roll number query');

const spyReply3 = AI.ask('Who is the topper in class?', 'student', 'S1');
assert(spyReply3.includes('I can only provide information about your own academic records'), 'Privacy gate: Blocked by peer inquiry');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
