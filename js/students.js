const Students = {
  currentFilters: { search: '', className: '', section: '', academicYear: '' },
  currentPage: 1,
  pageSize: 10,
  sortBy: 'name',
  sortDir: 'asc',

  getAll() {
    return EduResult.state.students;
  },

  getById(id) {
    return EduResult.state.students.find(s => s.id === id);
  },

  getByRoll(rollNo) {
    return EduResult.state.students.find(s => s.rollNo === String(rollNo));
  },

  add(data) {
    const { valid, errors } = this.validate(data);
    if (!valid) {
      this.showFormErrors(errors);
      return null;
    }
    data.id = UI.generateId('STU');
    data.admissionDate = new Date().toISOString().split('T')[0];
    EduResult.state.students.push(data);
    Storage.save('eduresult_students', EduResult.state.students);
    UI.toast('Student added successfully!', 'success');
    this.render();
    return data;
  },

  update(id, data) {
    const existing = this.getById(id);
    if (!existing) return null;
    const merged = { ...existing, ...data };
    const { valid, errors } = this.validate(merged, id);
    if (!valid) {
      this.showFormErrors(errors);
      return null;
    }
    const idx = EduResult.state.students.findIndex(s => s.id === id);
    if (idx > -1) {
      EduResult.state.students[idx] = merged;
      Storage.save('eduresult_students', EduResult.state.students);
      UI.toast('Student updated successfully!', 'success');
      this.render();
      return EduResult.state.students[idx];
    }
    return null;
  },

  delete(id) {
    const results = Results.getByStudent(id);
    let msg = 'Are you sure you want to delete this student?';
    if (results.length > 0) {
      msg = `This student has ${results.length} result(s). Deleting the student will also delete their results. Are you sure?`;
    }
    
    UI.confirm('Delete Student', msg, () => {
      EduResult.state.students = EduResult.state.students.filter(s => s.id !== id);
      if (results.length > 0) {
         EduResult.state.results = EduResult.state.results.filter(r => r.studentId !== id);
         Storage.save('eduresult_results', EduResult.state.results);
      }
      Storage.save('eduresult_students', EduResult.state.students);
      UI.toast('Student deleted successfully.', 'success');
      this.render();
    });
  },

  search(query) {
    const q = query.toLowerCase();
    return this.getAll().filter(s => s.name.toLowerCase().includes(q) || s.rollNo.includes(q));
  },

  filter(students) {
    let filtered = [...students];
    if (this.currentFilters.search) {
      const q = this.currentFilters.search.toLowerCase();
      filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || s.rollNo.includes(q));
    }
    if (this.currentFilters.className) filtered = filtered.filter(s => s.className === this.currentFilters.className);
    if (this.currentFilters.section) filtered = filtered.filter(s => s.section === this.currentFilters.section);
    if (this.currentFilters.academicYear) filtered = filtered.filter(s => s.academicYear === this.currentFilters.academicYear);
    return filtered;
  },

  sort(students) {
    return [...students].sort((a, b) => {
      let va = a[this.sortBy], vb = b[this.sortBy];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return this.sortDir === 'asc' ? -1 : 1;
      if (va > vb) return this.sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  },

  paginate(students) {
    const start = (this.currentPage - 1) * this.pageSize;
    return students.slice(start, start + this.pageSize);
  },

  validate(data, editingId = null) {
    const errors = {};
    if (!data.name || !data.name.trim()) errors.name = 'Name is required';
    if (!data.rollNo || !data.rollNo.trim()) errors.rollNo = 'Roll number is required';
    else {
      const existing = this.getByRoll(data.rollNo);
      if (existing && existing.id !== editingId) errors.rollNo = 'Roll number already exists';
    }
    if (!data.className) errors.className = 'Class is required';
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Invalid email address';
    if (data.phone && !/^\d{10}$/.test(data.phone)) errors.phone = 'Phone must be 10 digits';
    return { valid: Object.keys(errors).length === 0, errors };
  },

  render() {
    const container = document.getElementById('page-admin-students');
    if (!container) return;

    let all = this.getAll();
    let filtered = this.filter(all);
    let sorted = this.sort(filtered);
    const totalPages = Math.ceil(sorted.length / this.pageSize);
    if (this.currentPage > totalPages && totalPages > 0) this.currentPage = totalPages;
    let paged = this.paginate(sorted);

    const classes = [...new Set(all.map(s => s.className))];
    const sections = [...new Set(all.map(s => s.section))];
    const years = [...new Set(all.map(s => s.academicYear))];

    let html = `
      <div class="page-header flex-between">
        <h2>Students</h2>
        <button class="btn btn-primary" onclick="Students.showAddModal()">${typeof Icons !== 'undefined' ? Icons.plus : '+'} Add Student</button>
      </div>
      <div class="filter-bar">
        <div class="search-bar">
          <span class="search-icon">${typeof Icons !== 'undefined' ? Icons.search : '🔍'}</span>
          <input type="text" class="form-input" id="student-search" placeholder="Search by name or roll number..." value="${UI.escapeHtml(this.currentFilters.search)}">
        </div>
        <select class="form-select filter-select" id="filter-class">
          <option value="">All Classes</option>
          ${classes.map(c => `<option value="${UI.escapeHtml(c)}" ${this.currentFilters.className === c ? 'selected' : ''}>${UI.escapeHtml(c)}</option>`).join('')}
        </select>
        <select class="form-select filter-select" id="filter-section">
          <option value="">All Sections</option>
          ${sections.map(s => `<option value="${s}" ${this.currentFilters.section === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
    `;

    if (paged.length === 0) {
      html += UI.emptyState(typeof Icons !== 'undefined' ? Icons.students : '👥', 'No Students Found',
        filtered.length === 0 && all.length > 0 ? 'No students match your filters.' : 'Add your first student to get started.',
        'Add Student', 'Students.showAddModal()');
    } else {
      html += `<div class="table-container"><table class="data-table">
        <thead><tr>
          <th>#</th><th>Roll No</th><th>Name</th><th>Class</th><th>Section</th><th>Email</th><th>Actions</th>
        </tr></thead><tbody>`;
      paged.forEach((s, i) => {
        const idx = (this.currentPage - 1) * this.pageSize + i + 1;
        html += `<tr>
          <td>${idx}</td>
          <td>${UI.escapeHtml(s.rollNo)}</td>
          <td><div class="flex" style="align-items:center;gap:10px">
            <div class="avatar avatar-sm">${typeof UI.getInitials !== 'undefined' ? UI.getInitials(s.name) : s.name.charAt(0)}</div>
            ${UI.escapeHtml(s.name)}
          </div></td>
          <td>${UI.escapeHtml(s.className)}</td>
          <td>${UI.escapeHtml(s.section)}</td>
          <td>${UI.escapeHtml(s.email || '-')}</td>
          <td class="table-actions">
            <button class="btn btn-sm btn-outline" onclick="Students.view('${s.id}')" title="View">${typeof Icons !== 'undefined' ? Icons.view : '👁️'}</button>
            <button class="btn btn-sm btn-outline" onclick="Students.showEditModal('${s.id}')" title="Edit">${typeof Icons !== 'undefined' ? Icons.edit : '✏️'}</button>
            <button class="btn btn-sm btn-danger" onclick="Students.delete('${s.id}')" title="Delete">${typeof Icons !== 'undefined' ? Icons.delete : '🗑️'}</button>
          </td>
        </tr>`;
      });
      html += '</tbody></table></div>';

      if (totalPages > 1) {
        html += '<div class="pagination">';
        html += `<button class="page-btn" onclick="Students.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>${typeof Icons !== 'undefined' ? Icons.chevronLeft : '<'}</button>`;
        for (let p = 1; p <= totalPages; p++) {
          html += `<button class="page-btn ${p === this.currentPage ? 'active' : ''}" onclick="Students.goToPage(${p})">${p}</button>`;
        }
        html += `<button class="page-btn" onclick="Students.goToPage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>${typeof Icons !== 'undefined' ? Icons.chevronRight : '>'}</button>`;
        html += '</div>';
      }
    }

    container.innerHTML = html;

    const searchInput = document.getElementById('student-search');
    if (searchInput) {
      const handler = (e) => {
        this.currentFilters.search = e.target.value;
        this.currentPage = 1;
        this.render();
      };
      searchInput.addEventListener('input', typeof UI.debounce !== 'undefined' ? UI.debounce(handler) : handler);
      searchInput.focus();
    }

    document.getElementById('filter-class')?.addEventListener('change', (e) => {
      this.currentFilters.className = e.target.value;
      this.currentPage = 1;
      this.render();
    });

    document.getElementById('filter-section')?.addEventListener('change', (e) => {
      this.currentFilters.section = e.target.value;
      this.currentPage = 1;
      this.render();
    });
  },

  goToPage(page) {
    const totalPages = Math.ceil(this.filter(this.getAll()).length / this.pageSize);
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.render();
    }
  },

  showAddModal() {
    const modal = document.getElementById('modal-add-student');
    if(!modal) return;
    const body = modal.querySelector('.modal-body');
    if(body) body.innerHTML = this.renderForm();
    UI.showModal('modal-add-student');

    const saveBtn = modal.querySelector('.btn-save');
    if (saveBtn) {
        saveBtn.onclick = () => this.handleAdd();
    }
  },

  showEditModal(id) {
    const student = this.getById(id);
    if (!student) return;
    const modal = document.getElementById('modal-edit-student');
    if(!modal) return;
    const body = modal.querySelector('.modal-body');
    if(body) body.innerHTML = this.renderForm(student);
    UI.showModal('modal-edit-student');

    const saveBtn = modal.querySelector('.btn-save');
    if (saveBtn) {
        saveBtn.onclick = () => this.handleEdit(id);
    }
  },

  view(id) {
    const student = this.getById(id);
    if (!student) return;
    const modal = document.getElementById('modal-view-student');
    if(!modal) return;
    const body = modal.querySelector('.modal-body');
    if(!body) return;
    const results = typeof Results !== 'undefined' ? Results.getByStudent(id) : [];
    
    body.innerHTML = `
      <div style="text-align:center;margin-bottom:20px">
        <div class="avatar avatar-lg" style="margin:0 auto 12px">${typeof UI.getInitials !== 'undefined' ? UI.getInitials(student.name) : student.name.charAt(0)}</div>
        <h3>${UI.escapeHtml(student.name)}</h3>
        <p class="text-muted">Roll No: ${UI.escapeHtml(student.rollNo)}</p>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Class</label><p>${UI.escapeHtml(student.className)}</p></div>
        <div class="form-group"><label class="form-label">Section</label><p>${UI.escapeHtml(student.section)}</p></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Academic Year</label><p>${UI.escapeHtml(student.academicYear)}</p></div>
        <div class="form-group"><label class="form-label">Date of Birth</label><p>${typeof UI.formatDate !== 'undefined' ? UI.formatDate(student.dateOfBirth) : UI.escapeHtml(student.dateOfBirth)}</p></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Email</label><p>${UI.escapeHtml(student.email || '-')}</p></div>
        <div class="form-group"><label class="form-label">Phone</label><p>${UI.escapeHtml(student.phone || '-')}</p></div>
      </div>
      ${results.length > 0 ? `<h4 style="margin-top:20px">Results Summary</h4>
        ${results.map(r => `<div class="card" style="margin-top:10px;padding:12px">
          <strong>${UI.escapeHtml(r.examName)}</strong> — ${r.percentage}% — Grade ${r.grade} — 
          <span class="badge ${r.result === 'PASS' ? 'badge-pass' : 'badge-fail'}">${r.result}</span>
        </div>`).join('')}` : '<p class="text-muted" style="margin-top:20px">No results recorded.</p>'}
    `;
    UI.showModal('modal-view-student');
  },

  renderForm(student = null) {
    const s = student || { name: '', rollNo: '', className: 'B.Tech CSE', section: 'A', academicYear: '2026-2027', dateOfBirth: '', email: '', phone: '' };
    return `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="sf-name">Full Name *</label>
          <input type="text" class="form-input" id="sf-name" value="${UI.escapeHtml(s.name)}" placeholder="Enter full name" required>
          <span class="form-error" id="sf-name-error"></span>
        </div>
        <div class="form-group">
          <label class="form-label" for="sf-roll">Roll Number *</label>
          <input type="text" class="form-input" id="sf-roll" value="${UI.escapeHtml(s.rollNo)}" placeholder="e.g., 1024" required>
          <span class="form-error" id="sf-roll-error"></span>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="sf-class">Class *</label>
          <select class="form-select" id="sf-class">
            <option value="B.Tech CSE" ${s.className === 'B.Tech CSE' ? 'selected' : ''}>B.Tech CSE</option>
            <option value="B.Tech IT" ${s.className === 'B.Tech IT' ? 'selected' : ''}>B.Tech IT</option>
            <option value="BCA" ${s.className === 'BCA' ? 'selected' : ''}>BCA</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="sf-section">Section</label>
          <select class="form-select" id="sf-section">
            <option value="A" ${s.section === 'A' ? 'selected' : ''}>A</option>
            <option value="B" ${s.section === 'B' ? 'selected' : ''}>B</option>
            <option value="C" ${s.section === 'C' ? 'selected' : ''}>C</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="sf-year">Academic Year</label>
          <input type="text" class="form-input" id="sf-year" value="${UI.escapeHtml(s.academicYear || '')}" placeholder="2026-2027">
        </div>
        <div class="form-group">
          <label class="form-label" for="sf-dob">Date of Birth</label>
          <input type="date" class="form-input" id="sf-dob" value="${UI.escapeHtml(s.dateOfBirth || '')}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="sf-email">Email</label>
          <input type="email" class="form-input" id="sf-email" value="${UI.escapeHtml(s.email || '')}" placeholder="student@example.com">
          <span class="form-error" id="sf-email-error"></span>
        </div>
        <div class="form-group">
          <label class="form-label" for="sf-phone">Phone</label>
          <input type="tel" class="form-input" id="sf-phone" value="${s.phone || ''}" placeholder="9876543210">
          <span class="form-error" id="sf-phone-error"></span>
        </div>
      </div>
    `;
  },

  handleAdd() {
    const data = this.getFormData();
    if(this.validate(data).valid) {
        this.add(data);
        UI.hideModal('modal-add-student');
    } else {
        this.showFormErrors(this.validate(data).errors);
    }
  },

  handleEdit(id) {
    const data = this.getFormData();
    if(this.validate(data, id).valid) {
        this.update(id, data);
        UI.hideModal('modal-edit-student');
    } else {
        this.showFormErrors(this.validate(data, id).errors);
    }
  },

  getFormData() {
    return {
      name: document.getElementById('sf-name')?.value?.trim() || '',
      rollNo: document.getElementById('sf-roll')?.value?.trim() || '',
      className: document.getElementById('sf-class')?.value || '',
      section: document.getElementById('sf-section')?.value || 'A',
      academicYear: document.getElementById('sf-year')?.value?.trim() || '2026-2027',
      dateOfBirth: document.getElementById('sf-dob')?.value || '',
      email: document.getElementById('sf-email')?.value?.trim() || '',
      phone: document.getElementById('sf-phone')?.value?.trim() || ''
    };
  },

  showFormErrors(errors) {
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-input.error').forEach(el => el.classList.remove('error'));

    Object.entries(errors).forEach(([field, msg]) => {
      const errorEl = document.getElementById(`sf-${field}-error`);
      const inputEl = document.getElementById(`sf-${field}`);
      if (errorEl) errorEl.textContent = msg;
      if (inputEl) inputEl.classList.add('error');
    });
  }
};

window.Students = Students;
