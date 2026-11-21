const ADMIN_CREDENTIALS = { username: 'admin', password: 'EduResult@2026' };

const DEFAULT_SETTINGS = {
  academicYear: '2026-2027',
  defaultPassPercentage: 40,
  gradeConfig: {
    'A+': [90, 100], 'A': [80, 89.99], 'B': [70, 79.99],
    'C': [60, 69.99], 'D': [50, 59.99], 'E': [40, 49.99], 'F': [0, 39.99]
  },
  theme: 'light',
  institutionName: 'EduResult Academy'
};

const DEMO_SUBJECTS = [
  { id: 'SUB001', name: 'Programming in C', code: 'CS101', maxMarks: 100, passMarks: 40 },
  { id: 'SUB002', name: 'Python Programming', code: 'CS102', maxMarks: 100, passMarks: 40 },
  { id: 'SUB003', name: 'Java Programming', code: 'CS103', maxMarks: 100, passMarks: 40 },
  { id: 'SUB004', name: 'Data Structures', code: 'CS201', maxMarks: 100, passMarks: 40 },
  { id: 'SUB005', name: 'Database Management Systems', code: 'CS202', maxMarks: 100, passMarks: 40 },
  { id: 'SUB006', name: 'Web Development', code: 'CS203', maxMarks: 100, passMarks: 40 },
  { id: 'SUB007', name: 'Computer Networks', code: 'CS301', maxMarks: 100, passMarks: 40 },
  { id: 'SUB008', name: 'Operating Systems', code: 'CS302', maxMarks: 100, passMarks: 40 },
  { id: 'SUB009', name: 'Software Engineering', code: 'CS303', maxMarks: 100, passMarks: 40 },
  { id: 'SUB010', name: 'Computer Organization', code: 'CS304', maxMarks: 100, passMarks: 40 }
];

const DEMO_STUDENTS = [
  { id: 'STU001', rollNo: '1001', name: 'Rahul Kumar', className: 'B.Tech CSE', section: 'A', academicYear: '2026-2027', dateOfBirth: '2004-05-12', email: 'rahul.kumar@example.com', phone: '9876543210', admissionDate: '2024-07-01', avatar: '' },
  { id: 'STU002', rollNo: '1002', name: 'Priya Sharma', className: 'B.Tech CSE', section: 'A', academicYear: '2026-2027', dateOfBirth: '2005-01-22', email: 'priya.sharma@example.com', phone: '9876543211', admissionDate: '2024-07-02', avatar: '' },
  { id: 'STU003', rollNo: '1003', name: 'Arjun Reddy', className: 'B.Tech CSE', section: 'A', academicYear: '2026-2027', dateOfBirth: '2004-11-05', email: 'arjun.reddy@example.com', phone: '9876543212', admissionDate: '2024-07-03', avatar: '' },
  { id: 'STU004', rollNo: '1004', name: 'Sneha Patel', className: 'B.Tech CSE', section: 'A', academicYear: '2026-2027', dateOfBirth: '2005-08-14', email: 'sneha.patel@example.com', phone: '9876543213', admissionDate: '2024-07-04', avatar: '' },
  { id: 'STU005', rollNo: '1005', name: 'Karan Mehta', className: 'B.Tech CSE', section: 'A', academicYear: '2026-2027', dateOfBirth: '2004-03-30', email: 'karan.mehta@example.com', phone: '9876543214', admissionDate: '2024-07-05', avatar: '' },
  { id: 'STU006', rollNo: '1006', name: 'Ananya Singh', className: 'B.Tech CSE', section: 'A', academicYear: '2026-2027', dateOfBirth: '2005-12-11', email: 'ananya.singh@example.com', phone: '9876543215', admissionDate: '2024-07-06', avatar: '' },
  { id: 'STU007', rollNo: '1007', name: 'Vikram Nair', className: 'B.Tech CSE', section: 'A', academicYear: '2026-2027', dateOfBirth: '2004-09-25', email: 'vikram.nair@example.com', phone: '9876543216', admissionDate: '2024-07-07', avatar: '' },
  { id: 'STU008', rollNo: '1008', name: 'Divya Rao', className: 'B.Tech CSE', section: 'A', academicYear: '2026-2027', dateOfBirth: '2005-06-18', email: 'divya.rao@example.com', phone: '9876543217', admissionDate: '2024-07-08', avatar: '' },
  { id: 'STU009', rollNo: '1009', name: 'Rohit Joshi', className: 'B.Tech CSE', section: 'A', academicYear: '2026-2027', dateOfBirth: '2004-02-14', email: 'rohit.joshi@example.com', phone: '9876543218', admissionDate: '2024-07-09', avatar: '' },
  { id: 'STU010', rollNo: '1010', name: 'Meera Iyer', className: 'B.Tech CSE', section: 'A', academicYear: '2026-2027', dateOfBirth: '2005-10-09', email: 'meera.iyer@example.com', phone: '9876543219', admissionDate: '2024-07-10', avatar: '' },
  { id: 'STU011', rollNo: '1011', name: 'Amit Gupta', className: 'B.Tech CSE', section: 'B', academicYear: '2026-2027', dateOfBirth: '2004-07-21', email: 'amit.gupta@example.com', phone: '9876543220', admissionDate: '2024-07-11', avatar: '' },
  { id: 'STU012', rollNo: '1012', name: 'Pooja Verma', className: 'B.Tech CSE', section: 'B', academicYear: '2026-2027', dateOfBirth: '2005-03-08', email: 'pooja.verma@example.com', phone: '9876543221', admissionDate: '2024-07-12', avatar: '' },
  { id: 'STU013', rollNo: '1013', name: 'Suresh Pillai', className: 'B.Tech CSE', section: 'B', academicYear: '2026-2027', dateOfBirth: '2004-12-01', email: 'suresh.pillai@example.com', phone: '9876543222', admissionDate: '2024-07-13', avatar: '' },
  { id: 'STU014', rollNo: '1014', name: 'Kavya Menon', className: 'B.Tech CSE', section: 'B', academicYear: '2026-2027', dateOfBirth: '2005-09-17', email: 'kavya.menon@example.com', phone: '9876543223', admissionDate: '2024-07-14', avatar: '' },
  { id: 'STU015', rollNo: '1015', name: 'Sanjay Tiwari', className: 'B.Tech CSE', section: 'B', academicYear: '2026-2027', dateOfBirth: '2004-04-29', email: 'sanjay.tiwari@example.com', phone: '9876543224', admissionDate: '2024-07-15', avatar: '' },
  { id: 'STU016', rollNo: '1016', name: 'Neha Kapoor', className: 'B.Tech IT', section: 'A', academicYear: '2026-2027', dateOfBirth: '2005-02-14', email: 'neha.kapoor@example.com', phone: '9876543225', admissionDate: '2024-07-16', avatar: '' },
  { id: 'STU017', rollNo: '1017', name: 'Rajesh Bansal', className: 'B.Tech IT', section: 'A', academicYear: '2026-2027', dateOfBirth: '2004-08-05', email: 'rajesh.bansal@example.com', phone: '9876543226', admissionDate: '2024-07-17', avatar: '' },
  { id: 'STU018', rollNo: '1018', name: 'Ishita Deshmukh', className: 'B.Tech IT', section: 'A', academicYear: '2026-2027', dateOfBirth: '2005-11-20', email: 'ishita.deshmukh@example.com', phone: '9876543227', admissionDate: '2024-07-18', avatar: '' },
  { id: 'STU019', rollNo: '1019', name: 'Deepak Malhotra', className: 'B.Tech IT', section: 'A', academicYear: '2026-2027', dateOfBirth: '2004-06-11', email: 'deepak.malhotra@example.com', phone: '9876543228', admissionDate: '2024-07-19', avatar: '' },
  { id: 'STU020', rollNo: '1020', name: 'Aishwarya Kulkarni', className: 'B.Tech IT', section: 'A', academicYear: '2026-2027', dateOfBirth: '2005-05-25', email: 'aishwarya.kulkarni@example.com', phone: '9876543229', admissionDate: '2024-07-20', avatar: '' },
  { id: 'STU021', rollNo: '1021', name: 'Nikhil Chauhan', className: 'B.Tech CSE', section: 'C', academicYear: '2026-2027', dateOfBirth: '2004-10-08', email: 'nikhil.chauhan@example.com', phone: '9876543230', admissionDate: '2024-07-21', avatar: '' },
  { id: 'STU022', rollNo: '1022', name: 'Ritu Saxena', className: 'B.Tech CSE', section: 'C', academicYear: '2026-2027', dateOfBirth: '2005-07-30', email: 'ritu.saxena@example.com', phone: '9876543231', admissionDate: '2024-07-22', avatar: '' },
  { id: 'STU023', rollNo: '1023', name: 'Pranav Bhat', className: 'B.Tech CSE', section: 'C', academicYear: '2026-2027', dateOfBirth: '2004-01-19', email: 'pranav.bhat@example.com', phone: '9876543232', admissionDate: '2024-07-23', avatar: '' },
  { id: 'STU024', rollNo: '1024', name: 'Simran Kaur', className: 'BCA', section: 'A', academicYear: '2026-2027', dateOfBirth: '2005-04-12', email: 'simran.kaur@example.com', phone: '9876543233', admissionDate: '2024-07-24', avatar: '' },
  { id: 'STU025', rollNo: '1025', name: 'Varun Mishra', className: 'BCA', section: 'A', academicYear: '2026-2027', dateOfBirth: '2004-09-03', email: 'varun.mishra@example.com', phone: '9876543234', admissionDate: '2024-07-25', avatar: '' },
  { id: 'STU026', rollNo: '1026', name: 'Swati Jain', className: 'BCA', section: 'A', academicYear: '2026-2027', dateOfBirth: '2005-12-28', email: 'swati.jain@example.com', phone: '9876543235', admissionDate: '2024-07-26', avatar: '' },
  { id: 'STU027', rollNo: '1027', name: 'Manish Agarwal', className: 'BCA', section: 'A', academicYear: '2026-2027', dateOfBirth: '2004-05-07', email: 'manish.agarwal@example.com', phone: '9876543236', admissionDate: '2024-07-27', avatar: '' },
  { id: 'STU028', rollNo: '1028', name: 'Trisha Das', className: 'B.Tech IT', section: 'B', academicYear: '2026-2027', dateOfBirth: '2005-08-19', email: 'trisha.das@example.com', phone: '9876543237', admissionDate: '2024-07-28', avatar: '' },
  { id: 'STU029', rollNo: '1029', name: 'Aditya Shenoy', className: 'B.Tech IT', section: 'B', academicYear: '2026-2027', dateOfBirth: '2004-02-26', email: 'aditya.shenoy@example.com', phone: '9876543238', admissionDate: '2024-07-29', avatar: '' },
  { id: 'STU030', rollNo: '1030', name: 'Lakshmi Nambiar', className: 'B.Tech IT', section: 'B', academicYear: '2026-2027', dateOfBirth: '2005-11-04', email: 'lakshmi.nambiar@example.com', phone: '9876543239', admissionDate: '2024-07-30', avatar: '' }
];

const DEMO_RESULTS = (() => {
  const results = [];
  let resId = 1;

  function calculateGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    if (percentage >= 40) return 'E';
    return 'F';
  }

  function generateResult(student, examName, date, performanceTier, improvement = 0) {
    const marks = {};
    let total = 0;
    const failedSubjects = [];
    
    // Base marks depending on tier
    let baseMin, baseMax;
    if (performanceTier === 'top') { baseMin = 85; baseMax = 98; }
    else if (performanceTier === 'above_avg') { baseMin = 75; baseMax = 88; }
    else if (performanceTier === 'avg') { baseMin = 60; baseMax = 78; }
    else if (performanceTier === 'below_avg') { baseMin = 45; baseMax = 65; }
    else { baseMin = 30; baseMax = 55; } // failures

    DEMO_SUBJECTS.forEach(sub => {
      // Create some variance
      let variance = Math.floor(Math.random() * 10) - 5; 
      // Add improvement for Semester 2
      let mark = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin + variance + improvement;
      
      // Ensure specific subject strengths/weaknesses to make it realistic
      if (student.className.includes('CSE') && (sub.code === 'CS101' || sub.code === 'CS102' || sub.code === 'CS103')) {
        mark += 5; // Good at programming
      } else if (sub.code === 'CS301' || sub.code === 'CS304') {
        mark -= 5; // Hard subjects
      }
      
      if (mark > 100) mark = 100;
      if (mark < 0) mark = 0;
      
      marks[sub.id] = mark;
      total += mark;
      if (mark < sub.passMarks) failedSubjects.push(sub.id);
    });

    const maxTotal = DEMO_SUBJECTS.length * 100;
    const percentage = Number(((total / maxTotal) * 100).toFixed(2));
    const isPass = failedSubjects.length === 0 && percentage >= DEFAULT_SETTINGS.defaultPassPercentage;
    
    const resultObj = {
      id: 'RES' + String(resId++).padStart(3, '0'),
      studentId: student.id,
      examName: examName,
      academicYear: '2026-2027',
      marks: marks,
      total: total,
      maxTotal: maxTotal,
      percentage: percentage,
      grade: calculateGrade(percentage),
      result: isPass ? 'PASS' : 'FAIL',
      failedSubjects: failedSubjects,
      date: date
    };
    return resultObj;
  }

  // Assign tiers
  const tiers = [];
  for(let i=0; i<4; i++) tiers.push('top'); // 4 top
  for(let i=0; i<9; i++) tiers.push('above_avg'); // 9 above avg
  for(let i=0; i<9; i++) tiers.push('avg'); // 9 avg
  for(let i=0; i<5; i++) tiers.push('below_avg'); // 5 below avg
  for(let i=0; i<3; i++) tiers.push('fail'); // 3 failures

  // Semester 1 (All 30)
  DEMO_STUDENTS.forEach((student, index) => {
    results.push(generateResult(student, 'Semester 1', '2027-01-15', tiers[index]));
  });

  // Semester 2 (~25 students, slight improvement)
  const sem2Students = DEMO_STUDENTS.slice(0, 25);
  sem2Students.forEach((student, index) => {
    // 80% improve slightly, 20% decline slightly
    const improvement = Math.random() > 0.2 ? Math.floor(Math.random() * 5) + 2 : -(Math.floor(Math.random() * 4) + 1);
    results.push(generateResult(student, 'Semester 2', '2027-06-15', tiers[index], improvement));
  });

  return results;
})();

const DemoData = {
  students: DEMO_STUDENTS,
  subjects: DEMO_SUBJECTS,
  results: DEMO_RESULTS,
  settings: DEFAULT_SETTINGS
};

window.DemoData = DemoData;
window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
window.ADMIN_CREDENTIALS = ADMIN_CREDENTIALS;
