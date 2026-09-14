import React, { useState, useEffect, useMemo, useRef } from 'react';
import { staffContactDetailsService, StaffRecordItem } from '../services/staffContactDetailsService';
import { useToast } from '../context/ToastContext';
import { UserPlus, Trash2, X, Plus } from 'lucide-react';

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

const DEFAULT_STAFF: StaffContact[] = [
  {
    id: 'alesia',
    employeeId: 'CDL-001',
    displayName: 'Alesia Brangman',
    firstName: 'Alesia',
    lastName: 'Brangman',
    middleInitial: '',
    role: 'Dispatch Supervisor',
    position: 'Dispatch Supervisor',
    status: 'Active',
    hireDate: '2023-05-10',
    email: 'alesia.brangman@centraldispatch.bm',
    phone: '(441) 534-8822',
    personalPhone: '(441) 534-8822',
    workPhone: '(441) 295-4141',
    address: '14 Cedar Avenue, Hamilton HM11, Bermuda',
    emergencyName: 'David Brangman',
    emergencyContactName: 'David Brangman',
    emergencyPhone: '(441) 504-3321',
    emergencyContactPhone: '(441) 504-3321',
    emergencyRelation: 'Brother',
    emergencyContactRelation: 'Brother'
  },
  {
    id: 'global',
    employeeId: 'CDL-002',
    displayName: 'Global',
    firstName: 'Global',
    lastName: 'Dispatch',
    middleInitial: '',
    role: 'Global Dispatch / Call Center',
    position: 'Global Dispatch / Call Center',
    status: 'Active',
    hireDate: '2024-01-15',
    email: 'hamza@gdmbpo.com',
    phone: '(441) 505-1234',
    personalPhone: '(441) 505-1234',
    workPhone: '(441) 295-4141',
    address: '3 Laffan Street, Pembroke HM09, Bermuda',
    emergencyName: 'Sarah Hamza',
    emergencyContactName: 'Sarah Hamza',
    emergencyPhone: '(441) 518-9901',
    emergencyContactPhone: '(441) 518-9901',
    emergencyRelation: 'Spouse',
    emergencyContactRelation: 'Spouse'
  },
  {
    id: 'ty',
    employeeId: 'CDL-003',
    displayName: 'Tyonika McGowan (Ty)',
    firstName: 'Tyonika',
    lastName: 'McGowan',
    middleInitial: '',
    role: 'Dispatcher',
    position: 'Dispatcher',
    status: 'Active',
    hireDate: '2024-03-01',
    email: 'tyonika.mcgowan@centraldispatch.bm',
    phone: '(441) 516-7733',
    personalPhone: '(441) 516-7733',
    workPhone: '(441) 295-4141',
    address: '22 Middle Road, Devonshire DV06, Bermuda',
    emergencyName: 'Patricia McGowan',
    emergencyContactName: 'Patricia McGowan',
    emergencyPhone: '(441) 522-8811',
    emergencyContactPhone: '(441) 522-8811',
    emergencyRelation: 'Mother',
    emergencyContactRelation: 'Mother'
  },
  {
    id: 'neli',
    employeeId: 'CDL-004',
    displayName: 'Neli Outerbridge',
    firstName: 'Neli',
    lastName: 'Outerbridge',
    middleInitial: '',
    role: 'Owner / Manager / Director',
    position: 'Owner / Manager / Director',
    status: 'Active',
    hireDate: '2020-01-01',
    email: 'neli@bermudaislandtaxi.com',
    phone: '(441) 599-4455',
    personalPhone: '(441) 599-4455',
    workPhone: '(441) 295-4141',
    address: '8 Harbour Road, Paget PG02, Bermuda',
    emergencyName: 'Robert Outerbridge',
    emergencyContactName: 'Robert Outerbridge',
    emergencyPhone: '(441) 501-6677',
    emergencyContactPhone: '(441) 501-6677',
    emergencyRelation: 'Spouse',
    emergencyContactRelation: 'Spouse'
  },
  {
    id: 'ssh',
    employeeId: 'CDL-005',
    displayName: 'SSH',
    firstName: 'SSH',
    lastName: 'SSH',
    middleInitial: '',
    role: 'SSH Dispatch / Call Center',
    position: 'SSH Dispatch / Call Center',
    status: 'Active',
    hireDate: '2024-02-15',
    email: 'ssh.dispatch@centraldispatch.bm',
    phone: '(441) 527-9944',
    personalPhone: '(441) 527-9944',
    workPhone: '(441) 295-4141',
    address: '5 North Shore Road, Pembroke HM14, Bermuda',
    emergencyName: 'Michael Smith',
    emergencyContactName: 'Michael Smith',
    emergencyPhone: '(441) 512-3344',
    emergencyContactPhone: '(441) 512-3344',
    emergencyRelation: 'Guardian',
    emergencyContactRelation: 'Guardian'
  },
  {
    id: 'tanuvi',
    employeeId: 'CDL-006',
    displayName: 'Tanuvi Patel',
    firstName: 'Tanuvi',
    lastName: 'Patel',
    middleInitial: '',
    role: 'Dispatcher / Operations',
    position: 'Dispatcher / Operations',
    status: 'Active',
    hireDate: '2024-05-15',
    email: 'tanuvi.patel@centraldispatch.bm',
    phone: '(441) 538-4499',
    personalPhone: '(441) 538-4499',
    workPhone: '(441) 295-4141',
    address: '11 Point Finger Road, Paget DV04, Bermuda',
    emergencyName: 'Ramesh Patel',
    emergencyContactName: 'Ramesh Patel',
    emergencyPhone: '(441) 507-8899',
    emergencyContactPhone: '(441) 507-8899',
    emergencyRelation: 'Father',
    emergencyContactRelation: 'Father'
  }
];

export const StaffContacts: React.FC = () => {
  const [contacts, setContacts] = useState<StaffContact[]>(DEFAULT_STAFF);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>('ali');
  const [records, setRecords] = useState<StaffRecordItem[]>([]);
  const { showToast } = useToast();

  // Add Staff Modal State
  const [showAddModal, setShowAddModal] = useState(false);
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
        const mappedDb: StaffContact[] = dbList.map(mapDbToContact);
        const existingIds = new Set(mappedDb.map(c => (c.id || '').toLowerCase()));
        const extraDefaults = DEFAULT_STAFF.filter(d => !existingIds.has(d.id.toLowerCase()));
        const fullList = [...mappedDb, ...extraDefaults];
        setContacts(fullList);

        if (!selectedStaffId && fullList.length > 0) {
          setSelectedStaffId(fullList[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to load contacts:', err);
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

  // Handle contact field change and persist to DB
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
  };

  // Delete staff member
  const handleDeleteStaff = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name} from Staff Contact Details?`)) {
      return;
    }

    await staffContactDetailsService.deleteStaffContact(id);
    setContacts(prev => prev.filter(c => c.id !== id));
    if (selectedStaffId === id) {
      setSelectedStaffId(null);
    }
    showToast(`Staff member ${name} removed.`);
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
            <span>+ Add Staff Member</span>
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
        <div className="table-responsive-container">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#102a43] text-white font-bold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-5 font-bold">Staff Member</th>
                <th className="py-3.5 px-5 font-bold">Email Address</th>
                <th className="py-3.5 px-5 font-bold">Phone Number</th>
                <th className="py-3.5 px-5 font-bold text-center w-32">Status</th>
                <th className="py-3.5 px-5 font-bold text-center w-24">Action</th>
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
                    onClick={() => handleSelectStaff(staff.id)}
                    className={`cursor-pointer transition-colors ${
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
                          <div className={`font-bold text-sm ${isSelected ? 'text-[#1d4ed8]' : 'text-[#0f172a]'}`}>
                            {displayName}
                          </div>
                          <div className="text-xs font-semibold text-[#64748b]">
                            {role}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-5 font-semibold text-[#334155] text-sm">
                      {staff.email ? (
                        <a href={`mailto:${staff.email}`} onClick={e => e.stopPropagation()} className="text-[#1d4ed8] hover:underline">
                          {staff.email}
                        </a>
                      ) : (
                        <span className="text-[#94a3b8] italic">No email</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-5 font-semibold text-[#334155] text-xs sm:text-sm">
                      {staff.personalPhone || staff.phone || staff.workPhone || '—'}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-5 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#dcfce7] text-[#15803d]">
                        {staff.status || 'Active'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-5 text-center" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(staff.id, displayName)}
                        title="Delete staff member"
                        className="p-1.5 text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#fee2e2] rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
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
                    placeholder="e.g. Spouse, Parent, Sibling"
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div className="hidden md:block" />
              </div>
            </div>

            {/* Sub-section: Sick, Vacation & Notes Record */}
            <div className="border-t border-[#d7e3ed] p-5 sm:p-6 space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-[#12345b]">
                  Sick, Vacation & Notes Record
                </h3>
                <p className="text-xs font-semibold text-[#64748b] mt-1">
                  Records entered here are saved to <strong className="text-[#0f172a]">{selectedContact.displayName}</strong>.
                </p>
              </div>

              {/* Record Form */}
              <form onSubmit={handleAddRecord} className="flex flex-col md:flex-row items-stretch md:items-end gap-3.5">
                <div className="w-full md:w-48">
                  <label className="block text-xs font-bold text-[#456078] mb-1.5">
                    Record Type
                  </label>
                  <select
                    value={recordType}
                    onChange={e => setRecordType(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  >
                    <option value="sick">Sick Time</option>
                    <option value="vacation">Vacation Time</option>
                    <option value="note">Note Only</option>
                  </select>
                </div>

                <div className="w-full md:w-48">
                  <label className="block text-xs font-bold text-[#456078] mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={recordDate}
                    onChange={e => setRecordDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8] cursor-pointer"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-bold text-[#456078] mb-1.5">
                    Note / Details
                  </label>
                  <textarea
                    rows={1}
                    value={recordNote}
                    onChange={e => setRecordNote(e.target.value)}
                    placeholder="Add a note for this staff member..."
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-medium text-[#0f172a] focus:outline-none focus:border-[#1d4ed8] placeholder-[#94a3b8]"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-extrabold rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap self-start md:self-auto"
                >
                  Save Record
                </button>
              </form>

              {/* Records History Table */}
              <div className="overflow-x-auto w-full mt-3">
                <table className="w-full text-left text-sm border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-[#102a43] text-white font-bold text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 font-bold w-32">Date</th>
                      <th className="py-3 px-4 font-bold w-36">Type</th>
                      <th className="py-3 px-4 font-bold">Note / Details</th>
                      <th className="py-3 px-4 font-bold w-48">Date Stamp</th>
                      <th className="py-3 px-4 font-bold text-center w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf2f7]">
                    {!records || records.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 px-4 text-center text-xs font-semibold text-[#64748b]">
                          No sick, vacation or note records saved for this staff member yet.
                        </td>
                      </tr>
                    ) : (
                      records.map(rec => (
                        <tr key={rec.id} className="bg-white hover:bg-[#f8fafc] transition-colors">
                          <td className="py-3 px-4 font-bold text-xs text-[#0f172a] whitespace-nowrap">
                            {formatDateLabel(rec.date)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold inline-block ${getRecordBadgeClass(rec.type)}`}>
                              {getRecordLabel(rec.type)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold text-[#334155]">
                            {rec.note || '—'}
                          </td>
                          <td className="py-3 px-4 text-xs font-medium text-[#64748b] whitespace-nowrap">
                            {formatStamp(rec.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDeleteRecord(rec.id)}
                              className="px-3 py-1 bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] text-xs font-extrabold rounded-lg transition-all"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Notice Hint */}
        <div className="p-4 sm:p-5 border-t border-[#e2e8f0] text-xs font-semibold text-[#64748b]">
          Staff roster is fully dynamic and backed by MySQL database. Add as many staff members as required. Contact details are included in payroll reports and system backup data.
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#dde7f0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#e0f2fe] text-[#0369a1] rounded-xl">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#12345b]">
                    Add New Staff Member
                  </h3>
                  <p className="text-xs font-semibold text-[#64748b]">
                    Enter contact and emergency details for the new staff member
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="mt-5 space-y-4">
              {/* Row 1: Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaffForm.firstName}
                    onChange={e => setNewStaffForm({ ...newStaffForm, firstName: e.target.value })}
                    placeholder="First name"
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1">
                    Middle Initial
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    value={newStaffForm.middleInitial}
                    onChange={e => setNewStaffForm({ ...newStaffForm, middleInitial: e.target.value })}
                    placeholder="M.I."
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newStaffForm.lastName}
                    onChange={e => setNewStaffForm({ ...newStaffForm, lastName: e.target.value })}
                    placeholder="Last name"
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
              </div>

              {/* Row 2: Role, Status, Hire Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1">
                    Job Title / Role
                  </label>
                  <input
                    type="text"
                    value={newStaffForm.role}
                    onChange={e => setNewStaffForm({ ...newStaffForm, role: e.target.value })}
                    placeholder="e.g. Dispatcher"
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1">
                    Status
                  </label>
                  <select
                    value={newStaffForm.status}
                    onChange={e => setNewStaffForm({ ...newStaffForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1">
                    Hire Date
                  </label>
                  <input
                    type="date"
                    value={newStaffForm.hireDate}
                    onChange={e => setNewStaffForm({ ...newStaffForm, hireDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
              </div>

              {/* Row 3: Phones & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1">
                    Personal Phone
                  </label>
                  <input
                    type="tel"
                    value={newStaffForm.personalPhone}
                    onChange={e => setNewStaffForm({ ...newStaffForm, personalPhone: e.target.value })}
                    placeholder="(441) 500-0000"
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1">
                    Work Phone
                  </label>
                  <input
                    type="tel"
                    value={newStaffForm.workPhone}
                    onChange={e => setNewStaffForm({ ...newStaffForm, workPhone: e.target.value })}
                    placeholder="(441) 295-4141"
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    value={newStaffForm.email}
                    onChange={e => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                    placeholder="name@centraldispatch.bm"
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
              </div>

              {/* Row 4: Address */}
              <div>
                <label className="block text-xs font-bold text-[#456078] mb-1">
                  Physical / Mailing Address
                </label>
                <input
                  type="text"
                  value={newStaffForm.address}
                  onChange={e => setNewStaffForm({ ...newStaffForm, address: e.target.value })}
                  placeholder="3 Laffan Street, Pembroke HM09, Bermuda"
                  className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                />
              </div>

              {/* Row 5: Emergency Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    value={newStaffForm.emergencyName}
                    onChange={e => setNewStaffForm({ ...newStaffForm, emergencyName: e.target.value })}
                    placeholder="Full name"
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    value={newStaffForm.emergencyPhone}
                    onChange={e => setNewStaffForm({ ...newStaffForm, emergencyPhone: e.target.value })}
                    placeholder="(441) 500-0000"
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#456078] mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    value={newStaffForm.emergencyRelation}
                    onChange={e => setNewStaffForm({ ...newStaffForm, emergencyRelation: e.target.value })}
                    placeholder="Spouse / Parent / Sibling"
                    className="w-full px-3.5 py-2 bg-white border border-[#bdcbd9] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-bold text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-extrabold rounded-xl shadow-md transition-all active:scale-95"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

