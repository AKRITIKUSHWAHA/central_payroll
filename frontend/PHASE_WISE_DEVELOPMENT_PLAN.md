# Central Dispatch Payroll Management System
## 6-Phase Frontend Development & Architecture Plan

This document outlines the 6-phase implementation roadmap for building the production-quality frontend of the **Central Dispatch Payroll Management System** tailored for Bermuda operations.

---

## 🎨 Visual & Technical Principles
- **Design Direction**: Clean enterprise Windows application matching existing Central Dispatch design tokens:
  - Header & Brand Navy: `#12345b`
  - Primary Action Blue: `#2f6fb3`
  - Sky Blue Accents: `#eaf4fb`
  - Background: Light Gray (`#f4f7fb`)
  - Border: Soft Gray (`#dde7f0`)
  - Crisp typography with tabular numerical alignment (`font-variant-numeric: tabular-nums`)
- **Tech Stack**: React 18, Vite, TypeScript, React Router DOM, Tailwind CSS, Lucide React, Recharts, React Hook Form, Zod, date-fns.
- **Service Layer Architecture**: Decoupled mock service modules (`employeeService`, `payrollService`, `scheduleService`, `leaveService`, `reportService`, `userService`, `emailService`) stored with `localStorage` and fallback seed data, enabling seamless future backend REST API integration without UI rewrites.

---

## 🚀 6-Phase Execution Roadmap

### 📦 Phase 1: Project Setup, Design System, Mock Services & Auth Infrastructure
- Initialize Vite + React + TypeScript application with Tailwind CSS & custom design tokens.
- Establish clean modular architecture (`/components`, `/pages`, `/services`, `/types`, `/mock`, `/context`).
- Build core layout structure (`AppLayout`, `Sidebar`, `Topbar`, `ToastContainer`).
- Implement collapsible sidebar with Workspace and Administration categories, role indicator chip, and logout button.
- Create 15 realistic Bermuda employee profiles with varied roles, pay rates, departments, schedules, and leave history.
- Implement full service layer (`employeeService.ts`, `payrollService.ts`, `scheduleService.ts`, `leaveService.ts`, `reportService.ts`, `userService.ts`, `emailService.ts`).
- Set up Authentication Context (`AuthContext`) handling Super Admin, Admin, and Staff roles with permission-aware navigation.

### 📊 Phase 2: User Authentication Gate & Interactive Dashboard
- **Login Gate (`/login`)**: Role selector, credentials input, temporary password notice, first-time setup hint.
- **Header**: Personal user greeting (`Hello, [User Name]`), Bermuda date display (`Thursday, 10 September 2026`), Current Pay Period badge.
- **KPI Summary Cards**:
  - Total Employees (e.g. 25)
  - Total Hours This Week (e.g. 842.50)
  - Gross Payroll This Week (e.g. $28,450.00)
  - Payroll To Pay (e.g. $27,920.00)
  - Employees On Leave (e.g. 3)
  - Payroll Status Badge (`Draft` / `Calculated` / `Approved` / `Paid`).
- **Weekly Payroll Summary**: Active pay period employee list with regular hours, overtime, total hours, rate, gross pay, status, and quick action buttons.
- **This Week's Staff Schedule**: Compact grid showing Mon-Sun schedule with shift/leave badges (`WORK`, `OFF`, `VACATION`, `SICK`, `HOLIDAY`).
- **Staff Leave Summary**: Visual donut ring chart (Recharts) detailing Sick, Vacation, and Other leaves alongside active leave requests.
- **Upcoming Staff Events**: Birthdays, scheduled leave start dates, and return dates with date cards.

### 👥 Phase 3: Employee Management & Detailed Profiles
- **Employees Listing (`/employees`)**: Search input, active/inactive filters, department filters, pay type toggles, tabular data list. Add/Edit Employee modal powered by React Hook Form & Zod schema validation.
- **Employee Detailed Profile (`/employees/:id`)**:
  - Header banner with avatar initials, status badge, employee ID, and job title.
  - Tabbed Navigation: Overview, Personal Details, Contact Information, Employment Details, Payroll Setup, Schedule, Leave History, Payslip Archive.
  - Masking controls for sensitive data (pay rates, contact details, emergency contacts).
- **Staff Directory & Contacts (`/contacts`)**: Clean searchable contact table, quick email/call action buttons, and detailed slide-over profile drawer.

### 📅 Phase 4: Weekly Staff Schedule & Leave Calendar
- **Weekly Staff Schedule (`/schedules`)**:
  - Week selector controls (`< Previous Week`, `September 7 - September 13, 2026`, `Next Week >`).
  - Full interactive shift grid (Mon-Sun) allowing shift entries (e.g. `8:00 AM - 4:00 PM`, `OFF`, `VACATION`, `SICK`, `HOLIDAY`).
  - Auto-calculating total weekly hours per employee.
  - Action buttons: Add Schedule, Copy Previous Week, Clear Week, Export CSV, Print View.
  - Schedule Notes panel persistent to local workspace storage.
- **Leave Calendar (`/leave`)**:
  - Toggle views: Month calendar grid, Week view, List view.
  - Visual Sick and Holiday calendars with interactive date toggling.
  - Leave booking modal (Employee select, leave type, start date, end date, notes).
  - Leave summary analytics (Vacation Days, Sick Days, Other Leave).

### 💰 Phase 5: Core Payroll Engine, Individual Payslips & Emailing
- **Payroll Console (`/payroll`, `/payroll/:period`)**:
  - Pay period selector, pay date picker, status badge.
  - Comprehensive calculation engine (Regular Hours, Overtime Hours, Holiday Hours, Regular Rate, Overtime Rate, Deductions, Net Pay).
  - Confirmation dialogs for "Approve Payroll" and "Mark as Paid".
  - Payroll history drawer with period archive capabilities.
- **Individual Payslips (`/payslips`, `/payroll/:period/employee/:employeeId`)**:
  - Isolated payslip component for each employee.
  - Official Bermuda Central Dispatch letterhead format.
  - Earnings breakdown, itemized deductions, gross pay, total deductions, and net pay.
  - Print layout CSS and PDF export trigger.
- **Email Payslip Modal**:
  - Pre-filled employee email recipient, subject line, and custom message template.
  - Simulated email delivery with instant UI success state and toast notification.

### 📈 Phase 6: Comprehensive Reporting (Payroll, Accounting, Audit), RBAC, User Accounts & Settings
- **Payroll Reports (`/reports`)**:
  - 8 specialized report types: Weekly Payroll Summary, Employee Payroll Report, Department Breakdown, Hours Worked Report, Overtime Report, Gross vs Net Payroll, Payment Report, Leave Impact Report.
  - Filter controls: Pay Period, Employee, Department, Status. Export CSV & Print support.
- **Accounting Reports (`/reports/accounting`)**:
  - Reconciliation view designed for bookkeepers.
  - Summarized Total Gross, Total Deductions, Total Net Payroll, Regular Pay vs Overtime Pay across departments and periods.
- **Audit Reports (`/reports/audit`)**:
  - Weekly Audit and Year-End Audit modules.
  - Detailed audit trail tracking Created By, Created Date, Updated By, Updated Date, Approved By, Approved Date.
- **Permissions Matrix (`/permissions`)**:
  - Role-Based Access Control matrix for Super Admin, Admin, and Staff roles across all workspace modules.
- **User Accounts (`/users`)**:
  - User listing, Add User form, temporary password assignment, deactivate toggle, password reset trigger.
- **Settings (`/settings`)**:
  - Company Details, Payroll Rules (overtime limits, pay period defaults), Email Setup, Report Customizations.

---

## 📌 Summary Checklist
- [x] Phase 1: Project Setup, Design Tokens, Routing & Mock Services
- [x] Phase 2: Login Gate & Interactive Dashboard
- [x] Phase 3: Employee Management & Profiles
- [x] Phase 4: Weekly Staff Schedule & Leave Calendar
- [x] Phase 5: Core Payroll Engine, Individual Payslips & Emailing
- [x] Phase 6: Comprehensive Reporting, Audit, RBAC & User Settings
