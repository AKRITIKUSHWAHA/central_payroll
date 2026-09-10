import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeService } from '../services/employeeService';
import { leaveService } from '../services/leaveService';
import { payrollService } from '../services/payrollService';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Lock, Unlock, User, Phone, Mail, DollarSign, Calendar, FileText, Building, CreditCard } from 'lucide-react';

export const EmployeeProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const employee = employeeService.getEmployeeById(id || '') || employeeService.getEmployees()[0];
  const leaves = leaveService.getLeavesByEmployee(employee?.id || employee?.employeeId || '');
  const payrolls = payrollService.getPayrollPeriods();

  const [activeTab, setActiveTab] = useState<'Overview' | 'Personal' | 'Contact' | 'Employment' | 'Payroll' | 'Schedule' | 'Leave' | 'Payslips'>('Overview');
  const [showSensitive, setShowSensitive] = useState(false);

  if (!employee) {
    return (
      <div className="p-8 text-center text-[#607286]">
        Employee record not found.
      </div>
    );
  }

  const tabs = ['Overview', 'Personal', 'Contact', 'Employment', 'Payroll', 'Schedule', 'Leave', 'Payslips'] as const;

  return (
    <div className="space-y-6">
      {/* Back button & Header Banner */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/employees')}
          className="px-3.5 py-1.5 bg-white border border-[#dde7f0] hover:bg-[#edf5fb] text-[#12345b] text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4 text-[#2f6fb3]" />
          <span>Back to Directory</span>
        </button>

        <button
          onClick={() => {
            setShowSensitive(!showSensitive);
            showToast(showSensitive ? 'Sensitive details masked' : 'Sensitive details revealed', 'info');
          }}
          className="px-3.5 py-1.5 bg-[#edf4fa] border border-[#c9def6] hover:bg-[#d6e7f4] text-[#102f52] text-xs font-extrabold rounded-xl transition-all flex items-center gap-2"
        >
          {showSensitive ? <Unlock className="w-3.5 h-3.5 text-[#0f766e]" /> : <Lock className="w-3.5 h-3.5 text-[#a33b32]" />}
          <span>{showSensitive ? 'Hide Sensitive Info' : 'Reveal Sensitive Info'}</span>
        </button>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl p-6 shadow-cdCard flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#12345b] to-[#1f5f98] text-white font-black text-2xl flex items-center justify-center shadow-md">
            {employee.firstName.charAt(0)}{employee.lastName ? employee.lastName.charAt(0) : ''}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-[#12345b]">
                {employee.displayName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#d4eee9] text-[#145f57] font-extrabold text-xs">
                {employee.status}
              </span>
            </div>
            <p className="text-sm font-bold text-[#607286] mt-0.5">
              {employee.position} • <span className="text-[#2f6fb3]">{employee.department}</span>
            </p>
            <p className="text-xs font-semibold text-[#8292a3] mt-1 tabular-nums">
              ID: {employee.employeeId} • Joined: {employee.startDate}
            </p>
          </div>
        </div>

        <div className="bg-[#f4f7fb] border border-[#dde7f0] rounded-xl p-4 flex items-center gap-6">
          <div>
            <div className="text-xs font-bold text-[#607286]">Pay Type</div>
            <div className="text-sm font-black text-[#12345b]">{employee.payType}</div>
          </div>
          <div className="border-l border-[#c9d7e6] pl-6">
            <div className="text-xs font-bold text-[#607286]">Pay Rate</div>
            <div className="text-sm font-black text-[#0f766e] tabular-nums">
              {showSensitive ? `$${employee.payRate.toFixed(2)}/hr` : '••••••••'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
        <div className="flex items-center gap-1 p-2 bg-[#edf4fa] border-b border-[#d9e4ee] overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-white text-[#12345b] shadow-sm border border-[#c9def6]'
                  : 'text-[#456078] hover:bg-[#e2e8ee] hover:text-[#12345b]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Tab 1: Overview */}
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-base font-extrabold text-[#12345b] border-b border-[#e1e9f0] pb-2">
                  Personal Summary
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between py-1 border-b border-[#f0f4f8]">
                    <span className="font-semibold text-[#607286]">Full Name:</span>
                    <span className="font-extrabold text-[#1c2b3a]">{employee.displayName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#f0f4f8]">
                    <span className="font-semibold text-[#607286]">Date of Birth:</span>
                    <span className="font-extrabold text-[#1c2b3a]">{showSensitive ? employee.dateOfBirth : '••••••••'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#f0f4f8]">
                    <span className="font-semibold text-[#607286]">Phone:</span>
                    <span className="font-extrabold text-[#1c2b3a]">{showSensitive ? employee.personalPhone : '••••••••'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-semibold text-[#607286]">Email:</span>
                    <span className="font-extrabold text-[#2f6fb3]">{employee.email}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-extrabold text-[#12345b] border-b border-[#e1e9f0] pb-2">
                  Employment Setup
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between py-1 border-b border-[#f0f4f8]">
                    <span className="font-semibold text-[#607286]">Department:</span>
                    <span className="font-extrabold text-[#1c2b3a]">{employee.department}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#f0f4f8]">
                    <span className="font-semibold text-[#607286]">Employment Type:</span>
                    <span className="font-extrabold text-[#1c2b3a]">{employee.employmentType}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#f0f4f8]">
                    <span className="font-semibold text-[#607286]">Regular Hourly Rate:</span>
                    <span className="font-extrabold text-[#0f766e]">{showSensitive ? `$${employee.payRate.toFixed(2)}/hr` : '••••••••'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-semibold text-[#607286]">Holiday Rate:</span>
                    <span className="font-extrabold text-[#12345b]">{showSensitive ? `$${employee.holidayRate.toFixed(2)}/hr` : '••••••••'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Personal */}
          {activeTab === 'Personal' && (
            <div className="space-y-4 max-w-xl">
              <h3 className="text-base font-extrabold text-[#12345b]">Personal Details</h3>
              <div className="bg-[#f8fbfd] p-4 rounded-xl border border-[#dde7f0] space-y-3 text-sm">
                <div><span className="font-bold text-[#607286]">Address:</span> {employee.address}</div>
                <div><span className="font-bold text-[#607286]">Date of Birth:</span> {showSensitive ? employee.dateOfBirth : '••••••••'}</div>
                <div><span className="font-bold text-[#607286]">Employee ID:</span> {employee.employeeId}</div>
              </div>
            </div>
          )}

          {/* Tab 3: Contact */}
          {activeTab === 'Contact' && (
            <div className="space-y-4 max-w-xl">
              <h3 className="text-base font-extrabold text-[#12345b]">Contact & Emergency</h3>
              <div className="bg-[#f8fbfd] p-4 rounded-xl border border-[#dde7f0] space-y-3 text-sm">
                <div><span className="font-bold text-[#607286]">Work Phone:</span> {employee.workPhone}</div>
                <div><span className="font-bold text-[#607286]">Personal Phone:</span> {showSensitive ? employee.personalPhone : '••••••••'}</div>
                <div><span className="font-bold text-[#607286]">Emergency Contact:</span> {employee.emergencyContactName} ({employee.emergencyContactRelation})</div>
                <div><span className="font-bold text-[#607286]">Emergency Phone:</span> {showSensitive ? employee.emergencyContactPhone : '••••••••'}</div>
              </div>
            </div>
          )}

          {/* Tab 5: Payroll */}
          {activeTab === 'Payroll' && (
            <div className="space-y-4 max-w-xl">
              <h3 className="text-base font-extrabold text-[#12345b]">Payroll & Bank Setup</h3>
              <div className="bg-[#f8fbfd] p-4 rounded-xl border border-[#dde7f0] space-y-3 text-sm">
                <div><span className="font-bold text-[#607286]">Payment Method:</span> {employee.paymentMethod}</div>
                <div><span className="font-bold text-[#607286]">Bank Name:</span> {employee.bankName || 'Butterfield Bank Bermuda'}</div>
                <div><span className="font-bold text-[#607286]">Account Number:</span> {showSensitive ? (employee.bankAccountMasked || '••••••••4892') : '••••••••'}</div>
                <div><span className="font-bold text-[#607286]">Bermuda Statutory Deduction Setup:</span> Standard (No US Tax)</div>
              </div>
            </div>
          )}

          {/* Tab 7: Leave */}
          {activeTab === 'Leave' && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-[#12345b]">Leave History</h3>
              {leaves.length > 0 ? (
                <div className="space-y-2">
                  {leaves.map(l => (
                    <div key={l.id} className="p-3 bg-[#f8fbfd] border border-[#dde7f0] rounded-xl flex items-center justify-between text-sm">
                      <div>
                        <strong className="text-[#12345b]">{l.leaveType}</strong>
                        <span className="text-xs text-[#607286] ml-2">({l.startDate} to {l.endDate})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#d4eee9] text-[#145f57] font-bold text-xs">
                        {l.status} ({l.daysCount} days)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#607286]">No leave records saved for this employee.</p>
              )}
            </div>
          )}

          {/* Other tabs fallback */}
          {['Employment', 'Schedule', 'Payslips'].includes(activeTab) && (
            <div className="p-4 bg-[#f8fbfd] rounded-xl border border-[#dde7f0] text-sm text-[#607286]">
              Detailed {activeTab} information configured for {employee.displayName}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
