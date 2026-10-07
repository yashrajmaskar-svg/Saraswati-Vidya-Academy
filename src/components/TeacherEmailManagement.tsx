import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Teacher } from '../types';
import {
  getTeachers,
  createTeacher,
  updateTeacher,
  toggleTeacherStatus,
  deleteTeacher,
} from '../services/schoolService';
import { createTeacherAccountByPrincipal } from '../services/authService';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  BookOpen,
  X,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Send,
  UserCheck,
  UserX,
  Lock,
} from 'lucide-react';

interface TeacherEmailManagementProps {
  onOpenEmailLogs?: () => void;
}

export const TeacherEmailManagement: React.FC<TeacherEmailManagementProps> = ({ onOpenEmailLogs }) => {
  const { profile, isPrincipal } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [initialPassword, setInitialPassword] = useState('Teacher@123');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [creationSuccessNotice, setCreationSuccessNotice] = useState<string | null>(null);

  // Delete modal
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Status toggle confirmation
  const [togglingTeacher, setTogglingTeacher] = useState<Teacher | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getTeachers();
      setTeachers(data);
    } catch (err) {
      console.error('Failed to load teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingTeacher(null);
    setName('');
    setEmail('');
    setInitialPassword('Teacher@123');
    setPhone('');
    setSubject('');
    setActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setName(teacher.name);
    setEmail(teacher.email);
    setPhone(teacher.phone || '');
    setSubject(teacher.subject || '');
    setActive(teacher.active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Teacher name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('A valid email address is required for announcement broadcasts.');
      return;
    }

    setSaving(true);
    setFormError(null);
    setCreationSuccessNotice(null);

    try {
      if (editingTeacher) {
        await updateTeacher(
          editingTeacher.id,
          {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            subject: subject.trim(),
            active,
          },
          profile?.name || 'Principal'
        );
        setCreationSuccessNotice(`Teacher record for ${name.trim()} updated successfully.`);
      } else {
        const authRes = await createTeacherAccountByPrincipal({
          name: name.trim(),
          email: email.trim(),
          initialPassword: initialPassword.trim() || 'Teacher@123',
        });

        await createTeacher({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject: subject.trim(),
          active: true,
          createdBy: profile?.name || 'Principal',
        });

        setCreationSuccessNotice(
          `Teacher account for ${name.trim()} created with role "teacher"! Initial Password: ${initialPassword.trim() || 'Teacher@123'}`
        );
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save teacher record.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!togglingTeacher) return;
    try {
      await toggleTeacherStatus(
        togglingTeacher.id,
        !togglingTeacher.active,
        profile?.name || 'Principal'
      );
      setTogglingTeacher(null);
      await loadData();
    } catch (err) {
      console.error('Failed to toggle teacher status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTeacher(id);
      setDeletingId(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete teacher:', err);
    }
  };

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subject && t.subject.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? t.active !== false
        : t.active === false;

    return matchesSearch && matchesStatus;
  });

  const activeCount = teachers.filter(t => t.active !== false).length;
  const inactiveCount = teachers.filter(t => t.active === false).length;

  if (!isPrincipal) {
    return (
      <div className="bg-red-50 border border-red-200 p-8 rounded-2xl text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-2" />
        <h3 className="font-bold text-red-900">Access Restricted</h3>
        <p className="text-xs text-red-700 mt-1">
          Teacher Email Management is strictly restricted to the School Principal / Administrator role.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header (Requirement 11) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Staff Directory & Dispatch
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">Faculty Governance</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 font-serif">
            Teacher Email Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain active faculty directory and verify recipient addresses for official broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>+ Add Teacher</span>
          </button>

          {onOpenEmailLogs && (
            <button
              type="button"
              onClick={onOpenEmailLogs}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>Email Logs</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadData}
            title="Refresh Directory"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {creationSuccessNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-start gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{creationSuccessNotice}</div>
          <button
            type="button"
            onClick={() => setCreationSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-950"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Toolbar: Search & Filter Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by faculty name, email, department..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter Segment */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Teachers ({teachers.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              statusFilter === 'inactive'
                ? 'bg-white text-amber-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Deactivated ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Teacher Directory Table (Requirement 11) */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <RefreshCw className="w-6 h-6 text-blue-950 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading faculty directory...</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Teachers Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? 'No teachers match your search filters.'
              : 'Add your first teacher record to begin dispatching automated emails.'}
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-950 text-white rounded-xl text-xs font-bold"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Add First Teacher</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-5">Teacher Full Name</th>
                  <th className="py-3.5 px-5">Official Email</th>
                  <th className="py-3.5 px-5">Subject / Department</th>
                  <th className="py-3.5 px-5">Dispatch Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map(teacher => {
                  const isActive = teacher.active !== false;

                  return (
                    <tr key={teacher.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Monogram */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-950 font-bold flex items-center justify-center shrink-0 border border-blue-200/60">
                            {teacher.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">
                              {teacher.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Faculty Member
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-5 font-mono text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{teacher.email}</span>
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="py-4 px-5 text-slate-700 font-medium">
                        {teacher.subject ? (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-md">
                            <BookOpen className="w-3 h-3 text-slate-500" />
                            {teacher.subject}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">General Staff</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <button
                          type="button"
                          onClick={() => setTogglingTeacher(teacher)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                          }`}
                          title={isActive ? 'Click to deactivate teacher' : 'Click to activate teacher'}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Active (Receives Emails)</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Deactivated (Muted)</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions (Requirement 11) */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(teacher)}
                            className="p-1.5 text-slate-400 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Teacher"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTogglingTeacher(teacher)}
                            className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title={isActive ? 'Deactivate teacher' : 'Activate teacher'}
                          >
                            {isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(teacher.id)}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Teacher"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TEACHER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingTeacher ? 'Edit Teacher Record' : 'Add New Teacher'}
                </h3>
                <p className="text-xs text-slate-500">
                  Registered in Firebase Auth & Firestore directory
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mrs. Sunita Sharma"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="sunita.sharma@saraswatividya.edu.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                />
              </div>

              {!editingTeacher && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Initial Portal Password
                  </label>
                  <input
                    type="text"
                    required
                    value={initialPassword}
                    onChange={e => setInitialPassword(e.target.value)}
                    placeholder="Teacher@123"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 bg-slate-50"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Teacher can log in with this password immediately.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Subject / Dept
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. English Literature"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold bg-blue-950 hover:bg-blue-900 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  {saving ? 'Saving...' : editingTeacher ? 'Update Teacher' : 'Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOGGLE STATUS CONFIRMATION MODAL */}
      {togglingTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
                togglingTeacher.active ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {togglingTeacher.active ? <XCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {togglingTeacher.active ? 'Deactivate Teacher?' : 'Activate Teacher?'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {togglingTeacher.active ? (
                <>Deactivating <strong>{togglingTeacher.name}</strong> will mute announcement email dispatches to <strong>{togglingTeacher.email}</strong>.</>
              ) : (
                <>Activating <strong>{togglingTeacher.name}</strong> will resume official announcement emails to <strong>{togglingTeacher.email}</strong>.</>
              )}
            </p>
            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setTogglingTeacher(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer ${
                  togglingTeacher.active
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {togglingTeacher.active ? 'Yes, Deactivate' : 'Yes, Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE TEACHER CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Teacher Record?</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              This action removes the teacher from the staff database and future announcement recipients.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
