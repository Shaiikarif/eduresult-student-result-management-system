/**
 * EduResult - Navigation, Responsive Menu & Image Functionality Test Suite
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

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

console.log('========================================================');
console.log('       TESTING HAMBURGER, NAVIGATION & IMAGES           ');
console.log('========================================================');

// 1. Static HTML Audit
const htmlPath = path.resolve(__dirname, '../index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

console.log('\n--- Test 1: HTML Semantic & Accessibility Verification ---');
assert(html.includes('id="mobile-menu-btn"'), 'Admin hamburger button (#mobile-menu-btn) exists');
assert(html.includes('id="mobile-menu-btn-student"'), 'Student hamburger button (#mobile-menu-btn-student) exists');
assert(html.includes('aria-controls="admin-sidebar"'), 'Admin hamburger button has aria-controls="admin-sidebar"');
assert(html.includes('aria-controls="student-sidebar"'), 'Student hamburger button has aria-controls="student-sidebar"');
assert(html.includes('id="admin-sidebar-close"'), 'Admin sidebar has close button (#admin-sidebar-close)');
assert(html.includes('id="student-sidebar-close"'), 'Student sidebar has close button (#student-sidebar-close)');
assert(html.includes('id="admin-breadcrumb-bar"'), 'Admin portal has breadcrumb container (#admin-breadcrumb-bar)');
assert(html.includes('id="student-breadcrumb-bar"'), 'Student portal has breadcrumb container (#student-breadcrumb-bar)');
assert(html.includes('id="sidebar-overlay"'), 'Sidebar overlay element exists');

// 2. CSS Verification
console.log('\n--- Test 2: Responsive CSS Breakpoints Verification ---');
const responsiveCss = fs.readFileSync(path.resolve(__dirname, '../css/responsive.css'), 'utf8');
const componentsCss = fs.readFileSync(path.resolve(__dirname, '../css/components.css'), 'utf8');

assert(responsiveCss.includes('@media (max-width: 480px)'), 'Mobile 320px-480px breakpoint exists');
assert(responsiveCss.includes('@media (max-width: 768px)'), 'Tablet breakpoint (max-width: 768px) exists');
assert(responsiveCss.includes('@media (max-width: 1024px)'), 'Small laptop breakpoint (max-width: 1024px) exists');
assert(responsiveCss.includes('overflow-x: hidden'), 'Global horizontal overflow protection in place');
assert(componentsCss.includes('.breadcrumb-bar'), 'Breadcrumb navigation styles defined');
assert(componentsCss.includes('.sidebar-close-btn'), 'Mobile sidebar close button styles defined');
assert(componentsCss.includes('body.sidebar-open'), 'Body scroll lock class defined');
assert(componentsCss.includes('.avatar img'), 'Avatar image styling defined');

// 3. JS Logic Verification
console.log('\n--- Test 3: Avatar Rendering & Validation Logic ---');

// Mock DOM & window
global.window = global;
global.document = {
  body: { classList: { add(){}, remove(){}, contains(){ return false; } } },
  createElement: (tag) => {
    let _text = '';
    return {
      tagName: tag.toUpperCase(),
      style: {},
      classList: { add(){}, remove(){}, contains(){ return false; } },
      appendChild(){},
      removeChild(){},
      setAttribute(){},
      getAttribute(){ return ''; },
      get textContent() { return _text; },
      set textContent(v) { _text = String(v); },
      get innerHTML() {
        return _text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      },
      set innerHTML(v) { _text = String(v); }
    };
  },
  getElementById: (id) => ({
    id,
    style: {},
    classList: { add(){}, remove(){}, contains(){ return false; }, toggle(){} },
    innerHTML: '',
    value: '',
    setAttribute(){},
    getAttribute(){ return ''; }
  }),
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
['data.js', 'storage.js', 'ui.js', 'auth.js', 'students.js'].forEach(f => {
  vm.runInThisContext(fs.readFileSync(path.join(jsDir, f), 'utf8'));
});

// Test UI.renderAvatar
const avatarWithImage = UI.renderAvatar({ name: 'Rahul Kumar', avatar: 'data:image/jpeg;base64,testdata' }, 'md');
assert(avatarWithImage.includes('<img src="data:image/jpeg;base64,testdata"'), 'UI.renderAvatar renders <img> tag when avatar present');
assert(avatarWithImage.includes('avatar-md'), 'UI.renderAvatar applies correct size class');

const avatarWithoutImage = UI.renderAvatar({ name: 'Rahul Kumar', avatar: '' }, 'sm');
assert(avatarWithoutImage.includes('RK'), 'UI.renderAvatar falls back to initials when no avatar');
assert(!avatarWithoutImage.includes('<img'), 'UI.renderAvatar has no <img> tag when avatar empty');

// Test Image Validation in UI.validateAndProcessImage
let toastMsg = '';
UI.toast = (msg) => { toastMsg = msg; };

// Invalid MIME type test
UI.validateAndProcessImage({ type: 'application/pdf', size: 1024 }, () => {});
assert(toastMsg.includes('Invalid file type'), 'Rejects non-image MIME types with toast warning');

// Oversized file test
toastMsg = '';
UI.validateAndProcessImage({ type: 'image/jpeg', size: 5 * 1024 * 1024 }, () => {});
assert(toastMsg.includes('Image size must be under 2MB'), 'Rejects files over 2MB with toast warning');

// Test Students.validate with and without avatar
const stuWithoutAvatar = { name: 'Test Student', rollNo: '8888', className: 'B.Tech CSE', section: 'A' };
assert(Students.validate(stuWithoutAvatar).valid === true, 'Student record without avatar is valid');

const stuWithAvatar = { ...stuWithoutAvatar, avatar: 'data:image/jpeg;base64,sample' };
assert(Students.validate(stuWithAvatar).valid === true, 'Student record with avatar is valid');

console.log('\n========================================================');
console.log(`TOTAL CHECKS : ${passed + failed}`);
console.log(`PASSED       : ${passed}`);
console.log(`FAILED       : ${failed}`);
console.log('========================================================');

if (failed === 0) {
  console.log('🎉 ALL NAVIGATION, HAMBURGER & IMAGE TESTS PASSED!\n');
  process.exit(0);
} else {
  console.error(`💥 ${failed} TEST(S) FAILED.\n`);
  process.exit(1);
}
