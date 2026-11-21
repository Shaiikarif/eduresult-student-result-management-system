const Results = {
  currentFilters: { search: '', grade: '', result: '', className: '', section: '', examName: '', sort: 'percentage-desc' },
  currentPage: 1,
  pageSize: 10,
  selectedIds: [],
  marksEntryData: { studentId: '', examName: '', academicYear: '', marks: {} },

  getAll() { return EduResult.state.results || []; },
  getById(id) { return EduResult.state.results.find(r => r.id === id); },
  getByStudent(studentId) { return EduResult.state.results.filter(r => r.studentId === studentId); },

  add(data) {
    const existing = EduResult.state.results.find(r => r.studentId === data.studentId && r.examName === data.examName);
    if (existing) {
        UI.confirm('Result Exists', `A result for ${data.examName} already exists for this student. Update it instead?`, () => {
            this.update(existing.id, data);
        });
        return;
    }
    
    data.id = UI.generateId('RES');
    data.date = new Date().toISOString().split('T')[0];
    EduResult.state.results.push(data);
    Storage.save('eduresult_results', EduResult.state.results);
    UI.toast('Result saved successfully!', 'success');
  },

  update(id, data) {
    const idx = EduResult.state.results.findIndex(r => r.id === id);
    if (idx > -1) {
      EduResult.state.results[idx] = { ...EduResult.state.results[idx], ...data };
      Storage.save('eduresult_results', EduResult.state.results);
      UI.toast('Result updated successfully!', 'success');
    }
  },

  delete(id) {
    UI.confirm('Delete Result', 'Are you sure you want to delete this result? This cannot be undone.', () => {
      EduResult.state.results = EduResult.state.results.filter(r => r.id !== id);
      Storage.save('eduresult_results', EduResult.state.results);
      UI.toast('Result deleted successfully.', 'success');
      this.selectedIds = this.selectedIds.filter(selectedId => selectedId !== id);
      this.render();
    });
  },

  calculate(marks, subjects) {
    let total = 0;
    let maxTotal = 0;
    const failedSubjects = [];

    subjects.forEach(sub => {
      const score = parseFloat(marks[sub.id] || 0);
      total += score;
      maxTotal += sub.maxMarks;
      if (score < sub.passMarks) {
        failedSubjects.push(sub.id);
      }
    });

    const percentage = maxTotal > 0 ? Math.round((total / maxTotal) * 10000) / 100 : 0;
    const grade = this.calculateGrade(percentage);
    const passPercentage = EduResult.state.settings?.defaultPassPercentage || 40;
    const result = (failedSubjects.length === 0 && percentage >= passPercentage) ? 'PASS' : 'FAIL';

    return { total, maxTotal, percentage, grade, result, failedSubjects };
  },

  calculateGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    if (percentage >= 40) return 'E';
    return 'F';
  },

  renderMarksEntry() {
    const container = document.getElementById('page-admin-marks');
    if (!container) return;

    const students = typeof Students !== 'undefined' ? Students.getAll() : [];
    const subjects = typeof Subjects !== 'undefined' ? Subjects.getAll() : [];
    
    let html = `
      <div class="page-header">
        <h2>Marks Entry</h2>
      </div>
      <div class="card" style="max-width: 800px; margin: 0 auto;">
        <div class="form-row">
            <div class="form-group" style="flex: 2;">
                <label class="form-label" for="me-student">Select Student</label>
                <select class="form-select" id="me-student">
                    <option value="">-- Choose a Student --</option>
                    ${students.map(s => `<option value="${s.id}">${UI.escapeHtml(s.name)} (${UI.escapeHtml(s.rollNo)}) - ${UI.escapeHtml(s.className)}</option>`).join('')}
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label" for="me-exam">Exam Name</label>
                <input type="text" class="form-input" id="me-exam" placeholder="e.g., Semester 1">
            </div>
            <div class="form-group">
                <label class="form-label" for="me-year">Academic Year</label>
                <input type="text" class="form-input" id="me-year" placeholder="e.g., 2026-2027" value="${EduResult.state.settings?.academicYear || '2026-2027'}">
            </div>
        </div>
        <div id="me-subjects-container" style="margin-top:20px;display:none;">
            <h3 style="margin-bottom:15px;padding-bottom:10px;border-bottom:1px solid var(--border)">Enter Marks</h3>
            <table class="data-table" id="me-marks-table">
                <thead><tr>
                    <th>Subject</th>
                    <th>Max Marks</th>
                    <th>Pass Marks</th>
                    <th>Marks Obtained</th>
                </tr></thead>
                <tbody>
                    ${subjects.map(sub => `
                        <tr>
                            <td>${UI.escapeHtml(sub.name)} <span class="text-muted" style="font-size:0.8em">(${UI.escapeHtml(sub.code)})</span></td>
                            <td>${sub.maxMarks}</td>
                            <td>${sub.passMarks}</td>
                            <td>
                                <input type="number" class="form-input mark-input" data-subject="${sub.id}" data-max="${sub.maxMarks}" min="0" max="${sub.maxMarks}" style="width: 100px;">
                                <div class="form-error mark-error" id="err-${sub.id}"></div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="margin-top:20px;text-align:right;">
                <button class="btn btn-primary" id="btn-calculate" style="padding:10px 20px;font-size:1.1em;">Calculate Result</button>
            </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    const studentSelect = document.getElementById('me-student');
    const examInput = document.getElementById('me-exam');
    const yearInput = document.getElementById('me-year');
    const subjectsContainer = document.getElementById('me-subjects-container');
    const calcBtn = document.getElementById('btn-calculate');

    const checkShowSubjects = () => {
        if (studentSelect.value && examInput.value && yearInput.value) {
            subjectsContainer.style.display = 'block';
            
            const existingResult = EduResult.state.results.find(r => r.studentId === studentSelect.value && r.examName === examInput.value);
            if(existingResult) {
                document.querySelectorAll('.mark-input').forEach(input => {
                    const subId = input.dataset.subject;
                    if(existingResult.marks[subId] !== undefined) {
                        input.value = existingResult.marks[subId];
                    }
                });
            } else {
                 document.querySelectorAll('.mark-input').forEach(input => input.value = '');
            }
        } else {
            subjectsContainer.style.display = 'none';
        }
    };

    studentSelect.addEventListener('change', checkShowSubjects);
    examInput.addEventListener('input', checkShowSubjects);
    yearInput.addEventListener('input', checkShowSubjects);

    calcBtn.addEventListener('click', () => {
        let valid = true;
        const marks = {};
        document.querySelectorAll('.mark-input').forEach(input => {
            const subId = input.dataset.subject;
            const max = parseFloat(input.dataset.max);
            const val = input.value;
            const errEl = document.getElementById(`err-${subId}`);
            errEl.textContent = '';
            input.classList.remove('error');

            if (val === '') {
                errEl.textContent = 'Required';
                input.classList.add('error');
                valid = false;
            } else {
                const num = parseFloat(val);
                if (num < 0 || num > max) {
                    errEl.textContent = `Must be 0-${max}`;
                    input.classList.add('error');
                    valid = false;
                } else {
                    marks[subId] = num;
                }
            }
        });

        if (valid) {
            this.renderPreview(studentSelect.value, examInput.value, yearInput.value, marks);
        } else {
            UI.toast('Please fix errors in marks entry', 'error');
        }
    });

    if(this.marksEntryData && this.marksEntryData.studentId) {
        studentSelect.value = this.marksEntryData.studentId;
        examInput.value = this.marksEntryData.examName;
        yearInput.value = this.marksEntryData.academicYear;
        checkShowSubjects();
        
        if(Object.keys(this.marksEntryData.marks).length > 0) {
             document.querySelectorAll('.mark-input').forEach(input => {
                const subId = input.dataset.subject;
                if(this.marksEntryData.marks[subId] !== undefined) {
                    input.value = this.marksEntryData.marks[subId];
                }
            });
        }
        
        this.marksEntryData = { studentId: '', examName: '', academicYear: '', marks: {} };
    }
  },

  renderPreview(studentId, examName, academicYear, marks) {
    const student = Students.getById(studentId);
    const subjects = Subjects.getAll();
    const result = this.calculate(marks, subjects);
    
    let modal = document.getElementById('modal-result-preview');
    if(!modal) {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal-overlay" id="modal-result-preview" style="display:none;">
                <div class="modal-content" style="max-width:700px;">
                    <div class="modal-header">
                        <h2>Result Preview</h2>
                        <button class="modal-close" onclick="UI.hideModal('modal-result-preview')">&times;</button>
                    </div>
                    <div class="modal-body"></div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="UI.hideModal('modal-result-preview')">Cancel</button>
                        <button class="btn btn-primary btn-save" id="btn-save-result">Save Result</button>
                    </div>
                </div>
            </div>
        `);
        modal = document.getElementById('modal-result-preview');
    }

    const body = modal.querySelector('.modal-body');
    
    body.innerHTML = `
        <div class="card" style="margin-bottom:20px;background:var(--bg);">
            <div class="flex-between">
                <div>
                    <h3 style="margin:0 0 5px 0;">${UI.escapeHtml(student.name)}</h3>
                    <p class="text-muted" style="margin:0;">Roll No: ${UI.escapeHtml(student.rollNo)} | Class: ${UI.escapeHtml(student.className)}</p>
                </div>
                <div style="text-align:right;">
                    <h4 style="margin:0 0 5px 0;color:var(--primary);">${UI.escapeHtml(examName)}</h4>
                    <p class="text-muted" style="margin:0;">${UI.escapeHtml(academicYear)}</p>
                </div>
            </div>
        </div>

        <table class="data-table" style="margin-bottom:20px;">
            <thead><tr><th>Subject</th><th>Max</th><th>Pass</th><th>Obtained</th><th>Status</th></tr></thead>
            <tbody>
                ${subjects.map(sub => {
                    const score = marks[sub.id];
                    const isPass = score >= sub.passMarks;
                    return `
                        <tr>
                            <td>${UI.escapeHtml(sub.name)}</td>
                            <td>${sub.maxMarks}</td>
                            <td>${sub.passMarks}</td>
                            <td style="font-weight:bold; ${!isPass ? 'color:var(--danger);' : ''}">${score}</td>
                            <td><span class="badge ${isPass ? 'badge-pass' : 'badge-fail'}">${isPass ? 'PASS' : 'FAIL'}</span></td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>

        <div class="flex-between card neu-card" style="background: ${result.result === 'PASS' ? 'var(--success-light)' : 'var(--danger-light)'};">
            <div style="text-align:center;flex:1;">
                <div class="text-muted">Total Marks</div>
                <div style="font-size:1.5em;font-weight:bold;">${result.total} / ${result.maxTotal}</div>
            </div>
            <div style="text-align:center;flex:1;border-left:1px solid rgba(0,0,0,0.1);border-right:1px solid rgba(0,0,0,0.1);">
                <div class="text-muted">Percentage</div>
                <div style="font-size:1.5em;font-weight:bold;">${result.percentage}%</div>
            </div>
            <div style="text-align:center;flex:1;">
                <div class="text-muted">Grade / Result</div>
                <div style="font-size:1.5em;font-weight:bold;">
                    <span style="color:var(--primary);">${result.grade}</span> 
                    <span class="badge ${result.result === 'PASS' ? 'badge-pass' : 'badge-fail'}" style="margin-left:10px;vertical-align:middle;">${result.result}</span>
                </div>
            </div>
        </div>
    `;

    UI.showModal('modal-result-preview');

    const saveBtn = modal.querySelector('#btn-save-result');
    saveBtn.onclick = () => {
        const resultData = {
            studentId,
            examName,
            academicYear,
            marks,
            ...result
        };
        
        const existing = EduResult.state.results.find(r => r.studentId === studentId && r.examName === examName);
        if (existing) {
             this.update(existing.id, resultData);
        } else {
             this.add(resultData);
        }
        
        UI.hideModal('modal-result-preview');
        if(typeof App !== 'undefined') App.navigate('admin-results');
    };
  },

  render() {
    const container = document.getElementById('page-admin-results');
    if (!container) return;

    let all = this.getAll();
    let filtered = this.filterResults(all);
    let sorted = this.sortResults(filtered);
    
    const totalPages = Math.ceil(sorted.length / this.pageSize);
    if (this.currentPage > totalPages && totalPages > 0) this.currentPage = totalPages;
    const start = (this.currentPage - 1) * this.pageSize;
    let paged = sorted.slice(start, start + this.pageSize);

    const examNames = this.getExamNames();
    const students = typeof Students !== 'undefined' ? Students.getAll() : [];
    const classes = [...new Set(students.map(s => s.className))];

    let html = `
      <div class="page-header flex-between">
        <h2>Results Management</h2>
        <button class="btn btn-primary" onclick="if(typeof App !== 'undefined') App.navigate('admin-marks')">${typeof Icons !== 'undefined' ? Icons.plus : '+'} Enter Marks</button>
      </div>

      <div class="filter-bar" style="flex-wrap:wrap;gap:10px;">
        <div class="search-bar" style="flex:1;min-width:200px;">
          <span class="search-icon">${typeof Icons !== 'undefined' ? Icons.search : '🔍'}</span>
          <input type="text" class="form-input" id="result-search" placeholder="Search student name or roll..." value="${UI.escapeHtml(this.currentFilters.search)}">
        </div>
        <select class="form-select filter-select" id="filter-r-exam">
          <option value="">All Exams</option>
          ${examNames.map(e => `<option value="${UI.escapeHtml(e)}" ${this.currentFilters.examName === e ? 'selected' : ''}>${UI.escapeHtml(e)}</option>`).join('')}
        </select>
        <select class="form-select filter-select" id="filter-r-class">
          <option value="">All Classes</option>
          ${classes.map(c => `<option value="${UI.escapeHtml(c)}" ${this.currentFilters.className === c ? 'selected' : ''}>${UI.escapeHtml(c)}</option>`).join('')}
        </select>
        <select class="form-select filter-select" id="filter-r-result">
          <option value="">All Results</option>
          <option value="PASS" ${this.currentFilters.result === 'PASS' ? 'selected' : ''}>Pass Only</option>
          <option value="FAIL" ${this.currentFilters.result === 'FAIL' ? 'selected' : ''}>Fail Only</option>
        </select>
        <select class="form-select filter-select" id="filter-r-sort">
            <option value="percentage-desc" ${this.currentFilters.sort === 'percentage-desc' ? 'selected' : ''}>Highest % First</option>
            <option value="percentage-asc" ${this.currentFilters.sort === 'percentage-asc' ? 'selected' : ''}>Lowest % First</option>
            <option value="name-asc" ${this.currentFilters.sort === 'name-asc' ? 'selected' : ''}>Name A-Z</option>
        </select>
      </div>
    `;

    if (this.selectedIds.length > 0) {
        html += `
            <div class="card" style="background:var(--primary-light);padding:10px 15px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;">
                <span><strong>${this.selectedIds.length}</strong> results selected</span>
                <div>
                    <button class="btn btn-sm btn-outline" onclick="Results.selectAll(false)" style="background:white;margin-right:10px;">Clear Selection</button>
                    <button class="btn btn-sm btn-danger" onclick="Results.deleteSelected()">Delete Selected</button>
                </div>
            </div>
        `;
    }

    if (paged.length === 0) {
      html += UI.emptyState(typeof Icons !== 'undefined' ? Icons.results : '📄', 'No Results Found',
        filtered.length === 0 && all.length > 0 ? 'No results match your filters.' : 'No results have been recorded yet.',
        'Enter Marks', "if(typeof App !== 'undefined') App.navigate('admin-marks')");
    } else {
      const allSelectedOnPage = paged.length > 0 && paged.every(r => this.selectedIds.includes(r.id));
      
      html += `<div class="table-container"><table class="data-table">
        <thead><tr>
          <th style="width:40px;"><input type="checkbox" id="cb-all" ${allSelectedOnPage ? 'checked' : ''} onchange="Results.selectAll(this.checked)"></th>
          <th>Roll No</th>
          <th>Name</th>
          <th>Exam</th>
          <th>Class</th>
          <th>%</th>
          <th>Grade</th>
          <th>Result</th>
          <th>Actions</th>
        </tr></thead><tbody>`;
        
      paged.forEach((r, i) => {
        const student = Students.getById(r.studentId) || { name: 'Unknown', rollNo: 'N/A', className: 'N/A' };
        const isSelected = this.selectedIds.includes(r.id);
        
        html += `<tr class="${isSelected ? 'selected' : ''}" style="${isSelected ? 'background:var(--primary-light);' : ''}">
          <td><input type="checkbox" class="cb-row" value="${r.id}" ${isSelected ? 'checked' : ''} onchange="Results.toggleSelect('${r.id}')"></td>
          <td>${UI.escapeHtml(student.rollNo)}</td>
          <td>${UI.escapeHtml(student.name)}</td>
          <td>${UI.escapeHtml(r.examName)}</td>
          <td>${UI.escapeHtml(student.className)}</td>
          <td style="font-weight:bold;">${r.percentage}%</td>
          <td><span style="color:var(--primary);font-weight:bold;">${r.grade}</span></td>
          <td><span class="badge ${r.result === 'PASS' ? 'badge-pass' : 'badge-fail'}">${r.result}</span></td>
          <td class="table-actions">
            <button class="btn btn-sm btn-outline" onclick="Results.viewResult('${r.id}')" title="View">${typeof Icons !== 'undefined' ? Icons.view : '👁️'}</button>
            <button class="btn btn-sm btn-outline" onclick="Results.editResult('${r.id}')" title="Edit">${typeof Icons !== 'undefined' ? Icons.edit : '✏️'}</button>
            <button class="btn btn-sm btn-danger" onclick="Results.delete('${r.id}')" title="Delete">${typeof Icons !== 'undefined' ? Icons.delete : '🗑️'}</button>
          </td>
        </tr>`;
      });
      html += '</tbody></table></div>';

      if (totalPages > 1) {
        html += '<div class="pagination">';
        html += `<button class="page-btn" onclick="Results.currentPage--; Results.render()" ${this.currentPage === 1 ? 'disabled' : ''}>${typeof Icons !== 'undefined' ? Icons.chevronLeft : '<'}</button>`;
        for (let p = 1; p <= totalPages; p++) {
          html += `<button class="page-btn ${p === this.currentPage ? 'active' : ''}" onclick="Results.currentPage=${p}; Results.render()">${p}</button>`;
        }
        html += `<button class="page-btn" onclick="Results.currentPage++; Results.render()" ${this.currentPage === totalPages ? 'disabled' : ''}>${typeof Icons !== 'undefined' ? Icons.chevronRight : '>'}</button>`;
        html += '</div>';
      }
    }

    container.innerHTML = html;

    const attachListener = (id, field) => {
        const el = document.getElementById(id);
        if(el) {
            const handler = (e) => {
                this.currentFilters[field] = e.target.value;
                this.currentPage = 1;
                this.render();
            };
            if(id === 'result-search') {
                el.addEventListener('input', typeof UI.debounce !== 'undefined' ? UI.debounce(handler) : handler);
                el.focus();
            } else {
                el.addEventListener('change', handler);
            }
        }
    };

    attachListener('result-search', 'search');
    attachListener('filter-r-exam', 'examName');
    attachListener('filter-r-class', 'className');
    attachListener('filter-r-result', 'result');
    attachListener('filter-r-sort', 'sort');
  },

  viewResult(id) {
    const result = this.getById(id);
    if (!result) return;
    const student = typeof Students !== 'undefined' ? Students.getById(result.studentId) : null;
    const subjects = typeof Subjects !== 'undefined' ? Subjects.getAll() : [];
    if(!student) return;

    let modal = document.getElementById('modal-view-result');
    if(!modal) {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal-overlay" id="modal-view-result" style="display:none;">
                <div class="modal-content" style="max-width:800px;">
                    <div class="modal-header">
                        <h2>Result Details</h2>
                        <button class="modal-close" onclick="UI.hideModal('modal-view-result')">&times;</button>
                    </div>
                    <div class="modal-body" id="view-result-body"></div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="UI.hideModal('modal-view-result')">Close</button>
                        <button class="btn btn-primary" onclick="if(typeof Export !== 'undefined') Export.printReport('${id}')">Print Report</button>
                    </div>
                </div>
            </div>
        `);
        modal = document.getElementById('modal-view-result');
    }

    const body = document.getElementById('view-result-body');
    
    // Check if rankings exist to show rank
    let rankHtml = '';
    if (typeof Rankings !== 'undefined' && Rankings.getStudentRank) {
        const rankData = Rankings.getStudentRank(result.studentId, result.examName);
        if(rankData && rankData.rank) {
            rankHtml = `
                <div style="text-align:center;flex:1;">
                    <div class="text-muted">Class Rank</div>
                    <div style="font-size:1.5em;font-weight:bold;color:var(--accent);">#${rankData.rank}</div>
                </div>
                <div style="width:1px;background:rgba(0,0,0,0.1);"></div>
            `;
        }
    }

    body.innerHTML = `
        <div class="card" style="margin-bottom:20px;border-top:4px solid var(--primary);">
            <div class="flex-between">
                <div style="display:flex;gap:15px;align-items:center;">
                    <div class="avatar avatar-lg">${typeof UI.getInitials !== 'undefined' ? UI.getInitials(student.name) : student.name.charAt(0)}</div>
                    <div>
                        <h3 style="margin:0 0 5px 0;">${UI.escapeHtml(student.name)}</h3>
                        <p class="text-muted" style="margin:0;">Roll No: ${UI.escapeHtml(student.rollNo)} | Class: ${UI.escapeHtml(student.className)} - ${UI.escapeHtml(student.section)}</p>
                    </div>
                </div>
                <div style="text-align:right;">
                    <h4 style="margin:0 0 5px 0;color:var(--primary);font-size:1.2em;">${UI.escapeHtml(result.examName)}</h4>
                    <p class="text-muted" style="margin:0;">${UI.escapeHtml(result.academicYear)} | Date: ${typeof UI.formatDate !== 'undefined' ? UI.formatDate(result.date) : result.date}</p>
                </div>
            </div>
        </div>

        <div class="flex-between card neu-card" style="background: ${result.result === 'PASS' ? 'var(--success-light)' : 'var(--danger-light)'};margin-bottom:20px;">
            <div style="text-align:center;flex:1;">
                <div class="text-muted">Total Marks</div>
                <div style="font-size:1.5em;font-weight:bold;">${result.total} / ${result.maxTotal}</div>
            </div>
            <div style="width:1px;background:rgba(0,0,0,0.1);"></div>
            <div style="text-align:center;flex:1;">
                <div class="text-muted">Percentage</div>
                <div style="font-size:1.5em;font-weight:bold;">${result.percentage}%</div>
            </div>
            <div style="width:1px;background:rgba(0,0,0,0.1);"></div>
            ${rankHtml}
            <div style="text-align:center;flex:1;">
                <div class="text-muted">Grade / Result</div>
                <div style="font-size:1.5em;font-weight:bold;">
                    <span style="color:var(--primary);">${result.grade}</span> 
                    <span class="badge ${result.result === 'PASS' ? 'badge-pass' : 'badge-fail'}" style="margin-left:10px;vertical-align:middle;">${result.result}</span>
                </div>
            </div>
        </div>

        <h4 style="margin-bottom:15px;border-bottom:1px solid var(--border);padding-bottom:10px;">Subject Marks</h4>
        <table class="data-table">
            <thead><tr><th>Subject Code</th><th>Subject Name</th><th>Max</th><th>Pass</th><th>Obtained</th><th>Status</th></tr></thead>
            <tbody>
                ${subjects.filter(sub => result.marks[sub.id] !== undefined).map(sub => {
                    const score = result.marks[sub.id];
                    const isPass = score >= sub.passMarks;
                    return `
                        <tr>
                            <td class="text-muted">${UI.escapeHtml(sub.code)}</td>
                            <td>${UI.escapeHtml(sub.name)}</td>
                            <td>${sub.maxMarks}</td>
                            <td>${sub.passMarks}</td>
                            <td style="font-weight:bold; ${!isPass ? 'color:var(--danger);' : ''}">${score}</td>
                            <td><span class="badge ${isPass ? 'badge-pass' : 'badge-fail'}" style="font-size:0.7em;">${isPass ? 'PASS' : 'FAIL'}</span></td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    // Ensure footer button uses correct ID
    modal.querySelector('.modal-footer .btn-primary').setAttribute('onclick', `if(typeof Export !== 'undefined') Export.printReport('${id}')`);
    
    UI.showModal('modal-view-result');
  },

  editResult(id) {
    const result = this.getById(id);
    if (!result) return;
    
    this.marksEntryData = {
        studentId: result.studentId,
        examName: result.examName,
        academicYear: result.academicYear,
        marks: { ...result.marks }
    };
    
    if(typeof App !== 'undefined') App.navigate('admin-marks');
  },

  filterResults(results) {
    let filtered = [...results];
    
    if (this.currentFilters.search) {
      const q = this.currentFilters.search.toLowerCase();
      filtered = filtered.filter(r => {
          const student = typeof Students !== 'undefined' ? Students.getById(r.studentId) : null;
          if(!student) return false;
          return student.name.toLowerCase().includes(q) || student.rollNo.includes(q);
      });
    }
    
    if (this.currentFilters.examName) {
        filtered = filtered.filter(r => r.examName === this.currentFilters.examName);
    }
    
    if (this.currentFilters.result) {
        filtered = filtered.filter(r => r.result === this.currentFilters.result);
    }
    
    if (this.currentFilters.className) {
        filtered = filtered.filter(r => {
            const student = typeof Students !== 'undefined' ? Students.getById(r.studentId) : null;
            return student && student.className === this.currentFilters.className;
        });
    }
    
    return filtered;
  },

  sortResults(results) {
    return [...results].sort((a, b) => {
        if (this.currentFilters.sort === 'percentage-desc') return b.percentage - a.percentage;
        if (this.currentFilters.sort === 'percentage-asc') return a.percentage - b.percentage;
        if (this.currentFilters.sort === 'name-asc') {
            const sa = typeof Students !== 'undefined' ? Students.getById(a.studentId)?.name || '' : '';
            const sb = typeof Students !== 'undefined' ? Students.getById(b.studentId)?.name || '' : '';
            return sa.localeCompare(sb);
        }
        return 0;
    });
  },

  toggleSelect(id) {
      const idx = this.selectedIds.indexOf(id);
      if (idx > -1) {
          this.selectedIds.splice(idx, 1);
      } else {
          this.selectedIds.push(id);
      }
      this.render();
  },
  
  selectAll(checked) {
      if (checked) {
          const paged = this.sortResults(this.filterResults(this.getAll()))
              .slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
          paged.forEach(r => {
              if (!this.selectedIds.includes(r.id)) this.selectedIds.push(r.id);
          });
      } else {
          this.selectedIds = [];
      }
      this.render();
  },
  
  deleteSelected() {
      if (this.selectedIds.length === 0) return;
      
      UI.confirm('Delete Selected', `Are you sure you want to delete ${this.selectedIds.length} result(s)? This cannot be undone.`, () => {
          EduResult.state.results = EduResult.state.results.filter(r => !this.selectedIds.includes(r.id));
          Storage.save('eduresult_results', EduResult.state.results);
          this.selectedIds = [];
          UI.toast('Selected results deleted successfully.', 'success');
          this.render();
      });
  },

  getExamNames() {
    return [...new Set(this.getAll().map(r => r.examName))].sort();
  }
};

window.Results = Results;
