# Central Dispatch Payroll System — AI Developer Guide

## 🏗️ System Architecture Overview
The **Central Dispatch Payroll System** is built as a full-stack web application with a decoupled architecture:
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons.
- **Backend**: Node.js + Express + MySQL (`mysql2/promise` pool) + JSON Fallback.
- **Database**: MySQL database named `payroll_db` on `127.0.0.1:3307` (or configured via `.env`).

```
+-------------------------------------------------------------+
|                      React 18 Frontend                      |
| (Vite Dev Server :3000 / Pages / Components / Context API)  |
+------------------------------+------------------------------+
                               | REST API (apiFetch)
+------------------------------v------------------------------+
|                     Express Node Backend                    |
|                (Server :5000 / Router API)                  |
+------------------------------+------------------------------+
                               | mysql2 Pool
+------------------------------v------------------------------+
|                      MySQL Database                         |
|                 (database: payroll_db)                      |
+-------------------------------------------------------------+
```

---

## 💻 Tech Stack & Key Libraries
- **Language**: TypeScript (Strict typing enabled across Frontend & Backend).
- **Styling**: Tailwind CSS with custom color tokens (`#12345b`, `#3157d4`, `#0f766e`, `#edf4fa`).
- **Icons**: `lucide-react`.
- **Charts**: `recharts` (BarChart & PieChart).
- **Database Driver**: `mysql2/promise`.
- **State Management**: React Context (`AuthContext`, `ToastContext`) + LocalStorage caching.

---

## 🗄️ Database Schema (`payroll_db`)

### 1. `users` Table
```sql
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  displayName VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password VARCHAR(255),
  role ENUM('superadmin', 'admin', 'staff') NOT NULL DEFAULT 'staff',
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  lastLogin VARCHAR(100),
  createdAt DATE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2. `employees` Table
```sql
CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR(50) PRIMARY KEY,
  employeeId VARCHAR(50) NOT NULL UNIQUE,
  firstName VARCHAR(100) NOT NULL,
  middleInitial VARCHAR(10),
  lastName VARCHAR(100) NOT NULL,
  displayName VARCHAR(200) NOT NULL,
  position VARCHAR(150) NOT NULL,
  department VARCHAR(150) NOT NULL,
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  employmentType ENUM('Full-Time', 'Part-Time', 'Contract') NOT NULL DEFAULT 'Full-Time',
  payType ENUM('Hourly', 'Salaried') NOT NULL DEFAULT 'Hourly',
  payRate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  holidayRate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  startDate DATE,
  dateOfBirth DATE,
  personalPhone VARCHAR(50),
  workPhone VARCHAR(50),
  email VARCHAR(150),
  address TEXT,
  emergencyContactName VARCHAR(150),
  emergencyContactPhone VARCHAR(50),
  emergencyContactRelation VARCHAR(50),
  paymentMethod ENUM('Direct Deposit', 'Check', 'Cash') DEFAULT 'Direct Deposit',
  bankName VARCHAR(150),
  bankAccountMasked VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 3. `payroll_periods` Table
```sql
CREATE TABLE IF NOT EXISTS payroll_periods (
  id VARCHAR(50) PRIMARY KEY,
  periodStart DATE NOT NULL,
  periodEnd DATE NOT NULL,
  payDate DATE NOT NULL,
  status ENUM('Draft', 'Calculated', 'Approved', 'Paid', 'Archived') NOT NULL DEFAULT 'Draft',
  totalHours DECIMAL(10,2) DEFAULT 0.00,
  totalGrossPayroll DECIMAL(12,2) DEFAULT 0.00,
  totalDeductions DECIMAL(12,2) DEFAULT 0.00,
  totalNetPayroll DECIMAL(12,2) DEFAULT 0.00,
  createdBy VARCHAR(100),
  createdAt VARCHAR(100),
  approvedBy VARCHAR(100),
  approvedAt VARCHAR(100),
  paidAt VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 4. `employee_payroll_items` Table
```sql
CREATE TABLE IF NOT EXISTS employee_payroll_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  periodId VARCHAR(50) NOT NULL,
  employeeId VARCHAR(50) NOT NULL,
  employeeName VARCHAR(200) NOT NULL,
  position VARCHAR(150),
  department VARCHAR(150),
  regularRate DECIMAL(10,2) DEFAULT 0.00,
  regularHours DECIMAL(10,2) DEFAULT 0.00,
  regularPay DECIMAL(10,2) DEFAULT 0.00,
  holidayRate DECIMAL(10,2) DEFAULT 0.00,
  holidayHours DECIMAL(10,2) DEFAULT 0.00,
  holidayPay DECIMAL(10,2) DEFAULT 0.00,
  otherPay DECIMAL(10,2) DEFAULT 0.00,
  otherPayNotes TEXT,
  deductions DECIMAL(10,2) DEFAULT 0.00,
  deductionNotes TEXT,
  totalHours DECIMAL(10,2) DEFAULT 0.00,
  grossPay DECIMAL(10,2) DEFAULT 0.00,
  netPay DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('Ready', 'Incomplete', 'Paid') DEFAULT 'Ready',
  FOREIGN KEY (periodId) REFERENCES payroll_periods(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 5. `leave_records` Table
```sql
CREATE TABLE IF NOT EXISTS leave_records (
  id VARCHAR(50) PRIMARY KEY,
  employeeId VARCHAR(50) NOT NULL,
  employeeName VARCHAR(200) NOT NULL,
  leaveType ENUM('Vacation', 'Sick', 'Personal', 'Holiday', 'Other') NOT NULL DEFAULT 'Vacation',
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  daysCount INT DEFAULT 1,
  status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  notes TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 6. `schedules` Table
```sql
CREATE TABLE IF NOT EXISTS schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employeeId VARCHAR(50) NOT NULL,
  weekStartDate DATE NOT NULL,
  shiftsJson JSON,
  totalHours DECIMAL(10,2) DEFAULT 0.00,
  UNIQUE KEY unique_emp_week (employeeId, weekStartDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 7. `app_settings` Table
```sql
CREATE TABLE IF NOT EXISTS app_settings (
  settingKey VARCHAR(100) PRIMARY KEY,
  settingValue LONGTEXT,
  updatedAt VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 📡 Menu-Specific API Endpoint Reference

| # | Category | Sidebar Menu Name | Frontend Route | Backend API Endpoint | Description |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **WORKSPACE** | **Dashboard** | `/dashboard` | `/api/dashboard` | Dashboard KPI summary, employee stats, charts & active status |
| **2** | **WORKSPACE** | **Payroll** | `/payroll` | `/api/payroll` | 6-Column weekly payroll computation, rate editing & Net Pay calculation |
| **3** | **WORKSPACE** | **Leave Calendars** | `/leave` | `/api/leave` | Dual-calendar sick/vacation leave records & persistence |
| **4** | **WORKSPACE** | **Staff Contact Details** | `/contacts` | `/api/staff-contact-details` | 6-Staff phone & email directory with working edit/delete |
| **5** | **WORKSPACE** | **Weekly Schedules** | `/schedules` | `/api/schedules` | Duty shift rotas, weekly hours, & shift notes |
| **6** | **WORKSPACE** | **Payroll Reports** | `/reports` | `/api/reports` | Summary reports & historical payroll archive |
| **7** | **WORKSPACE** | **Payslips** | `/payslips` | `/api/payslips` | Printable salary pay slips for individual employees |
| **8** | **CUSTOMERS & ACCOUNTS** | **Accounts Overview** | `/accounts` | `/api/accounts-overview` | Financial KPIs, complete backup & restore utilities |
| **9** | **CUSTOMERS & ACCOUNTS** | **Customers & Ledgers** | `/customers` | `/api/customers-and-ledgers` | 784 Customers directory, A-to-Z sorting, pagination & ledger statements |
| **10** | **CUSTOMERS & ACCOUNTS** | **Create Invoice** | `/invoices` | `/api/create-invoice` | Multi-line customer invoicing, email dispatch & pay link |
| **11** | **CUSTOMERS & ACCOUNTS** | **Record Payment** | `/payments` | `/api/record-payment` | Customer payments, RideBermuda pay link & ledger balance |
| **12** | **CUSTOMERS & ACCOUNTS** | **A/R Aging** | `/aging` | `/api/ar-aging` | Receivables aging breakdown (Current, 1-30, 31-60, 61-90, 90+) |
| **13** | **CUSTOMERS & ACCOUNTS** | **General Ledger** | `/general-ledger` | `/api/general-ledger` | 1,927+ Consolidated general ledger transactions with export & fit layout |
| **14** | **CUSTOMERS & ACCOUNTS** | **Employee Records** | `/employees` | `/api/employees` | Master staff directory, 6 active staff, real-time edit & delete |
| **15** | **CUSTOMERS & ACCOUNTS** | **Permissions** | `/permissions` | `/api/permissions` | Role-based permission matrix (Super Admin, Admin, Staff) |
| **16** | **CUSTOMERS & ACCOUNTS** | **User Accounts** | `/users` | `/api/user-accounts` | Admin & staff login accounts, 3-dot action menu |

---

## 📅 Development Timeline & Revision History

### ✅ Completed: 14 September 2026 (Client Revision & Cleanup)
1. **Time Record / Clock-in Removal**:
   - Dropped `time_records` DB table and removed `/api/my-time` & `/api/time-records` endpoints.
   - Removed `MyTime.tsx` page, `timeService.ts`, and all clock-in references from UI and permissions.
2. **Simplified Payroll Console (`/payroll`)**:
   - Implemented streamlined 6-column structure matching yellow markup: `EMPLOYEE`, `REGULAR RATE`, `HOLIDAY RATE`, `OTHER PAY`, `DEDUCTIONS`, `NET PAY`.
   - Removed redundant hours and gross columns.
   - Formatted ISO date strings to human-readable format.
3. **Staff Roster Cleanup & CRUD Fix (`/employees`, `/contacts`)**:
   - Removed retired staff (`Tiffany Robinson`, `Shonee Simons`) and test accounts.
   - Confirmed 6 official staff members in DB seed.
   - Fixed `DELETE /api/employees/:id` endpoint and made edit/delete fully functional.
4. **Customers & Ledgers Optimization (`/customers`)**:
   - Cleaned duplicate `Phone: Phone:` string prefix.
   - Eliminated wide gap between Phone & Email by setting explicit column widths.
   - Enabled strict A-to-Z alphabetical sorting and added pagination controls for 784 customers.
5. **General Ledger Layout (`/general-ledger`)**:
   - Resolved `SOURCE` column cut-off on standard screen resolutions.
6. **Git Synchronization**:
   - Changes committed and pushed to `https://github.com/AKRITIKUSHWAHA/central_payroll.git` (main).

---

## 🔍 Key Guidelines & Rules
1. **Zero-Handling on Input Elements**:
   Use `value={field === 0 ? '' : field}` on numerical inputs to prevent persistent leading zeros.
2. **Auto-Upsert Safety**:
   Backend endpoints auto-create missing records if they do not exist in MySQL yet, preventing 404 response errors.
3. **Verification**:
   Always run `npx tsc --noEmit` in `frontend` and `backend` directories to ensure strict TypeScript type checking before pushing to Git.
