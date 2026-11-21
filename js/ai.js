const AI = {
  adminHistory: [],
  studentHistory: [],

  // STUDENT CONTEXT — only current student's data
  getStudentContext(studentId) {
    const student = Students.getById(studentId);
    if (!student) return null;
    const results = Results.getByStudent(studentId);
    const subjects = Subjects.getAll();
    const latestResult = results[results.length - 1];
    let rankInfo = null;
    if (latestResult) rankInfo = Rankings.getStudentRank(studentId, latestResult.examName);

    return { student, results, subjects, latestResult, rankInfo };
  },

  // ADMIN CONTEXT — aggregate data
  getAdminContext() {
    const stats = Analytics.getOverallStats();
    const students = Students.getAll();
    const subjects = Subjects.getAll();
    const results = Results.getAll();
    const subjectPerf = Analytics.getSubjectPerformance();
    return { stats, students, subjects, results, subjectPerf };
  },

  // PROCESS QUESTION
  ask(question, role, studentId = null) {
    const q = question.toLowerCase().trim();

    if (role === 'student') {
      return this.handleStudentQuestion(q, studentId);
    } else {
      return this.handleAdminQuestion(q);
    }
  },

  // STUDENT AI
  handleStudentQuestion(q, studentId) {
    const ctx = this.getStudentContext(studentId);
    if (!ctx) return "I couldn't find your student record. Please try logging in again.";

    // Privacy check — if asking about another student
    // Check for names (full name, first name) or roll number of other students
    const otherStudents = Students.getAll().filter(s => s.id !== studentId);
    const mentionsOther = otherStudents.some(s => {
      const fullName = s.name.toLowerCase();
      const firstName = s.name.split(' ')[0].toLowerCase();
      return (firstName.length > 2 && q.includes(firstName)) || q.includes(fullName) || q.includes(s.rollNo);
    });
    const mentionsOthersGeneric = q.includes('other student') || q.includes('someone else') || q.includes('classmate') || q.includes("friend") || q.includes("topper");
    if (mentionsOther || mentionsOthersGeneric) {
      return "I can only provide information about your own academic records. I cannot share other students' data.";
    }

    const { student, results, subjects, latestResult, rankInfo } = ctx;

    // PERFORMANCE QUESTIONS
    if (q.match(/percentage|percent|score|marks|total/)) {
      if (!latestResult) return "You don't have any results recorded yet.";
      return `Your latest result (${latestResult.examName}):\n\n` +
        `Total: ${latestResult.total}/${latestResult.maxTotal}\n` +
        `Percentage: ${latestResult.percentage}%\n` +
        `Grade: ${latestResult.grade}\n` +
        `Result: ${latestResult.result}`;
    }

    if (q.match(/grade|what.*grade/)) {
      if (!latestResult) return "No results found. Your grade will appear after your marks are entered.";
      return `Your current grade is **${latestResult.grade}** (${latestResult.percentage}%) in ${latestResult.examName}.`;
    }

    if (q.match(/rank|position|standing/)) {
      if (!rankInfo) return "Rankings are not available yet.";
      return `You are ranked **#${rankInfo.rank}** out of ${rankInfo.total} students (Top ${rankInfo.topPercent}%, Percentile: ${rankInfo.percentile}).`;
    }

    if (q.match(/weak|worst|lowest|poor|bad|struggle/)) {
      if (!latestResult) return "No results to analyze yet.";
      let weakest = null, minPct = 101;
      subjects.forEach(s => {
        const m = latestResult.marks[s.id];
        if (m !== undefined) {
          const pct = (m / s.maxMarks) * 100;
          if (pct < minPct) { minPct = pct; weakest = s; }
        }
      });
      if (!weakest) return "Could not determine your weakest subject.";
      return `Your weakest subject is **${weakest.name}** with ${latestResult.marks[weakest.id]}/${weakest.maxMarks} marks (${Math.round(minPct)}%).\n\nI recommend dedicating extra study time to this subject.`;
    }

    if (q.match(/strong|best|highest|top.*subject/)) {
      if (!latestResult) return "No results to analyze yet.";
      let strongest = null, maxPct = -1;
      subjects.forEach(s => {
        const m = latestResult.marks[s.id];
        if (m !== undefined) {
          const pct = (m / s.maxMarks) * 100;
          if (pct > maxPct) { maxPct = pct; strongest = s; }
        }
      });
      if (!strongest) return "Could not determine your strongest subject.";
      return `Your strongest subject is **${strongest.name}** with ${latestResult.marks[strongest.id]}/${strongest.maxMarks} marks (${Math.round(maxPct)}%). Keep up the great work! 🌟`;
    }

    if (q.match(/improv|better|how.*can.*i|tips|advice|focus|priorit/)) {
      if (!latestResult) return "Complete your exams first, and I'll help you improve!";
      return this.generateImprovementAdvice(ctx);
    }

    if (q.match(/study.*plan|schedule|timetable|weekly/)) {
      if (!latestResult) return "I need your results to create a study plan.";
      return this.generateStudyPlan(ctx);
    }

    if (q.match(/perform|how.*am.*i|doing|progress|trend/)) {
      return this.generatePerformanceSummary(ctx);
    }

    // SUBJECT/CONCEPT QUESTIONS
    if (q.match(/explain|what.*is|define|describe|tell.*about/)) {
      return this.answerConceptQuestion(q);
    }

    if (q.match(/example|code|program|write/)) {
      return this.answerCodeQuestion(q);
    }

    // GENERAL
    if (q.match(/hello|hi|hey/)) {
      return `Hello, ${student.name}! 👋 I'm EduBot, your academic assistant. You can ask me about your performance, grades, ranks, or even CS concepts!`;
    }

    if (q.match(/help|what.*can.*you/)) {
      return `I can help you with:\n\n` +
        `📊 **Performance**: "What's my percentage?", "What's my rank?"\n` +
        `📚 **Subjects**: "What's my weakest subject?", "How am I doing in Python?"\n` +
        `📈 **Improvement**: "How can I improve?", "Create a study plan"\n` +
        `💡 **Concepts**: "Explain polymorphism", "What is normalization?"\n\n` +
        `Try asking me something!`;
    }

    return `I'm not sure how to answer that. Try asking about your grades, rank, subjects, or CS concepts. Type "help" to see what I can do!`;
  },

  // ADMIN AI
  handleAdminQuestion(q) {
    const ctx = this.getAdminContext();
    const { stats, students, subjects, results, subjectPerf } = ctx;

    if (results.length === 0) return "There are no results in the system yet. Add some marks to get started.";

    // Top students
    if (q.match(/top\s*(\d+)?|best.*student|highest.*score/)) {
      const n = parseInt(q.match(/(\d+)/)?.[1]) || 5;
      const latestExam = Rankings.getLatestExam();
      const rankings = Rankings.calculate(latestExam).slice(0, n);
      let response = `**Top ${n} Students (${latestExam}):**\n\n`;
      rankings.forEach(r => {
        const s = Students.getById(r.studentId);
        if (s) response += `#${r.rank} ${s.name} — ${r.percentage}% (Grade ${r.grade})\n`;
      });
      return response;
    }

    // Failed students
    if (q.match(/fail|failed|failing/)) {
      const latestExam = Rankings.getLatestExam();
      const failed = results.filter(r => r.examName === latestExam && r.result === 'FAIL');
      if (failed.length === 0) return `No students failed in ${latestExam}. 🎉`;
      let response = `**${failed.length} students failed in ${latestExam}:**\n\n`;
      failed.forEach(r => {
        const s = Students.getById(r.studentId);
        const failedSubs = r.failedSubjects.map(id => Subjects.getById(id)?.name || id).join(', ');
        if (s) response += `• ${s.name} (${r.percentage}%)${failedSubs ? ' — Failed: ' + failedSubs : ''}\n`;
      });
      return response;
    }

    // Subject performance
    if (q.match(/lowest.*average|worst.*subject|hardest|difficult/)) {
      const worst = subjectPerf[subjectPerf.length - 1];
      return `The subject with the lowest average is **${worst.subject}** (${worst.code}) with an average of ${worst.avgPercentage}%.`;
    }

    if (q.match(/highest.*average|best.*subject|easiest/)) {
      const best = subjectPerf[0];
      return `The subject with the highest average is **${best.subject}** (${best.code}) with an average of ${best.avgPercentage}%.`;
    }

    // Class average
    if (q.match(/class.*average|average.*class|overall.*average/)) {
      return `The class average is **${stats.classAvg}%** across ${stats.total} students in ${stats.examName}.\n\nPass Rate: ${stats.passRate}%\nHighest: ${stats.highest}%\nLowest: ${stats.lowest}%`;
    }

    // How many students
    if (q.match(/how.*many.*student|total.*student|number.*student/)) {
      return `There are **${students.length}** students registered.\n\nIn the latest exam (${stats.examName}):\n• ${stats.passed} passed\n• ${stats.failed} failed\n• Pass rate: ${stats.passRate}%`;
    }

    // Grade queries
    if (q.match(/grade\s*(a\+?|b|c|d|e|f)/i)) {
      const gradeMatch = q.match(/grade\s*(a\+?|b|c|d|e|f)/i);
      const targetGrade = gradeMatch[1].toUpperCase();
      const latestExam = Rankings.getLatestExam();
      const matching = results.filter(r => r.examName === latestExam && r.grade === targetGrade);
      if (matching.length === 0) return `No students have Grade ${targetGrade} in ${latestExam}.`;
      let response = `**${matching.length} students with Grade ${targetGrade} in ${latestExam}:**\n\n`;
      matching.forEach(r => {
        const s = Students.getById(r.studentId);
        if (s) response += `• ${s.name} — ${r.percentage}%\n`;
      });
      return response;
    }

    // Specific subject query
    if (q.match(/who.*best.*in|who.*top.*in|performed.*best/)) {
      // Try to find subject name in question
      const sub = this.findSubjectInQuestion(q, subjects);
      if (!sub) return "I couldn't identify which subject you're asking about. Please specify the subject name.";
      const latestExam = Rankings.getLatestExam();
      const examResults = results.filter(r => r.examName === latestExam && r.marks[sub.id] !== undefined);
      examResults.sort((a, b) => (b.marks[sub.id] || 0) - (a.marks[sub.id] || 0));
      const top = examResults.slice(0, 5);
      let response = `**Top performers in ${sub.name} (${latestExam}):**\n\n`;
      top.forEach((r, i) => {
        const s = Students.getById(r.studentId);
        if (s) response += `#${i+1} ${s.name} — ${r.marks[sub.id]}/${sub.maxMarks}\n`;
      });
      return response;
    }

    // Below threshold
    if (q.match(/below\s*(\d+)|under\s*(\d+)|less.*than\s*(\d+)/)) {
      const threshold = parseInt(q.match(/(\d+)/)?.[1]) || 50;
      const latestExam = Rankings.getLatestExam();
      const below = results.filter(r => r.examName === latestExam && r.percentage < threshold);
      if (below.length === 0) return `No students scored below ${threshold}% in ${latestExam}.`;
      let response = `**${below.length} students below ${threshold}% in ${latestExam}:**\n\n`;
      below.forEach(r => {
        const s = Students.getById(r.studentId);
        if (s) response += `• ${s.name} — ${r.percentage}%\n`;
      });
      return response;
    }

    // Improving students
    if (q.match(/improv|progress|getting.*better/)) {
      const exams = [...new Set(results.map(r => r.examName))].sort();
      if (exams.length < 2) return "Need at least 2 exams to track improvement.";
      const prev = exams[exams.length - 2];
      const curr = exams[exams.length - 1];
      const improving = [];
      students.forEach(s => {
        const prevR = results.find(r => r.studentId === s.id && r.examName === prev);
        const currR = results.find(r => r.studentId === s.id && r.examName === curr);
        if (prevR && currR && currR.percentage > prevR.percentage) {
          improving.push({ name: s.name, prev: prevR.percentage, curr: currR.percentage, diff: Math.round((currR.percentage - prevR.percentage) * 10) / 10 });
        }
      });
      improving.sort((a, b) => b.diff - a.diff);
      if (improving.length === 0) return "No students showed improvement between the last two exams.";
      let response = `**${improving.length} students improved from ${prev} to ${curr}:**\n\n`;
      improving.slice(0, 10).forEach(s => {
        response += `• ${s.name}: ${s.prev}% → ${s.curr}% (+${s.diff}%)\n`;
      });
      return response;
    }

    // Section comparison
    if (q.match(/section|compare.*section/)) {
      const latestExam = Rankings.getLatestExam();
      const sections = {};
      results.filter(r => r.examName === latestExam).forEach(r => {
        const s = Students.getById(r.studentId);
        if (!s) return;
        if (!sections[s.section]) sections[s.section] = [];
        sections[s.section].push(r.percentage);
      });
      let response = `**Section Comparison (${latestExam}):**\n\n`;
      Object.entries(sections).forEach(([sec, pcts]) => {
        const avg = Math.round(pcts.reduce((a,b) => a+b, 0) / pcts.length * 10) / 10;
        response += `Section ${sec}: ${avg}% average (${pcts.length} students)\n`;
      });
      return response;
    }

    // Hello
    if (q.match(/hello|hi|hey/)) return "Hello, Admin! 👋 I can help you analyze academic data. Try asking about top students, fail rates, subject performance, or class averages.";

    if (q.match(/help|what.*can/)) {
      return `I can answer questions like:\n\n` +
        `👥 "Who are the top 5 students?"\n` +
        `❌ "How many students failed?"\n` +
        `📊 "What is the class average?"\n` +
        `📚 "Which subject has the lowest average?"\n` +
        `🏆 "Who performed best in Python?"\n` +
        `📈 "Which students are improving?"\n` +
        `🎓 "Show me students with grade A+"\n` +
        `⚠️ "Which students scored below 50%?"\n`;
    }

    return "I'm not sure how to answer that. Try asking about student performance, grades, rankings, or subject analysis. Type 'help' for suggestions.";
  },

  // Find subject mentioned in question
  findSubjectInQuestion(q, subjects) {
    for (const sub of subjects) {
      if (q.includes(sub.name.toLowerCase()) || q.includes(sub.code.toLowerCase())) return sub;
      // Partial matching
      const words = sub.name.toLowerCase().split(' ');
      for (const w of words) {
        if (w.length > 3 && q.includes(w)) return sub;
      }
    }
    return null;
  },

  // IMPROVEMENT ADVICE (for student)
  generateImprovementAdvice(ctx) {
    const { student, latestResult, subjects } = ctx;
    if (!latestResult) return "I need your exam results to provide improvement advice.";

    const avg = latestResult.percentage;
    const subjectScores = subjects.map(s => ({
      name: s.name,
      marks: latestResult.marks[s.id] || 0,
      max: s.maxMarks,
      pct: ((latestResult.marks[s.id] || 0) / s.maxMarks) * 100
    })).sort((a, b) => a.pct - b.pct);

    const weak = subjectScores.filter(s => s.pct < avg - 5);
    const strong = subjectScores.filter(s => s.pct >= avg + 5);

    let response = `**Improvement Analysis for ${student.name}**\n\n`;
    response += `Current: ${latestResult.percentage}% (Grade ${latestResult.grade})\n\n`;

    if (strong.length > 0) {
      response += `✅ **Strong Areas:**\n`;
      strong.forEach(s => response += `• ${s.name}: ${Math.round(s.pct)}%\n`);
      response += '\n';
    }

    if (weak.length > 0) {
      response += `⚠️ **Focus Areas:**\n`;
      weak.forEach(s => response += `• ${s.name}: ${Math.round(s.pct)}% (needs +${Math.round(avg - s.pct)}%)\n`);
      response += '\n';
    }

    response += `💡 **Recommendations:**\n`;
    response += `1. Focus extra time on ${weak[0]?.name || 'your weakest subjects'}\n`;
    response += `2. Target ${Math.min(Math.round(avg + 5), 100)}% next semester\n`;
    response += `3. Practice previous year questions\n`;
    response += `4. Maintain your performance in strong areas\n`;

    return response;
  },

  // STUDY PLAN (for student)
  generateStudyPlan(ctx) {
    const { student, latestResult, subjects } = ctx;
    if (!latestResult) return "I need your results to create a study plan.";

    const subjectScores = subjects.map(s => ({
      name: s.name,
      pct: ((latestResult.marks[s.id] || 0) / s.maxMarks) * 100
    })).sort((a, b) => a.pct - b.pct);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const focusSubjects = subjectScores.slice(0, 3); // Bottom 3
    const maintainSubjects = subjectScores.slice(3);

    let response = `**Weekly Study Plan for ${student.name}**\n\n`;
    response += `Focus Areas: ${focusSubjects.map(s => s.name).join(', ')}\n\n`;

    days.forEach((day, i) => {
      if (day === 'Sunday') {
        response += `📅 **${day}**: Revision & Practice Tests\n`;
      } else if (day === 'Saturday') {
        response += `📅 **${day}**: ${maintainSubjects[i % maintainSubjects.length]?.name || 'Review'} + Revision\n`;
      } else {
        const subject = focusSubjects[i % focusSubjects.length];
        response += `📅 **${day}**: ${subject.name} (${Math.round(subject.pct)}% → target ${Math.min(Math.round(subject.pct + 10), 100)}%)\n`;
      }
    });

    response += `\n💪 Stay consistent and you'll see improvement!`;
    return response;
  },

  // PERFORMANCE SUMMARY (for student)
  generatePerformanceSummary(ctx) {
    const { student, results, latestResult, rankInfo, subjects } = ctx;
    if (results.length === 0) return "No results available to analyze your performance.";

    let response = `**Performance Summary — ${student.name}**\n\n`;
    response += `Latest: ${latestResult.examName} — ${latestResult.percentage}% (Grade ${latestResult.grade})\n`;

    if (rankInfo) {
      response += `Rank: #${rankInfo.rank} out of ${rankInfo.total} (Top ${rankInfo.topPercent}%)\n`;
    }

    // Trend
    if (results.length > 1) {
      const sorted = [...results].sort((a, b) => a.date?.localeCompare(b.date));
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const diff = Math.round((last.percentage - first.percentage) * 10) / 10;
      response += `\n📈 **Trend**: ${diff >= 0 ? '+' : ''}${diff}% since ${first.examName}\n`;
      response += diff > 0 ? 'You are improving! 🎉\n' : diff < 0 ? "Your performance has declined. Let's work on improving!\n" : 'Consistent performance.\n';
    }

    response += `\nResult: ${latestResult.result}`;
    if (latestResult.failedSubjects.length > 0) {
      const failedNames = latestResult.failedSubjects.map(id => Subjects.getById(id)?.name || id);
      response += `\n⚠️ Failed subjects: ${failedNames.join(', ')}`;
    }

    return response;
  },

  // CONCEPT ANSWERS (rule-based for common CS topics)
  answerConceptQuestion(q) {
    const concepts = {
      'polymorphism': "Polymorphism means \"many forms\". In OOP, it allows objects of different classes to be treated as objects of a common parent class. There are two types:\n\n1. **Compile-time (Method Overloading)**: Same method name, different parameters\n2. **Runtime (Method Overriding)**: Child class provides a specific implementation of a parent's method\n\nExample: A `Shape` class with a `draw()` method overridden by `Circle`, `Rectangle` subclasses.",
      'recursion': 'Recursion is when a function calls itself to solve a problem by breaking it into smaller sub-problems.\n\n**Key components:**\n1. **Base case**: The condition where recursion stops\n2. **Recursive case**: The function calls itself with a smaller input\n\n**Example (Factorial):**\n```\nfunction factorial(n) {\n  if (n <= 1) return 1;  // base case\n  return n * factorial(n-1);  // recursive case\n}\n```',
      'normalization': 'Database Normalization organizes data to reduce redundancy.\n\n**Normal Forms:**\n• **1NF**: Atomic values, no repeating groups\n• **2NF**: 1NF + no partial dependencies\n• **3NF**: 2NF + no transitive dependencies\n• **BCNF**: Stricter version of 3NF\n\nPurpose: Eliminate data anomalies (insertion, update, deletion anomalies).',
      'tcp': 'TCP (Transmission Control Protocol) vs UDP (User Datagram Protocol):\n\n**TCP:**\n• Connection-oriented (3-way handshake)\n• Reliable delivery (acknowledgments, retransmission)\n• Ordered data delivery\n• Flow control & congestion control\n• Use: Web browsing, email, file transfer\n\n**UDP:**\n• Connectionless\n• No guaranteed delivery\n• Faster, lower overhead\n• Use: Video streaming, gaming, DNS',
      'binary search': 'Binary Search finds a target value in a **sorted** array by repeatedly dividing the search range in half.\n\n**Algorithm:**\n1. Compare target with middle element\n2. If equal → found\n3. If target < middle → search left half\n4. If target > middle → search right half\n\n**Time Complexity:** O(log n)\n**Space Complexity:** O(1) iterative, O(log n) recursive',
      'stack': 'A Stack is a LIFO (Last In, First Out) data structure.\n\n**Operations:**\n• push(x) — Add to top\n• pop() — Remove from top\n• peek() — View top element\n• isEmpty() — Check if empty\n\n**Applications:** Function call stack, expression evaluation, undo operations, backtracking',
      'linked list': 'A Linked List is a linear data structure where elements (nodes) are linked using pointers.\n\n**Types:**\n1. Singly Linked List\n2. Doubly Linked List\n3. Circular Linked List\n\n**Advantages over arrays:** Dynamic size, efficient insertions/deletions\n**Disadvantages:** No random access, extra memory for pointers',
      'oop': 'Object-Oriented Programming (OOP) has 4 main pillars:\n\n1. **Encapsulation**: Bundling data and methods, hiding internal state\n2. **Abstraction**: Hiding complex details, showing only essentials\n3. **Inheritance**: Creating new classes from existing ones\n4. **Polymorphism**: Same interface, different implementations',
      'sql': 'SQL (Structured Query Language) is used to manage relational databases.\n\n**Key commands:**\n• SELECT — Query data\n• INSERT — Add data\n• UPDATE — Modify data\n• DELETE — Remove data\n• CREATE TABLE — Define structure\n• JOIN — Combine tables\n• WHERE — Filter conditions\n• GROUP BY — Aggregate data',
      'sorting': 'Common sorting algorithms:\n\n| Algorithm | Best | Average | Worst | Space |\n|-----------|------|---------|-------|-------|\n| Bubble | O(n) | O(n²) | O(n²) | O(1) |\n| Selection | O(n²) | O(n²) | O(n²) | O(1) |\n| Insertion | O(n) | O(n²) | O(n²) | O(1) |\n| Merge | O(n log n) | O(n log n) | O(n log n) | O(n) |\n| Quick | O(n log n) | O(n log n) | O(n²) | O(log n) |',
      'os': 'An Operating System manages hardware and software resources.\n\n**Key functions:**\n• Process management\n• Memory management\n• File system management\n• I/O management\n• Security & protection\n\n**Types:** Batch, Time-sharing, Real-time, Distributed, Embedded',
      'dbms': 'A Database Management System (DBMS) is software for creating, managing, and manipulating databases.\n\n**Features:** Data independence, data integrity, concurrent access, security, backup/recovery\n\n**Types:** Relational (MySQL, PostgreSQL), NoSQL (MongoDB), Object-oriented, Graph'
    };

    for (const [key, answer] of Object.entries(concepts)) {
      if (q.includes(key)) return answer;
    }

    return "That's an interesting topic! While I have limited built-in knowledge, I recommend checking your textbook or course notes for a detailed explanation. I'm best at helping with your academic performance and common CS concepts.";
  },

  // CODE EXAMPLES
  answerCodeQuestion(q) {
    if (q.includes('python')) {
      return '**Python Example — Fibonacci:**\n```python\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nfor i in range(10):\n    print(fibonacci(i), end=" ")\n# Output: 0 1 1 2 3 5 8 13 21 34\n```';
    }
    if (q.includes('java')) {
      return '**Java Example — Hello World:**\n```java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n```';
    }
    if (q.includes('c ') || q.includes('c\\n') || q.includes('in c')) {
      return '**C Example — Array Sum:**\n```c\n#include <stdio.h>\nint main() {\n    int arr[] = {1, 2, 3, 4, 5};\n    int sum = 0;\n    for (int i = 0; i < 5; i++)\n        sum += arr[i];\n    printf("Sum: %d\\\\n", sum);\n    return 0;\n}\n```';
    }
    return "What programming language would you like an example in? I can help with Python, Java, or C.";
  },

  // RENDER ADMIN CHAT
  renderAdminChat() {
    const container = document.getElementById('page-admin-ai');
    if (!container) return;

    const suggestions = [
      'Who are the top 5 students?',
      'How many students failed?',
      'What is the class average?',
      'Which subject has the lowest average?',
      'Which students scored below 50%?',
      'Which students are improving?',
      'Show me students with grade A+'
    ];

    let html = `
      <div class="page-header"><h2>AI Admin Assistant</h2></div>
      <div class="ai-chat card">
        <div class="ai-messages" id="admin-ai-messages">
          ${this.adminHistory.length === 0 ? `
            <div class="ai-message ai-bot-msg">
              <strong>EduBot</strong><br>
              Hello, Admin! 👋 I can help you analyze academic data. Ask me about student performance, grades, rankings, or subject analysis.
            </div>
          ` : this.adminHistory.map(m => `
            <div class="ai-message ${m.role === 'user' ? 'ai-user-msg' : 'ai-bot-msg'}">
              ${m.role === 'bot' ? '<strong>EduBot</strong><br>' : ''}${this.formatResponse(m.text)}
            </div>
          `).join('')}
        </div>
        <div class="ai-suggestions">
          ${suggestions.map(s => `<button class="ai-chip" onclick="AI.sendAdminMessage('${s.replace(/'/g, "\\\\'")}')"> ${UI.escapeHtml(s)}</button>`).join('')}
        </div>
        <div class="ai-input-area">
          <input type="text" class="form-input ai-input" id="admin-ai-input" placeholder="Ask about academic data..." onkeydown="if(event.key==='Enter')AI.sendAdminMessage()">
          <button class="btn btn-primary btn-icon" onclick="AI.sendAdminMessage()">${Icons.send}</button>
        </div>
      </div>
    `;
    container.innerHTML = html;
    this.scrollChat('admin-ai-messages');
  },

  // RENDER STUDENT CHAT
  renderStudentChat() {
    const container = document.getElementById('page-student-ai');
    if (!container) return;

    const suggestions = [
      'What is my percentage?',
      'What is my rank?',
      'What is my weakest subject?',
      'How can I improve?',
      'Create a study plan',
      'Explain polymorphism',
      'What is binary search?'
    ];

    let html = `
      <div class="page-header"><h2>EduBot — AI Academic Assistant</h2></div>
      <div class="ai-chat card">
        <div class="ai-messages" id="student-ai-messages">
          ${this.studentHistory.length === 0 ? `
            <div class="ai-message ai-bot-msg">
              <strong>EduBot</strong><br>
              Hello! 👋 I'm your academic assistant. Ask me about your grades, performance, or CS concepts!
            </div>
          ` : this.studentHistory.map(m => `
            <div class="ai-message ${m.role === 'user' ? 'ai-user-msg' : 'ai-bot-msg'}">
              ${m.role === 'bot' ? '<strong>EduBot</strong><br>' : ''}${this.formatResponse(m.text)}
            </div>
          `).join('')}
        </div>
        <div class="ai-suggestions">
          ${suggestions.map(s => `<button class="ai-chip" onclick="AI.sendStudentMessage('${s.replace(/'/g, "\\\\'")}')"> ${UI.escapeHtml(s)}</button>`).join('')}
        </div>
        <div class="ai-input-area">
          <input type="text" class="form-input ai-input" id="student-ai-input" placeholder="Ask me anything..." onkeydown="if(event.key==='Enter')AI.sendStudentMessage()">
          <button class="btn btn-primary btn-icon" onclick="AI.sendStudentMessage()">${Icons.send}</button>
        </div>
      </div>
    `;
    container.innerHTML = html;
    this.scrollChat('student-ai-messages');
  },

  sendAdminMessage(text = null) {
    const input = document.getElementById('admin-ai-input');
    const message = text || input?.value?.trim();
    if (!message) return;
    if (input) input.value = '';

    this.adminHistory.push({ role: 'user', text: message });
    const response = this.ask(message, 'admin');
    this.adminHistory.push({ role: 'bot', text: response });

    this.renderAdminChat();
  },

  sendStudentMessage(text = null) {
    const input = document.getElementById('student-ai-input');
    const message = text || input?.value?.trim();
    if (!message) return;
    if (input) input.value = '';

    const studentId = EduResult.currentUser?.studentId;
    this.studentHistory.push({ role: 'user', text: message });
    const response = this.ask(message, 'student', studentId);
    this.studentHistory.push({ role: 'bot', text: response });

    this.renderStudentChat();
  },

  formatResponse(text) {
    if (!text) return '';
    // Escape HTML first to prevent XSS injection
    const escaped = typeof UI !== 'undefined' ? UI.escapeHtml(text) : text;
    // Then safely apply markdown transforms
    return escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  },

  scrollChat(containerId) {
    const el = document.getElementById(containerId);
    if (el) setTimeout(() => el.scrollTop = el.scrollHeight, 50);
  }
};

window.AI = AI;
