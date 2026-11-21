const Subjects = {
  currentFilters: { search: '' },

  getAll() {
    return EduResult.state.subjects;
  },
  
  getById(id) {
    return EduResult.state.subjects.find(s => s.id === id);
  },
  
  getByCode(code) {
    return EduResult.state.subjects.find(s => s.code.toLowerCase() === String(code).toLowerCase());
  },

  add(data) {
    const { valid, errors } = this.validate(data);
    if (!valid) {
      this.showFormErrors(errors);
      return null;
    }
    data.id = UI.generateId('SUB');
    EduResult.state.subjects.push(data);
    Storage.save('eduresult_subjects', EduResult.state.subjects);
    UI.toast('Subject added successfully!', 'success');
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
    const idx = EduResult.state.subjects.findIndex(s => s.id === id);
    if (idx > -1) {
      EduResult.state.subjects[idx] = merged;
      Storage.save('eduresult_subjects', EduResult.state.subjects);
      UI.toast('Subject updated successfully!', 'success');
      this.render();
      return EduResult.state.subjects[idx];
    }
    return null;
  },

  delete(id) {
    // Check if subject is used in any results
    let isUsed = false;
    if (typeof Results !== 'undefined') {
        const results = Results.getAll();
        isUsed = results.some(r => r.marks && r.marks[id] !== undefined);
    }
    
    let msg = 'Are you sure you want to delete this subject?';
    if (isUsed) {
      msg = 'This subject is used in existing results. Deleting it may cause issues with historical data. Are you sure?';
    }

    UI.confirm('Delete Subject', msg, () => {
      EduResult.state.subjects = EduResult.state.subjects.filter(s => s.id !== id);
      Storage.save('eduresult_subjects', EduResult.state.subjects);
      UI.toast('Subject deleted successfully.', 'success');
      this.render();
    });
  },

  validate(data, editingId = null) {
    const errors = {};
    if (!data.name || !data.name.trim()) errors.name = 'Subject name is required';
    if (!data.code || !data.code.trim()) errors.code = 'Subject code is required';
    else {
      const existing = this.getByCode(data.code);
      if (existing && existing.id !== editingId) errors.code = 'Subject code already exists';
    }
    
    if (isNaN(data.maxMarks) || data.maxMarks <= 0) errors.maxMarks = 'Max marks must be greater than 0';
    if (isNaN(data.passMarks) || data.passMarks < 0) errors.passMarks = 'Pass marks cannot be negative';
    else if (data.passMarks > data.maxMarks) errors.passMarks = 'Pass marks cannot exceed max marks';
    
    return { valid: Object.keys(errors).length === 0, errors };
  },

  search(query) {
    const q = query.toLowerCase();
    return this.getAll().filter(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  },

  render() {
    const container = document.getElementById('page-admin-subjects');
    if (!container) return;

    let all = this.getAll();
    let displaySubjects = this.currentFilters.search ? this.search(this.currentFilters.search) : all;

    let html = `
      <div class="page-header flex-between">
        <h2>Subjects</h2>
        <button class="btn btn-primary" onclick="Subjects.showAddModal()">${typeof Icons !== 'undefined' ? Icons.plus : '+'} Add Subject</button>
      </div>
      <div class="filter-bar">
        <div class="search-bar">
          <span class="search-icon">${typeof Icons !== 'undefined' ? Icons.search : '🔍'}</span>
          <input type="text" class="form-input" id="subject-search" placeholder="Search by subject name or code..." value="${UI.escapeHtml(this.currentFilters.search)}">
        </div>
      </div>
    `;

    if (displaySubjects.length === 0) {
      html += UI.emptyState(typeof Icons !== 'undefined' ? Icons.subjects : '📚', 'No Subjects Found',
        this.currentFilters.search ? 'No subjects match your search.' : 'Add your first subject to get started.',
        'Add Subject', 'Subjects.showAddModal()');
    } else {
      html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;margin-top:20px;">`;
      displaySubjects.forEach(s => {
        html += `
          <div class="card neu-card">
            <div class="flex-between" style="margin-bottom:15px;align-items:flex-start;">
              <div>
                <h3 style="margin:0 0 5px 0;font-size:1.1rem;">${UI.escapeHtml(s.name)}</h3>
                <span class="badge" style="background:var(--primary-light);color:var(--primary-dark);">${UI.escapeHtml(s.code)}</span>
              </div>
              <div class="table-actions" style="display:flex;gap:5px;">
                <button class="btn btn-sm btn-icon" onclick="Subjects.showEditModal('${s.id}')" title="Edit">${typeof Icons !== 'undefined' ? Icons.edit : '✏️'}</button>
                <button class="btn btn-sm btn-icon" style="color:var(--danger);" onclick="Subjects.delete('${s.id}')" title="Delete">${typeof Icons !== 'undefined' ? Icons.delete : '🗑️'}</button>
              </div>
            </div>
            <div class="flex-between text-muted" style="font-size:0.9rem;border-top:1px solid var(--border);padding-top:10px;margin-top:auto;">
              <div>Max Marks: <strong>${s.maxMarks}</strong></div>
              <div>Pass Marks: <strong>${s.passMarks}</strong></div>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

    container.innerHTML = html;

    const searchInput = document.getElementById('subject-search');
    if (searchInput) {
      const handler = (e) => {
        this.currentFilters.search = e.target.value;
        this.render();
      };
      searchInput.addEventListener('input', typeof UI.debounce !== 'undefined' ? UI.debounce(handler) : handler);
      searchInput.focus();
    }
  },

  showAddModal() {
    const modal = document.getElementById('modal-add-subject');
    if(!modal) return;
    const body = modal.querySelector('.modal-body');
    if(body) body.innerHTML = this.renderForm();
    UI.showModal('modal-add-subject');

    const saveBtn = modal.querySelector('.btn-save');
    if(saveBtn) {
        saveBtn.onclick = () => this.handleAdd();
    }
  },

  showEditModal(id) {
    const subject = this.getById(id);
    if (!subject) return;
    const modal = document.getElementById('modal-edit-subject');
    if(!modal) return;
    const body = modal.querySelector('.modal-body');
    if(body) body.innerHTML = this.renderForm(subject);
    UI.showModal('modal-edit-subject');

    const saveBtn = modal.querySelector('.btn-save');
    if(saveBtn) {
        saveBtn.onclick = () => this.handleEdit(id);
    }
  },

  renderForm(subject = null) {
    const s = subject || { name: '', code: '', maxMarks: 100, passMarks: 40 };
    return `
      <div class="form-group">
        <label class="form-label" for="sub-name">Subject Name *</label>
        <input type="text" class="form-input" id="sub-name" value="${UI.escapeHtml(s.name)}" placeholder="e.g., Programming in C" required>
        <span class="form-error" id="sub-name-error"></span>
      </div>
      <div class="form-group">
        <label class="form-label" for="sub-code">Subject Code *</label>
        <input type="text" class="form-input" id="sub-code" value="${UI.escapeHtml(s.code)}" placeholder="e.g., CS101" required>
        <span class="form-error" id="sub-code-error"></span>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="sub-max">Max Marks *</label>
          <input type="number" class="form-input" id="sub-max" value="${s.maxMarks}" min="1" required>
          <span class="form-error" id="sub-maxMarks-error"></span>
        </div>
        <div class="form-group">
          <label class="form-label" for="sub-pass">Pass Marks *</label>
          <input type="number" class="form-input" id="sub-pass" value="${s.passMarks}" min="0" required>
          <span class="form-error" id="sub-passMarks-error"></span>
        </div>
      </div>
    `;
  },

  handleAdd() {
    const data = this.getFormData();
    if(this.validate(data).valid) {
        this.add(data);
        UI.hideModal('modal-add-subject');
    } else {
        this.showFormErrors(this.validate(data).errors);
    }
  },

  handleEdit(id) {
    const data = this.getFormData();
    if(this.validate(data, id).valid) {
        this.update(id, data);
        UI.hideModal('modal-edit-subject');
    } else {
        this.showFormErrors(this.validate(data, id).errors);
    }
  },

  getFormData() {
    return {
      name: document.getElementById('sub-name')?.value?.trim() || '',
      code: document.getElementById('sub-code')?.value?.trim() || '',
      maxMarks: parseInt(document.getElementById('sub-max')?.value, 10) || 0,
      passMarks: parseInt(document.getElementById('sub-pass')?.value, 10) || 0
    };
  },

  showFormErrors(errors) {
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-input.error').forEach(el => el.classList.remove('error'));

    Object.entries(errors).forEach(([field, msg]) => {
      const errorEl = document.getElementById(`sub-${field}-error`);
      const inputEl = document.getElementById(`sub-${field === 'maxMarks' ? 'max' : field === 'passMarks' ? 'pass' : field}`);
      if (errorEl) errorEl.textContent = msg;
      if (inputEl) inputEl.classList.add('error');
    });
  }
};

window.Subjects = Subjects;
