import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../services/employeeService';
import { Employee } from '../types';
import { useToast } from '../context/ToastContext';
import { Search, UserPlus, Eye, Edit, Calendar, DollarSign, FileText, CheckCircle2, XCircle } from 'lucide-react';

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>(() => employeeService.getEmployees());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const initialNewEmp = {
    firstName: '',
    lastName: '',
    position: 'Dispatcher',
    department: 'Dispatch Operations',
    payRate: '',
    holidayRate: '',
    employmentType: 'Full-Time' as const,
    payType: 'Hourly' as const,
  };

  const [newEmp, setNewEmp] = useState(initialNewEmp);

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(String(newEmp.payRate)) || 0;
    const created = employeeService.saveEmployee({
      ...newEmp,
      payRate: rate,
      holidayRate: rate * 1.5,
    });
    setEmployees(employeeService.getEmployees());
    setNewEmp(initialNewEmp);
    setShowAddModal(false);
    showToast(`Employee ${created.displayName} added successfully.`);
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
    const matchesDept = departmentFilter === 'All' || emp.department === departmentFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  const departments = Array.from(new Set(employees.map(e => e.department)));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12345b] tracking-tight">
            Employee Directory
          </h1>
          <p className="text-sm font-semibold text-[#607286] mt-1">
            Manage Bermuda staff profiles, pay rates, and employment records
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#2f6fb3] hover:bg-[#245a96] text-white text-sm font-extrabold rounded-xl transition-all shadow-md flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl p-4 shadow-cdCard flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#607286]" />
          <input
            type="text"
            placeholder="Search by name, ID, or position..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#2f6fb3]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-bold text-[#1c2b3a] focus:outline-none focus:border-[#2f6fb3]"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-bold text-[#1c2b3a] focus:outline-none focus:border-[#2f6fb3]"
          >
            <option value="All">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Employee Data Table */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#12345b] text-white font-bold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Position</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Pay Type</th>
                <th className="py-3.5 px-4 text-right">Pay Rate</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e9f0]">
              {filteredEmployees.map((emp, idx) => (
                <tr key={emp.id} className={idx % 2 === 0 ? 'bg-white hover:bg-[#f8fbfd]' : 'bg-[#f8fbfd] hover:bg-[#edf5fb]'}>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#e8eff5] text-[#31506d] font-black text-xs flex items-center justify-center flex-shrink-0">
                        {emp.firstName.charAt(0)}{emp.lastName ? emp.lastName.charAt(0) : ''}
                      </div>
                      <span className="font-extrabold text-[#183a61]">
                        {emp.displayName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#607286] tabular-nums">
                    {emp.employeeId}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#1c2b3a]">
                    {emp.position}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#607286]">
                    {emp.department}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#1c2b3a]">
                    {emp.payType}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-[#12345b] tabular-nums">
                    ${emp.payRate.toFixed(2)}/hr
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                      emp.status === 'Active' ? 'bg-[#d4eee9] text-[#145f57]' : 'bg-[#f7d8d5] text-[#8d251d]'
                    }`}>
                      {emp.status === 'Active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/employees/${emp.id}`)}
                        className="px-2.5 py-1 bg-[#eaf4fb] hover:bg-[#d6e7f4] text-[#12345b] font-extrabold text-xs rounded-lg transition-all flex items-center gap-1"
                        title="View Profile"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0b1d31]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d7e2ec] rounded-2xl max-w-lg w-full p-6 shadow-cdModal space-y-4">
            <div className="flex items-center justify-between border-b border-[#e1e8ef] pb-3">
              <h3 className="text-lg font-black text-[#12345b]">
                Add New Staff Member
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#607286] hover:text-[#12345b]">✕</button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#38516b] mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newEmp.firstName}
                    onChange={e => setNewEmp({ ...newEmp, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#bdcbd9] rounded-xl text-sm focus:border-[#2f6fb3]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#38516b] mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newEmp.lastName}
                    onChange={e => setNewEmp({ ...newEmp, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#bdcbd9] rounded-xl text-sm focus:border-[#2f6fb3]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#38516b] mb-1">Position / Title</label>
                <input
                  type="text"
                  required
                  value={newEmp.position}
                  onChange={e => setNewEmp({ ...newEmp, position: e.target.value })}
                  className="w-full px-3 py-2 border border-[#bdcbd9] rounded-xl text-sm focus:border-[#2f6fb3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#38516b] mb-1">Department</label>
                  <input
                    type="text"
                    value={newEmp.department}
                    onChange={e => setNewEmp({ ...newEmp, department: e.target.value })}
                    className="w-full px-3 py-2 border border-[#bdcbd9] rounded-xl text-sm focus:border-[#2f6fb3]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#38516b] mb-1">Pay Rate ($/hr)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    placeholder="e.g. 18.00"
                    value={newEmp.payRate}
                    onChange={e => setNewEmp({ ...newEmp, payRate: e.target.value })}
                    className="w-full px-3 py-2 border border-[#bdcbd9] rounded-xl text-sm focus:border-[#2f6fb3]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#aebfd1] text-[#173a60] font-bold text-xs rounded-xl hover:bg-[#edf5fb]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2f6fb3] hover:bg-[#245a96] text-white font-extrabold text-xs rounded-xl"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
