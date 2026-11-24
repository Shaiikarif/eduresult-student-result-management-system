const Auth = {
  adminLogin(username, password) {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      const session = { role: 'admin', timestamp: Date.now() };
      Storage.saveSession(session);
      window.EduResult.currentUser = session;
      return true;
    }
    return false;
  },

  studentLogin(rollNo) {
    const student = window.EduResult.state.students.find(s => s.rollNo === rollNo);
    if (student) {
      const session = { role: 'student', studentId: student.id, timestamp: Date.now() };
      Storage.saveSession(session);
      window.EduResult.currentUser = session;
      if (typeof App !== 'undefined' && App.updateStudentHeaderAvatar) {
        App.updateStudentHeaderAvatar(student);
      }
      return student;
    }
    return null;
  },

  logout() {
    Storage.clearSession();
    window.EduResult.currentUser = null;
    
    // Reset app state
    App.showPortal('login');
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    
    // Reset login forms
    const adminForm = document.getElementById('admin-login-section');
    const studentForm = document.getElementById('student-login-section');
    const selection = document.getElementById('login-selection');
    
    if (adminForm) adminForm.style.display = 'none';
    if (studentForm) studentForm.style.display = 'none';
    if (selection) selection.style.display = 'flex';
    
    // Clear inputs
    const userInp = document.getElementById('admin-username');
    const passInp = document.getElementById('admin-password');
    const rollInp = document.getElementById('student-roll');
    
    if (userInp) userInp.value = '';
    if (passInp) passInp.value = '';
    if (rollInp) rollInp.value = '';
  },

  getSession() {
    return Storage.loadSession();
  },

  isAdmin() {
    return window.EduResult.currentUser && window.EduResult.currentUser.role === 'admin';
  },

  isStudent() {
    return window.EduResult.currentUser && window.EduResult.currentUser.role === 'student';
  },

  getCurrentStudent() {
    if (!this.isStudent()) return null;
    return window.EduResult.state.students.find(s => s.id === window.EduResult.currentUser.studentId);
  },

  restoreSession() {
    const session = this.getSession();
    if (!session) return false;
    
    // Validate session
    if (session.role === 'student') {
      const studentExists = window.EduResult.state.students.find(s => s.id === session.studentId);
      if (!studentExists) {
        this.logout();
        return false;
      }
    }
    
    window.EduResult.currentUser = session;
    return true;
  },

  initLoginUI() {
    const selection = document.getElementById('login-selection');
    const adminSection = document.getElementById('admin-login-section');
    const studentSection = document.getElementById('student-login-section');
    
    // Cards
    const adminCard = document.getElementById('admin-login-card');
    const studentCard = document.getElementById('student-login-card');
    
    if (adminCard) {
      adminCard.addEventListener('click', () => {
        if(selection) selection.style.display = 'none';
        if(adminSection) adminSection.style.display = 'block';
      });
    }
    
    if (studentCard) {
      studentCard.addEventListener('click', () => {
        if(selection) selection.style.display = 'none';
        if(studentSection) studentSection.style.display = 'block';
      });
    }
    
    // Back buttons
    const backBtn1 = document.getElementById('back-to-selection');
    const backBtn2 = document.getElementById('back-to-selection-2');
    const backHandler = () => {
      if(adminSection) adminSection.style.display = 'none';
      if(studentSection) studentSection.style.display = 'none';
      if(selection) selection.style.display = 'flex';
    };
    if (backBtn1) backBtn1.addEventListener('click', backHandler);
    if (backBtn2) backBtn2.addEventListener('click', backHandler);
    
    // Form submissions
    const adminBtn = document.getElementById('admin-login-btn');
    if (adminBtn) {
      adminBtn.addEventListener('click', () => {
        const u = document.getElementById('admin-username').value;
        const p = document.getElementById('admin-password').value;
        const err = document.getElementById('admin-login-error');
        
        if (this.adminLogin(u, p)) {
          if(err) err.style.display = 'none';
          App.showPortal('admin');
          App.navigate('admin-dashboard');
          UI.toast('Welcome, Admin!', 'success');
        } else {
          if(err) {
            err.textContent = 'Invalid credentials';
            err.style.display = 'block';
          }
        }
      });
    }
    
    const studentBtn = document.getElementById('student-login-btn');
    if (studentBtn) {
      studentBtn.addEventListener('click', () => {
        const roll = document.getElementById('student-roll').value;
        const err = document.getElementById('student-login-error');
        
        const student = this.studentLogin(roll);
        if (student) {
          if(err) err.style.display = 'none';
          App.showPortal('student');
          App.navigate('student-dashboard');
          UI.toast('Welcome, ' + student.name + '!', 'success');
        } else {
          if(err) {
            err.textContent = 'Student not found';
            err.style.display = 'block';
          }
        }
      });
    }
    
    // Enter key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (adminSection && adminSection.style.display === 'block') {
          adminBtn.click();
        } else if (studentSection && studentSection.style.display === 'block') {
          studentBtn.click();
        }
      }
    });
  }
};

window.Auth = Auth;
