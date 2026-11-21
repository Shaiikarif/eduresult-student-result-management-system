# EduResult — Student Result Management System

EduResult is an intelligent, frontend-driven academic performance and result management platform designed for educational institutions. It delivers a modern, responsive interface for both administrators and students using pure web technologies without heavy framework overhead.

---

## 🌟 Key Features

### Dual Role-Based Portals

1. **Admin Portal**
   - **Interactive Dashboard**: Metric cards for cohort statistics, pass/fail ratios, grade distribution, and recent performance highlights.
   - **Student Administration**: Add, edit, remove, search, and paginate through student profiles.
   - **Subject Management**: Define CS course catalogs with credit allocations, code assignments, and passing marks.
   - **Marks Entry & Engine**: Rapid marks input with instant verification, grade assignment, and pass/fail validation.
   - **Academic Rankings**: Automatic rank calculation supporting ties and percentile generation.
   - **Cohort Analytics**: Visual subject proficiencies, grade distributions, and historical trends.
   - **Data Export & Print Cards**: One-click CSV export and formal printable student scorecards.
   - **EduBot Query Assistant**: Rule-based conversational assistant for immediate cohort insights.

2. **Student Portal**
   - **Private Dashboard**: Individual cumulative percentages, grades, and recent scores.
   - **My Profile & Subjects**: Personal enrollment records, contact information, and registered courses.
   - **Historical Performance**: Exam-by-exam score breakdowns and proficiency tracking.
   - **Goal Simulator**: Interactive target calculator determining scores needed to achieve target percentages.
   - **Actionable Improvement Plan**: Diagnostic recommendations highlighting areas needing extra focus.

---

## 🛠️ Technology Stack

- **Markup**: Semantic HTML5 with accessibility attributes
- **Styling**: Pure CSS3 (Custom design system, CSS Variables, Flexbox, Grid, Media Queries)
- **Programming Language**: Vanilla JavaScript (ES6+)
- **Storage**: Browser LocalStorage with automated schema recovery
- **Testing**: Native Node.js test suite with automated assertion runners

---

## 📐 Result Engine Rules

- **Total Marks**: Sum of obtained marks across all subjects.
- **Maximum Marks**: Sum of maximum marks across all subjects.
- **Percentage**: `(Total Marks / Maximum Marks) * 100`

### Grading Scale

| Percentage Range | Letter Grade | Status |
| :--- | :--- | :--- |
| **90.00% – 100.0%** | A+ | Pass |
| **80.00% – 89.99%** | A | Pass |
| **70.00% – 79.99%** | B | Pass |
| **60.00% – 69.99%** | C | Pass |
| **50.00% – 59.99%** | D | Pass |
| **40.00% – 49.99%** | E | Pass |
| **Below 40.00%** | F | Fail |

*Note*: A candidate fails if their overall percentage is below 40% or if any individual subject mark falls below its required passing score.

---

## 🚀 Running the Project Locally

No build step or package installation is required.

1. Clone or download this repository.
2. Open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).

### Demonstration Access Credentials

- **Admin Portal**: Username `admin` | Password `EduResult@2026`
- **Student Portal**: Enter Roll Number `1001`, `1002`, `1003`, or `1024`

> **Demonstration Architecture Note**: Authentication and state management run client-side using localStorage. For production deployment, connect client endpoints to a secure backend with token-based sessions.

---

## 🧪 Automated Testing

Run the included verification suite using Node.js:

```bash
node tests/run_all_tests.js
```

Covers:
- Grade boundaries & pass/fail arithmetic
- Rank computation and dense tie handling
- Duplicate detection & schema validation
- Input sanitization & student privacy boundary checks

---

## 📄 License

This project is licensed under the MIT License.
