import React, { useState, useEffect } from 'react';
import { employeeService } from '../services/employeeService';
import { useToast } from '../context/ToastContext';
import { Employee } from '../types';
import { AlertCircle, X, Eye, Edit3, Trash2, Phone, Mail, MapPin, Calendar, ShieldAlert } from 'lucide-react';

interface EmployeeFormData {
  id?: string;
  name: string;
  status: 'Active' | 'Inactive';
  phone: string;
  email: string;
  address: string;
}

const emptyForm: EmployeeFormData = {
  name: '',
  status: 'Active',
  phone: '',
  email: '',
  address: '',
};

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewModalEmployee, setViewModalEmployee] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      const data = await employeeService.fetchEmployees();
      setEmployees(data);
    } catch (err) {
      console.error(err);
      showToast('Error loading employees.', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingEmployee(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      id: emp.id,
      name: emp.displayName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
      status: emp.status || 'Active',
      phone: emp.personalPhone || emp.workPhone || '',
      email: emp.email || '',
      address: emp.address || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Employee name is required.', 'error');
      return;
    }

    setLoading(true);
    try {
      const parts = formData.name.trim().split(' ');
      const firstName = parts[0] || 'Staff';
      const lastName = parts.slice(1).join(' ') || '';

      if (editingEmployee) {
        const updated = await employeeService.saveEmployee({
          ...editingEmployee,
          firstName,
          lastName,
          displayName: formData.name.trim(),
          status: formData.status,
          personalPhone: formData.phone.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
        });
        showToast(`Employee record for ${updated.displayName} updated successfully.`);
      } else {
        const created = await employeeService.saveEmployee({
          firstName,
          lastName,
          displayName: formData.name.trim(),
          status: formData.status,
          personalPhone: formData.phone.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
        });
        showToast(`Employee ${created.displayName} added successfully.`);
      }

      setShowModal(false);
      setFormData(emptyForm);
      setEditingEmployee(null);
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Error saving employee record.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await employeeService.deleteEmployee(deleteTarget.id);
      showToast(`Employee ${deleteTarget.displayName} deleted.`);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete employee record.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (emp: Employee) => {
    return emp.personalPhone || emp.workPhone || '—';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12345b] tracking-tight">
            Employee Records
          </h1>
          <p className="text-sm font-semibold text-[#3b82f6] mt-1">
            Add, update, activate, deactivate, or remove employee contact records.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto hover:shadow-lg active:scale-95"
        >
          <span>+ Add Employee</span>
        </button>
      </div>

      {/* Employee Records Table Panel */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-[#102a43] text-white font-bold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-5 font-bold">Employee</th>
                <th className="py-3.5 px-5 font-bold">Phone</th>
                <th className="py-3.5 px-5 font-bold">Email</th>
                <th className="py-3.5 px-5 font-bold">Address</th>
                <th className="py-3.5 px-5 font-bold text-center">Status</th>
                <th className="py-3.5 px-5 font-bold text-center w-48">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2f7]">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm font-bold text-[#64748b]">
                    No employee records are available.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-[#f8fafc] transition-colors"
                  >
                    {/* Employee Name */}
                    <td className="py-3.5 px-5 font-bold text-[#0f172a] whitespace-nowrap">
                      {emp.displayName || `${emp.firstName} ${emp.lastName}`.trim()}
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-5 text-xs font-semibold text-[#334155] whitespace-nowrap">
                      {formatPhone(emp)}
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-5 text-xs text-[#334155] whitespace-nowrap">
                      {emp.email ? (
                        <a href={`mailto:${emp.email}`} className="text-[#0284c7] hover:underline">
                          {emp.email}
                        </a>
                      ) : (
                        <span className="text-[#94a3b8]">—</span>
                      )}
                    </td>

                    {/* Address */}
                    <td className="py-3.5 px-5 text-xs text-[#334155] max-w-[280px] truncate" title={emp.address || ''}>
                      {emp.address || <span className="text-[#94a3b8]">—</span>}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-5 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          emp.status === 'Active'
                            ? 'bg-[#dcfce7] text-[#15803d]'
                            : 'bg-[#fee2e2] text-[#b91c1c]'
                        }`}
                      >
                        {emp.status || 'Active'}
                      </span>
                    </td>

                    {/* Actions: View, Edit & Delete */}
                    <td className="py-3.5 px-5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewModalEmployee(emp)}
                          className="px-2.5 py-1 bg-white hover:bg-[#f1f5f9] text-[#1e293b] font-bold text-xs rounded-lg border border-[#cbd5e1] transition-all shadow-xs flex items-center gap-1"
                        >
                          <Eye size={13} className="text-[#64748b]" />
                          <span>View</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(emp)}
                          className="px-2.5 py-1 bg-white hover:bg-[#eff6ff] text-[#1d4ed8] font-bold text-xs rounded-lg border border-[#bfdbfe] transition-all shadow-xs flex items-center gap-1"
                        >
                          <Edit3 size={13} className="text-[#1d4ed8]" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(emp)}
                          className="px-2.5 py-1 bg-white hover:bg-[#fef2f2] text-[#dc2626] font-bold text-xs rounded-lg border border-[#fecaca] transition-all shadow-xs flex items-center gap-1"
                        >
                          <Trash2 size={13} className="text-[#dc2626]" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <p className="text-xs font-semibold text-[#64748b] mt-3">
        Payroll rates, hours, schedules, leave, and payslips remain in the original payroll areas.
      </p>

      {/* View Employee Modal */}
      {viewModalEmployee && (
        <div className="fixed inset-0 bg-[#0b1d31]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d7e2ec] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-fadeIn">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#e2e8f0] pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#12345b] text-white font-black text-lg flex items-center justify-center shadow-sm">
                  {(viewModalEmployee.displayName?.charAt(0) || 'E').toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#12345b]">
                    {viewModalEmployee.displayName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-[#64748b]">
                      {viewModalEmployee.position || 'Staff Member'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#dcfce7] text-[#15803d]">
                      {viewModalEmployee.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewModalEmployee(null)}
                className="text-[#64748b] hover:text-[#12345b] p-1.5 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center gap-1.5 text-[#64748b] font-bold mb-1">
                  <Phone size={13} />
                  <span>Personal Phone</span>
                </div>
                <div className="text-sm font-black text-[#0f172a]">
                  {viewModalEmployee.personalPhone || viewModalEmployee.workPhone || '—'}
                </div>
              </div>

              <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center gap-1.5 text-[#64748b] font-bold mb-1">
                  <Phone size={13} />
                  <span>Work Phone</span>
                </div>
                <div className="text-sm font-black text-[#0f172a]">
                  {viewModalEmployee.workPhone || '(441) 295-4141'}
                </div>
              </div>

              <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center gap-1.5 text-[#64748b] font-bold mb-1">
                  <Mail size={13} />
                  <span>Work Email</span>
                </div>
                <div className="text-sm font-black text-[#1d4ed8] break-all">
                  {viewModalEmployee.email || '—'}
                </div>
              </div>

              <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center gap-1.5 text-[#64748b] font-bold mb-1">
                  <Calendar size={13} />
                  <span>Hire Date</span>
                </div>
                <div className="text-sm font-black text-[#0f172a]">
                  {viewModalEmployee.startDate || '—'}
                </div>
              </div>

              <div className="sm:col-span-2 p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center gap-1.5 text-[#64748b] font-bold mb-1">
                  <MapPin size={13} />
                  <span>Physical Address</span>
                </div>
                <div className="text-sm font-semibold text-[#0f172a]">
                  {viewModalEmployee.address || '—'}
                </div>
              </div>

              <div className="sm:col-span-2 p-3 bg-[#fff7ed] rounded-xl border border-[#ffedd5]">
                <div className="flex items-center gap-1.5 text-[#c2410c] font-bold mb-1">
                  <ShieldAlert size={13} />
                  <span>Emergency Contact</span>
                </div>
                <div className="text-sm font-bold text-[#7c2d12]">
                  {viewModalEmployee.emergencyContactName || '—'}{' '}
                  {viewModalEmployee.emergencyContactRelation && `(${viewModalEmployee.emergencyContactRelation})`}
                </div>
                <div className="text-xs text-[#9a3412] mt-0.5">
                  Phone: {viewModalEmployee.emergencyContactPhone || '—'}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => {
                  const emp = viewModalEmployee;
                  setViewModalEmployee(null);
                  openEditModal(emp);
                }}
                className="px-4 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-extrabold rounded-xl shadow-sm transition-all"
              >
                Edit Employee
              </button>
              <button
                type="button"
                onClick={() => setViewModalEmployee(null)}
                className="px-4 py-2 border border-[#cbd5e1] text-[#475569] text-xs font-bold rounded-xl hover:bg-[#f8fafc]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0b1d31]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d7e2ec] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <div>
                <h3 className="text-lg font-black text-[#12345b]">
                  {editingEmployee ? 'Edit Employee' : 'Add Employee'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#64748b] hover:text-[#12345b] p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Employee Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alesia Brangman"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                  className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. (441) 534-8822"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. alesia.brangman@centraldispatch.bm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Address</label>
                <textarea
                  rows={3}
                  placeholder="e.g. 14 Cedar Avenue, Hamilton HM11, Bermuda"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8]"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#cbd5e1] text-[#475569] font-bold text-sm rounded-xl hover:bg-[#f8fafc] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-[#0b1d31]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d7e2ec] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 text-[#dc2626]">
              <div className="w-10 h-10 rounded-full bg-[#fef2f2] flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#12345b]">
                  Delete Employee Record?
                </h3>
                <p className="text-xs text-[#64748b]">This action will delete the employee from the MySQL database.</p>
              </div>
            </div>

            <p className="text-sm font-semibold text-[#334155]">
              Are you sure you want to delete{' '}
              <span className="font-extrabold text-[#0f172a]">{deleteTarget.displayName}</span>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-[#cbd5e1] text-[#475569] font-bold text-sm rounded-xl hover:bg-[#f8fafc] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-5 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
