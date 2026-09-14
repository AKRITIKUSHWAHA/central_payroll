# Central Dispatch Payroll System — Client Documentation

## 📌 Executive Summary
**Central Dispatch Payroll** is an enterprise-grade weekly payroll and workforce management system custom-built for Central Dispatch operations in Bermuda. The platform seamlessly manages employee master records, shift schedules, leave calendars, customer accounting, statutory tax deductions, and automated payroll calculations.

---

## 🎯 Primary Purpose & Business Value
1. **Weekly Payroll Processing**: Streamlines weekly payroll cycles (Thursday through Wednesday) with instant calculations of Regular Pay, Holiday Pay, Other Allowances, Deductions, and Net Payroll.
2. **Staff Rota & Shift Management**: Maintains employee duty schedules independently from payroll, tracking weekly shift hours.
3. **Leave Tracking**: Records Sick Time and Holiday/Vacation days on interactive dual-calendar displays.
4. **Bermuda Tax Flexibility**: Provides an editable Statutory Tax / Deduction input column to accommodate individual employee tax brackets under Bermuda labor laws.
5. **Customer Accounts & Accounting Integration**: Live management of 784 customers, accounts receivable, general ledger history, customer invoicing, and payment receipts.
6. **Audit Logging & Access Control**: Tracks all administrative actions with audit logs and fine-grained role-based permissions (Super Admin, Admin, Staff).

---

## 🛠️ Main Feature Modules

### 1. Dashboard (`/dashboard`)
- Executive overview displaying **Total Active Staff**, **Total Hours**, **Gross Payroll ($)**, and **Net Payroll To Pay ($)**.
- Visual charts: Employee Payroll Bar Chart & Staff Leave Donut Chart.
- Quick preview of current weekly staff shifts and active workspace status.

### 2. Employee Directory & Staff Management (`/employees` & `/contacts`)
- Clean master contact directory matching prototype specifications.
- **6 Official Active Staff**:
  1. `Alesia Brangman` (Dispatcher / Full Time)
  2. `Global` (Operations / Support)
  3. `SSH` (Support / Operations)
  4. `Neli Outerbridge` (Dispatcher / Full Time)
  5. `Tyonika McGowan (Ty)` (Dispatcher / Full Time)
  6. `Tanuvi Patel` (Payroll Admin / Full Time)
- **Table Columns**:
  - **Employee**: Full display name with bold styling.
  - **Phone**: Formatted contact numbers.
  - **Email**: Email address with direct `mailto:` links.
  - **Address**: Full physical / mailing address.
  - **Status**: Live green badge (`Active`) or gray badge (`Inactive`).
  - **Actions**: Direct inline `Edit` and `Delete` buttons connected directly to MySQL backend.
- **Add / Edit Modal**: Add and modify employee contact details, status, roles, and hourly rates.

### 3. Payroll Console (`/payroll`)
- Central workspace for computing weekly salaries.
- Auto-syncs all active employees from the Employee Directory into the active draft.
- **Simplified 6-Column Layout (Matching Approved Yellow Markup)**:
  1. **EMPLOYEE**: Staff member name.
  2. **REGULAR RATE ($)**: Editable hourly base pay (e.g. `$17.50/hr`).
  3. **HOLIDAY RATE ($)**: Editable holiday pay rate (e.g. `$26.25/hr`).
  4. **OTHER PAY ($)**: Editable bonus, overtime, or extra pay allowance.
  5. **DEDUCTIONS ($)**: Editable deductions (Bermuda Payroll Tax, Social Insurance, Pensions).
  6. **NET PAY ($)**: Real-time calculated net salary:
     $$\text{Net Pay} = \text{Regular Rate} + \text{Holiday Rate} + \text{Other Pay} - \text{Deductions}$$
- **Date Display**: Clean, human-readable date formatting (e.g., `March 5, 2026`).
- **Actions**: Save Draft, Backup Payroll Data (JSON), Restore Backup, Export to Excel (6 columns), Print Report, View Payslips, Process Pay.

### 4. Customers & Account Ledgers (`/customers`)
- Complete customer database with **784 Total Records**.
- **Alphabetical A-to-Z Sorting**: Customers are automatically sorted from A to Z for effortless navigation.
- **Clean Phone Formatting**: Duplicate `Phone: Phone:` prefixes removed.
- **Optimized Column Layout**: Eliminated extra gaps between Phone, Email, and Address.
- **Pagination Controls**: Select `25`, `50`, `100`, `250`, or `All customers` per page with page navigation arrows and live customer counters.
- **Customer Ledger View**: Review individual customer invoices, payments, historical balance, create invoices, record payments, and email customer statements with one click.

### 5. General Ledger (`/general-ledger`)
- 1,927+ historical and live transactions.
- Filter by Search Query, Year (2024, 2025, 2026), and Transaction Type (Payment, Invoice, Check, Pledge, Payroll Check, Tax Payment).
- **Fit Screen Layout**: Responsive horizontal scroll wrapper ensures all columns, including `Debit`, `Credit`, and `SOURCE`, are fully visible on any screen size.
- One-click **Export Ledger to Excel**.

### 6. Leave Calendars (`/leave`)
- Dual-calendar interactive view: **Sick Time Calendar (Red)** & **Holiday Calendar (Green)**.
- Select Employee and Month to view or edit recorded leave days.
- **Save Leave Records** button persists records directly to database table `leave_records`.

### 7. Weekly Schedules (`/schedules`)
- Independent weekly shift matrix (Monday to Sunday) for staff rotas (e.g. `8-4`, `OFF`).
- Auto-calculates row total working hours.
- Includes shift instructions and weekly schedule notes panel.
- **Save Schedule** button persists rotas to database table `schedules`.

### 8. Payroll Reports (`/reports`)
- Comprehensive summary of past payroll periods.
- Filter by date range, department, or status with one-click Excel/CSV export.

### 9. Payslips (`/payslips`)
- Official printable salary slips (pay stubs) for individual staff members.

### 10. Administration & Security
- **Permissions (`/permissions`)**: Granular role-based view/edit permissions:
  - **Super Admin**: Full unrestricted access.
  - **Admin**: Schedules, Customers & Ledgers, Leave Calendar (Sick & Off Schedule), Staff Contacts.
  - **Staff**: Weekly Schedules & Shift Notes only (No payroll, invoices, or system settings).
- **User Accounts (`/users`)**: Create, activate, or deactivate administrative login accounts with custom password management.
- **Settings (`/settings`)**: System settings, company profile, RideBermuda payment link, and database backup/restore tools.

---

## 📅 Work Log & Progress (Date-Wise)

### 🗓️ Latest Update (14 September 2026) — Client Revision & System Refinements
* **🗑️ Complete Removal of Legacy Time Record / Clock-in Flow**:
  - Dropped `time_records` table from MySQL database.
  - Deleted backend route `myTimeRoutes.ts` and removed endpoints `/api/my-time` and `/api/time-records`.
  - Deleted frontend `MyTime.tsx` and `timeService.ts`.
  - Cleaned navigation menu, dashboard quick actions, staff redirect rules, and permissions matrix. Staff login now defaults cleanly to `/schedules`.
* **💼 Employee Payroll Simplification (Yellow Markup Aligned)**:
  - Simplified table columns to: `EMPLOYEE`, `REGULAR RATE`, `HOLIDAY RATE`, `OTHER PAY`, `DEDUCTIONS`, and `NET PAY`.
  - Removed confusing and redundant columns (*Regular Hours, Regular Pay, Holiday Hours, Holiday Pay, Gross Pay*).
  - Fixed ISO date formatting bug — dates now display as `March 5, 2026` instead of raw UTC timestamp.
  - Aligned Excel export and JSON backup structures.
* **👥 Staff Roster & Active Management**:
  - Cleaned retired staff (`Miss Tiffany Robinson`, `Miss Shonee Simons`) and test entries.
  - Established 6 official staff members in default database seed: `Alesia Brangman`, `Global`, `SSH`, `Neli Outerbridge`, `Tyonika McGowan (Ty)`, `Tanuvi Patel`.
  - Implemented missing `DELETE /api/employees/:id` backend route and made frontend save/delete fully asynchronous. **Edit and Delete buttons now work reliably**.
* **📇 Customer Directory & Account Ledger Enhancements**:
  - Stripped duplicate `Phone: Phone:` text prefixes from telephone records.
  - Fixed column width distribution to remove excessive empty gaps between Phone and Email.
  - Implemented strict alphabetical **A-to-Z sorting** by default.
  - Added multi-page pagination controls (25 / 50 / 100 / 250 / All) and total counter for all 784 customers.
* **📊 General Ledger Fit Screen Optimization**:
  - Resolved `SOURCE` column cut-off on standard fit screens with horizontal scroll container and minimum width rules.
* **🔐 Permission Alignment**:
  - Updated Admin and Staff roles to match operational requirements.

---

## 🧪 Client Testing Guide (Step-by-Step)

Here is how you can verify each updated module in the system:

### 1. Test Employee Payroll (`/payroll`)
1. Navigate to **Payroll** from the sidebar.
2. Confirm the 6 columns displayed: `EMPLOYEE`, `REGULAR RATE`, `HOLIDAY RATE`, `OTHER PAY`, `DEDUCTIONS`, and `NET PAY`.
3. Confirm the Pay Date header displays a clean formatted date (e.g., `March 5, 2026`).
4. Edit rates or deductions in any row — verify that **Net Pay** updates instantly.
5. Click **Export to Excel** — verify the exported file contains the 6-column layout.

### 2. Test Staff Management (`/employees` & `/contacts`)
1. Navigate to **Employee Records** (`/employees`) or **Staff Contact Details (`/contacts`)**.
2. Verify the 6 official staff members are listed.
3. Click **Edit** on a staff member, update a phone number or role, and click **Save Employee** — confirm updates persist after page reload.
4. Click **Delete** on a test staff member — confirm the employee is deleted and does not reappear.

### 3. Test Customers & Account Ledgers (`/customers`)
1. Navigate to **Customers & Ledgers** from the sidebar.
2. Verify customer names are sorted **A-to-Z** alphabetically.
3. Verify phone numbers display cleanly without any `Phone: Phone:` text.
4. Verify there is no awkward wide gap between Phone and Email.
5. Use the **Per Page** dropdown to switch between 25, 50, 100, 250, or All customers.
6. Click any customer name to view their individual account ledger statement below.

### 4. Test General Ledger (`/general-ledger`)
1. Navigate to **General Ledger** from the sidebar.
2. Verify that the table displays all columns including `Debit`, `Credit`, and `SOURCE`.
3. Filter by year (e.g. `2025`) or transaction type (e.g. `Payment`) and click **Export Ledger to Excel**.

### 5. Test Staff Permissions (`/login`)
1. Log in with a Staff user account.
2. Verify that only **Weekly Schedules** and **Shift Notes** are visible in the navigation.
3. Confirm there are no payroll or invoice links visible.

---

## 💾 Data Persistence & Backup Policy
- **Primary Database**: MySQL Server (`payroll_db`) running on port `3307`.
- **System Settings Table**: `app_settings` table storing company profile, payment links, and payroll defaults in JSON format.
- **User Accounts Table**: `users` table storing administrative & staff logins, role assignments, passwords, and last login timestamps.
- **Backup Guidance**: Administrators can use the **Backup Payroll Data** button in Payroll or **Backup Data** in Settings to save JSON backups of all organization data.
