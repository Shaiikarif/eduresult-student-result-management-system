const Storage = {
  keys: {
    students: 'eduresult_students',
    subjects: 'eduresult_subjects',
    results: 'eduresult_results',
    settings: 'eduresult_settings',
    session: 'eduresult_session'
  },

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Error saving to localStorage', e);
      return false;
    }
  },

  load(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error loading from localStorage', e);
      return null;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clear() {
    Object.values(this.keys).forEach(key => this.remove(key));
  },

  init() {
    const students = this.load(this.keys.students);
    const subjects = this.load(this.keys.subjects);
    const results = this.load(this.keys.results);
    const settings = this.load(this.keys.settings);
    
    if (!students || !Array.isArray(students) || students.length === 0 || !subjects || !Array.isArray(subjects) || subjects.length === 0) {
      this.resetToDemo();
    } else {
      window.EduResult.state.students = students;
      window.EduResult.state.subjects = subjects;
      window.EduResult.state.results = results || [];
      window.EduResult.state.settings = settings || JSON.parse(JSON.stringify(DemoData.settings));
    }
  },

  saveAll() {
    this.save(this.keys.students, window.EduResult.state.students);
    this.save(this.keys.subjects, window.EduResult.state.subjects);
    this.save(this.keys.results, window.EduResult.state.results);
    this.save(this.keys.settings, window.EduResult.state.settings);
  },

  saveSession(session) {
    this.save(this.keys.session, session);
  },

  loadSession() {
    return this.load(this.keys.session);
  },

  clearSession() {
    this.remove(this.keys.session);
  },

  resetToDemo() {
    this.clear();
    window.EduResult.state.students = JSON.parse(JSON.stringify(DemoData.students));
    window.EduResult.state.subjects = JSON.parse(JSON.stringify(DemoData.subjects));
    window.EduResult.state.results = JSON.parse(JSON.stringify(DemoData.results));
    window.EduResult.state.settings = JSON.parse(JSON.stringify(DemoData.settings));
    this.saveAll();
  }
};

window.Storage = Storage;
