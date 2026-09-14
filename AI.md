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

### 8. `time_records` Table
```sql
CREATE TABLE IF NOT EXISTS time_records (
  id VARCHAR(50) PRIMARY KEY,
  userId VARCHAR(50) NOT NULL,
  employeeId VARCHAR(50),
  employeeName VARCHAR(200) NOT NULL,
  clockIn VARCHAR(100) NOT NULL,
  clockOut VARCHAR(100),
  totalHours DECIMAL(6,2) DEFAULT 0.00,
  status ENUM('ClockedIn', 'ClockedOut') NOT NULL DEFAULT 'ClockedIn',
  notes TEXT,
  createdAt VARCHAR(100),
  INDEX idx_user_time (userId),
  INDEX idx_emp_time (employeeId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 9. `app_settings` Table
```sql
CREATE TABLE IF NOT EXISTS app_settings (
  settingKey VARCHAR(100) PRIMARY KEY,
  settingValue LONGTEXT,
  updatedAt VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 📡 Menu-Specific API Endpoint Reference (Exact Match with Prototype)

| # | Category | Sidebar Menu Name | Frontend Route | Backend API Endpoint | Description |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **WORKSPACE** | **Dashboard** | `/dashboard` | `/api/dashboard` | Dashboard KPI summary, employee stats, charts & customer list |
| **2** | **WORKSPACE** | **Payroll** | `/payroll` | `/api/payroll` | Weekly payroll computation, calculations & salary processing |
| **3** | **WORKSPACE** | **Leave Calendars** | `/leave` | `/api/leave` | Dual-calendar sick/vacation leave records & persistence |
| **4** | **WORKSPACE** | **Staff Contact Details** | `/contacts` | `/api/contacts` | Phone & email contact directory with quick call/email links |
| **5** | **WORKSPACE** | **Weekly Schedules** | `/schedules` | `/api/schedules` | Duty shift rotas, weekly hours, & staff time clock |
| **6** | **WORKSPACE** | **Payroll Reports** | `/reports` | `/api/reports` | 8-Report types summary & historical payroll archive |
| **7** | **WORKSPACE** | **Payslips** | `/payslips` | `/api/payslips` | Printable salary pay slips for individual employees |
| **8** | **CUSTOMERS & ACCOUNTS** | **Accounts Overview** | `/accounts` | `/api/accounts` | Financial KPIs, complete backup & restore utilities |
| **9** | **CUSTOMERS & ACCOUNTS** | **Customers & Ledgers** | `/customers` | `/api/customers` | 782 Customers directory, calendar date filter, ledger cards |
| **10** | **CUSTOMERS & ACCOUNTS** | **Create Invoice** | `/invoices` | `/api/invoices` | Multi-line customer invoicing, email dispatch & pay link |
| **11** | **CUSTOMERS & ACCOUNTS** | **Record Payment** | `/payments` | `/api/payments` | Customer payments, RideBermuda pay link & ledger balance |
| **12** | **CUSTOMERS & ACCOUNTS** | **A/R Aging** | `/aging` | `/api/aging` | Receivables aging breakdown (Current, 1-30, 31-60, 61-90, 90+) |
| **13** | **CUSTOMERS & ACCOUNTS** | **General Ledger** | `/ledger` | `/api/ledger` | 1,927+ Consolidated general ledger transactions with export |
| **14** | **CUSTOMERS & ACCOUNTS** | **Employee Records** | `/employees` | `/api/employees` | Master staff directory, 5-part registration & pay rates |
| **15** | **CUSTOMERS & ACCOUNTS** | **Permissions** | `/permissions` | `/api/permissions` | Role-based permission matrix (Super Admin only) |
| **16** | **CUSTOMERS & ACCOUNTS** | **User Accounts** | `/users` | `/api/users` | Admin & staff login accounts, 3-dot action menu |

---

## 📅 Development Timeline & Work Log (Date-Wise)

### ✅ Completed: 10 September 2026
1. **Responsive Mobile/Tablet Optimization**: Responsive layouts across desktop, tablet, and mobile with off-canvas navigation.
2. **Sidebar Layout & Viewport Lock**: Fixed sidebar positioning with independent internal scroll.
3. **Audit Logging MySQL Integration**: Created and wired `audit_logs` table.
4. **Environment Configuration**: Configured `.env` and `.env.example`.

---

### ✅ Completed: 11 September 2026 (Customer Accounts & Ledger Integration)
1. **Database Schema & Data Import**: Seeded 782 Customers and 1,927 General Ledger entries in MySQL.
2. **Frontend UI Components**: Dashboard launcher, Accounts Overview, Invoices, Payments, A/R Aging, and General Ledger.
3. **Navigation & Routes**: Added Customers & Accounts section in sidebar.

---

### ✅ Completed: 12 September 2026 (Company Settings, Payment Links, Staff Password Change & Security)
1. **Company Profile & Settings MySQL Persistence (`app_settings` table)**:
   - Wired `GET /api/settings` and `POST /api/settings` directly to MySQL `app_settings` table.
   - Company Name, Bermuda Telephone, Office Address, Payroll Contact Email, and Overtime Threshold are dynamically persisted and loaded across reloads.
2. **RideBermuda Customer Payment Link (`https://ridebermuda-prod.web.app/paylink`)**:
   - Integrated into System Settings (`/settings`) with instant testing capability.
   - Added prominent header card on Payments View (`/payments`) with quick "Copy Link" and "Open Link" buttons.
   - Embedded directly into generated customer email bodies and printable invoice preview dialogues in Invoices View (`/invoices`).
3. **Staff Self-Service Password Management & User Accounts Directory (`/users`)**:
   - Built global `ChangePasswordModal` accessible from Topbar and Sidebar for all users (Staff, Admin, Super Admin).
   - Created backend API `POST /api/user-accounts/change-password` that updates password hashes directly in MySQL `users` table.
   - Redesigned User Accounts screen with quick statistics pills, 4:8 responsive split, live search filter, and a sleek **3-Dots Actions Menu** (`Copy Login Link & Details`, `Reset Password`, `Activate / Deactivate Account`).
4. **Customer Date Filter & Added Date Column (`/customers`)**:
   - Implemented single Calendar Date Picker to instantly locate customers added on any chosen date.
   - Added "Added Date" column displaying timestamp of creation.
5. **Role-Based Security & Redirection Rules**:
   - Enforced strict `SuperAdminRoute` guarding for `/permissions` and `/users`.
   - Routing: Unauthenticated -> `/login`, Staff -> `/my-time`, Admin/SuperAdmin -> `/dashboard`.

---

## 🔍 Key Guidelines & Rules
1. **Zero-Handling on Input Elements**:
   Use `value={field === 0 ? '' : field}` on numerical inputs to prevent persistent leading zeros.
2. **Auto-Upsert Safety**:
   Backend endpoints auto-create missing records if they do not exist in MySQL yet, preventing 404 response errors.
3. **Verification**:
   Always run `npx tsc --noEmit` in `frontend` and `backend` directories to ensure strict TypeScript type checking before pushing to Git.

