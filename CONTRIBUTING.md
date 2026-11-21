# Contributing to EduResult

Thank you for your interest in contributing to EduResult – Student Result Management System!

## How to Contribute

1. **Fork the Repository**: Create your own copy of the repository on GitHub.
2. **Clone Locally**:
   ```bash
   git clone https://github.com/Shaiikarif/eduresult-student-result-management-system.git
   cd eduresult-student-result-management-system
   ```
3. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Follow Coding Guidelines**:
   - Write clean, modular, vanilla JavaScript (ES6+).
   - Sanitize all user-provided HTML inputs using the existing `escapeHtml` utility to prevent XSS vulnerabilities.
   - Maintain the responsive styling system in `css/style.css`, `css/components.css`, and `css/responsive.css`.
   - Ensure the rule-based Assistant logic is not misrepresented as server-side machine learning.
5. **Run Tests**:
   - Ensure all automated unit and integration tests pass before submitting changes:
     ```bash
     node tests/run_all_tests.js
     ```
6. **Submit a Pull Request**:
   - Open a PR targeting the `main` branch with a clear description of changes, tests added, and screenshots if UI changes were made.
