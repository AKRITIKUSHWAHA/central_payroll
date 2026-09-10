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

### 7. `audit_logs` Table
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(100) NOT NULL,
  user VARCHAR(100) NOT NULL,
  role VARCHAR(100) NOT NULL,
  timestamp VARCHAR(100) NOT NULL,
  details TEXT,
  ipAddress VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 📡 API Endpoint Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user with username & password |
| `GET` | `/api/employees` | Fetch all employees from MySQL `employees` table |
| `POST` | `/api/employees` | Create or update an employee in MySQL |
| `PATCH` | `/api/employees/:id/toggle` | Toggle employee Active/Inactive status |
| `GET` | `/api/payroll` | Fetch all payroll periods |
| `PUT` | `/api/payroll/:id/items` | Save items and upsert payroll period in MySQL |
| `PATCH` | `/api/payroll/:id/status` | Update period status (`Draft` -> `Paid`) |
| `GET` | `/api/leave` | Fetch all leave records |
| `PUT` | `/api/leave/employee/:employeeId` | Sync employee leaves in `leave_records` table |
| `GET` | `/api/schedules` | Fetch weekly shift schedules |
| `POST` | `/api/schedules` | Save schedule matrix row into `schedules` table |
| `GET` | `/api/users` | Fetch user accounts |
| `POST` | `/api/users` | Create/update user account |
| `PATCH` | `/api/users/:id/toggle` | Toggle user account Active/Inactive status |

---

## 🔍 Key Guidelines & Rules
1. **Zero-Handling on Input Elements**:
   Use `value={field === 0 ? '' : field}` on numerical inputs to prevent persistent leading zeros.
2. **Auto-Upsert Safety**:
   Backend endpoints auto-create missing records if they do not exist in MySQL yet, preventing 404 response errors.
3. **Verification**:
   Always run `npx tsc --noEmit` in `frontend` directory to ensure strict TypeScript type checking before pushing to Git.
