import React, { useState, useEffect, useMemo, useRef } from 'react';
import { staffContactDetailsService, StaffRecordItem } from '../services/staffContactDetailsService';
import { isRealEmployee } from '../services/employeeService';
import { useToast } from '../context/ToastContext';
import { UserPlus, X, Plus, AlertCircle, Eye, Edit3, Trash2, Phone, Mail, MapPin, ShieldAlert, Calendar, MoreVertical } from 'lucide-react';

interface StaffContact {
  id: string;
  employeeId?: string;
  name?: string;
  displayName?: string;
  firstName?: string;
  middleInitial?: string;
  lastName?: string;
  role?: string;
  position?: string;
  status?: string;
  hireDate?: string;
  startDate?: string;
  phone?: string;
  personalPhone?: string;
  workPhone?: string;
  email?: string;
  address?: string;
  emergencyName?: string;
  emergencyContactName?: string;
  emergencyPhone?: string;
  emergencyContactPhone?: string;
  emergencyRelation?: string;
  emergencyContactRelation?: string;
}

export const StaffContacts: React.FC = () => {
  const [contacts, setContacts] = useState<StaffContact[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [records, setRecords] = useState<StaffRecordItem[]>([]);
  const { showToast } = useToast();

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewModalStaff, setViewModalStaff] = useState<StaffContact | null>(null);
  const [editModalStaff, setEditModalStaff] = useState<StaffContact | null>(null);
  const [deleteTargetStaff, setDeleteTargetStaff] = useState<StaffContact | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.staff-action-menu')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const [newStaffForm, setNewStaffForm] = useState({
    firstName: '',
    middleInitial: '',
    lastName: '',
    role: 'Dispatcher',
    status: 'Active',
    hireDate: new Date().toISOString().slice(0, 10),
    personalPhone: '',
    workPhone: '(441) 295-4141',
    email: '',
    address: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: 'Relative'
  });

  // Record Form State
  const [recordType, setRecordType] = useState<'sick' | 'vacation' | 'note'>('sick');
  const [recordDate, setRecordDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [recordNote, setRecordNote] = useState<string>('');

  const detailRef = useRef<HTMLDivElement>(null);

  const mapDbToContact = (e: any): StaffContact => ({
    id: e.id || e.employeeId,
    employeeId: e.employeeId || e.id,
    displayName: e.displayName || `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.id,
    firstName: e.firstName || '',
    middleInitial: e.middleInitial || '',
    lastName: e.lastName || '',
    role: e.position || e.role || 'Staff',
    position: e.position || e.role || 'Staff',
    status: e.status || 'Active',
    hireDate: e.startDate || e.hireDate || '',
    startDate: e.startDate || e.hireDate || '',
    phone: e.personalPhone || e.workPhone || e.phone || '',
    personalPhone: e.personalPhone || e.phone || '',
    workPhone: e.workPhone || '(441) 295-4141',
    email: e.email || '',
    address: e.address || '',
    emergencyName: e.emergencyContactName || e.emergencyName || '',
    emergencyContactName: e.emergencyContactName || e.emergencyName || '',
    emergencyPhone: e.emergencyContactPhone || e.emergencyPhone || '',
    emergencyContactPhone: e.emergencyContactPhone || e.emergencyPhone || '',
    emergencyRelation: e.emergencyContactRelation || e.emergencyRelation || '',
    emergencyContactRelation: e.emergencyContactRelation || e.emergencyRelation || ''
  });

  // Load contacts from DB
  const loadContacts = async () => {
    try {
      const dbList = await staffContactDetailsService.getStaffContactDetails();
      if (dbList && dbList.length > 0) {
        const mappedDb: StaffContact[] = dbList
          .filter(isRealEmployee)
          .map(mapDbToContact)
          .sort((a, b) => (a.displayName || `${a.firstName || ''} ${a.lastName || ''}`).localeCompare(b.displayName || `${b.firstName || ''} ${b.lastName || ''}`));
        
        setContacts(mappedDb);

        if (mappedDb.length > 0) {
          setSelectedStaffId(prev => prev && mappedDb.some(m => m.id === prev) ? prev : mappedDb[0].id);
        } else {
          setSelectedStaffId(null);
        }
      } else {
        setContacts([]);
        setSelectedStaffId(null);
      }
    } catch (err) {
      console.warn('Failed to load contacts:', err);
      setContacts([]);
      setSelectedStaffId(null);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  // Selected contact object
  const selectedContact = useMemo(() => {
    if (!selectedStaffId) return null;
    return contacts.find(c => c.id === selectedStaffId) || null;
  }, [selectedStaffId, contacts]);

  // Load records for selected staff
  useEffect(() => {
    if (selectedStaffId) {
      staffContactDetailsService.getStaffRecords(selectedStaffId).then(res => {
        setRecords(res || []);
      });
    } else {
      setRecords([]);
    }
  }, [selectedStaffId]);

  // Handle contact field change in inline panel and persist to DB
  const handleFieldChange = (field: keyof StaffContact, value: string) => {
    if (!selectedStaffId) return;

    setContacts(prev =>
      prev.map(c => {
        if (c.id === selectedStaffId) {
          const updated = { ...c, [field]: value };
          if (field === 'firstName' || field === 'lastName' || field === 'middleInitial') {
            const f = field === 'firstName' ? value : c.firstName || '';
            const m = field === 'middleInitial' ? value : c.middleInitial || '';
            const l = field === 'lastName' ? value : c.lastName || '';
            const full = [f, m, l].filter(Boolean).join(' ').trim();
            if (full) updated.displayName = full;
          }
          return updated;
        }
        return c;
      })
    );

    const target = contacts.find(c => c.id === selectedStaffId);
    if (target) {
      const payload: any = {
        ...target,
        [field]: value
      };
      staffContactDetailsService.updateStaffContactDetail(selectedStaffId, payload);
    }
  };

  // Add new staff member
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.firstName.trim()) {
      showToast('First name is required.', 'error');
      return;
    }

    const fullName = `${newStaffForm.firstName} ${newStaffForm.lastName}`.trim();
    const newId = `staff-${Date.now()}`;
    const newStaffData: any = {
      id: newId,
      firstName: newStaffForm.firstName.trim(),
      middleInitial: newStaffForm.middleInitial.trim(),
      lastName: newStaffForm.lastName.trim(),
      displayName: fullName,
      position: newStaffForm.role,
      status: newStaffForm.status,
      startDate: newStaffForm.hireDate,
      personalPhone: newStaffForm.personalPhone.trim(),
      workPhone: newStaffForm.workPhone.trim(),
      email: newStaffForm.email.trim(),
      address: newStaffForm.address.trim(),
      emergencyContactName: newStaffForm.emergencyName.trim(),
      emergencyContactPhone: newStaffForm.emergencyPhone.trim(),
      emergencyContactRelation: newStaffForm.emergencyRelation.trim()
    };

    const saved = await staffContactDetailsService.addStaffContact(newStaffData);
    const mapped = mapDbToContact(saved || newStaffData);
    
    setContacts(prev => [...prev, mapped]);
    setSelectedStaffId(mapped.id);
    setShowAddModal(false);
    showToast(`Staff member ${mapped.displayName} added successfully.`);

    // Reset form
    setNewStaffForm({
      firstName: '',
      middleInitial: '',
      lastName: '',
      role: 'Dispatcher',
      status: 'Active',
      hireDate: new Date().toISOString().slice(0, 10),
      personalPhone: '',
      workPhone: '(441) 295-4141',
      email: '',
      address: '',
      emergencyName: '',
      emergencyPhone: '',
      emergencyRelation: 'Relative'
    });
    await loadContacts();
  };

  // Save edits from Edit Modal
  const handleSaveEditModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalStaff) return;

    const fullName = `${editModalStaff.firstName || ''} ${editModalStaff.lastName || ''}`.trim() || editModalStaff.displayName || '';
    const payload: any = {
      ...editModalStaff,
      displayName: fullName
    };

    await staffContactDetailsService.updateStaffContactDetail(editModalStaff.id, payload);
    setEditModalStaff(null);
    showToast(`Staff member ${fullName} updated successfully.`);
    await loadContacts();
  };

  // Delete staff member
  const handleConfirmDelete = async () => {
    if (!deleteTargetStaff) return;

    await staffContactDetailsService.deleteStaffContact(deleteTargetStaff.id);
    setContacts(prev => prev.filter(c => c.id !== deleteTargetStaff.id));
    if (selectedStaffId === deleteTargetStaff.id) {
      setSelectedStaffId(null);
    }
    showToast(`Staff member ${deleteTargetStaff.displayName} deleted.`);
    setDeleteTargetStaff(null);
    await loadContacts();
  };

  // Select staff member
  const handleSelectStaff = (id: string) => {
    setSelectedStaffId(id);
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Hide Information button
  const handleHideDetail = () => {
    setSelectedStaffId(null);
    showToast('Staff information hidden', 'info');
  };

  // Add staff record
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) return;
    if (!recordDate) {
      alert('Please select a date for this staff record.');
      return;
    }
    if (recordType === 'note' && !recordNote.trim()) {
      alert('Please enter a note.');
      return;
    }

    const newRec = await staffContactDetailsService.addStaffRecord(selectedStaffId, {
      type: recordType,
      date: recordDate,
      note: recordNote.trim()
    });

    setRecords(prev => [newRec, ...prev]);
    setRecordNote('');
    const typeLabel = recordType === 'sick' ? 'Sick Time' : recordType === 'vacation' ? 'Vacation Time' : 'Note';
    showToast(`${typeLabel} record saved`);
  };

  // Delete staff record
  const handleDeleteRecord = async (recordId: string) => {
    if (!selectedStaffId) return;
    if (!window.confirm('Delete this staff record?')) return;

    await staffContactDetailsService.deleteStaffRecord(selectedStaffId, recordId);
    setRecords(prev => prev.filter(r => r.id !== recordId));
    showToast('Staff record deleted');
  };

  const getRecordBadgeClass = (type: string) => {
    if (type === 'sick') return 'bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5]';
    if (type === 'vacation') return 'bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]';
    return 'bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]';
  };

  const getRecordLabel = (type: string) => {
    if (type === 'sick') return 'Sick Time';
    if (type === 'vacation') return 'Vacation Time';
    return 'Note';
  };

  const formatDateLabel = (dStr: string) => {
    if (!dStr) return '—';
    try {
      const parts = dStr.split('-').map(Number);
      if (parts.length === 3) {
        const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
      }
      return dStr;
    } catch {
      return dStr;
    }
  };

  const formatStamp = (iso: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return `Saved ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Main Directory Panel */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="p-5 sm:p-6 border-b border-[#e2e8f0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#12345b] tracking-tight">
                Staff Contact Details
              </h1>
              <span className="px-2.5 py-0.5 bg-[#e0f2fe] text-[#0369a1] text-xs font-black rounded-full">
                {contacts.length} Staff Members Loaded
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#64748b] mt-1">
              Select any staff member to view, edit, or enter records. Add unlimited staff to the roster.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap self-start sm:self-auto"
          >
            <UserPlus size={16} />
            <span>Add Staff Member</span>
          </button>
        </div>

        {/* Mobile Scroll Hint */}
        <div className="mobile-scroll-hint">
          <span>👉 Swipe table to view phone, status &amp; actions</span>
          <span className="text-[10px] uppercase bg-white px-2 py-0.5 rounded border border-[#cbd5e1] font-extrabold">
            Directory
          </span>
        </div>

        {/* Directory Table */}
        <div className="table-responsive-container overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-[#102a43] text-white font-bold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-5 font-bold w-[34%]">Staff Member</th>
                <th className="py-3.5 px-4 font-bold w-[28%]">Email Address</th>
                <th className="py-3.5 px-4 font-bold w-[22%]">Phone Number</th>
                <th className="py-3.5 px-3 font-bold text-center w-[10%]">Status</th>
                <th className="py-3.5 px-3 font-bold text-center w-[6%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2f7]">
              {contacts.map((staff, idx) => {
                const isSelected = selectedStaffId === staff.id;
                const displayName = staff.displayName || `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'Staff member';
                const initial = (displayName.charAt(0) || '?').toUpperCase();
                const role = staff.role || staff.position || 'Staff';

                return (
                  <tr
                    key={staff.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-[#eaf4fb]'
                        : idx % 2 === 0
                        ? 'bg-white hover:bg-[#f8fafc]'
                        : 'bg-[#fbfdff] hover:bg-[#f1f5f9]'
                    }`}
                  >
                    {/* Name + Avatar + Role */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-[#e8eff5] text-[#31506d] font-black text-sm flex items-center justify-center flex-shrink-0">
                          {initial}
                        </div>
                        <div>
                          <button
                            onClick={() => handleSelectStaff(staff.id)}
                            className="font-bold text-sm text-[#0f172a] hover:text-[#1d4ed8] text-left block"
                          >
                            {displayName}
                          </button>
                          <div className="text-xs font-semibold text-[#64748b]">
                            {role}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-5 font-semibold text-[#334155] text-sm">
                      {staff.email ? (
                        <a href={`mailto:${staff.email}`} className="text-[#1d4ed8] hover:underline">
                          {staff.email}
                        </a>
                      ) : (
                        <span className="text-[#94a3b8] italic">No email</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-5 font-semibold text-[#334155] text-xs sm:text-sm whitespace-nowrap">
                      {staff.personalPhone || staff.phone || staff.workPhone || '—'}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-5 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#dcfce7] text-[#15803d]">
                        {staff.status || 'Active'}
                      </span>
                    </td>

                    {/* 3-Dot Actions Menu */}
                    <td className="py-3.5 px-5 text-center relative staff-action-menu" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === staff.id ? null : staff.id)}
                        className="p-2 rounded-xl border border-[#cbd5e1] bg-white hover:bg-[#f1f5f9] text-[#1e293b] hover:text-[#1d4ed8] transition-all shadow-2xs inline-flex items-center justify-center cursor-pointer"
                        title="Options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === staff.id && (
                        <div className="absolute right-6 top-12 w-44 bg-white border border-[#d7e2ec] rounded-xl shadow-xl py-1.5 z-30 animate-fadeIn text-left">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setViewModalStaff(staff);
                            }}
                            className="w-full px-3.5 py-2 text-xs font-bold text-[#334155] hover:bg-[#f1f5f9] hover:text-[#12345b] flex items-center gap-2.5 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#64748b]" />
                            <span>View Details</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setEditModalStaff({ ...staff });
                            }}
                            className="w-full px-3.5 py-2 text-xs font-bold text-[#1d4ed8] hover:bg-[#eff6ff] flex items-center gap-2.5 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#1d4ed8]" />
                            <span>Edit Record</span>
                          </button>

                          <div className="my-1 border-t border-[#edf2f7]" />

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setDeleteTargetStaff(staff);
                            }}
                            className="w-full px-3.5 py-2 text-xs font-bold text-[#dc2626] hover:bg-[#fef2f2] flex items-center gap-2.5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#dc2626]" />
                            <span>Delete Staff</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Staff Detail Container */}
        {selectedContact && (
          <div ref={detailRef} className="m-4 sm:m-5 border border-[#d7e3ed] rounded-2xl overflow-hidden bg-white shadow-xs">
            {/* Detail Card Header */}
            <div className="px-5 py-4 bg-[#edf4fa] border-b border-[#d9e4ee] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#12345b]">
                  {selectedContact.displayName}
                </h2>
                <span className="text-xs font-semibold text-[#64748b]">
                  {selectedContact.role || selectedContact.position}
                </span>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <span className="text-xs font-bold text-[#64748b] hidden sm:inline">
                  Staff information (Changes auto-save to MySQL)
                </span>
                <button
                  type="button"
                  onClick={handleHideDetail}
                  className="px-4 py-1.5 bg-white hover:bg-[#f8fafc] text-[#1e293b] border border-[#cbd5e1] text-xs font-extrabold rounded-xl transition-all shadow-xs"
                >
                  Hide Information
                </button>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Row 1: First Name, Middle Initial, Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={selectedContact.firstName || ''}
                    onChange={e => handleFieldChange('firstName', e.target.value)}
                    placeholder="First name"
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1.5">
                    Middle Initial
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    value={selectedContact.middleInitial || ''}
                    onChange={e => handleFieldChange('middleInitial', e.target.value)}
                    placeholder="M.I."
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={selectedContact.lastName || ''}
                    onChange={e => handleFieldChange('lastName', e.target.value)}
                    placeholder="Last name"
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
              </div>

              {/* Row 2: Job Title / Role, Status, Hire Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1.5">
                    Job Title / Role
                  </label>
                  <input
                    type="text"
                    value={selectedContact.role || selectedContact.position || ''}
                    onChange={e => {
                      handleFieldChange('role', e.target.value);
                      handleFieldChange('position', e.target.value);
                    }}
                    placeholder={selectedContact.role || 'Job title...'}
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1.5">
                    Status
                  </label>
                  <select
                    value={selectedContact.status || 'Active'}
                    onChange={e => handleFieldChange('status', e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1.5">
                    Hire Date
                  </label>
                  <input
                    type="date"
                    value={selectedContact.hireDate || selectedContact.startDate || ''}
                    onChange={e => {
                      handleFieldChange('hireDate', e.target.value);
                      handleFieldChange('startDate', e.target.value);
                    }}
                    placeholder="yyyy-mm-dd"
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8] cursor-pointer"
                  />
                </div>
              </div>

              {/* Row 3: Personal Phone, Work Phone, Email Address */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1.5">
                    Personal Phone
                  </label>
                  <input
                    type="tel"
                    value={selectedContact.personalPhone || selectedContact.phone || ''}
                    onChange={e => {
                      handleFieldChange('personalPhone', e.target.value);
                      handleFieldChange('phone', e.target.value);
                    }}
                    placeholder="(441) 500-0000"
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1.5">
                    Work Phone
                  </label>
                  <input
                    type="tel"
                    value={selectedContact.workPhone || '(441) 295-4141'}
                    onChange={e => handleFieldChange('workPhone', e.target.value)}
                    placeholder="(441) 295-4141"
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1.5">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    value={selectedContact.email || ''}
                    onChange={e => handleFieldChange('email', e.target.value)}
                    placeholder="email@centraldispatch.bm"
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
              </div>

              {/* Row 4: Home Address (span 2), Emergency Contact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#456078] mb-1.5">
                    Physical / Mailing Address
                  </label>
                  <input
                    type="text"
                    value={selectedContact.address || ''}
                    onChange={e => handleFieldChange('address', e.target.value)}
                    placeholder="Address, Parish, Bermuda"
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1.5">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    value={selectedContact.emergencyName || selectedContact.emergencyContactName || ''}
                    onChange={e => {
                      handleFieldChange('emergencyName', e.target.value);
                      handleFieldChange('emergencyContactName', e.target.value);
                    }}
                    placeholder="Contact full name"
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
              </div>

              {/* Row 5: Emergency Phone, Relationship */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1.5">
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    value={selectedContact.emergencyPhone || selectedContact.emergencyContactPhone || ''}
                    onChange={e => {
                      handleFieldChange('emergencyPhone', e.target.value);
                      handleFieldChange('emergencyContactPhone', e.target.value);
                    }}
                    placeholder="Emergency phone number"
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1.5">
                    Relationship
                  </label>
                  <input
                    type="text"
                    value={selectedContact.emergencyRelation || selectedContact.emergencyContactRelation || ''}
                    onChange={e => {
                      handleFieldChange('emergencyRelation', e.target.value);
                      handleFieldChange('emergencyContactRelation', e.target.value);
                    }}
                    placeholder="e.g. Spouse, Brother, Mother"
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
              </div>
            </div>

            {/* Sub-Section: Staff Notes & Records */}
            <div className="border-t border-[#d7e3ed] bg-[#f8fbfe] p-5 sm:p-6 space-y-4">
              <h3 className="text-sm font-black text-[#12345b]">
                Staff Record Log &amp; Notes
              </h3>

              <form onSubmit={handleAddRecord} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="w-full sm:w-40">
                  <label className="block text-xs font-bold text-[#456078] mb-1">Type</label>
                  <select
                    value={recordType}
                    onChange={e => setRecordType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-[#bdcbd9] rounded-xl text-xs font-semibold text-[#0f172a]"
                  >
                    <option value="sick">Sick Time</option>
                    <option value="vacation">Vacation Time</option>
                    <option value="note">Staff Note</option>
                  </select>
                </div>

                <div className="w-full sm:w-44">
                  <label className="block text-xs font-bold text-[#456078] mb-1">Date</label>
                  <input
                    type="date"
                    value={recordDate}
                    onChange={e => setRecordDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#bdcbd9] rounded-xl text-xs font-semibold text-[#0f172a]"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-bold text-[#456078] mb-1">Note Details</label>
                  <input
                    type="text"
                    placeholder="e.g. Called in sick, shift coverage note..."
                    value={recordNote}
                    onChange={e => setRecordNote(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-xs font-semibold text-[#0f172a]"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0f766e] hover:bg-[#115e59] text-white text-xs font-extrabold rounded-xl shadow-xs transition-all active:scale-95 whitespace-nowrap"
                >
                  + Save Record
                </button>
              </form>

              {/* Records List */}
              <div className="space-y-2 mt-3">
                {records.length === 0 ? (
                  <div className="text-xs font-semibold text-[#64748b] py-3 text-center bg-white rounded-xl border border-[#e2e8f0]">
                    No recorded notes or sick/vacation entries for this staff member yet.
                  </div>
                ) : (
                  records.map(rec => (
                    <div
                      key={rec.id}
                      className="p-3 bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${getRecordBadgeClass(rec.type)}`}>
                          {getRecordLabel(rec.type)}
                        </span>
                        <span className="font-bold text-[#0f172a]">
                          {formatDateLabel(rec.date)}
                        </span>
                        <span className="text-[#475569]">
                          {rec.note || 'No note details'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-[#94a3b8] hidden md:inline">
                          {formatStamp(rec.createdAt)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-1 text-[#94a3b8] hover:text-[#dc2626] rounded-lg"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* VIEW MODAL */}
      {viewModalStaff && (
        <div className="fixed inset-0 bg-[#0b1d31]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d7e2ec] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-fadeIn">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#e2e8f0] pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#12345b] text-white font-black text-lg flex items-center justify-center shadow-sm">
                  {(viewModalStaff.displayName?.charAt(0) || 'S').toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#12345b]">
                    {viewModalStaff.displayName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-[#64748b]">
                      {viewModalStaff.role || viewModalStaff.position || 'Staff Member'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#dcfce7] text-[#15803d]">
                      {viewModalStaff.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewModalStaff(null)}
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
                  {viewModalStaff.personalPhone || viewModalStaff.phone || '—'}
                </div>
              </div>

              <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center gap-1.5 text-[#64748b] font-bold mb-1">
                  <Phone size={13} />
                  <span>Work Phone</span>
                </div>
                <div className="text-sm font-black text-[#0f172a]">
                  {viewModalStaff.workPhone || '(441) 295-4141'}
                </div>
              </div>

              <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center gap-1.5 text-[#64748b] font-bold mb-1">
                  <Mail size={13} />
                  <span>Work Email</span>
                </div>
                <div className="text-sm font-black text-[#1d4ed8] break-all">
                  {viewModalStaff.email || '—'}
                </div>
              </div>

              <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center gap-1.5 text-[#64748b] font-bold mb-1">
                  <Calendar size={13} />
                  <span>Hire Date</span>
                </div>
                <div className="text-sm font-black text-[#0f172a]">
                  {formatDateLabel(viewModalStaff.hireDate || viewModalStaff.startDate || '')}
                </div>
              </div>

              <div className="sm:col-span-2 p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center gap-1.5 text-[#64748b] font-bold mb-1">
                  <MapPin size={13} />
                  <span>Physical Address</span>
                </div>
                <div className="text-sm font-semibold text-[#0f172a]">
                  {viewModalStaff.address || '—'}
                </div>
              </div>

              <div className="sm:col-span-2 p-3 bg-[#fff7ed] rounded-xl border border-[#ffedd5]">
                <div className="flex items-center gap-1.5 text-[#c2410c] font-bold mb-1">
                  <ShieldAlert size={13} />
                  <span>Emergency Contact</span>
                </div>
                <div className="text-sm font-bold text-[#7c2d12]">
                  {viewModalStaff.emergencyName || viewModalStaff.emergencyContactName || '—'}{' '}
                  {viewModalStaff.emergencyRelation && `(${viewModalStaff.emergencyRelation})`}
                </div>
                <div className="text-xs text-[#9a3412] mt-0.5">
                  Phone: {viewModalStaff.emergencyPhone || viewModalStaff.emergencyContactPhone || '—'}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => {
                  const s = viewModalStaff;
                  setViewModalStaff(null);
                  setEditModalStaff({ ...s });
                }}
                className="px-4 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-extrabold rounded-xl shadow-sm transition-all"
              >
                Edit Staff Details
              </button>
              <button
                type="button"
                onClick={() => setViewModalStaff(null)}
                className="px-4 py-2 border border-[#cbd5e1] text-[#475569] text-xs font-bold rounded-xl hover:bg-[#f8fafc]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalStaff && (
        <div className="fixed inset-0 bg-[#0b1d31]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d7e2ec] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <h3 className="text-lg font-black text-[#12345b]">
                Edit Staff Member
              </h3>
              <button
                onClick={() => setEditModalStaff(null)}
                className="text-[#64748b] hover:text-[#12345b] p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditModal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editModalStaff.firstName || ''}
                    onChange={e => setEditModalStaff({ ...editModalStaff, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Middle Initial</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={editModalStaff.middleInitial || ''}
                    onChange={e => setEditModalStaff({ ...editModalStaff, middleInitial: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editModalStaff.lastName || ''}
                    onChange={e => setEditModalStaff({ ...editModalStaff, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Job Role / Position</label>
                  <input
                    type="text"
                    value={editModalStaff.role || editModalStaff.position || ''}
                    onChange={e => setEditModalStaff({ ...editModalStaff, role: e.target.value, position: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Status</label>
                  <select
                    value={editModalStaff.status || 'Active'}
                    onChange={e => setEditModalStaff({ ...editModalStaff, status: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Hire Date</label>
                  <input
                    type="date"
                    value={editModalStaff.hireDate || editModalStaff.startDate || ''}
                    onChange={e => setEditModalStaff({ ...editModalStaff, hireDate: e.target.value, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Personal Phone</label>
                  <input
                    type="tel"
                    value={editModalStaff.personalPhone || editModalStaff.phone || ''}
                    onChange={e => setEditModalStaff({ ...editModalStaff, personalPhone: e.target.value, phone: e.target.value })}
                    placeholder="(441) 500-0000"
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Work Phone</label>
                  <input
                    type="tel"
                    value={editModalStaff.workPhone || '(441) 295-4141'}
                    onChange={e => setEditModalStaff({ ...editModalStaff, workPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Email</label>
                  <input
                    type="email"
                    value={editModalStaff.email || ''}
                    onChange={e => setEditModalStaff({ ...editModalStaff, email: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Address</label>
                <input
                  type="text"
                  value={editModalStaff.address || ''}
                  onChange={e => setEditModalStaff({ ...editModalStaff, address: e.target.value })}
                  placeholder="Address, Parish, Bermuda"
                  className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Emergency Name</label>
                  <input
                    type="text"
                    value={editModalStaff.emergencyName || editModalStaff.emergencyContactName || ''}
                    onChange={e => setEditModalStaff({ ...editModalStaff, emergencyName: e.target.value, emergencyContactName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Emergency Phone</label>
                  <input
                    type="tel"
                    value={editModalStaff.emergencyPhone || editModalStaff.emergencyContactPhone || ''}
                    onChange={e => setEditModalStaff({ ...editModalStaff, emergencyPhone: e.target.value, emergencyContactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Relationship</label>
                  <input
                    type="text"
                    value={editModalStaff.emergencyRelation || editModalStaff.emergencyContactRelation || ''}
                    onChange={e => setEditModalStaff({ ...editModalStaff, emergencyRelation: e.target.value, emergencyContactRelation: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setEditModalStaff(null)}
                  className="px-4 py-2 border border-[#cbd5e1] text-[#475569] text-xs font-bold rounded-xl hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-extrabold rounded-xl shadow-md active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTargetStaff && (
        <div className="fixed inset-0 bg-[#0b1d31]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d7e2ec] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 text-[#dc2626]">
              <div className="w-10 h-10 rounded-full bg-[#fef2f2] flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#12345b]">
                  Delete Staff Member?
                </h3>
                <p className="text-xs text-[#64748b]">This action will delete the staff record from MySQL database.</p>
              </div>
            </div>

            <p className="text-sm font-semibold text-[#334155]">
              Are you sure you want to delete{' '}
              <span className="font-extrabold text-[#0f172a]">{deleteTargetStaff.displayName}</span>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetStaff(null)}
                className="px-4 py-2 border border-[#cbd5e1] text-[#475569] font-bold text-sm rounded-xl hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-sm rounded-xl shadow-md active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0b1d31]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d7e2ec] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <h3 className="text-lg font-black text-[#12345b]">
                Add New Staff Member
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#64748b] hover:text-[#12345b] p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="First name"
                    value={newStaffForm.firstName}
                    onChange={e => setNewStaffForm({ ...newStaffForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Middle Initial</label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="M.I."
                    value={newStaffForm.middleInitial}
                    onChange={e => setNewStaffForm({ ...newStaffForm, middleInitial: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="Last name"
                    value={newStaffForm.lastName}
                    onChange={e => setNewStaffForm({ ...newStaffForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Job Role / Position</label>
                  <input
                    type="text"
                    value={newStaffForm.role}
                    onChange={e => setNewStaffForm({ ...newStaffForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Status</label>
                  <select
                    value={newStaffForm.status}
                    onChange={e => setNewStaffForm({ ...newStaffForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Hire Date</label>
                  <input
                    type="date"
                    value={newStaffForm.hireDate}
                    onChange={e => setNewStaffForm({ ...newStaffForm, hireDate: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Personal Phone</label>
                  <input
                    type="tel"
                    placeholder="(441) 500-0000"
                    value={newStaffForm.personalPhone}
                    onChange={e => setNewStaffForm({ ...newStaffForm, personalPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Work Phone</label>
                  <input
                    type="tel"
                    value={newStaffForm.workPhone}
                    onChange={e => setNewStaffForm({ ...newStaffForm, workPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@centraldispatch.bm"
                    value={newStaffForm.email}
                    onChange={e => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Address, Parish, Bermuda"
                  value={newStaffForm.address}
                  onChange={e => setNewStaffForm({ ...newStaffForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Emergency Name</label>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={newStaffForm.emergencyName}
                    onChange={e => setNewStaffForm({ ...newStaffForm, emergencyName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Emergency Phone</label>
                  <input
                    type="tel"
                    placeholder="(441) 500-0000"
                    value={newStaffForm.emergencyPhone}
                    onChange={e => setNewStaffForm({ ...newStaffForm, emergencyPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Relationship</label>
                  <input
                    type="text"
                    placeholder="e.g. Spouse"
                    value={newStaffForm.emergencyRelation}
                    onChange={e => setNewStaffForm({ ...newStaffForm, emergencyRelation: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#cbd5e1] text-[#475569] text-xs font-bold rounded-xl hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-extrabold rounded-xl shadow-md active:scale-95"
                >
                  Create Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW STAFF MODAL */}
      {viewModalStaff && (
        <div className="fixed inset-0 bg-[#0b1d31]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d7e2ec] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <h3 className="text-lg font-black text-[#12345b]">
                {viewModalStaff.displayName}
              </h3>
              <button
                onClick={() => setViewModalStaff(null)}
                className="text-[#64748b] hover:text-[#12345b] p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div><span className="font-bold text-[#64748b]">Role:</span> <span className="font-semibold text-[#1e293b]">{viewModalStaff.role || viewModalStaff.position}</span></div>
              <div><span className="font-bold text-[#64748b]">Email:</span> <span className="font-semibold text-[#1e293b]">{viewModalStaff.email || '—'}</span></div>
              <div><span className="font-bold text-[#64748b]">Phone:</span> <span className="font-semibold text-[#1e293b]">{viewModalStaff.personalPhone || viewModalStaff.phone || '—'}</span></div>
              <div><span className="font-bold text-[#64748b]">Address:</span> <span className="font-semibold text-[#1e293b]">{viewModalStaff.address || '—'}</span></div>
              <div><span className="font-bold text-[#64748b]">Emergency Contact:</span> <span className="font-semibold text-[#1e293b]">{viewModalStaff.emergencyName || viewModalStaff.emergencyContactName || '—'} ({viewModalStaff.emergencyPhone || viewModalStaff.emergencyContactPhone || '—'})</span></div>
              <div><span className="font-bold text-[#64748b]">Status:</span> <span className="font-semibold text-[#15803d] bg-[#dcfce7] px-2 py-0.5 rounded-full">{viewModalStaff.status || 'Active'}</span></div>
            </div>
            <div className="flex justify-end pt-3 border-t border-[#e2e8f0]">
              <button
                onClick={() => setViewModalStaff(null)}
                className="px-4 py-2 bg-[#12345b] text-white text-xs font-bold rounded-xl hover:bg-[#1d4ed8]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STAFF MODAL */}
      {editModalStaff && (
        <div className="fixed inset-0 bg-[#0b1d31]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d7e2ec] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <h3 className="text-lg font-black text-[#12345b]">
                Edit Staff Member
              </h3>
              <button
                onClick={() => setEditModalStaff(null)}
                className="text-[#64748b] hover:text-[#12345b] p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEditModal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">First Name</label>
                  <input
                    type="text"
                    value={editModalStaff.firstName || ''}
                    onChange={e => setEditModalStaff({ ...editModalStaff, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Middle Initial</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={editModalStaff.middleInitial || ''}
                    onChange={e => setEditModalStaff({ ...editModalStaff, middleInitial: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editModalStaff.lastName || ''}
                    onChange={e => setEditModalStaff({ ...editModalStaff, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Position / Role</label>
                  <input
                    type="text"
                    value={editModalStaff.role || editModalStaff.position || ''}
                    onChange={e => setEditModalStaff({ ...editModalStaff, role: e.target.value, position: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Status</label>
                  <select
                    value={editModalStaff.status || 'Active'}
                    onChange={e => setEditModalStaff({ ...editModalStaff, status: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Phone</label>
                  <input
                    type="text"
                    value={editModalStaff.personalPhone || editModalStaff.phone || ''}
                    onChange={e => setEditModalStaff({ ...editModalStaff, personalPhone: e.target.value, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Email</label>
                  <input
                    type="email"
                    value={editModalStaff.email || ''}
                    onChange={e => setEditModalStaff({ ...editModalStaff, email: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Address</label>
                <input
                  type="text"
                  value={editModalStaff.address || ''}
                  onChange={e => setEditModalStaff({ ...editModalStaff, address: e.target.value })}
                  className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setEditModalStaff(null)}
                  className="px-4 py-2 border border-[#cbd5e1] text-[#475569] text-xs font-bold rounded-xl hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-extrabold rounded-xl shadow-md active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTargetStaff && (
        <div className="fixed inset-0 bg-[#0b1d31]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#fed7aa] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 text-[#dc2626]">
              <div className="p-2.5 bg-[#fef2f2] rounded-xl">
                <AlertCircle className="w-6 h-6 text-[#dc2626]" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#12345b]">
                  Delete Staff Member?
                </h3>
                <p className="text-xs font-semibold text-[#64748b]">
                  This action removes the employee across the entire system.
                </p>
              </div>
            </div>

            <p className="text-xs font-medium text-[#475569] bg-[#fff7ed] p-3.5 rounded-xl border border-[#ffedd5] leading-relaxed">
              Are you sure you want to delete <strong className="text-[#0f172a]">{deleteTargetStaff.displayName}</strong>? They will be removed from all active rosters, payroll drafts, weekly schedules, payslips, and leave calendars. (Historical processed payrolls will remain safely locked).
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetStaff(null)}
                className="px-4 py-2 border border-[#cbd5e1] text-[#475569] text-xs font-bold rounded-xl hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-extrabold rounded-xl shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Yes, Delete Staff</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
