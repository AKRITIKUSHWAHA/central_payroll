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

### 2. Employee Records (`/employees`)
- Clean master contact directory matching prototype specifications.
- **Table Columns**:
  - **Employee**: Full display name with bold styling.
  - **Phone**: Formatted contact numbers (e.g. `Phone: 177-837-7831 Mobile: 177-837-7831`).
  - **Email**: Email address with direct `mailto:` links.
  - **Address**: Full physical / mailing address.
  - **Status**: Live green badge (`Active`) or red badge (`Inactive`).
  - **Actions**: Direct inline `Edit` and `Delete` action triggers.
- **Add / Edit Modal**: Add and modify employee contact details, status, roles, and pay rates.
- **Database Connectivity**: Real-time CRUD operations against MySQL `employees` table with instantaneous UI updates.


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

## 📅 Work Log & Progress (Date-Wise)

### 🗓️ Yesterday (10 September 2026) — Completed Work
* **📱 Mobile & Tablet Responsive Architecture**: Upgraded all payroll, scheduling, employee directory, and report interfaces to adapt seamlessly across smartphones, tablets, and desktop displays.
* **📌 Fixed Navigation Sidebar**: Enhanced the sidebar with independent scrolling and fixed headers/user profiles to optimize screen workspace usability.
* **🛡️ Live Database Audit Logging**: Integrated MySQL `audit_logs` tracking to monitor all critical administrative operations in real time.
* **⚙️ Production Environment Setup**: Implemented standard `.env` configuration for API routing.

---

### 🗓️ Today (12 September 2026) — Completed Work
* **🏢 Company Profile & Settings Database Persistence**: Connected System Settings (`/settings`) directly to MySQL `app_settings` table, ensuring Company Name, Bermuda Telephone, Office Address, Payroll Contact Email, and Overtime Threshold are permanently saved and loaded dynamically.
* **💳 RideBermuda Customer Payment Link Integration**: Integrated `https://ridebermuda-prod.web.app/paylink` across the system — accessible via Settings, top banner on Payments View (`/payments`) with instant copy/open actions, and embedded directly inside customer email invoices and printable invoice preview dialogues.
* **👥 Customers & Account Ledgers (`/customers`) Alignment**:
  - Rebuilt the customer directory to match the exact prototype layout with Dark Navy Header (`#102a43`), search bar (`Name, phone, email, address, note, or customer code`), status filter (`All customers`, `Active`, `Inactive`), and live count badge.
  - Formatted columns: `Customer` (name + alias), `Phone`, `Email`, `Billing Address`, `Customer Note`, `Status`, `Balance` (BMD currency), and stacked `Edit / Note` & `Delete` action buttons.
  - Linked directly to the customer ledger detail panel and full Add/Edit modal connected to MySQL database via `/api/customers-and-ledgers`.
* **📑 Payroll Reports (`/reports`) & Weekly Schedules (`/schedules`) Alignment**:
  - Rebuilt **Payroll Reports (`/reports`)** matching the prototype layout with 3 KPI Cards (`Processed Reports`, `Current Gross`, `Current Net`), `Export Current to Excel`, `Print Current Report`, and the `Payroll Report Archive` table.
  - **🏢 Company Info & Profile Sync (Bug Fix)**: Completely resolved company profile persistence across the application. Connected `SettingsView` (`/settings`), `InvoicesView` (`/invoices`), `PayslipsView` (`/payslips`), and `CustomersView` (`/customers`) to a centralized `companyService` backed by MySQL `app_settings` (`company_profile_settings`). Default company information updated to:
  - **Business Email**: `info@bermudaislandtaxi.com`
  - **Address**: `3 Laffan Street, Pembroke HM09`
  - **Phone**: `(441) 295-4141`
  - Any edits made in Settings now immediately update invoice document headers, email templates, and payslip letterheads.
  - Rebuilt **Central Dispatch Payroll (`/payroll`)**: Fully redesigned matching the prototype screenshot with Dark Navy top header, Setup Toolbar (`Pay Period Start`, `Pay Period End`, `Pay Date`, `Payroll Status`), 3 KPI Cards (`Total Hours`, `Gross Payroll`, `Total Payroll To Pay`), dynamic 5 base employee payroll table with automatic pay calculations, interactive toolbar (`Save Draft`, `Backup Payroll Data`, `Restore Backup` JSON loader, `Export to Excel`, `Print Report`, `Payslips`, `Process Pay`), disclaimer notice, and **Payroll History** table with database persistence.
  - Rebuilt **Employee Leave Calendars (`/leave`)**: Completely aligned with prototype screenshot featuring dual interactive Sick Time (`#a33b32`) and Holiday (`#24796f`) calendars, dynamic monthly grid generation, mutual-exclusivity date toggling, real-time date summary lists, integrated **Leave Note / Staff Record** sub-panel, and full end-to-end sync with MySQL `leave_records` and `staff_records` tables via Express REST APIs.
- **Staff Contact Details (`/contacts`) & Dynamic Staff Roster**:
  - Loaded all 8 initial staff members with complete real details (First & Last Name, Position, Status, Hire Date, Personal Phone, Work Phone `(441) 295-4141`, Work Email, Full Bermuda Address, Emergency Contact Name, Emergency Phone, and Relationship).
  - Fixed Tanuvi Patel's email from placeholder `t@gmail.com` to real work email `tanuvi.patel@centraldispatch.bm`.
  - Added `+ Add Staff Member` modal and endpoint (`POST /api/staff-contact-details` & `POST /api/employees`) allowing users to add unlimited additional staff members beyond the initial roster.
  - Added delete capability and real-time MySQL persistence for staff contact information and notes/sick/vacation history.
- **Weekly Schedules (`/schedules`) Multi-Staff Integration**:
  - Dynamically connected schedule roster to the MySQL employee master list, rendering all 8 staff members (`Ali Hamza`, `Alesia Brangman`, `Tyonika McGowan`, `Neli Outerbridge`, `SSH, SSH`, `Miss Shonee Simons`, `Miss Tiffany Robinson`, `Tanuvi Patel`) and any newly created staff members in the shift matrix.
- **Core Payroll Module (`/payroll`) Full Roster Synchronization**:
  - Auto-syncs all active staff members from the MySQL database into the active payroll draft table.
  - Automatically loads standard rates and computes Regular Pay, Holiday Pay, Other Pay, Deductions, Gross, and Net Payroll across the entire staff roster.
- **2024–2026 Historical Accounting Data Transfer & Flow Connection (Bug Fix)**:
  - Connected 1,927 General Ledger transactions, 784 customers, 59 customer invoices, and 58 customer payments from `ridebermuda-prod.web.app` into live frontend and MySQL database tables.
  - Resolved `BMD 0.00` issue on **Accounts Overview (`/accounts` / `/accounts-overview`)** and **A/R Aging (`/aging` / `/ar-aging`)**:
    - **Total Customers**: 784 (627 Active, 157 Inactive)
    - **Total Invoices**: 59 invoices ($23,705.04 total invoiced)
    - **Open Invoices**: 23 active unpaid invoices ($6,890.64 total accounts receivable)
    - **Total Payments Received**: $24,285.04 across 58+ payments
    - **A/R Aging Breakdown**:
      - Current: BMD 230.00
      - 1–30 Days: BMD 555.00
      - 31–60 Days: BMD 0.00
      - 61–90 Days: BMD 780.00
      - 90+ Days: BMD 5,325.64
      - **Total Aging**: **BMD 6,890.64**
  - Customer Accounts (`/customers`), Invoices (`/invoices`), Payments (`/payments`), and General Ledger (`/general-ledger`) now reflect live historical data synced with backend MySQL REST endpoints (`/api/accounts-overview`, `/api/ar-aging`, `/api/invoices`, `/api/payments`, `/api/customers`, `/api/general-ledger`).
- **🔐 Role Permissions Hierarchy Restructuring (Bug Fix / Feature Alignment)**:
  - **Super Administrator (Full System Authority)**:
    - Exclusive access to **Payroll Calculation & Approval** (`/payroll`, `/reports`, `/payslips`).
    - Exclusive access to **User Accounts & Role Management** (`/users`).
    - Exclusive access to **Permissions Administration** (`/permissions`).
    - Full access to Staff Management, Weekly Schedules, Leave, Customer Invoices, Payments, A/R Aging, General Ledger, Time Records, and Settings.
  - **Administrator (Operations & Customers)**:
    - **Payroll Calculation & Approval REMOVED** (Restricted strictly to Super Admin).
    - **Staff Management & Pay Rates MAINTAINED** (`/employees`, `/contacts` — view, add, edit staff & pay rates).
    - **Weekly Schedules & Leave Calendars MAINTAINED** (`/schedules`, `/leave`).
    - **Customer Invoices, Payments, Aging & General Ledger MAINTAINED** (`/accounts`, `/customers`, `/invoices`, `/payments`, `/aging`, `/ledger`).
    - **Time Records & Audit Trail MAINTAINED** (`/my-time`, `/reports/audit`).
    - **User Accounts & Permissions REMOVED** (Restricted strictly to Super Admin).
  - **Staff Member (Weekly Calendar & Shift Notes Only)**:
    - **View Weekly Shift Schedules** (`/schedules`) — Read-only weekly shift matrix.
    - **Weekly Schedule Notes** (`/schedules`) — Write, edit, and save operational shift notes.
    - **Clock-in / Clock-out REMOVED** per client directive.
    - Restricted from Payroll, Employee Rates, Customer Invoices, Ledgers, Permissions, and Settings.
  - Synchronized across frontend `Sidebar.tsx`, route guards in `App.tsx`, `PermissionsView.tsx`, `userService.ts`, and Express backend endpoints (`/api/permissions`).
- **🔐 Staff Password Self-Service Setup Link (`/set-password`)**:
  - Implemented a dedicated public **Set / Reset Password** portal (`/set-password`) accessible by staff members to establish or update their credentials independently.
  - Added a direct **"Set / Reset Password"** link on the main Login screen (`/login`).
  - Added a 1-click **"Copy Set Password Link"** action button in **User Accounts (`/users`)** so administrators can generate and share unique invitation links (e.g., `http://localhost:3000/set-password?username=tanuvi.patel`).
  - Backed by backend REST endpoint `POST /api/user-accounts/set-password` with MySQL database updates and live audit logging (`PASSWORD_RESET_SELF_SERVICE`).
- **💳 Payment Link Integration & Dynamic URL Configuration**:
  - Integrated `https://ridebermuda-prod.web.app/paylink` as the active payment portal with copy and open actions on **Payments (`/payments`)** and **Customer Invoices (`/invoices`)**.
  - Built a dynamic URL override mechanism in **System Settings (`/settings`)** and invoice dispatch so Central Dispatch can seamlessly switch payment gateways (e.g. Stripe, Bermuda Gateway) or update URLs in the future without code changes.
  - *Client Confirmation Required*: Awaiting client decision on whether to continue with legacy URL (`ridebermuda-prod.web.app/paylink`) or provision a dedicated custom gateway/domain for the new platform.
- **📧 Customer Invoice Email Dispatch System (`/invoices`)**:
  - Added an interactive **Email Invoice to Customer Modal** directly inside the Customer Invoices module.
  - Automatically matches and pre-populates the verified recipient email address from the customer master database.
  - Generates a branded email subject (`Invoice {number} from Central Dispatch`) and itemized breakdown with amounts due, dates, payment terms, and direct payment link.
  - Supports dual dispatch methods: **Send via Server API (`POST /api/email/send-invoice`)** with automatic audit trail recording, and **Open in Default Mail Client (`mailto:`)** for instant review before sending.
- **📱 Comprehensive Mobile Responsive Optimization (Portrait 375px–430px & Tablets)**:
  - **Off-canvas Sidebar Navigation Drawer**: Sidebar collapses off-canvas with hamburger menu trigger, backdrop overlay, and close button on mobile (< 768px). Desktop layout (> 768px) remains identical.
  - **Horizontal Table Scroll Isolation & Mobile Affordance Indicators**: Added `.table-responsive-container` and visible mobile scroll hints (`👉 Swipe table to view...`) to all wide tables (Payroll 12 columns, Weekly Schedules 7 days, A/R Aging 8 columns, Customer Directory 8 columns, Customer Ledger 7 columns, Staff Contacts Directory). Root layout is locked to prevent full-page horizontal swaying.
  - **Stacked Mobile Forms & 44px Touch Targets**: Multi-column forms (Staff Contact Details, Create User, Leave Records, Payroll Setup, Company Profile) automatically stack into 1 column on portrait screens. Inputs, selects, and buttons have touch-friendly tap targets (`min-height: 42px/40px`).
  - **Action Toolbar Wrapping**: Button toolbars (Payroll actions, Weekly schedule actions, Reports export) use fluid flex-wrap to prevent clipping on 375px screens.
- **TypeScript Verification**: Zero compilation errors across frontend and backend.

---

## 💾 Data Persistence & Backup Policy
- **Primary Database**: MySQL Server (`payroll_db`) running on port `3307`.
- **System Settings Table**: `app_settings` table storing company profile, payment links, and payroll defaults in JSON format.
- **User Accounts Table**: `users` table storing administrative & staff logins, role assignments, passwords, and last login timestamps.
- **Fallback / Local Cache**: Browser LocalStorage for instant offline availability.
- **Backup Guidance**: Administrators should regularly use the **Backup Data** tool in Settings to save JSON backups of all organization data.

