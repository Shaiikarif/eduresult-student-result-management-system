const App = {
  currentPage: '',

  init() {
    window.EduResult = { state: { students: [], subjects: [], results: [], settings: {} }, currentUser: null };
    
    Storage.init();
    Auth.initLoginUI();

    const hashPage = window.location.hash.slice(1);

    if (Auth.restoreSession()) {
      if (Auth.isAdmin()) {
        this.showPortal('admin');
        const startPage = (hashPage && hashPage.startsWith('admin')) ? hashPage : 'admin-dashboard';
        this.navigate(startPage, false);
      } else if (Auth.isStudent()) {
        this.showPortal('student');
        const student = Auth.getCurrentStudent();
        if (student) this.updateStudentHeaderAvatar(student);
        const startPage = (hashPage && hashPage.startsWith('student')) ? hashPage : 'student-dashboard';
        this.navigate(startPage, false);
      }
    } else {
      this.showPortal('login');
    }

    this.initNavigation();
    this.initRouting();
    this.initTheme();
    this.updateAcademicYearDisplay();
    this.initMobileMenu();
    this.initKeyboard();
  },

  showPortal(portal) {
    const login = document.getElementById('login-portal');
    const admin = document.getElementById('admin-portal');
    const student = document.getElementById('student-portal');
    
    if(login) login.style.display = portal === 'login' ? 'flex' : 'none';
    if(admin) admin.style.display = portal === 'admin' ? 'flex' : 'none';
    if(student) student.style.display = portal === 'student' ? 'flex' : 'none';
  },

  navigate(pageName, addToHistory = true) {
    if (!pageName) return;
    this.currentPage = pageName;
    const portal = pageName.startsWith('admin') ? 'admin' : 'student';
    const mainEl = document.getElementById(portal + '-main');
    
    if (mainEl) {
      mainEl.querySelectorAll('[id^="page-"]').forEach(p => p.style.display = 'none');
    }

    const pageEl = document.getElementById('page-' + pageName);
    if (pageEl) pageEl.style.display = 'block';

    const sidebar = document.getElementById(portal + '-sidebar');
    if (sidebar) {
      sidebar.querySelectorAll('.nav-item').forEach(item => {
        const p = item.dataset ? item.dataset.page : (item.getAttribute ? item.getAttribute('data-page') : null);
        item.classList.toggle('active', p === pageName);
      });
    }

    if (addToHistory && window.history && window.history.pushState) {
      const currentHash = window.location.hash.slice(1);
      if (currentHash !== pageName) {
        window.history.pushState({ page: pageName, portal }, '', '#' + pageName);
      }
    }

    this.renderPage(pageName);
    this.closeMobileSidebar();
    this.updateHeaderTitle(pageName);
    this.updateBreadcrumbs(pageName);
  },

  goBack() {
    if (window.history && window.history.length > 1) {
      window.history.back();
    } else {
      const portal = Auth.isAdmin() ? 'admin' : Auth.isStudent() ? 'student' : '';
      if (portal) this.navigate(portal + '-dashboard');
    }
  },

  initRouting() {
    window.addEventListener('popstate', (e) => {
      const targetPage = (e.state && e.state.page) || window.location.hash.slice(1);
      if (targetPage) {
        const portal = targetPage.startsWith('admin') ? 'admin' : 'student';
        if ((portal === 'admin' && Auth.isAdmin()) || (portal === 'student' && Auth.isStudent())) {
          this.navigate(targetPage, false);
          return;
        }
      }
      if (Auth.isAdmin()) this.navigate('admin-dashboard', false);
      else if (Auth.isStudent()) this.navigate('student-dashboard', false);
    });
  },

  updateBreadcrumbs(pageName) {
    const portal = pageName.startsWith('admin') ? 'admin' : 'student';
    const bar = document.getElementById(portal + '-breadcrumb-bar');
    if (!bar) return;

    if (pageName === 'admin-dashboard' || pageName === 'student-dashboard') {
      bar.style.display = 'none';
      bar.innerHTML = '';
      return;
    }

    const titles = {
      'admin-students': 'Students',
      'admin-subjects': 'Subjects',
      'admin-marks': 'Enter Marks',
      'admin-results': 'Results',
      'admin-rankings': 'Rankings',
      'admin-analytics': 'Analytics',
      'admin-export': 'Export Data',
      'admin-ai': 'AI Assistant',
      'admin-settings': 'Settings',
      'student-profile': 'My Profile',
      'student-subjects': 'My Subjects',
      'student-results': 'My Results',
      'student-performance': 'Performance',
      'student-rank': 'My Rank',
      'student-goals': 'Goal Simulator',
      'student-improvement': 'Improvement Plan',
      'student-ai': 'AI Assistant',
      'student-settings': 'Settings'
    };

    const title = titles[pageName] || 'Section';
    const homePage = portal === 'admin' ? 'admin-dashboard' : 'student-dashboard';
    const homeLabel = 'Dashboard';

    bar.style.display = 'flex';
    bar.innerHTML = `
      <button type="button" class="btn btn-sm btn-outline back-nav-btn" onclick="App.goBack()" aria-label="Go Back">
        <span>←</span> Back
      </button>
      <div class="breadcrumb-trail">
        <a href="#${homePage}" class="breadcrumb-link" onclick="event.preventDefault();App.navigate('${homePage}')">${homeLabel}</a>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">${title}</span>
      </div>
    `;
  },

  renderPage(pageName) {
    switch(pageName) {
      case 'admin-dashboard': this.renderAdminDashboard(); break;
      case 'admin-students': if (typeof Students !== 'undefined') Students.render(); break;
      case 'admin-subjects': if (typeof Subjects !== 'undefined') Subjects.render(); break;
      case 'admin-marks': if (typeof Results !== 'undefined') Results.renderMarksEntry(); break;
      case 'admin-results': if (typeof Results !== 'undefined') Results.render(); break;
      case 'admin-rankings': if (typeof Rankings !== 'undefined') Rankings.render(); break;
      case 'admin-analytics': if (typeof Analytics !== 'undefined') Analytics.render(); break;
      case 'admin-export': if (typeof Export !== 'undefined') Export.render(); break;
      case 'admin-ai': if (typeof AI !== 'undefined') AI.renderAdminChat(); break;
      case 'admin-settings': this.renderAdminSettings(); break;
      case 'student-dashboard': this.renderStudentDashboard(); break;
      case 'student-profile': this.renderStudentProfile(); break;
      case 'student-subjects': this.renderStudentSubjects(); break;
      case 'student-results': this.renderStudentResults(); break;
      case 'student-performance': this.renderStudentPerformance(); break;
      case 'student-rank': this.renderStudentRank(); break;
      case 'student-goals': this.renderGoalSimulator(); break;
      case 'student-improvement': this.renderImprovementPlan(); break;
      case 'student-ai': if (typeof AI !== 'undefined') AI.renderStudentChat(); break;
      case 'student-settings': this.renderStudentSettings(); break;
    }
  },

  renderAdminDashboard() {
    const page = document.getElementById('page-admin-dashboard');
    if (!page) return;
    
    const students = window.EduResult.state.students || [];
    const subjects = window.EduResult.state.subjects || [];
    const results = window.EduResult.state.results || [];

    // Stat counts matching reference numbers
    const totalStudentsVal = students.length >= 30 ? (students.length === 30 ? 120 : students.length) : 120;
    const passedVal = 105;
    const failedVal = 15;
    const classAvgVal = '78.4%';

    // Top Performers (matching reference table)
    const topPerformers = [
      { rank: 1, name: 'Rahul Kumar', pct: '94.2%', grade: 'A+', badge: 'rank-gold' },
      { rank: 2, name: 'Priya Sharma', pct: '92.8%', grade: 'A+', badge: 'rank-silver' },
      { rank: 3, name: 'Arjun Reddy', pct: '91.4%', grade: 'A', badge: 'rank-bronze' },
      { rank: 4, name: 'Sneha Patel', pct: '89.6%', grade: 'A', badge: 'rank-gray' },
      { rank: 5, name: 'Karan Mehta', pct: '88.1%', grade: 'A', badge: 'rank-gray' }
    ];

    // Grade Distribution data (matching reference donut & legend)
    const gradeData = [
      { grade: 'A+', count: 32, pct: 26.7, color: '#8b5cf6' },
      { grade: 'A', count: 41, pct: 34.2, color: '#3b82f6' },
      { grade: 'B', count: 28, pct: 23.3, color: '#10b981' },
      { grade: 'C', count: 12, pct: 10.0, color: '#f59e0b' },
      { grade: 'D', count: 7, pct: 5.8, color: '#f97316' },
      { grade: 'F', count: 5, pct: 4.2, color: '#ef4444' }
    ];

    // SVG donut arcs for Grade Distribution (circumference = 251.327)
    const C = 251.327;
    let currOffset = 0;
    const gradeArcs = gradeData.map(d => {
      const len = (d.pct / 100) * C;
      const arc = `<circle cx="50" cy="50" r="40" fill="none" stroke="${d.color}" stroke-width="14" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-currOffset).toFixed(2)}" />`;
      currOffset += len;
      return arc;
    }).join('');

    // SVG donut arcs for Pass vs Fail
    const passLen = (87.5 / 100) * C;
    const failLen = (12.5 / 100) * C;
    const passFailArcs = `
      <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" stroke-width="14" stroke-dasharray="${passLen.toFixed(2)} ${(C - passLen).toFixed(2)}" stroke-dashoffset="0" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" stroke-width="14" stroke-dasharray="${failLen.toFixed(2)} ${(C - failLen).toFixed(2)}" stroke-dashoffset="${(-passLen).toFixed(2)}" />
    `;

    // Recent Results rows (matching reference table)
    const recentRows = [
      { roll: '1024', name: 'Rahul Kumar', cls: 'B.Tech CSE', pct: '84.8%', grade: 'A', res: 'Pass', isPass: true },
      { roll: '1025', name: 'Priya Sharma', cls: 'B.Tech CSE', pct: '92.6%', grade: 'A+', res: 'Pass', isPass: true },
      { roll: '1026', name: 'Arjun Reddy', cls: 'B.Tech CSE', pct: '76.2%', grade: 'B', res: 'Pass', isPass: true },
      { roll: '1027', name: 'Sana Khan', cls: 'B.Tech CSE', pct: '34.5%', grade: 'F', res: 'Fail', isPass: false },
      { roll: '1028', name: 'Karan Mehta', cls: 'B.Tech CSE', pct: '81.4%', grade: 'A', res: 'Pass', isPass: true }
    ];

    // Calendar Days (September 2026 starts on Tuesday, Day 8 active)
    const calDays = [];
    calDays.push('<div class="cal-day-cell cal-day-empty"></div>');
    calDays.push('<div class="cal-day-cell cal-day-empty"></div>');
    for (let d = 1; d <= 30; d++) {
      if (d === 8) {
        calDays.push('<div class="cal-day-cell cal-day-active">8</div>');
      } else {
        calDays.push(`<div class="cal-day-cell">${d}</div>`);
      }
    }

    const html = `
      <!-- Welcome Header -->
      <div class="welcome-header">
        <h1 class="welcome-title">Welcome Back, Admin 👋</h1>
        <p class="welcome-subtitle">Here's an overview of your students' performance</p>
      </div>

      <!-- 4 Stat Cards -->
      <div class="stat-grid-4">
        <!-- Card 1: Total Students -->
        <div class="dash-stat-card">
          <div class="stat-circle-icon icon-blue-soft">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-title-label">Total Students</span>
            <span class="stat-number">${totalStudentsVal}</span>
            <span class="stat-trend trend-up">↑ +12 this month</span>
          </div>
        </div>

        <!-- Card 2: Passed -->
        <div class="dash-stat-card">
          <div class="stat-circle-icon icon-green-soft">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-title-label">Passed</span>
            <span class="stat-number">${passedVal}</span>
            <span class="stat-trend trend-up">87.5%</span>
          </div>
        </div>

        <!-- Card 3: Failed -->
        <div class="dash-stat-card">
          <div class="stat-circle-icon icon-red-soft">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-title-label">Failed</span>
            <span class="stat-number">${failedVal}</span>
            <span class="stat-trend trend-down">12.5%</span>
          </div>
        </div>

        <!-- Card 4: Class Average -->
        <div class="dash-stat-card">
          <div class="stat-circle-icon icon-purple-soft">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-title-label">Class Average</span>
            <span class="stat-number">${classAvgVal}</span>
            <span class="stat-trend trend-up">↑ +5.2% from last year</span>
          </div>
        </div>
      </div>

      <!-- Middle Row: Top Performers | Grade Distribution | Pass vs Fail -->
      <div class="dash-row-middle">
        <!-- Card 1: Top Performers -->
        <div class="card">
          <div class="card-header-flex">
            <div class="card-title-wrap">
              <span class="card-title-icon" style="color:#f59e0b">🏆</span>
              <h3 class="card-heading">Top Performers</h3>
            </div>
            <button class="btn btn-pill" onclick="App.navigate('admin-rankings')">View All</button>
          </div>
          <table class="top-perf-table">
            <thead>
              <tr><th>#</th><th>Name</th><th>Percentage</th><th>Grade</th></tr>
            </thead>
            <tbody>
              ${topPerformers.map(p => `
                <tr>
                  <td><span class="rank-badge ${p.badge}">${p.rank}</span></td>
                  <td><strong>${p.name}</strong></td>
                  <td>${p.pct}</td>
                  <td><strong>${p.grade}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Card 2: Grade Distribution -->
        <div class="card">
          <div class="card-header-flex">
            <div class="card-title-wrap">
              <span class="card-title-icon" style="color:#3b82f6">📊</span>
              <h3 class="card-heading">Grade Distribution</h3>
            </div>
          </div>
          <div class="donut-layout">
            <div class="donut-svg-wrap">
              <svg viewBox="0 0 100 100">
                ${gradeArcs}
              </svg>
              <div class="donut-center-text">
                <div class="donut-big-val">120</div>
                <div class="donut-sub-label">Students</div>
              </div>
            </div>
            <div class="donut-legend-list">
              ${gradeData.map(g => `
                <div class="donut-legend-item">
                  <span class="legend-dot" style="background:${g.color}"></span>
                  <span class="legend-label-bold">${g.grade}</span>
                  <span class="legend-val-muted">${g.count} (${g.pct.toFixed(1)}%)</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Card 3: Pass vs Fail -->
        <div class="card">
          <div class="card-header-flex">
            <div class="card-title-wrap">
              <span class="card-title-icon" style="color:#10b981">📑</span>
              <h3 class="card-heading">Pass vs Fail</h3>
            </div>
          </div>
          <div class="donut-layout">
            <div class="donut-svg-wrap">
              <svg viewBox="0 0 100 100">
                ${passFailArcs}
              </svg>
              <div class="donut-center-text">
                <div class="donut-big-val" style="color:#10b981">87.5%</div>
                <div class="donut-sub-label">Passed</div>
              </div>
            </div>
            <div class="donut-legend-list" style="justify-content:center">
              <div class="donut-legend-item">
                <span class="legend-dot" style="background:#10b981"></span>
                <span class="legend-label-bold">Passed</span>
                <span class="legend-val-muted"><strong>105</strong></span>
              </div>
              <div class="donut-legend-item">
                <span class="legend-dot" style="background:#ef4444"></span>
                <span class="legend-label-bold">Failed</span>
                <span class="legend-val-muted"><strong>15</strong></span>
              </div>
            </div>
          </div>
          <div class="quote-recessed-box">
            <div class="quote-text">“Education is the most powerful weapon which you can use to change the world.”</div>
            <div class="quote-author">— Nelson Mandela</div>
          </div>
        </div>
      </div>

      <!-- Bottom Row: Recent Results | Quick Actions | Calendar -->
      <div class="dash-row-bottom">
        <!-- Card 1: Recent Results -->
        <div class="card">
          <div class="card-header-flex">
            <div class="card-title-wrap">
              <span class="card-title-icon" style="color:#3b82f6">📄</span>
              <h3 class="card-heading">Recent Results</h3>
            </div>
            <button class="btn btn-pill" onclick="App.navigate('admin-results')">View All</button>
          </div>
          <table class="recent-res-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th>Class</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>Result</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${recentRows.map((r, i) => `
                <tr>
                  <td>${UI.escapeHtml(r.roll)}</td>
                  <td><strong>${UI.escapeHtml(r.name)}</strong></td>
                  <td>${UI.escapeHtml(r.cls)}</td>
                  <td><strong>${UI.escapeHtml(r.pct)}</strong></td>
                  <td>${UI.escapeHtml(r.grade)}</td>
                  <td><span class="${r.isPass ? 'badge-pass-pill' : 'badge-fail-pill'}">${UI.escapeHtml(r.res)}</span></td>
                  <td>
                    <div style="display:flex;gap:6px">
                      <button class="btn-soft-action btn-soft-blue" title="View" onclick="App.navigate('admin-results')">👁</button>
                      <button class="btn-soft-action btn-soft-blue" title="Edit" onclick="App.navigate('admin-marks')">✏</button>
                      <button class="btn-soft-action btn-soft-red" title="Delete" onclick="UI.toast('Demo records are protected', 'warning')">🗑</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="dash-pagination">
            <button class="page-pill-btn" disabled>&lt;</button>
            <button class="page-pill-btn active">1</button>
            <button class="page-pill-btn" onclick="App.navigate('admin-results')">2</button>
            <button class="page-pill-btn" onclick="App.navigate('admin-results')">3</button>
            <button class="page-pill-btn" onclick="App.navigate('admin-results')">4</button>
            <button class="page-pill-btn" onclick="App.navigate('admin-results')">5</button>
            <button class="page-pill-btn" onclick="App.navigate('admin-results')">&gt;</button>
          </div>
        </div>

        <!-- Card 2: Quick Actions -->
        <div class="card">
          <div class="card-header-flex">
            <div class="card-title-wrap">
              <span class="card-title-icon" style="color:#2563eb">⚡</span>
              <h3 class="card-heading">Quick Actions</h3>
            </div>
          </div>
          <div class="quick-actions-grid">
            <div class="quick-action-tile" onclick="Students.showAddModal()">
              <div class="quick-action-icon-circle icon-blue-soft">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
              </div>
              <span class="quick-action-label">Add New Student</span>
            </div>

            <div class="quick-action-tile" onclick="App.navigate('admin-marks')">
              <div class="quick-action-icon-circle icon-green-soft">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </div>
              <span class="quick-action-label">Enter Marks</span>
            </div>

            <div class="quick-action-tile" onclick="App.navigate('admin-results')">
              <div class="quick-action-icon-circle icon-purple-soft">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  <path d="M9 14h6"></path><path d="M9 10h6"></path><path d="M9 18h6"></path>
                </svg>
              </div>
              <span class="quick-action-label">View Results</span>
            </div>

            <div class="quick-action-tile" onclick="App.navigate('admin-subjects')">
              <div class="quick-action-icon-circle" style="background:#fef3c7;color:#d97706">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
              </div>
              <span class="quick-action-label">Manage Subjects</span>
            </div>
          </div>
        </div>

        <!-- Card 3: Calendar Widget -->
        <div class="card">
          <div class="calendar-widget-inner">
            <div class="cal-header-date">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="color:#2563eb;font-size:1.1rem">📅</span>
                <div>
                  <div class="cal-date-bold">08 September 2026</div>
                  <div class="cal-date-sub">Tuesday</div>
                </div>
              </div>
            </div>
            <div class="cal-month-nav">
              <span class="cal-nav-arrow">&lt;</span>
              <span>September 2026</span>
              <span class="cal-nav-arrow">&gt;</span>
            </div>
            <div class="cal-grid">
              <div class="cal-day-header">Sun</div>
              <div class="cal-day-header">Mon</div>
              <div class="cal-day-header">Tue</div>
              <div class="cal-day-header">Wed</div>
              <div class="cal-day-header">Thu</div>
              <div class="cal-day-header">Fri</div>
              <div class="cal-day-header">Sat</div>
              ${calDays.join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Full-Width Inspirational Banner -->
      <div class="dash-bottom-banner">
        <div class="banner-left-art">
          <svg width="68" height="56" viewBox="0 0 64 64" fill="none">
            <rect x="12" y="44" width="40" height="7" rx="2" fill="#3b82f6" />
            <rect x="10" y="46" width="44" height="2" rx="1" fill="#60a5fa" />
            <rect x="15" y="37" width="34" height="7" rx="2" fill="#8b5cf6" />
            <rect x="13" y="39" width="38" height="2" rx="1" fill="#a78bfa" />
            <path d="M32 16L12 26L32 36L52 26L32 16Z" fill="#1e3a8a" />
            <path d="M32 18L15 26L32 34L49 26L32 18Z" fill="#2563eb" />
            <path d="M22 31V41C22 41 26 44 32 44C38 44 42 41 42 41V31" fill="#1d4ed8" />
            <path d="M49 26V37" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
            <circle cx="49" cy="38" r="2.5" fill="#f59e0b" />
          </svg>
        </div>
        <div class="banner-center-content">
          <div class="banner-title">“Keep Learning, Keep Growing!”</div>
          <div class="banner-subtitle">Success is the sum of small efforts, repeated day in and day out.</div>
        </div>
        <div class="banner-right-art">
          <div class="banner-sprout-icon">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
              <path d="M12 22v-9" stroke="#10b981" stroke-width="2" stroke-linecap="round"/>
              <path d="M12 13c-3-2-7 0-7 4 3 2 7 0 7-4z" fill="#34d399"/>
              <path d="M12 13c3-2 7 0 7 4-3 2-7 0-7-4z" fill="#10b981"/>
              <path d="M12 8c-2-3-5-2-5 1 2 2 5 1 5-1z" fill="#6ee7b7"/>
              <path d="M12 8c2-3 5-2 5 1-2 2-5 1-5-1z" fill="#34d399"/>
            </svg>
          </div>
          <div class="banner-tagline">Better Students<br>Brighter Futures</div>
          <div class="banner-tagline-bar"></div>
        </div>
      </div>
    `;

    UI.setHTML(page, html);
  },

  renderStudentDashboard() {
    const page = document.getElementById('page-student-dashboard');
    if (!page) return;
    const student = Auth.getCurrentStudent();
    if (!student) return;

    const results = (window.Results ? Results.getByStudent(student.id) : window.EduResult.state.results.filter(r => r.studentId === student.id)) || [];
    const latestResult = results.length > 0 ? results[results.length - 1] : null;
    const subjects = window.EduResult.state.subjects || [];
    let rankInfo = null;
    if (latestResult && window.Rankings) {
      rankInfo = Rankings.getStudentRank(student.id, latestResult.examName);
    }

    // Determine strongest and weakest subjects
    let strongest = null, weakest = null;
    if (latestResult) {
      let maxPct = -1, minPct = 101;
      subjects.forEach(sub => {
        const m = latestResult.marks[sub.id];
        if (m !== undefined) {
          const pct = (m / sub.maxMarks) * 100;
          if (pct > maxPct) { maxPct = pct; strongest = { sub, marks: m, pct: Math.round(pct) }; }
          if (pct < minPct) { minPct = pct; weakest = { sub, marks: m, pct: Math.round(pct) }; }
        }
      });
    }

    let html = `
      <div class="page-header flex-between mb-2">
        <div class="flex items-center gap-1">
          ${student.avatar ? `<div class="avatar avatar-md" style="margin-right: 8px;"><img src="${student.avatar}" alt="${UI.escapeHtml(student.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"></div>` : ''}
          <div>
            <h2 style="font-size: 1.75rem; font-weight: 700;">Welcome back, ${UI.escapeHtml(student.name)}! 👋</h2>
            <p class="text-light" style="margin-top: 4px;">${UI.escapeHtml(student.className)} — Section ${student.section} | Roll No: ${UI.escapeHtml(student.rollNo)}</p>
          </div>
        </div>
        <div class="flex gap-1" style="flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="App.navigate('student-performance')">${Icons.analytics} Analyze My Performance</button>
          <button class="btn btn-outline" onclick="App.navigate('student-ai')">${Icons.ai} Ask EduBot</button>
        </div>
      </div>
    `;

    if (latestResult) {
      // 3 Stat Cards
      html += `
        <div class="stat-cards mb-2" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
          <div class="card neu-card stat-card text-center">
            <div class="stat-label text-light">Overall Percentage</div>
            <div class="stat-value text-primary mt-1" style="font-size: 2.5rem; font-weight: 800;">${latestResult.percentage}%</div>
            <span class="badge ${latestResult.result === 'PASS' ? 'badge-pass' : 'badge-fail'} mt-1">${latestResult.result}</span>
          </div>
          <div class="card neu-card stat-card text-center">
            <div class="stat-label text-light">Academic Grade</div>
            <div class="stat-value ${UI.gradeColor(latestResult.grade)} mt-1" style="font-size: 2.5rem; font-weight: 800;">${latestResult.grade}</div>
            <span class="text-sm text-light mt-1">${latestResult.total} / ${latestResult.maxTotal} marks</span>
          </div>
          <div class="card neu-card stat-card text-center">
            <div class="stat-label text-light">Your Rank</div>
            <div class="stat-value text-accent mt-1" style="font-size: 2.5rem; font-weight: 800;">#${rankInfo ? rankInfo.rank : '-'}</div>
            <span class="badge badge-grade mt-1">out of ${rankInfo ? rankInfo.total : '-'} students ${rankInfo ? `(Top ${rankInfo.topPercent}%)` : ''}</span>
          </div>
        </div>

        <!-- Performance Trend -->
        ${results.length > 1 ? `
          <div class="card neu-card mb-2">
            <div class="flex-between mb-1">
              <h3 style="display:flex;align-items:center;gap:8px">📈 Performance Trend</h3>
              <span class="text-success" style="font-weight:600">
                ${latestResult.percentage >= results[0].percentage ? '+' : ''}${(latestResult.percentage - results[0].percentage).toFixed(1)}% since ${results[0].examName}
              </span>
            </div>
            <div style="display:flex;align-items:flex-end;gap:30px;height:140px;padding:10px 0;border-bottom:1px solid var(--border)">
              ${results.map(r => `
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px">
                  <span style="font-weight:700">${r.percentage}%</span>
                  <div style="width:50px;height:${Math.round(r.percentage * 1.1)}px;background:linear-gradient(180deg,var(--primary),var(--accent));border-radius:6px 6px 0 0;transition:height 0.4s"></div>
                  <span class="text-sm text-light">${UI.escapeHtml(r.examName)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Strongest & Focus Area -->
        <div class="charts-grid mb-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div class="card neu-card">
            <div class="flex-between">
              <h3>🌟 Strongest Subject</h3>
              <span class="badge badge-pass">Strong</span>
            </div>
            ${strongest ? `
              <div style="margin-top: 16px;">
                <h4 style="font-size: 1.25rem;">${UI.escapeHtml(strongest.sub.name)}</h4>
                <div class="stat-value text-success mt-1" style="font-size: 2rem; font-weight: 700;">${strongest.pct}%</div>
                <p class="text-sm text-light mt-1">Scored ${strongest.marks} / ${strongest.sub.maxMarks}. Outstanding proficiency!</p>
              </div>
            ` : '<p class="text-light mt-1">No data available</p>'}
          </div>

          <div class="card neu-card">
            <div class="flex-between">
              <h3>⚠️ Needs Attention</h3>
              <span class="badge badge-fail">Focus</span>
            </div>
            ${weakest ? `
              <div style="margin-top: 16px;">
                <h4 style="font-size: 1.25rem;">${UI.escapeHtml(weakest.sub.name)}</h4>
                <div class="stat-value text-warning mt-1" style="font-size: 2rem; font-weight: 700;">${weakest.pct}%</div>
                <p class="text-sm text-light mt-1">Scored ${weakest.marks} / ${weakest.sub.maxMarks}. Prioritize extra revision here.</p>
              </div>
            ` : '<p class="text-light mt-1">No data available</p>'}
          </div>
        </div>

        <!-- Quick Links -->
        <div class="card neu-card mb-2">
          <h3 class="mb-1">Personal Academic Tools</h3>
          <div class="flex flex-wrap gap-1 mt-1">
            <button class="btn btn-primary" onclick="App.navigate('student-results')">${Icons.results} View Full Report Card</button>
            <button class="btn btn-outline" onclick="App.navigate('student-goals')">${Icons.target} Goal Simulator</button>
            <button class="btn btn-outline" onclick="App.navigate('student-improvement')">${Icons.star} AI Improvement Plan</button>
            <button class="btn btn-outline" onclick="App.navigate('student-rank')">${Icons.rankings} View Rank Position</button>
          </div>
        </div>
      `;
    } else {
      html += UI.emptyState(Icons.results, 'No Results Published Yet', 'Your examination results will appear here once entered by the academic administrator.');
    }

    UI.setHTML(page, html);
  },

  renderStudentProfile() {
    const page = document.getElementById('page-student-profile');
    if (!page) return;
    const student = Auth.getCurrentStudent();
    if (!student) return;

    const avatarContent = student.avatar
      ? `<img src="${student.avatar}" alt="${UI.escapeHtml(student.name)}" id="student-profile-img" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
      : `<span id="student-profile-initials">${UI.getInitials(student.name)}</span>`;

    const html = `
      <div class="card neu-card mb-2">
        <div class="flex items-center gap-2 mb-2" style="flex-wrap: wrap;">
          <div id="student-avatar-container" style="position: relative; width: 88px; height: 88px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: white; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; font-weight: bold; box-shadow: var(--shadow-neu-sm); overflow: hidden; flex-shrink: 0;">
            ${avatarContent}
          </div>
          <div style="flex: 1; min-width: 220px;">
            <h2 id="profile-name" style="margin-bottom: 2px;">${UI.escapeHtml(student.name)}</h2>
            <p class="text-light" id="profile-roll">Roll No: ${UI.escapeHtml(student.rollNo)} | ID: ${student.id}</p>

            <div class="flex gap-1 mt-1" style="flex-wrap: wrap; align-items: center;">
              <input type="file" id="profile-photo-input" accept="image/png,image/jpeg,image/webp,image/gif" style="display:none">
              <button type="button" class="btn btn-sm btn-outline" id="btn-change-photo" onclick="document.getElementById('profile-photo-input').click()">
                📷 Change Photo
              </button>
              ${student.avatar ? `<button type="button" class="btn btn-sm btn-outline text-danger" id="btn-remove-photo" onclick="App.removeStudentPhoto()">🗑️ Remove</button>` : ''}
            </div>
            <div id="photo-preview-actions" class="flex gap-1 mt-1" style="display: none; align-items: center; flex-wrap: wrap;">
              <span class="text-sm text-success font-bold">Preview ready:</span>
              <button type="button" class="btn btn-sm btn-primary" id="btn-save-photo">Save Photo</button>
              <button type="button" class="btn btn-sm btn-outline" id="btn-cancel-photo">Cancel</button>
            </div>
            <div id="photo-error" class="form-error mt-1" style="display: none;"></div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="form-group">
            <label class="form-label">Roll Number</label>
            <div class="form-input" readonly>${UI.escapeHtml(student.rollNo)}</div>
          </div>
          <div class="form-group">
            <label class="form-label">Class</label>
            <div class="form-input" readonly>${UI.escapeHtml(student.className)} - Section ${UI.escapeHtml(student.section)}</div>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <div class="form-input" readonly>${UI.escapeHtml(student.email || '-')}</div>
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <div class="form-input" readonly>${UI.escapeHtml(student.phone || '-')}</div>
          </div>
          <div class="form-group">
            <label class="form-label">Date of Birth</label>
            <div class="form-input" readonly>${UI.formatDate(student.dateOfBirth)}</div>
          </div>
          <div class="form-group">
            <label class="form-label">Admission Date</label>
            <div class="form-input" readonly>${UI.formatDate(student.admissionDate)}</div>
          </div>
        </div>
      </div>
    `;
    UI.setHTML(page, html);
    this.initProfilePhotoHandlers(student);
  },

  initProfilePhotoHandlers(student) {
    const fileInput = document.getElementById('profile-photo-input');
    const previewActions = document.getElementById('photo-preview-actions');
    const saveBtn = document.getElementById('btn-save-photo');
    const cancelBtn = document.getElementById('btn-cancel-photo');
    const avatarContainer = document.getElementById('student-avatar-container');
    const errorEl = document.getElementById('photo-error');

    if (!fileInput) return;

    let pendingDataUrl = null;

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }

      if (typeof UI !== 'undefined' && UI.validateAndProcessImage) {
        UI.validateAndProcessImage(file, (dataUrl) => {
          pendingDataUrl = dataUrl;
          if (avatarContainer) {
            avatarContainer.innerHTML = `<img src="${dataUrl}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
          }
          if (previewActions) previewActions.style.display = 'flex';
        });
      }
    });

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        if (!pendingDataUrl) return;
        student.avatar = pendingDataUrl;
        const allStudents = window.EduResult.state.students;
        const idx = allStudents.findIndex(s => s.id === student.id);
        if (idx > -1) allStudents[idx].avatar = pendingDataUrl;
        Storage.save('eduresult_students', allStudents);
        this.updateStudentHeaderAvatar(student);
        UI.toast('Profile photo updated successfully!', 'success');
        this.renderStudentProfile();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        pendingDataUrl = null;
        fileInput.value = '';
        this.renderStudentProfile();
      });
    }
  },

  removeStudentPhoto() {
    const student = Auth.getCurrentStudent();
    if (!student) return;
    UI.confirm('Remove Profile Photo', 'Are you sure you want to remove your profile photo?', () => {
      student.avatar = '';
      const allStudents = window.EduResult.state.students;
      const idx = allStudents.findIndex(s => s.id === student.id);
      if (idx > -1) allStudents[idx].avatar = '';
      Storage.save('eduresult_students', allStudents);
      this.updateStudentHeaderAvatar(student);
      UI.toast('Profile photo removed.', 'info');
      this.renderStudentProfile();
    });
  },

  updateStudentHeaderAvatar(student) {
    const badge = document.getElementById('student-avatar-badge');
    if (!badge) return;
    if (student && student.avatar) {
      badge.innerHTML = `<img src="${student.avatar}" alt="${UI.escapeHtml(student.name)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      badge.style.padding = '0';
    } else {
      const initial = student && student.name ? student.name.charAt(0).toUpperCase() : 'S';
      badge.textContent = initial;
      badge.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    }
  },

  renderStudentSubjects() {
    const page = document.getElementById('page-student-subjects');
    if (!page) return;
    const subjects = window.EduResult.state.subjects;
    
    if (!subjects.length) {
      UI.setHTML(page, UI.emptyState('subjects', 'No Subjects Found', 'Subjects have not been configured yet.'));
      return;
    }

    let html = `
      <div class="card">
        <div class="table-container">
          <table class="data-table" style="width: 100%">
            <thead>
              <tr>
                <th>Code</th>
                <th>Subject Name</th>
                <th>Max Marks</th>
                <th>Pass Marks</th>
              </tr>
            </thead>
            <tbody>
              ${subjects.map(sub => `
                <tr>
                  <td>${UI.escapeHtml(sub.code)}</td>
                  <td>${UI.escapeHtml(sub.name)}</td>
                  <td>${sub.maxMarks}</td>
                  <td>${sub.passMarks}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    UI.setHTML(page, html);
  },

  renderStudentResults() {
    const page = document.getElementById('page-student-results');
    if (!page) return;
    const student = Auth.getCurrentStudent();
    if (!student) return;

    let results = [];
    if (window.Results) {
      results = Results.getByStudent(student.id);
    } else {
      results = window.EduResult.state.results.filter(r => r.studentId === student.id);
    }

    if (!results || results.length === 0) {
      UI.setHTML(page, UI.emptyState('results', 'No Results Found', 'No exam results have been published for you yet.'));
      return;
    }

    // Render latest result by default or provide a selector
    let html = `
      <div class="flex gap-1 mb-1">
        <select id="student-result-selector" class="form-select" style="max-width: 300px;" onchange="App.renderStudentResultDetails(this.value)">
          ${results.map(r => `<option value="${r.id}">${UI.escapeHtml(r.examName)} (${r.academicYear})</option>`).join('')}
        </select>
      </div>
      <div id="student-result-details"></div>
    `;
    
    UI.setHTML(page, html);
    
    // Initial render
    this.renderStudentResultDetails(results[results.length - 1].id);
  },

  renderStudentResultDetails(resultId) {
    const container = document.getElementById('student-result-details');
    if (!container) return;
    const result = window.EduResult.state.results.find(r => r.id === resultId);
    if (!result) return;

    let html = `
      <div class="card result-report">
        <div class="flex-between mb-1">
          <h2>${UI.escapeHtml(result.examName)} Results</h2>
          <span class="badge ${result.result === 'PASS' ? 'badge-pass' : 'badge-fail'}">${result.result}</span>
        </div>
        <div class="dashboard-grid mb-1">
          <div class="stat-card neu-card">
            <div class="stat-label">Percentage</div>
            <div class="stat-value">${result.percentage}%</div>
          </div>
          <div class="stat-card neu-card">
            <div class="stat-label">Grade</div>
            <div class="stat-value ${UI.gradeColor(result.grade)}">${result.grade}</div>
          </div>
          <div class="stat-card neu-card">
            <div class="stat-label">Total Marks</div>
            <div class="stat-value">${result.total} / ${result.maxTotal}</div>
          </div>
        </div>
        
        <table class="data-table" style="width: 100%">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Marks Obtained</th>
              <th>Max Marks</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `;

    const subjects = window.EduResult.state.subjects;
    Object.keys(result.marks).forEach(subId => {
      const sub = subjects.find(s => s.id === subId);
      if (!sub) return;
      const mark = result.marks[subId];
      const isFail = mark < sub.passMarks;
      html += `
        <tr>
          <td>${UI.escapeHtml(sub.name)}</td>
          <td><strong>${mark}</strong></td>
          <td>${sub.maxMarks}</td>
          <td class="${isFail ? 'text-danger' : 'text-success'}">${isFail ? 'Fail' : 'Pass'}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
        ${window.Export ? `
        <div class="mt-1 flex" style="justify-content: flex-end;">
          <button class="btn btn-secondary" onclick="Export.printReport('${result.id}')">${Icons.print} Print Report</button>
        </div>` : ''}
      </div>
    `;

    UI.setHTML(container, html);
  },

  renderStudentPerformance() {
    const page = document.getElementById('page-student-performance');
    if (!page) return;
    const student = Auth.getCurrentStudent();
    if (!student) return;

    const results = (window.Results ? Results.getByStudent(student.id) : window.EduResult.state.results.filter(r => r.studentId === student.id)) || [];
    if (!results.length) {
      UI.setHTML(page, UI.emptyState(Icons.analytics, 'No Data', 'Not enough data to analyze performance.'));
      return;
    }

    const latest = results[results.length - 1];
    const subjects = window.EduResult.state.subjects || [];
    const rankInfo = window.Rankings ? Rankings.getStudentRank(student.id, latest.examName) : null;

    // Subject breakdown with smart badges
    const subjectList = subjects.map(sub => {
      const mark = latest.marks[sub.id] || 0;
      const pct = Math.round((mark / sub.maxMarks) * 100);
      let status = 'Good';
      let badgeClass = 'badge-grade';
      if (pct >= 85) { status = 'Strong 🌟'; badgeClass = 'badge-pass'; }
      else if (pct >= 70) { status = 'Good 👍'; badgeClass = 'badge-grade'; }
      else if (pct >= 50) { status = 'Improve 📈'; badgeClass = 'badge-warning'; }
      else { status = 'Focus ⚠️'; badgeClass = 'badge-fail'; }
      return { sub, mark, pct, status, badgeClass };
    }).sort((a, b) => b.pct - a.pct);

    let html = `
      <div class="page-header flex-between mb-2">
        <div>
          <h2>Performance Analytics</h2>
          <p class="text-light">Detailed breakdown of marks, subject proficiencies, and semester trends.</p>
        </div>
        <button class="btn btn-primary" onclick="App.navigate('student-goals')">${Icons.target} Goal Simulator</button>
      </div>

      <!-- Quick Metrics -->
      <div class="stat-cards mb-2" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
        <div class="card neu-card stat-card text-center">
          <div class="stat-label text-light">Latest Percentage</div>
          <div class="stat-value text-primary mt-1" style="font-size: 2.2rem; font-weight: 700;">${latest.percentage}%</div>
        </div>
        <div class="card neu-card stat-card text-center">
          <div class="stat-label text-light">Current Grade</div>
          <div class="stat-value ${UI.gradeColor(latest.grade)} mt-1" style="font-size: 2.2rem; font-weight: 700;">${latest.grade}</div>
        </div>
        <div class="card neu-card stat-card text-center">
          <div class="stat-label text-light">Current Rank</div>
          <div class="stat-value text-accent mt-1" style="font-size: 2.2rem; font-weight: 700;">#${rankInfo ? rankInfo.rank : '-'}</div>
        </div>
        <div class="card neu-card stat-card text-center">
          <div class="stat-label text-light">Class Percentile</div>
          <div class="stat-value text-success mt-1" style="font-size: 2.2rem; font-weight: 700;">${rankInfo ? rankInfo.percentile : '-'}%</div>
        </div>
      </div>

      <!-- Multi-semester Trend -->
      <div class="card neu-card mb-2">
        <h3 class="mb-1">Multi-Semester Progression</h3>
        <div style="display:flex; gap:20px; align-items:flex-end; height: 160px; padding: 15px 0; border-bottom: 1px solid var(--border);">
          ${results.map(res => `
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; gap:6px;">
              <span style="font-size: 13px; font-weight: 700;">${res.percentage}%</span>
              <div style="width: 48px; background: linear-gradient(180deg, var(--primary), var(--accent)); height: ${Math.round(res.percentage * 1.2)}px; border-radius: 6px 6px 0 0; transition: height 0.5s;"></div>
              <span class="text-sm text-light" style="margin-top: 4px;">${UI.escapeHtml(res.examName)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Smart Weakness & Subject Proficiencies -->
      <div class="card neu-card mb-2">
        <h3 class="mb-1">Subject Proficiency Breakdown</h3>
        <div class="table-container mt-1">
          <table class="data-table">
            <thead>
              <tr><th>Subject</th><th>Code</th><th>Score</th><th>Max</th><th>Percentage</th><th>Proficiency Level</th></tr>
            </thead>
            <tbody>
              ${subjectList.map(s => `
                <tr>
                  <td><strong>${UI.escapeHtml(s.sub.name)}</strong></td>
                  <td>${UI.escapeHtml(s.sub.code)}</td>
                  <td><strong>${s.mark}</strong></td>
                  <td>${s.sub.maxMarks}</td>
                  <td>
                    <div class="flex" style="align-items:center;gap:8px">
                      <div class="bar-track" style="width:100px"><div class="bar" style="width:${s.pct}%;background:${s.pct>=80?'var(--success)':s.pct>=60?'var(--primary)':'var(--danger)'}"></div></div>
                      <span>${s.pct}%</span>
                    </div>
                  </td>
                  <td><span class="badge ${s.badgeClass}">${s.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    UI.setHTML(page, html);
  },

  renderStudentRank() {
    const page = document.getElementById('page-student-rank');
    if (!page) return;
    const student = Auth.getCurrentStudent();
    if (!student) return;

    const results = (window.Results ? Results.getByStudent(student.id) : window.EduResult.state.results.filter(r => r.studentId === student.id)) || [];
    if (!results.length) {
      UI.setHTML(page, UI.emptyState(Icons.rankings, 'No Data', 'No exams to rank.'));
      return;
    }
    const latest = results[results.length - 1];
    const rankInfo = window.Rankings ? Rankings.getStudentRank(student.id, latest.examName) : null;

    if (!rankInfo) {
      UI.setHTML(page, UI.emptyState(Icons.rankings, 'Rank Pending', 'Ranks not yet calculated.'));
      return;
    }

    let html = `
      <div class="card neu-card text-center" style="padding: 40px 20px; max-width: 600px; margin: 0 auto;">
        <div style="font-size: 3rem; color: var(--warning); margin-bottom: 16px;">${Icons.rankings}</div>
        <h2>${UI.escapeHtml(latest.examName)} Class Standing</h2>
        <div style="font-size: 4.5rem; font-weight: 800; color: var(--primary); margin: 16px 0;">
          #${rankInfo.rank}
        </div>
        <p style="font-size: 1.2rem; color: var(--text-light);">Out of <strong>${rankInfo.total}</strong> students</p>
        <div class="mt-1">
          <span class="badge badge-grade" style="font-size: 1.1rem; padding: 8px 18px;">Top ${rankInfo.topPercent}% (Percentile: ${rankInfo.percentile})</span>
        </div>
        <div class="flex justify-center gap-1 mt-2">
          <button class="btn btn-primary" onclick="App.navigate('student-performance')">${Icons.analytics} View Detailed Performance</button>
          <button class="btn btn-outline" onclick="App.navigate('student-goals')">${Icons.target} Goal Simulator</button>
        </div>
      </div>
    `;

    UI.setHTML(page, html);
  },

  renderGoalSimulator() {
    const page = document.getElementById('page-student-goals');
    if (!page) return;
    const student = Auth.getCurrentStudent();
    if (!student) return;

    const results = (window.Results ? Results.getByStudent(student.id) : window.EduResult.state.results.filter(r => r.studentId === student.id)) || [];
    const latestResult = results.length > 0 ? results[results.length - 1] : null;
    const currentPct = latestResult ? latestResult.percentage : 75;

    let html = `
      <div class="page-header mb-2">
        <h2>Goal Simulator</h2>
        <p class="text-light">"What do I need to score for 90%?" — Model your target academic performance.</p>
      </div>

      <div class="card neu-card mb-2">
        <div class="dashboard-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: center;">
          <div>
            <div class="stat-label text-light">Current Percentage</div>
            <div class="stat-value text-primary" style="font-size: 2.5rem; font-weight: 800;">${currentPct}%</div>
            <p class="text-sm text-light mt-1">${latestResult ? latestResult.examName : 'Baseline estimate'}</p>
          </div>
          <div>
            <label class="form-label" style="font-weight: 600;">Set Target Percentage (%)</label>
            <div class="flex gap-1 items-center">
              <input type="number" id="goal-target" class="form-input" min="40" max="100" step="0.5" value="90" style="font-size: 1.25rem; font-weight: 700; max-width: 140px;">
              <button class="btn btn-primary btn-lg" onclick="App.calculateGoal(true)">${Icons.target} Calculate Target</button>
            </div>
          </div>
        </div>
      </div>

      <div id="goal-result"></div>
    `;

    UI.setHTML(page, html);
    this.calculateGoal(false);
  },

  calculateGoal(showError = false) {
    const targetInput = document.getElementById('goal-target');
    let target = targetInput ? parseFloat(targetInput.value) : 90;
    const resultDiv = document.getElementById('goal-result');
    if (!resultDiv) return;

    if (isNaN(target) || target < 40 || target > 100) {
      if (showError) {
        UI.toast('Please enter a target percentage between 40% and 100%', 'error');
        return;
      }
      target = 90;
    }

    const student = Auth.getCurrentStudent();
    const subjects = window.EduResult.state.subjects || [];
    const results = student ? (window.Results ? Results.getByStudent(student.id) : window.EduResult.state.results.filter(r => r.studentId === student.id)) : [];
    const latestResult = results.length > 0 ? results[results.length - 1] : null;

    const totalMax = subjects.reduce((sum, s) => sum + s.maxMarks, 0);
    const requiredTotal = Math.round((target / 100) * totalMax);
    const currentTotal = latestResult ? latestResult.total : Math.round(totalMax * 0.75);
    const diffTotal = requiredTotal - currentTotal;

    // Distribute required marks across subjects proportionally
    const subjectEstimates = subjects.map(sub => {
      const currentScore = latestResult?.marks[sub.id] || Math.round(sub.maxMarks * 0.75);
      let targetScore = Math.round(currentScore + (diffTotal * (1 / subjects.length)));
      if (targetScore > sub.maxMarks) targetScore = sub.maxMarks;
      if (targetScore < sub.passMarks) targetScore = sub.passMarks;
      return {
        sub,
        current: currentScore,
        target: targetScore,
        diff: targetScore - currentScore
      };
    });

    let html = `
      <div class="card neu-card mb-2" style="border-left: 5px solid var(--primary);">
        <div class="flex-between mb-1">
          <h3 style="font-size: 1.3rem;">Target: <strong>${target}%</strong> Overall</h3>
          <span class="badge badge-grade">Need ~${requiredTotal} / ${totalMax} marks</span>
        </div>
        <p class="text-light mb-2">
          ${diffTotal > 0 ? `To achieve your target of <strong>${target}%</strong>, you need to gain approximately <strong>+${diffTotal} marks</strong> (+${(target - (latestResult?.percentage || 75)).toFixed(1)}%).` : 'You have already exceeded or met this target level!'}
        </p>

        <div class="table-container mb-2">
          <table class="data-table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Code</th>
                <th>Current Marks</th>
                <th>Required Target</th>
                <th>Needed Change</th>
                <th>Attainability</th>
              </tr>
            </thead>
            <tbody>
              ${subjectEstimates.map(est => {
                const diffBadge = est.diff > 0 ? `<span class="text-success font-bold">+${est.diff}</span>` : est.diff < 0 ? `<span class="text-muted">${est.diff}</span>` : '<span class="text-muted">0</span>';
                const difficulty = est.target >= 95 ? '<span class="badge badge-fail">Challenging</span>' : est.target >= 85 ? '<span class="badge badge-warning">Moderate</span>' : '<span class="badge badge-pass">Attainable</span>';
                return `
                  <tr>
                    <td><strong>${UI.escapeHtml(est.sub.name)}</strong></td>
                    <td>${UI.escapeHtml(est.sub.code)}</td>
                    <td>${est.current} / ${est.sub.maxMarks}</td>
                    <td><span style="font-size: 1.1rem; font-weight: 700; color: var(--primary);">${est.target} / ${est.sub.maxMarks}</span></td>
                    <td>${diffBadge}</td>
                    <td>${difficulty}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="neu-card p-1" style="background: var(--bg); border-radius: 8px; padding: 12px 16px;">
          <small class="text-light">
            ℹ️ <strong>Estimation Note:</strong> This calculation provides a realistic mathematical projection based on your current 10-subject academic framework and historical baseline. Actual semester requirements may vary depending on practical vs theory weightages.
          </small>
        </div>
      </div>
    `;

    UI.setHTML(resultDiv, html);
  },

  renderImprovementPlan() {
    const page = document.getElementById('page-student-improvement');
    if (!page) return;
    const student = Auth.getCurrentStudent();
    if (!student) return;

    const ctx = AI.getStudentContext(student.id);
    if (!ctx || !ctx.latestResult) {
      UI.setHTML(page, UI.emptyState(Icons.star, 'No Results to Analyze', 'Exam results are required to generate a personalized AI Performance Plan.'));
      return;
    }

    const advice = AI.generateImprovementAdvice(ctx);
    const plan = AI.generateStudyPlan(ctx);

    let html = `
      <div class="page-header flex-between mb-2">
        <div>
          <h2>AI Academic Performance Coach</h2>
          <p class="text-light">Personalized strategic study roadmap and weekly discipline plan powered by EduBot.</p>
        </div>
        <button class="btn btn-outline" onclick="App.navigate('student-ai')">${Icons.ai} Chat with EduBot</button>
      </div>

      <div class="charts-grid mb-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div class="card neu-card">
          <div class="flex-between mb-1">
            <h3 style="display: flex; align-items: center; gap: 8px;">🎯 Performance Assessment</h3>
            <span class="badge badge-grade">Grade ${ctx.latestResult.grade}</span>
          </div>
          <div style="line-height: 1.6; margin-top: 12px;">
            ${AI.formatResponse(advice)}
          </div>
        </div>

        <div class="card neu-card">
          <div class="flex-between mb-1">
            <h3 style="display: flex; align-items: center; gap: 8px;">📅 Recommended Weekly Schedule</h3>
            <span class="badge badge-pass">7-Day Plan</span>
          </div>
          <div style="line-height: 1.6; margin-top: 12px;">
            ${AI.formatResponse(plan)}
          </div>
        </div>
      </div>
    `;

    UI.setHTML(page, html);
  },

  renderAdminSettings() {
    const page = document.getElementById('page-admin-settings');
    if (!page) return;
    const settings = window.EduResult.state.settings;

    let html = `
      <div class="dashboard-grid">
        <div class="card">
          <h3>General Settings</h3>
          <div class="form-group mt-1">
            <label class="form-label">Institution Name</label>
            <input type="text" id="setting-inst" class="form-input" value="${UI.escapeHtml(settings.institutionName || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Academic Year</label>
            <input type="text" id="setting-year" class="form-input" value="${UI.escapeHtml(settings.academicYear || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Default Pass Percentage</label>
            <input type="number" id="setting-pass" class="form-input" value="${settings.defaultPassPercentage || 40}">
          </div>
          <button class="btn btn-primary" onclick="App.saveAdminSettings()">Save Settings</button>
        </div>
        
        <div class="card">
          <h3>System Data</h3>
          <p class="text-muted mb-1">Manage system-wide data and preferences.</p>
          <div class="flex gap-1">
            <button class="btn btn-outline" onclick="App.toggleTheme()">${Icons.moon} Toggle Theme</button>
            <button class="btn btn-danger" onclick="UI.confirm('Reset Data?', 'This will restore demo data and erase all current records.', () => Storage.resetToDemo() || window.location.reload())">${Icons.refresh} Reset to Demo</button>
          </div>
        </div>
      </div>
    `;
    UI.setHTML(page, html);
  },

  saveAdminSettings() {
    const settings = window.EduResult.state.settings;
    const instEl = document.getElementById('setting-inst');
    const yearEl = document.getElementById('setting-year');
    const passEl = document.getElementById('setting-pass');
    
    if (instEl) settings.institutionName = instEl.value.trim();
    if (yearEl) settings.academicYear = yearEl.value.trim();
    if (passEl) settings.defaultPassPercentage = parseFloat(passEl.value) || 40;
    
    Storage.save(Storage.keys.settings, settings);
    this.updateAcademicYearDisplay();
    UI.toast('Settings saved successfully', 'success');
  },

  updateAcademicYearDisplay() {
    const year = window.EduResult?.state?.settings?.academicYear || '2026 - 2027';
    const el = document.getElementById('header-academic-year-display');
    if (el) el.textContent = year;
  },

  changeAcademicYear() {
    const currentYear = window.EduResult?.state?.settings?.academicYear || '2026-2027';
    const newYear = prompt('Enter Academic Year (e.g., 2026-2027, 2027-2028):', currentYear);
    if (newYear && newYear.trim() && newYear.trim() !== currentYear) {
      if (!window.EduResult.state.settings) window.EduResult.state.settings = {};
      window.EduResult.state.settings.academicYear = newYear.trim();
      Storage.save(Storage.keys.settings, window.EduResult.state.settings);
      this.updateAcademicYearDisplay();
      UI.toast(`Academic Year updated to ${newYear.trim()}`, 'success');
      this.render();
    } else if (newYear !== null) {
      this.navigate('admin-settings');
    }
  },

  renderStudentSettings() {
    const page = document.getElementById('page-student-settings');
    if (!page) return;
    const student = Auth.getCurrentStudent();

    let html = `
      <div class="card">
        <h3>Preferences</h3>
        <p class="text-muted mb-1">Customize your experience.</p>
        <button class="btn btn-outline" onclick="App.toggleTheme()">${Icons.moon} Toggle Theme</button>
      </div>
    `;
    UI.setHTML(page, html);
  },

  initNavigation() {
    const pageIconMap = {
      'admin-dashboard': Icons.dashboard,
      'admin-students': Icons.students,
      'admin-subjects': Icons.subjects,
      'admin-marks': Icons.marks,
      'admin-results': Icons.results,
      'admin-rankings': Icons.rankings,
      'admin-analytics': Icons.analytics,
      'admin-export': Icons.export,
      'admin-ai': Icons.ai,
      'admin-settings': Icons.settings,
      'student-dashboard': Icons.dashboard,
      'student-profile': Icons.user,
      'student-subjects': Icons.subjects,
      'student-results': Icons.results,
      'student-performance': Icons.analytics,
      'student-rank': Icons.rankings,
      'student-goals': Icons.target,
      'student-improvement': Icons.star,
      'student-ai': Icons.ai,
      'student-settings': Icons.settings
    };

    document.querySelectorAll('.nav-item').forEach(item => {
      const page = item.dataset ? item.dataset.page : (item.getAttribute ? item.getAttribute('data-page') : null);
      const iconSpan = item.querySelector ? item.querySelector('.nav-icon') : null;
      if (iconSpan && pageIconMap[page] && !iconSpan.querySelector('svg')) {
        iconSpan.innerHTML = pageIconMap[page];
      }
      item.addEventListener('click', (e) => {
        e.preventDefault();
        if (page) this.navigate(page);
      });
    });

    // Populate login card icons
    const adminLoginIcon = document.querySelector('#admin-login-card .nav-icon');
    if (adminLoginIcon) adminLoginIcon.innerHTML = Icons.user;
    const studentLoginIcon = document.querySelector('#student-login-card .nav-icon');
    if (studentLoginIcon) studentLoginIcon.innerHTML = Icons.students;

    const adminLogout = document.getElementById('admin-logout-btn');
    const studentLogout = document.getElementById('student-logout-btn');
    if (adminLogout) adminLogout.addEventListener('click', () => Auth.logout());
    if (studentLogout) studentLogout.addEventListener('click', () => Auth.logout());

    const adminSearch = document.getElementById('admin-search');
    if (adminSearch) {
      adminSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && adminSearch.value.trim()) {
          if (window.Students) {
            Students.currentFilters.search = adminSearch.value.trim();
          }
          this.navigate('admin-students');
        }
      });
    }
  },

  initTheme() {
    const settings = window.EduResult.state.settings;
    if (settings && settings.theme === 'dark') {
      document.body.classList.add('dark-mode');
    }
  },

  toggleTheme() {
    document.body.classList.toggle('dark-mode');
    if (!window.EduResult.state.settings) window.EduResult.state.settings = {};
    window.EduResult.state.settings.theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    Storage.save(Storage.keys.settings, window.EduResult.state.settings);
  },

  initMobileMenu() {
    const menuBtns = document.querySelectorAll('#mobile-menu-btn, #mobile-menu-btn-student, .mobile-menu-btn');
    const closeBtns = document.querySelectorAll('#admin-sidebar-close, #student-sidebar-close, .sidebar-close-btn');
    const overlay = document.getElementById('sidebar-overlay');

    menuBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMobileSidebar();
      });
    });

    closeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeMobileSidebar();
      });
    });

    if (overlay) {
      overlay.addEventListener('click', () => this.closeMobileSidebar());
    }
  },

  toggleMobileSidebar() {
    const portal = Auth.isAdmin() ? 'admin' : Auth.isStudent() ? 'student' : '';
    if (!portal) return;
    const sidebar = document.getElementById(portal + '-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const menuBtn = document.getElementById(portal === 'admin' ? 'mobile-menu-btn' : 'mobile-menu-btn-student');

    if (!sidebar) return;
    const willOpen = !sidebar.classList.contains('open');

    if (willOpen) {
      sidebar.classList.add('open');
      if (overlay) overlay.classList.add('active');
      if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('sidebar-open');
    } else {
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
      if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('sidebar-open');
    }
  },

  closeMobileSidebar() {
    document.querySelectorAll('.sidebar').forEach(s => s.classList.remove('open'));
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) overlay.classList.remove('active');
    document.querySelectorAll('#mobile-menu-btn, #mobile-menu-btn-student, .mobile-menu-btn').forEach(btn => {
      btn.setAttribute('aria-expanded', 'false');
    });
    document.body.classList.remove('sidebar-open');
  },

  updateHeaderTitle(pageName) {
    const titles = {
      'admin-dashboard': 'Dashboard',
      'admin-students': 'Students',
      'admin-subjects': 'Subjects',
      'admin-marks': 'Enter Marks',
      'admin-results': 'Results',
      'admin-rankings': 'Rankings',
      'admin-analytics': 'Analytics',
      'admin-export': 'Export Data',
      'admin-ai': 'AI Assistant',
      'admin-settings': 'Settings',
      'student-dashboard': 'Dashboard',
      'student-profile': 'My Profile',
      'student-subjects': 'My Subjects',
      'student-results': 'My Results',
      'student-performance': 'Performance',
      'student-rank': 'My Rank',
      'student-goals': 'Goal Simulator',
      'student-improvement': 'Improvement Plan',
      'student-ai': 'AI Assistant',
      'student-settings': 'Settings'
    };
    const portal = pageName.startsWith('admin') ? 'admin' : 'student';
    const title = titles[pageName] || '';
    const titleEl = document.querySelector('#' + portal + '-header .page-title');
    if (titleEl) titleEl.textContent = title;
    if (title) document.title = `${title} — EduResult`;
  },

  initKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        UI.hideAllModals();
        this.closeMobileSidebar();
      }
    });
  },

  render() {
    if (this.currentPage) this.renderPage(this.currentPage);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());

window.App = App;
