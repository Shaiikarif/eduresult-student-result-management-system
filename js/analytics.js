const Analytics = {
  // Get overall statistics
  getOverallStats(examName = null) {
    let results = EduResult.state.results;
    if (examName) results = results.filter(r => r.examName === examName);
    // Use latest exam if not specified
    if (!examName) {
      const exams = [...new Set(results.map(r => r.examName))];
      examName = exams[exams.length - 1];
      results = results.filter(r => r.examName === examName);
    }

    const total = results.length;
    const passed = results.filter(r => r.result === 'PASS').length;
    const failed = total - passed;
    const passRate = total > 0 ? Math.round((passed / total) * 100 * 10) / 10 : 0;
    const percentages = results.map(r => r.percentage);
    const classAvg = total > 0 ? Math.round(percentages.reduce((a,b) => a+b, 0) / total * 10) / 10 : 0;
    const highest = total > 0 ? Math.max(...percentages) : 0;
    const lowest = total > 0 ? Math.min(...percentages) : 0;

    return { total, passed, failed, passRate, classAvg, highest, lowest, examName };
  },

  // Grade distribution
  getGradeDistribution(examName = null) {
    let results = EduResult.state.results;
    if (examName) results = results.filter(r => r.examName === examName);
    else {
      const exams = [...new Set(results.map(r => r.examName))];
      results = results.filter(r => r.examName === exams[exams.length - 1]);
    }

    const dist = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'F': 0 };
    results.forEach(r => { if (dist.hasOwnProperty(r.grade)) dist[r.grade]++; });
    return dist;
  },

  // Subject performance (average marks per subject)
  getSubjectPerformance(examName = null) {
    let results = EduResult.state.results;
    if (examName) results = results.filter(r => r.examName === examName);
    else {
      const exams = [...new Set(results.map(r => r.examName))];
      results = results.filter(r => r.examName === exams[exams.length - 1]);
    }

    const subjects = Subjects.getAll();
    return subjects.map(sub => {
      const marks = results.map(r => r.marks[sub.id]).filter(m => m !== undefined);
      const avg = marks.length > 0 ? Math.round(marks.reduce((a,b) => a+b, 0) / marks.length * 10) / 10 : 0;
      const avgPct = sub.maxMarks > 0 ? Math.round(avg / sub.maxMarks * 1000) / 10 : 0;
      return { subject: sub.name, code: sub.code, avgMarks: avg, avgPercentage: avgPct, maxMarks: sub.maxMarks };
    }).sort((a, b) => b.avgPercentage - a.avgPercentage);
  },

  // Semester trend (average percentage per exam)
  getSemesterTrend() {
    const exams = [...new Set(EduResult.state.results.map(r => r.examName))];
    return exams.map(exam => {
      const examResults = EduResult.state.results.filter(r => r.examName === exam);
      const avg = examResults.length > 0 ? Math.round(examResults.reduce((a,r) => a + r.percentage, 0) / examResults.length * 10) / 10 : 0;
      return { exam, average: avg, count: examResults.length };
    });
  },

  // RENDER ANALYTICS PAGE
  render() {
    const container = document.getElementById('page-admin-analytics');
    if (!container) return;

    const results = EduResult.state.results;
    if (results.length === 0) {
      container.innerHTML = UI.emptyState(Icons.analytics, 'No Analytics Data', 'Enter student results to see analytics.', 'Enter Marks', "App.navigate('admin-marks')");
      return;
    }

    const stats = this.getOverallStats();
    const gradeDist = this.getGradeDistribution();
    const subjectPerf = this.getSubjectPerformance();
    const trend = this.getSemesterTrend();

    let html = `
      <div class="page-header"><h2>Analytics</h2></div>

      <!-- Overall Stats -->
      <div class="stat-cards">
        <div class="stat-card neu-card">
          <div class="stat-icon" style="background:var(--primary-light);color:var(--primary)">${Icons.students}</div>
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">Total Students</div>
        </div>
        <div class="stat-card neu-card">
          <div class="stat-icon" style="background:var(--success-light);color:var(--success)">${Icons.check}</div>
          <div class="stat-value">${stats.passRate}%</div>
          <div class="stat-label">Pass Rate</div>
        </div>
        <div class="stat-card neu-card">
          <div class="stat-icon" style="background:var(--accent-light);color:var(--accent)">${Icons.target}</div>
          <div class="stat-value">${stats.classAvg}%</div>
          <div class="stat-label">Class Average</div>
        </div>
        <div class="stat-card neu-card">
          <div class="stat-icon" style="background:var(--warning-light);color:var(--warning)">${Icons.arrowUp}</div>
          <div class="stat-value">${stats.highest}%</div>
          <div class="stat-label">Highest Score</div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="charts-grid">
        <!-- Grade Distribution -->
        <div class="card">
          <div class="card-header"><h3>Grade Distribution</h3></div>
          <div class="card-body" id="grade-dist-chart"></div>
        </div>

        <!-- Pass vs Fail -->
        <div class="card">
          <div class="card-header"><h3>Pass vs Fail</h3></div>
          <div class="card-body" id="passfail-chart"></div>
        </div>
      </div>

      <!-- Subject Performance -->
      <div class="card" style="margin-top:24px">
        <div class="card-header"><h3>Subject Performance</h3></div>
        <div class="card-body" id="subject-perf-chart"></div>
      </div>

      <!-- Semester Trend -->
      ${trend.length > 1 ? `
      <div class="card" style="margin-top:24px">
        <div class="card-header"><h3>Semester Trend</h3></div>
        <div class="card-body" id="semester-trend-chart"></div>
      </div>` : ''}
    `;

    container.innerHTML = html;

    // Render charts
    this.renderGradeDistChart(gradeDist);
    this.renderPassFailChart(stats.passed, stats.failed);
    this.renderSubjectPerfChart(subjectPerf);
    if (trend.length > 1) this.renderTrendChart(trend);
  },

  // BAR CHART — Grade Distribution
  renderGradeDistChart(dist) {
    const container = document.getElementById('grade-dist-chart');
    if (!container) return;
    const max = Math.max(...Object.values(dist), 1);
    const colors = { 'A+': '#10b981', 'A': '#34d399', 'B': '#3b82f6', 'C': '#f59e0b', 'D': '#f97316', 'E': '#ef4444', 'F': '#dc2626' };

    let html = '<div class="bar-chart">';
    Object.entries(dist).forEach(([grade, count]) => {
      const width = Math.round((count / max) * 100);
      html += `
        <div class="bar-row">
          <span class="bar-label">Grade ${grade}</span>
          <div class="bar-track">
            <div class="bar" style="width:${width}%;background:${colors[grade]}" title="${count} students"></div>
          </div>
          <span class="bar-value">${count}</span>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  },

  // DONUT CHART — Pass vs Fail (CSS conic-gradient)
  renderPassFailChart(passed, failed) {
    const container = document.getElementById('passfail-chart');
    if (!container) return;
    const total = passed + failed;
    if (total === 0) { container.innerHTML = '<p class="text-muted">No data</p>'; return; }
    const passPercent = Math.round((passed / total) * 100);
    const failPercent = 100 - passPercent;

    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;gap:40px;flex-wrap:wrap">
        <div class="donut-chart" style="
          width: 180px; height: 180px; border-radius: 50%;
          background: conic-gradient(var(--success) 0% ${passPercent}%, var(--danger) ${passPercent}% 100%);
          display: flex; align-items: center; justify-content: center;
        ">
          <div style="width:120px;height:120px;border-radius:50%;background:var(--card-bg);display:flex;align-items:center;justify-content:center;flex-direction:column">
            <strong style="font-size:1.5rem">${passPercent}%</strong>
            <span class="text-muted">Pass Rate</span>
          </div>
        </div>
        <div class="chart-legend">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="width:12px;height:12px;border-radius:50%;background:var(--success)"></span>
            <span>Passed: ${passed} students</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:12px;height:12px;border-radius:50%;background:var(--danger)"></span>
            <span>Failed: ${failed} students</span>
          </div>
        </div>
      </div>
    `;
  },

  // HORIZONTAL BAR CHART — Subject Performance
  renderSubjectPerfChart(subjects) {
    const container = document.getElementById('subject-perf-chart');
    if (!container) return;

    let html = '<div class="bar-chart">';
    subjects.forEach(s => {
      const color = s.avgPercentage >= 80 ? 'var(--success)' : s.avgPercentage >= 60 ? 'var(--primary)' : s.avgPercentage >= 40 ? 'var(--warning)' : 'var(--danger)';
      html += `
        <div class="bar-row">
          <span class="bar-label">${UI.escapeHtml(s.subject)}</span>
          <div class="bar-track">
            <div class="bar" style="width:${s.avgPercentage}%;background:${color}"></div>
          </div>
          <span class="bar-value">${s.avgPercentage}%</span>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  },

  // LINE/BAR CHART — Semester Trend (using CSS bars since we can't use chart libraries)
  renderTrendChart(trend) {
    const container = document.getElementById('semester-trend-chart');
    if (!container) return;
    const max = Math.max(...trend.map(t => t.average), 100);

    let html = '<div style="display:flex;align-items:flex-end;justify-content:center;gap:24px;height:200px;padding:20px 0">';
    trend.forEach(t => {
      const height = Math.round((t.average / max) * 160);
      html += `
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
          <span style="font-weight:600">${t.average}%</span>
          <div style="width:60px;height:${height}px;background:linear-gradient(180deg,var(--primary),var(--accent));border-radius:8px 8px 0 0;transition:height 0.5s"></div>
          <span class="text-muted" style="font-size:0.8rem">${UI.escapeHtml(t.exam)}</span>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  }
};

window.Analytics = Analytics;
