const Export = {
  // Render export page
  render() {
    const container = document.getElementById('page-admin-export');
    if (!container) return;

    const examNames = [...new Set(EduResult.state.results.map(r => r.examName))];
    const results = EduResult.state.results;

    let html = `
      <div class="page-header"><h2>Export Data</h2></div>

      <div class="card" style="margin-bottom:24px">
        <div class="card-header"><h3>Export Results</h3></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Exam</label>
              <select class="form-select" id="export-exam">
                <option value="">All Exams</option>
                ${examNames.map(e => `<option value="${UI.escapeHtml(e)}">${UI.escapeHtml(e)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Format</label>
              <select class="form-select" id="export-format">
                <option value="csv">CSV (Excel Compatible)</option>
              </select>
            </div>
          </div>
          <div style="display:flex;gap:12px;margin-top:16px">
            <button class="btn btn-primary" onclick="Export.allResults()">${Icons.export} Export All Results</button>
            <button class="btn btn-outline" onclick="Export.filteredResults()">${Icons.filter} Export Filtered</button>
          </div>
          <p class="text-muted" style="margin-top:12px">Exports a CSV file compatible with Microsoft Excel, Google Sheets, and other spreadsheet applications.</p>
        </div>
      </div>

      <!-- Preview -->
      <div class="card">
        <div class="card-header flex-between">
          <h3>Preview</h3>
          <span class="text-muted">${results.length} records</span>
        </div>
        <div class="card-body" id="export-preview"></div>
      </div>
    `;

    container.innerHTML = html;
    this.renderPreview();
  },

  renderPreview() {
    const container = document.getElementById('export-preview');
    if (!container) return;

    const examFilter = document.getElementById('export-exam')?.value || '';
    let results = EduResult.state.results;
    if (examFilter) results = results.filter(r => r.examName === examFilter);

    if (results.length === 0) {
      container.innerHTML = '<p class="text-muted text-center" style="padding:20px">No results to export.</p>';
      return;
    }

    const subjects = Subjects.getAll();
    const rankings = examFilter ? Rankings.calculate(examFilter) : null;

    let html = '<div class="table-container"><table class="data-table"><thead><tr>';
    html += '<th>Roll No</th><th>Name</th><th>Class</th><th>Section</th><th>Exam</th>';
    subjects.forEach(s => html += `<th>${UI.escapeHtml(s.name)}</th>`);
    html += '<th>Total</th><th>Max</th><th>%</th><th>Grade</th><th>Result</th>';
    html += '</tr></thead><tbody>';

    results.slice(0, 10).forEach(r => {
      const student = Students.getById(r.studentId);
      if (!student) return;
      html += '<tr>';
      html += `<td>${UI.escapeHtml(student.rollNo)}</td>`;
      html += `<td>${UI.escapeHtml(student.name)}</td>`;
      html += `<td>${UI.escapeHtml(student.className)}</td>`;
      html += `<td>${UI.escapeHtml(student.section)}</td>`;
      html += `<td>${UI.escapeHtml(r.examName)}</td>`;
      subjects.forEach(s => html += `<td>${r.marks[s.id] !== undefined ? r.marks[s.id] : '-'}</td>`);
      html += `<td>${r.total}</td><td>${r.maxTotal}</td><td>${r.percentage}%</td>`;
      html += `<td>${r.grade}</td><td>${r.result}</td>`;
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    if (results.length > 10) html += `<p class="text-muted" style="margin-top:8px">Showing 10 of ${results.length} records. Full data will be exported.</p>`;
    container.innerHTML = html;
  },

  // CSV Export
  toCSV(results, filename) {
    const subjects = Subjects.getAll();
    const headers = ['Roll No', 'Student Name', 'Class', 'Section', 'Academic Year', 'Exam'];
    subjects.forEach(s => headers.push(s.name));
    headers.push('Total Marks', 'Maximum Marks', 'Percentage', 'Grade', 'Result', 'Rank');

    const rows = [headers];

    // Calculate rankings per exam
    const examRankings = {};
    const exams = [...new Set(results.map(r => r.examName))];
    exams.forEach(exam => { examRankings[exam] = Rankings.calculate(exam); });

    results.forEach(r => {
      const student = Students.getById(r.studentId);
      if (!student) return;
      const ranking = examRankings[r.examName]?.find(rk => rk.studentId === r.studentId);

      const row = [
        student.rollNo, student.name, student.className, student.section,
        r.academicYear, r.examName
      ];
      subjects.forEach(s => row.push(r.marks[s.id] !== undefined ? r.marks[s.id] : ''));
      row.push(r.total, r.maxTotal, r.percentage, r.grade, r.result, ranking ? ranking.rank : '');
      rows.push(row);
    });

    // Generate CSV string with proper escaping
    const csv = rows.map(row => 
      row.map(cell => {
        const str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      }).join(',')
    ).join('\\n');

    // Download
    const blob = new Blob(['\\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    UI.toast(`Exported ${results.length} records to ${filename}`, 'success');
  },

  allResults() {
    const examFilter = document.getElementById('export-exam')?.value || '';
    let results = EduResult.state.results;
    if (examFilter) results = results.filter(r => r.examName === examFilter);
    if (results.length === 0) { UI.toast('No results to export.', 'warning'); return; }
    const year = EduResult.state.settings.academicYear || '2026-2027';
    this.toCSV(results, `EduResult_Results_${year}.csv`);
  },

  filteredResults() {
    // Use current Results page filters if available
    const examFilter = document.getElementById('export-exam')?.value || '';
    let results = EduResult.state.results;
    if (examFilter) results = results.filter(r => r.examName === examFilter);
    if (results.length === 0) { UI.toast('No results to export.', 'warning'); return; }
    this.toCSV(results, `EduResult_Filtered_Results.csv`);
  },

  selectedResults(ids) {
    const results = EduResult.state.results.filter(r => ids.includes(r.id));
    if (results.length === 0) { UI.toast('No results selected.', 'warning'); return; }
    this.toCSV(results, `EduResult_Selected_Results.csv`);
  },

  // PRINT REPORT
  printReport(resultId) {
    const result = Results.getById(resultId);
    if (!result) return;
    const student = Students.getById(result.studentId);
    if (!student) return;
    const subjects = Subjects.getAll();
    const rankInfo = Rankings.getStudentRank(student.id, result.examName);

    const modal = document.getElementById('modal-report');
    const body = modal.querySelector('.modal-body');

    body.innerHTML = `
      <div class="result-report" id="printable-report">
        <div class="report-header">
          <h2>${UI.escapeHtml(EduResult.state.settings.institutionName || 'EduResult Academy')}</h2>
          <h3>Student Result Report</h3>
          <p>Academic Year: ${UI.escapeHtml(result.academicYear)} | ${UI.escapeHtml(result.examName)}</p>
        </div>

        <div class="report-student-info">
          <div class="report-info-row">
            <div><strong>Student Name:</strong> ${UI.escapeHtml(student.name)}</div>
            <div><strong>Roll Number:</strong> ${UI.escapeHtml(student.rollNo)}</div>
          </div>
          <div class="report-info-row">
            <div><strong>Class:</strong> ${UI.escapeHtml(student.className)}</div>
            <div><strong>Section:</strong> ${UI.escapeHtml(student.section)}</div>
          </div>
        </div>

        <table class="report-marks-table">
          <thead><tr><th>Subject</th><th>Subject Code</th><th>Max Marks</th><th>Marks Obtained</th><th>Status</th></tr></thead>
          <tbody>
            ${subjects.map(s => {
              const marks = result.marks[s.id];
              const passed = marks !== undefined && marks >= s.passMarks;
              return `<tr>
                <td>${UI.escapeHtml(s.name)}</td>
                <td>${UI.escapeHtml(s.code)}</td>
                <td>${s.maxMarks}</td>
                <td>${marks !== undefined ? marks : '-'}</td>
                <td style="color:${passed ? 'var(--success)' : 'var(--danger)'}">${marks !== undefined ? (passed ? 'Pass' : 'Fail') : '-'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>

        <div class="report-summary">
          <div class="report-summary-row">
            <span>Total Marks:</span>
            <strong>${result.total} / ${result.maxTotal}</strong>
          </div>
          <div class="report-summary-row">
            <span>Percentage:</span>
            <strong>${result.percentage}%</strong>
          </div>
          <div class="report-summary-row">
            <span>Grade:</span>
            <strong>${result.grade}</strong>
          </div>
          <div class="report-summary-row">
            <span>Result:</span>
            <strong style="color:${result.result === 'PASS' ? 'var(--success)' : 'var(--danger)'}">${result.result}</strong>
          </div>
          ${rankInfo ? `<div class="report-summary-row">
            <span>Rank:</span>
            <strong>#${rankInfo.rank} out of ${rankInfo.total}</strong>
          </div>` : ''}
        </div>

        <div class="report-footer">
          <div class="report-date">Date: ${UI.formatDate(result.date || new Date().toISOString().split('T')[0])}</div>
          <div class="report-signatures">
            <div class="signature-block">
              <div class="signature-line"></div>
              <span>Class Teacher</span>
            </div>
            <div class="signature-block">
              <div class="signature-line"></div>
              <span>Head of Department</span>
            </div>
            <div class="signature-block">
              <div class="signature-line"></div>
              <span>Principal</span>
            </div>
          </div>
        </div>
      </div>
    `;

    UI.showModal('modal-report');

    // Add print button handler
    modal.querySelector('.btn-print')?.addEventListener('click', () => {
      window.print();
    });
  }
};

window.Export = Export;
