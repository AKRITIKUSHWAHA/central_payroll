CENTRAL DISPATCH PAYROLL & ACCOUNTS — PROPER WINDOWS SETUP

WHAT THIS PACKAGE DOES
This installs Central Dispatch Payroll into a permanent Windows application folder instead of running it from Downloads or from inside a ZIP.
The main HTML app is self-contained, including the imported customer and ledger data.

WHAT IS INCLUDED
- Existing weekly payroll, payslips, schedules, leave, staff notes, time clock, and user access
- Easy home page with grouped shortcuts to every customer, payroll, report, and administration screen
- 782 alphabetical customer records consolidated from 855 source rows
- 7 imported employee contact records
- 1,927 dated general-ledger transactions
- Customer invoices and payment recording
- Multi-line invoices with customer dropdown, automatic totals, preview, print/PDF, and prepared email
- Customer account ledgers and running balances
- Add, edit, activate, deactivate, or delete customer and employee contact records
- Customer-ledger shortcuts for creating invoices, recording payments, editing details, and preparing a ledger email
- Customer notes that can be added, edited, searched, and viewed in the customer list
- Paid/Owing invoice status with email wording prepared for either an outstanding invoice or a paid-in-full invoice
- Accounts-receivable aging by due date
- Excel exports for customers, aging, and the complete general ledger
- Complete app backup and restore from the Accounts Overview page
- Source_Data folder containing the three original Excel files used for this import

IMPORTANT PAYMENT NOTE
"Record Payment" records money that Central Dispatch has already received. It does not charge a customer's card or transfer funds through a bank. A separate payment-provider connection would be required for online card processing.

EMAILING INVOICES
The Email Invoice button opens the computer's normal email program with the customer's saved email address and the invoice details prepared. The invoice displays info@bermudaislandtaxi.com as the business email. The local app cannot send mail silently or force the sending mailbox without a separate email-server connection.

RECORD SAFETY
Customers with saved invoices or payments cannot be deleted because that would break their account history. Edit the customer and set Status to Inactive instead. Records without activity can be deleted after confirmation.

INSTALL
1. Download this ZIP.
2. Right-click the ZIP and choose Extract All.
3. Open the extracted folder.
4. Double-click INSTALL.cmd.
5. Windows may ask whether PowerShell is allowed to run. Allow it.
6. After installation, use the new "Central Dispatch Payroll" icon on your Desktop or Start Menu.

WHERE YOUR APP LIVES
%LOCALAPPDATA%\CentralDispatchPayroll

The folder contains:
- App: the installed payroll and accounting application
- UserData: the dedicated Edge/Chrome app profile that holds local payroll and accounting data
- Backups: copies made by the backup script

WEEKLY USE
- Open only the Desktop/Start Menu shortcut.
- Enter payroll and schedules during the week.
- Create customer invoices and record payments received.
- Review customer ledgers, balances, aging, and the general ledger.
- Export/print the weekly reports you need.
- At the end of each payroll week, run BACKUP_DATA.ps1 from:
  %LOCALAPPDATA%\CentralDispatchPayroll

BACKUP
Close the payroll app first, then right-click BACKUP_DATA.ps1 and choose Run with PowerShell.
A timestamped copy is stored under the Backups folder.

RESTORE
Use RESTORE_LATEST_BACKUP.ps1 only if you need to recover the latest saved copy.
Close the payroll app first.

UPDATES
When ChatGPT gives you a newer app package, keep its HTML, CSS, JavaScript, and imported-data files together. Use UPDATE_APP.ps1 and select the new Central_Dispatch_Payroll_App.html. The updater also copies the companion accounting files while preserving the dedicated UserData folder.

IMPORTANT SECURITY NOTE
This version is designed for stable use on one Windows computer.
The Super Admin/Admin/Staff login is local to that computer. For several people signing in securely from different computers or phones, the next step is a server/database-backed version with real authentication and centralized data.
