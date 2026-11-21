const Rankings = {
  // Calculate rankings for a specific exam
  calculate(examName) {
    // Get all results for this exam
    // Sort by percentage descending
    // Assign ranks (handle ties: same percentage = same rank)
    // Return array of { studentId, rank, percentage, grade, result }
    const results = EduResult.state.results.filter(r => r.examName === examName);
    const sorted = [...results].sort((a, b) => b.percentage - a.percentage);
    
    const rankings = [];
    let currentRank = 1;
    sorted.forEach((r, i) => {
      if (i > 0 && r.percentage < sorted[i-1].percentage) {
        currentRank = i + 1;
      }
      rankings.push({
        ...r,
        rank: currentRank
      });
    });
    return rankings;
  },

  // Get specific student's rank for an exam
  getStudentRank(studentId, examName) {
    const rankings = this.calculate(examName);
    const studentRank = rankings.find(r => r.studentId === studentId);
    if (!studentRank) return null;
    const total = rankings.length;
    const percentile = Math.round(((total - studentRank.rank) / total) * 100);
    return {
      rank: studentRank.rank,
      total: total,
      percentile: percentile,
      topPercent: Math.round((studentRank.rank / total) * 100)
    };
  },

  // Get latest exam name
  getLatestExam() {
    const exams = [...new Set(EduResult.state.results.map(r => r.examName))];
    return exams[exams.length - 1] || '';
  },

  // Render rankings page (admin)
  render() {
    const container = document.getElementById('page-admin-rankings');
    if (!container) return;

    const examNames = [...new Set(EduResult.state.results.map(r => r.examName))];
    if (examNames.length === 0) {
      container.innerHTML = UI.emptyState(Icons.rankings, 'No Rankings Yet', 'Enter marks to generate rankings.', 'Enter Marks', "App.navigate('admin-marks')");
      return;
    }

    const selectedExam = this._selectedExam || examNames[examNames.length - 1];
    const rankings = this.calculate(selectedExam);

    let html = `
      <div class="page-header flex-between">
        <h2>Student Rankings</h2>
        <select class="form-select" id="ranking-exam-filter" style="width:auto">
          ${examNames.map(e => `<option value="${UI.escapeHtml(e)}" ${e === selectedExam ? 'selected' : ''}>${UI.escapeHtml(e)}</option>`).join('')}
        </select>
      </div>
    `;

    // Top 3 Podium
    if (rankings.length >= 3) {
      const top3 = rankings.filter(r => r.rank <= 3);
      // Deduplicate by rank, take first for each
      const podium = [null, null, null];
      top3.forEach(r => {
        if (r.rank >= 1 && r.rank <= 3 && !podium[r.rank - 1]) {
          podium[r.rank - 1] = r;
        }
      });

      html += '<div class="podium">';
      // Show #2, #1, #3 (visual podium order)
      [1, 0, 2].forEach(idx => {
        const r = podium[idx];
        if (!r) return;
        const student = Students.getById(r.studentId);
        if (!student) return;
        const medals = ['🥇', '🥈', '🥉'];
        const classes = ['podium-1', 'podium-2', 'podium-3'];
        html += `
          <div class="podium-card ${classes[idx]}">
            <div class="podium-medal">${medals[idx]}</div>
            <div class="avatar avatar-md">${UI.getInitials(student.name)}</div>
            <h4>${UI.escapeHtml(student.name)}</h4>
            <p class="text-muted">Roll: ${UI.escapeHtml(student.rollNo)}</p>
            <div class="stat-value">${r.percentage}%</div>
            <span class="badge badge-grade">Grade ${r.grade}</span>
          </div>
        `;
      });
      html += '</div>';
    }

    // Full Rankings Table
    html += `<div class="card" style="margin-top:24px"><div class="table-container"><table class="data-table">
      <thead><tr><th>Rank</th><th>Student Name</th><th>Roll No</th><th>Class</th><th>Percentage</th><th>Grade</th><th>Result</th></tr></thead>
      <tbody>`;

    rankings.forEach(r => {
      const student = Students.getById(r.studentId);
      if (!student) return;
      html += `<tr>
        <td><strong>#${r.rank}</strong></td>
        <td><div class="flex" style="align-items:center;gap:10px">
          <div class="avatar avatar-sm">${UI.getInitials(student.name)}</div>
          ${UI.escapeHtml(student.name)}
        </div></td>
        <td>${UI.escapeHtml(student.rollNo)}</td>
        <td>${UI.escapeHtml(student.className)}</td>
        <td><strong>${r.percentage}%</strong></td>
        <td><span class="badge badge-grade">${r.grade}</span></td>
        <td><span class="badge ${r.result === 'PASS' ? 'badge-pass' : 'badge-fail'}">${r.result}</span></td>
      </tr>`;
    });

    html += '</tbody></table></div></div>';
    container.innerHTML = html;

    // Exam filter listener
    document.getElementById('ranking-exam-filter')?.addEventListener('change', (e) => {
      this._selectedExam = e.target.value;
      this.render();
    });
  }
};

window.Rankings = Rankings;
