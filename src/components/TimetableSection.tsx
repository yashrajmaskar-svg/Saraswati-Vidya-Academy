import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TimetableEntry, Weekday } from '../types';
import {
  getTimetable,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
} from '../services/schoolService';
import {
  CalendarRange,
  Plus,
  Edit2,
  Trash2,
  Clock,
  MapPin,
  User,
  BookOpen,
  X,
  RefreshCw,
  Calendar,
  AlertCircle,
  Building,
} from 'lucide-react';

const WEEKDAYS: Weekday[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const TimetableSection: React.FC = () => {
  const { profile, isPrincipal } = useAuth();
  const [selectedDay, setSelectedDay] = useState<Weekday>('Monday');
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TimetableEntry | null>(null);
  const [period, setPeriod] = useState('Period 1');
  const [subject, setSubject] = useState('');
  const [teacher, setTeacher] = useState('');
  const [startTime, setStartTime] = useState('08:30 AM');
  const [endTime, setEndTime] = useState('09:20 AM');
  const [room, setRoom] = useState('Room 201');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async (day: Weekday) => {
    setLoading(true);
    try {
      const data = await getTimetable(day);
      setEntries(data);
    } catch (err) {
      console.error('Failed to load timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDay);
  }, [selectedDay]);

  const openCreateModal = () => {
    setEditingItem(null);
    setPeriod(`Period ${entries.length + 1}`);
    setSubject('');
    setTeacher('');
    setStartTime('08:30 AM');
    setEndTime('09:20 AM');
    setRoom('Room 201');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: TimetableEntry) => {
    setEditingItem(item);
    setPeriod(item.period);
    setSubject(item.subject);
    setTeacher(item.teacher);
    setStartTime(item.startTime);
    setEndTime(item.endTime);
    setRoom(item.room);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !teacher.trim() || !room.trim()) {
      setFormError('Subject, faculty teacher name, and classroom are required.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (editingItem) {
        await updateTimetableEntry(editingItem.id, {
          period,
          subject: subject.trim(),
          teacher: teacher.trim(),
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          room: room.trim(),
        });
      } else {
        await createTimetableEntry({
          day: selectedDay,
          period,
          subject: subject.trim(),
          teacher: teacher.trim(),
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          room: room.trim(),
          createdBy: profile?.name || 'Principal',
        });
      }

      setIsModalOpen(false);
      await loadData(selectedDay);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save timetable period.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTimetableEntry(id);
      setDeletingId(null);
      await loadData(selectedDay);
    } catch (err) {
      console.error('Failed to delete timetable entry:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Academic Schedule
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">Daily Periods</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 font-serif">
            School Master Timetable
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Class periods, subject allocations, faculty assignments, and room locations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isPrincipal && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>+ Add Period ({selectedDay})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => loadData(selectedDay)}
            title="Refresh Timetable"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Switcher (Requirement 10) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs flex flex-wrap gap-1.5">
        {WEEKDAYS.map(day => (
          <button
            key={day}
            type="button"
            onClick={() => setSelectedDay(day)}
            className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
              selectedDay === day
                ? 'bg-blue-950 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Timetable Table & Cards (Requirement 10) */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <RefreshCw className="w-6 h-6 text-blue-950 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading {selectedDay} schedule...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <CalendarRange className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Periods Configured for {selectedDay}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {isPrincipal
              ? 'Click "+ Add Period" above to configure class periods, teachers, and rooms for this day.'
              : 'There are no scheduled class periods recorded for this day yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Desktop Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-5">Period</th>
                  <th className="py-3.5 px-5">Time Window</th>
                  <th className="py-3.5 px-5">Subject</th>
                  <th className="py-3.5 px-5">Faculty Assigned</th>
                  <th className="py-3.5 px-5">Classroom</th>
                  {isPrincipal && <th className="py-3.5 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry, idx) => (
                  <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-5 font-bold text-slate-900">
                      <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-900 px-2.5 py-1 rounded-md border border-blue-200/60 font-mono">
                        {entry.period}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-slate-600 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{entry.startTime} – {entry.endTime}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-900 text-sm">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-900" />
                        <span>{entry.subject}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-slate-700 font-medium">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{entry.teacher}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 font-semibold px-2.5 py-1 rounded-md">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {entry.room}
                      </span>
                    </td>
                    {isPrincipal && (
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(entry)}
                            className="p-1.5 text-slate-400 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Period"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(entry.id)}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Period"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TIMETABLE MODAL */}
      {isModalOpen && isPrincipal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center">
                <CalendarRange className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingItem ? 'Edit Class Period' : `Add Period for ${selectedDay}`}
                </h3>
                <p className="text-xs text-slate-500">
                  Daily period allocation and room coordination
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Period Label
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Period 1"
                    value={period}
                    onChange={e => setPeriod(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics / Physics"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 08:30 AM"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09:20 AM"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Faculty Assigned
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mr. Rajesh Sharma"
                    value={teacher}
                    onChange={e => setTeacher(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Classroom / Lab
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 204 / Physics Lab"
                    value={room}
                    onChange={e => setRoom(e.target.value)}
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
                  {saving ? 'Saving...' : editingItem ? 'Update Period' : 'Save Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && isPrincipal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Class Period?</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              This will remove this period from the master schedule for {selectedDay}.
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
