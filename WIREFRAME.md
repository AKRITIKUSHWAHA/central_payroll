# Central Dispatch Payroll System — Wireframes & UI Specifications

## 📐 Layout Architecture Overview (`AppLayout.tsx`)
The application features a responsive 2-column dashboard layout with persistent navigation and active top indicator bar.

```
+-----------------------------------------------------------------------------------+
|  [▶ Central Dispatch]   [📅 Thursday, 10 Sept 2026] [🟢 Bermuda Active]   [Profile] |  <-- Top Header
+-----------------------+-----------------------------------------------------------+
| WORKSPACE             |                                                           |
| 📊 Dashboard          |                                                           |
| 👥 Employees          |                    PAGE CONTENT VIEW                      |
| 💰 Payroll            |           (Dashboard / Payroll Console / Leaves /         |
| 📅 Leave Calendars    |             Schedules / Contacts / Reports)               |
| 📞 Staff Contacts     |                                                           |
| 🗓️ Weekly Schedules   |                                                           |
| 📄 Payroll Reports    |                                                           |
| 📑 Audit Reports      |                                                           |
|                       |                                                           |
| ADMINISTRATION        |                                                           |
| 🛡️ Permissions        |                                                           |
| 👤 User Accounts      |                                                           |
| ⚙️ Settings           |                                                           |
|                       |                                                           |
| [🚪 Sign Out]         |                                                           |
+-----------------------+-----------------------------------------------------------+
```

---

## 🖼️ Screen Wireframe Specifications

### 1. Login Page (`/login`)
- **Header**: Central Dispatch Payroll Logo & Title.
- **Card**: Glassmorphism dark/navy themed card with Username & Password fields.
- **Action**: "Sign In to Payroll Console" primary button.
- **Footer**: Password reset helper text & Bermuda System Active indicator.

```
+----------------------------------------------------+
|               Central Dispatch Payroll             |
|                                                    |
|  Username: [ superadmin                          ] |
|  Password: [ •••••••••••••                       ] |
|                                                    |
|        [  Sign In to Payroll Console  ]            |
+----------------------------------------------------+
```

---

### 2. Dashboard (`/dashboard`)
- **Top Greeting Banner**: "Hello, Super Admin — It's Thursday, 10 Sept 2026."
- **4 Stat Cards (KPI Row)**:
  1. **Employees**: Active Count Card (Blue Filled).
  2. **Total Hours**: Total working hours (`min-w-0 overflow-hidden`).
  3. **Gross Payroll**: Total Gross Payroll ($) with `tabular-nums truncate`.
  4. **Payroll To Pay**: Total Net Payroll ($) with `tabular-nums truncate`.
- **Middle Section**:
  - Left: Bar Chart — Payroll by Employee.
  - Right: Ring Chart — Staff Leave Breakdown (Sick vs Vacation).
- **Bottom Section**:
  - Left: Weekly Staff Schedule Summary Table.
  - Right: Workspace Quick Summary (Payroll status, staff record count).

---

### 3. Employee Directory (`/employees`)
- **Header**: Employee Directory title + "+ Add New Staff Member" CTA button.
- **Filters**: Search Bar (Name/Position), Department Dropdown Filter, Active/Inactive Toggle Filter.
- **Data Table**:
  - Columns: Employee ID, Full Name, Department / Position, Pay Rate ($/hr), Holiday Rate, Status (`Active`/`Inactive`), Actions (View Profile, Toggle Status).
- **Add Staff Modal**:
  - Tab 1: Basic Info
  - Tab 2: Employment & Rates
  - Tab 3: Contact & Address
  - Tab 4: Emergency Contact
  - Tab 5: Bank & Direct Deposit
  - Action: "Save Staff Member" button.

---

### 4. Employee Profile (`/employees/:id`)
- **Header**: Employee Name, Employee ID badge, Edit button, Back button.
- **Left Column**: Avatar card, Position, Department, Active/Inactive status badge, Contact numbers.
- **Right Column**: Detailed Tabs:
  - Personal Information (DOB YYYY-MM-DD, Address, Emergency Contact).
  - Employment Details (Start Date, Employment Type, Pay Type, Base Rate, Holiday Rate).
  - Banking Details (Payment Method, Bank Name, Masked Account Number).

---

### 5. Payroll Console (`/payroll`)
- **Top Banner**: "Central Dispatch Payroll — Weekly Payroll (Thursday through Wednesday)" + Draft Badge.
- **Setup Panel**: Date selectors (Pay Period Start, Pay Period End, Pay Date) & Status Dropdown (`Draft`, `Calculated`, `Approved`, `Paid`).
- **KPI Summary Cards**: Total Hours, Gross Payroll ($), Total Payroll To Pay ($).
- **Main Interactive Payroll Table**:
  - Columns: Employee, Regular Rate ($ - Input), Regular Hours (Input), Regular Pay ($), Holiday Rate ($ - Input), Holiday Hours (Input), Holiday Pay ($), Other Pay ($ - Input), Deductions / Tax ($ - Input), Total Hours, Gross Pay ($), Net Pay ($).
- **Action Bar**:
  - `[ 💾 Save Draft ]` `[ 📄 Export to Excel ]` `[ 🖨️ Print Report ]` `[ 📊 Payslips ]` `[ 🟢 Process Pay ]`

---

### 6. Leave Calendars (`/leave`)
- **Header**: Employee Leave Calendars title + `[ 💾 Save Leave Records ]` CTA button.
- **Tools Row**: Employee Select Dropdown & Calendar Month Picker.
- **Dual-Calendar Grid**:
  - Left: **Sick Time Calendar** (Red header `#a33b32` with clickable days 1-30).
  - Right: **Holiday Calendar** (Green header `#24796f` with clickable days 1-30).
- **Recorded Dates Summary**: Bottom boxes listing recorded Sick dates & Vacation dates.
- **Save Trigger**: Clicking `Save Leave Records` button triggers `PUT /api/leave/employee/:id` to save into MySQL table `leave_records` and displays success toast notification.

---

### 7. Staff Contact Details (`/contacts`)
- **Header**: Staff Contact Directory title + search bar.
- **Grid Layout**: Employee contact cards showing Work Extension, Personal Phone, Email Address, Emergency Contact Name & Phone with quick action links.

---

### 8. Weekly Schedules (`/schedules`)
- **Header**: Weekly Staff Schedule title + `[ 💾 Save Schedule ]` `[ 🗑️ Clear Week ]`.
- **Tools Row**: Week Start date & Week End date selectors.
- **Shift Matrix Table**:
  - Columns: Employee Name, Mon, Tue, Wed, Thu, Fri, Sat, Sun, Total Row Hours.
  - Cell Inputs: Text boxes accepting shift codes (e.g., `8-4`, `OFF`, `10`).
- **Notes Panel**: Textarea for weekly shift reminders & manager instructions + `Save Note` button.
- **Save Trigger**: Clicking `Save Schedule` saves matrix entries into MySQL table `schedules`.

---

### 9. Payroll Reports (`/reports`)
- Date Range filter, Status Filter, Department Filter.
- Summary table listing past payroll periods with Total Hours, Gross Amount, Deductions, and Net Pay.
- CSV/Excel Export & Print actions.

---

### 10. Audit Reports (`/reports/audit`)
- Table displaying system security log entries: Action, Module, User, Role, Timestamp, and Details.

---

### 11. Payslips View (`/payslips`)
- Employee Selector + Pay Period Selector.
- Printable Official Pay Stub Card displaying Company Header, Employee Info, Earnings Breakdown (Regular, Holiday, Other Pay), Deductions (Bermuda Tax), Net Pay, and Signature line.

---

### 12. User Accounts (`/users`)
- Header: User Accounts Management + "+ Create New User" CTA button.
- Table: Username, Display Name, Email, Role (`Super Admin`, `Admin`, `Staff`), Status (`Active`/`Inactive`), Last Login, Toggle Status Switch.
- Modal: Form to create user accounts with username, display name, email, password, and role.

---

### 13. Permissions (`/permissions`)
- Matrix table showing modules across roles with interactive checkbox toggles for View / Edit privileges.

---

### 14. Settings (`/settings`)
- Organization Name, Currency, Pay Cycle frequency, Backup Database button (downloads JSON), Restore Database tool.
