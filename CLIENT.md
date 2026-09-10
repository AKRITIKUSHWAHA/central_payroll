# Central Dispatch Payroll System — Client Documentation

## 📌 Executive Summary
**Central Dispatch Payroll** is an enterprise-grade weekly payroll and workforce management system custom-built for Central Dispatch operations in Bermuda. The platform seamlessly manages employee master records, shift schedules, leave calendars, statutory tax deductions, and automated payroll calculations.

---

## 🎯 Primary Purpose & Business Value
1. **Weekly Payroll Processing**: Streamlines weekly payroll cycles (Thursday through Wednesday) with instant calculations of Regular Pay, Holiday Pay, Other Allowances, and Net Payroll.
2. **Staff Rota & Shift Management**: Maintains employee duty schedules independently from payroll, tracking weekly shift hours.
3. **Leave Tracking**: Records Sick Time and Holiday/Vacation days on interactive dual-calendar displays.
4. **Bermuda Tax Flexibility**: Provides an editable Statutory Tax / Deduction input column to accommodate individual employee tax brackets under Bermuda labor laws.
5. **Audit Logging & Access Control**: Tracks all administrative actions with audit logs and fine-grained role-based permissions (Super Admin, Admin, Staff).

---

## 🛠️ Main Feature Modules

### 1. Dashboard (`/dashboard`)
- Executive overview displaying **Total Active Staff**, **Total Hours**, **Gross Payroll ($)**, and **Net Payroll To Pay ($)**.
- Visual charts: Employee Payroll Bar Chart & Staff Leave Donut Chart.
- Quick preview of current weekly staff shifts and active workspace status.

### 2. Employee Directory (`/employees`)
- Complete master list of all employees.
- "+ Add New Staff Member" form collecting 5 comprehensive sections:
  1. **Basic Info**: Name, Employee ID, Position, Department, Status.
  2. **Employment Setup**: Employment Type, Pay Type (Hourly/Salaried), Pay Rate ($/hr), Holiday Rate ($/hr), Start Date.
  3. **Contact Details**: Personal Phone, Work Phone, Email, Date of Birth (`YYYY-MM-DD`), Address.
  4. **Emergency Contact**: Emergency Contact Name, Relationship, Phone.
  5. **Bank & Direct Deposit**: Payment Method, Bank Name, Masked Account Number.
- Search, department filters, active/inactive status toggles, and individual profile views (`/employees/:id`).

### 3. Payroll Console (`/payroll`)
- Central workspace for computing weekly salaries.
- Auto-syncs all active employees from the Employee Directory into the active draft.
- **100% Editable Table Inputs**:
  - **Regular Rate ($)** & **Regular Hours**
  - **Holiday Rate ($)** & **Holiday Hours**
  - **Other Pay ($)**
  - **Deductions / Tax ($)** (Manual entry for Bermuda Tax, Social Insurance, etc.)
- **Real-Time Recalculation**:
  - $$\text{Regular Pay} = \text{Regular Rate} \times \text{Regular Hours}$$
  - $$\text{Holiday Pay} = \text{Holiday Rate} \times \text{Holiday Hours}$$
  - $$\text{Gross Pay} = \text{Regular Pay} + \text{Holiday Pay} + \text{Other Pay}$$
  - $$\text{Net Pay} = \text{Gross Pay} - \text{Deductions}$$
- **Actions**: Save Draft, Export to Excel/CSV, Print Report, View Payslips, Process Pay (Mark as Paid).

### 4. Leave Calendars (`/leave`)
- Dual-calendar interactive view: **Sick Time Calendar (Red)** & **Holiday Calendar (Green)**.
- Select Employee and Month to view or edit recorded leave days.
- **Save Leave Records** button persists records directly to database table `leave_records`.

### 5. Staff Contact Details (`/contacts`)
- Quick telephone & email directory for all team members.
- One-click phone calling and email dispatch links.

### 6. Weekly Schedules (`/schedules`)
- Independent weekly shift matrix (Monday to Sunday) for staff rotas (e.g. `8-4`, `OFF`).
- Auto-calculates row total working hours.
- Includes shift instructions and weekly schedule notes panel.
- **Save Schedule** button persists rotas to database table `schedules`.

### 7. Payroll Reports (`/reports`)
- Comprehensive summary of past payroll periods.
- Filter by date range, department, or status with one-click Excel/CSV export.

### 8. Audit Reports (`/reports/audit`)
- Security & compliance log tracking every action (e.g. `PAYROLL_PROCESSED`, `USER_STATUS_TOGGLED`) with user timestamp and details.

### 9. Payslips (`/payslips`)
- Official printable salary slips (pay stubs) for individual staff members.

### 10. Administration & Security
- **Permissions (`/permissions`)**: Granular role-based view/edit permissions for Super Admin, Admin, and Staff.
- **User Accounts (`/users`)**: Create, activate, or deactivate administrative login accounts with custom password management.
- **Settings (`/settings`)**: System settings, pay frequency configuration, and database backup/restore tools.

---

## 💾 Data Persistence & Backup Policy
- **Primary Database**: MySQL Server (`payroll_db`) running on port `3307`.
- **Fallback / Local Cache**: Browser LocalStorage for instant offline availability.
- **Backup Guidance**: Administrators should regularly use the **Backup Data** tool in Settings to save JSON backups of all organization data.
