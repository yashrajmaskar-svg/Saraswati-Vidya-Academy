import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ScheduleItem,
  MeetingItem,
  CompetitionItem,
  SchoolEvent,
} from '../types';
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getCompetitions,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../services/schoolService';
import {
  CalendarDays,
  Users,
  Trophy,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Clock,
  MapPin,
  Search,
  X,
  RefreshCw,
  FileText,
  AlertCircle,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface Props {
  initialTab?: 'schedules' | 'meetings' | 'competitions' | 'events';
}

export const SchedulesMeetingsCompetitionsView: React.FC<Props> = ({
  initialTab = 'events',
}) => {
  const { profile, isPrincipal } = useAuth();
  const [activeTab, setActiveTab] = useState<'schedules' | 'meetings' | 'competitions' | 'events'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Data lists
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'schedule' | 'meeting' | 'competition' | 'event'>('event');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [locationOrVenue, setLocationOrVenue] = useState('');
  const [descriptionOrAgenda, setDescriptionOrAgenda] = useState('');
  const [category, setCategory] = useState('');
  const [eligibility, setEligibility] = useState('');

  // Delete confirmation
  const [deletingInfo, setDeletingInfo] = useState<{ id: string; type: 'schedule' | 'meeting' | 'competition' | 'event' } | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [schedList, meetList, compList, eventList] = await Promise.all([
        getSchedules(),
        getMeetings(),
        getCompetitions(),
        getEvents(),
      ]);
      setSchedules(schedList);
      setMeetings(meetList);
      setCompetitions(compList);
      setEvents(eventList);
    } catch (err) {
      console.error('Failed to load schedule/events data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const openCreateModal = (type: 'schedule' | 'meeting' | 'competition' | 'event') => {
    setModalType(type);
    setEditingItem(null);
    setTitle('');
    setDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
    setTime('10:00 AM');
    setLocationOrVenue('Auditorium / Campus');
    setDescriptionOrAgenda('');
    setCategory('Academic');
    setEligibility('All Students');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any, type: 'schedule' | 'meeting' | 'competition' | 'event') => {
    setModalType(type);
    setEditingItem(item);
    setTitle(item.title || '');
    setDate(item.date || item.eventDate || '');
    setTime(item.time || item.startTime || '');
    setLocationOrVenue(item.location || item.venue || '');
    setDescriptionOrAgenda(item.description || item.agenda || item.details || '');
    setCategory(item.category || 'Academic');
    setEligibility(item.eligibility || 'All Students');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Title is required.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (modalType === 'event') {
        if (editingItem) {
          await updateEvent(editingItem.id, {
            title: title.trim(),
            eventDate: date.trim(),
            startTime: time.trim(),
            location: locationOrVenue.trim(),
            description: descriptionOrAgenda.trim(),
          });
        } else {
          await createEvent({
            title: title.trim(),
            eventDate: date.trim(),
            startTime: time.trim(),
            location: locationOrVenue.trim(),
            description: descriptionOrAgenda.trim(),
            createdBy: profile?.name || 'Principal',
          });
        }
      } else if (modalType === 'schedule') {
        if (editingItem) {
          await updateSchedule(editingItem.id, {
            title: title.trim(),
            date: date.trim(),
            time: time.trim(),
            location: locationOrVenue.trim(),
            description: descriptionOrAgenda.trim(),
          });
        } else {
          await createSchedule({
            title: title.trim(),
            date: date.trim(),
            time: time.trim(),
            location: locationOrVenue.trim(),
            description: descriptionOrAgenda.trim(),
            createdBy: profile?.name || 'Principal',
          });
        }
      } else if (modalType === 'meeting') {
        if (editingItem) {
          await updateMeeting(editingItem.id, {
            title: title.trim(),
            date: date.trim(),
            time: time.trim(),
            venue: locationOrVenue.trim(),
            agenda: descriptionOrAgenda.trim(),
          });
        } else {
          await createMeeting({
            title: title.trim(),
            date: date.trim(),
            time: time.trim(),
            venue: locationOrVenue.trim(),
            agenda: descriptionOrAgenda.trim(),
            createdBy: profile?.name || 'Principal',
          });
        }
      } else if (modalType === 'competition') {
        if (editingItem) {
          await updateCompetition(editingItem.id, {
            title: title.trim(),
            category: category.trim(),
            date: date.trim(),
            eligibility: eligibility.trim(),
            details: descriptionOrAgenda.trim(),
          });
        } else {
          await createCompetition({
            title: title.trim(),
            category: category.trim(),
            date: date.trim(),
            eligibility: eligibility.trim(),
            details: descriptionOrAgenda.trim(),
            createdBy: profile?.name || 'Principal',
          });
        }
      }

      setIsModalOpen(false);
      await loadAllData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingInfo) return;
    try {
      if (deletingInfo.type === 'event') await deleteEvent(deletingInfo.id);
      else if (deletingInfo.type === 'schedule') await deleteSchedule(deletingInfo.id);
      else if (deletingInfo.type === 'meeting') await deleteMeeting(deletingInfo.id);
      else if (deletingInfo.type === 'competition') await deleteCompetition(deletingInfo.id);

      setDeletingInfo(null);
      await loadAllData();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Institutional Calendar
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">Activity Coordination</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 font-serif">
            Schedules & Events
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Academic calendar, staff briefings, competitions, and institutional functions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isPrincipal && (
            <button
              type="button"
              onClick={() => openCreateModal(modalType)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>+ Add {activeTab === 'events' ? 'School Event' : activeTab === 'meetings' ? 'Staff Meeting' : activeTab === 'competitions' ? 'Competition' : 'Schedule'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadAllData}
            title="Refresh Schedules"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Segmented Sub-Navigation (Events, Schedules, Meetings, Competitions) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setActiveTab('events'); setModalType('event'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'events'
              ? 'bg-blue-950 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-amber-300" />
          <span>School Events ({events.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('schedules'); setModalType('schedule'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'schedules'
              ? 'bg-blue-950 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-300" />
          <span>Academic Schedules ({schedules.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('meetings'); setModalType('meeting'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'meetings'
              ? 'bg-blue-950 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-amber-300" />
          <span>Staff Meetings ({meetings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('competitions'); setModalType('competition'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'competitions'
              ? 'bg-blue-950 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-300" />
          <span>Competitions & Sports ({competitions.length})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search dates, subjects, venues..."
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
      </div>

      {/* TAB 1: SCHOOL EVENTS (Calendar-Style Cards, Requirement 9) */}
      {activeTab === 'events' && (
        <div>
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <RefreshCw className="w-6 h-6 text-blue-950 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">Loading school events calendar...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Events Scheduled</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Your upcoming school events will appear here once published by the Principal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {events
                .filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()) || (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase())))
                .map(event => (
                  <div
                    key={event.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start gap-3.5 mb-3">
                        {/* Big Calendar Date Badge */}
                        <div className="w-13 rounded-2xl bg-slate-950 text-white p-2.5 text-center shrink-0 shadow-xs border border-amber-400/30">
                          <span className="block text-[10px] font-bold uppercase text-amber-300">
                            {new Date(event.eventDate).toLocaleString('default', { month: 'short' })}
                          </span>
                          <span className="block text-xl font-black leading-tight text-white">
                            {new Date(event.eventDate).getDate() || '—'}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            Institutional Event
                          </span>
                          <h4 className="text-base font-bold text-slate-900 mt-1 leading-snug group-hover:text-blue-900 transition-colors">
                            {event.title}
                          </h4>
                        </div>
                      </div>

                      {/* Event Meta: Time & Venue */}
                      <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{event.startTime}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>

                      {event.description && (
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {isPrincipal && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(event, 'event')}
                          className="p-1.5 text-slate-400 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Event"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingInfo({ id: event.id, type: 'event' })}
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SCHEDULES */}
      {activeTab === 'schedules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {schedules.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono font-bold text-slate-700">{item.date}</span>
                  <span>·</span>
                  <span>{item.time}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
                {item.location && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{item.location}</span>
                  </p>
                )}
                {item.description && (
                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">{item.description}</p>
                )}
              </div>
              {isPrincipal && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                  <button onClick={() => openEditModal(item, 'schedule')} className="p-1.5 text-slate-400 hover:text-blue-900 rounded-lg">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeletingInfo({ id: item.id, type: 'schedule' })} className="p-1.5 text-slate-400 hover:text-red-700 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: MEETINGS */}
      {activeTab === 'meetings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {meetings.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <span className="bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded text-[10px]">Staff Meeting</span>
                  <span className="font-mono font-bold text-slate-700">{item.date}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>Venue: {item.venue} ({item.time})</span>
                </p>
                {item.agenda && (
                  <div className="text-xs text-slate-700 mt-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <strong>Agenda:</strong> {item.agenda}
                  </div>
                )}
              </div>
              {isPrincipal && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                  <button onClick={() => openEditModal(item, 'meeting')} className="p-1.5 text-slate-400 hover:text-blue-900 rounded-lg">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeletingInfo({ id: item.id, type: 'meeting' })} className="p-1.5 text-slate-400 hover:text-red-700 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: COMPETITIONS */}
      {activeTab === 'competitions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {competitions.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    {item.category}
                  </span>
                  <span className="font-mono font-bold text-slate-700">{item.date}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
                {item.eligibility && (
                  <p className="text-xs text-slate-500 mt-1">
                    Eligibility: <strong>{item.eligibility}</strong>
                  </p>
                )}
                {item.details && (
                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">{item.details}</p>
                )}
              </div>
              {isPrincipal && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                  <button onClick={() => openEditModal(item, 'competition')} className="p-1.5 text-slate-400 hover:text-blue-900 rounded-lg">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeletingInfo({ id: item.id, type: 'competition' })} className="p-1.5 text-slate-400 hover:text-red-700 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CREATE / EDIT */}
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
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingItem ? 'Edit Calendar Entry' : `Schedule New ${modalType}`}
                </h3>
                <p className="text-xs text-slate-500">
                  Campus calendar and faculty schedule records
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
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Title / Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Sports Meet 2026 Opening Ceremony"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 18 Oct 2026"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 09:30 AM"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Location / Venue
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main Auditorium / Sports Pavilion"
                  value={locationOrVenue}
                  onChange={e => setLocationOrVenue(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                />
              </div>

              {modalType === 'competition' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Athletics / Debate"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Eligibility
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Grades 8 to 12"
                      value={eligibility}
                      onChange={e => setEligibility(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Description / Agenda Details
                </label>
                <textarea
                  rows={4}
                  placeholder="Additional event agenda, rules, or briefing..."
                  value={descriptionOrAgenda}
                  onChange={e => setDescriptionOrAgenda(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                />
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
                  {saving ? 'Saving...' : editingItem ? 'Update Entry' : 'Schedule Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingInfo && isPrincipal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Remove Entry?</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              This action will remove this calendar record from the school agenda.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingInfo(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
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
