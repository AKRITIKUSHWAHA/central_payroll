import React, { useState } from 'react';
import { employeeService } from '../services/employeeService';
import { Employee } from '../types';
import { useToast } from '../context/ToastContext';
import { Search, UserCheck, Phone, Mail, Save, User } from 'lucide-react';

export const StaffContacts: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>(() => employeeService.getEmployees());
  const [selectedId, setSelectedId] = useState<string>(employees[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  const selectedEmployee = employees.find(e => e.id === selectedId) || employees[0];
  const [formData, setFormData] = useState<Employee>(selectedEmployee);

  const handleSelect = (emp: Employee) => {
    setSelectedId(emp.id);
    setFormData(emp);
  };

  const handleFormChange = (field: keyof Employee, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = employeeService.saveEmployee(formData);
    setEmployees(employeeService.getEmployees());
    showToast(`Contact information updated for ${updated.displayName}`);
  };

  const filteredEmployees = employees.filter(e =>
    e.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12345b] tracking-tight">
            Staff Contact Details
          </h1>
          <p className="text-sm font-semibold text-[#607286] mt-1">
            Select a staff member to view or update their information
          </p>
        </div>
      </div>

      {/* Directory Table Panel */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
        <div className="p-4 bg-[#edf4fa] border-b border-[#d9e4ee] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#607286]" />
            <input
              type="text"
              placeholder="Search staff by name or position..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#2f6fb3]"
            />
          </div>
          <span className="text-xs font-bold text-[#607286]">
            {filteredEmployees.length} staff records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#12345b] text-white font-bold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email address</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e9f0]">
              {filteredEmployees.map((emp, idx) => {
                const isSelected = emp.id === selectedId;
                const initials = emp.firstName.charAt(0) + (emp.lastName ? emp.lastName.charAt(0) : '');

                return (
                  <tr
                    key={emp.id}
                    onClick={() => handleSelect(emp)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#eaf4fb]' : idx % 2 === 0 ? 'bg-white hover:bg-[#f8fbfd]' : 'bg-[#f8fbfd] hover:bg-[#edf5fb]'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#e8eff5] text-[#31506d] font-black text-sm flex items-center justify-center flex-shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="font-extrabold text-[#183a61] hover:text-[#2f6fb3]">
                            {emp.displayName}
                          </div>
                          <div className="text-xs font-semibold text-[#607286]">
                            {emp.position}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#1c2b3a]">
                      {emp.email || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-extrabold text-xs text-[#176b55]">
                        <UserCheck className="w-3.5 h-3.5" />
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Employee Detail Form (Matching Screenshot 4) */}
      {selectedEmployee && (
        <div className="bg-white border border-[#d7e3ed] rounded-2xl shadow-cdCard overflow-hidden">
          <div className="px-6 py-4 bg-[#edf4fa] border-b border-[#d9e4ee] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#12345b]">
                {formData.displayName}
              </h2>
              <p className="text-xs font-bold text-[#607286]">
                {formData.position}
              </p>
            </div>
            <span className="text-xs font-bold text-[#607286]">
              Staff information
            </span>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-[#456078] uppercase tracking-wider mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={e => handleFormChange('firstName', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#2f6fb3]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#456078] uppercase tracking-wider mb-1.5">
                  Middle Initial
                </label>
                <input
                  type="text"
                  value={formData.middleInitial || ''}
                  onChange={e => handleFormChange('middleInitial', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#2f6fb3]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#456078] uppercase tracking-wider mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={e => handleFormChange('lastName', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#2f6fb3]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-[#456078] uppercase tracking-wider mb-1.5">
                  Work Phone
                </label>
                <input
                  type="text"
                  value={formData.workPhone}
                  onChange={e => handleFormChange('workPhone', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#2f6fb3]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#456078] uppercase tracking-wider mb-1.5">
                  Personal Phone
                </label>
                <input
                  type="text"
                  value={formData.personalPhone}
                  onChange={e => handleFormChange('personalPhone', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#2f6fb3]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#456078] uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => handleFormChange('email', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#2f6fb3]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-[#456078] uppercase tracking-wider mb-1.5">
                  Address (Bermuda)
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => handleFormChange('address', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#2f6fb3]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#456078] uppercase tracking-wider mb-1.5">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={`${formData.emergencyContactName} (${formData.emergencyContactRelation}) - ${formData.emergencyContactPhone}`}
                  onChange={e => handleFormChange('emergencyContactName', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#2f6fb3]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#2f6fb3] hover:bg-[#245a96] text-white text-sm font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Contact Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
