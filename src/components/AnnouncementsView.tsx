import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Announcement, SchoolSettings } from '../types';
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  dispatchAnnouncementEmails,
  getActiveTeacherEmails,
} from '../services/schoolService';
import {
  Megaphone,
  Send,
  Mail,
  Trash2,
  Calendar,
  X,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info,
  Clock,
  Plus,
  ChevronDown,
  ChevronUp,
  User,
  Users,
  Shield,
  Layers,
} from 'lucide-react';

interface AnnouncementsViewProps {
  settings?: SchoolSettings;
  onOpenEmailLogs?: () => void;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({ settings, onOpenEmailLogs }) => {
  const { profile, isPrincipal } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states for creating announcement
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'Normal' | 'Important' | 'Urgent'>('Normal');
  const [date, setDate] = useState(
    new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  );
  const [time, setTime] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [sending, setSending] = useState(false);
  const [sendStage, setSendStage] = useState<'idle' | 'preparing' | 'sending' | 'sent' | 'failed'>('idle');
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Delete modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSend = async (_sendEmail: boolean = true) => {
    setStatusFeedback(null);
    if (!title.trim() || !message.trim()) {
      setStatusFeedback({
        type: 'error',
        text: 'Please enter both Announcement Title and Message Content.',
      });
      return;
    }

    setSending(true);
    setSendStage('preparing');

    const timeoutPromise = new Promise<{ timeout: true }>((_, reject) => {
      setTimeout(() => reject(new Error('Email service timed out. Please check your Google Apps Script connection.')), 35000);
    });

    try {
      // 1. Save announcement to existing Firestore announcements collection
      const fullDate = `${date.trim() || new Date().toLocaleDateString('en-GB')} at ${time.trim() || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const created = await createAnnouncement({
        title: title.trim(),
        message: message.trim(),
        priority,
        date: fullDate,
        sendEmail: true,
        createdBy: profile?.name || 'Principal',
      });

      // 2. Get ALL ACTIVE teacher email addresses from Firestore
      setSendStage('sending');
      const activeTeacherEmails = await getActiveTeacherEmails();

      // If zero active teachers found, report clearly without failing announcement creation
      if (activeTeacherEmails.length === 0) {
        setSendStage('sent');
        setStatusFeedback({
          type: 'info',
          text: '✓ Announcement saved to notice board, but no active teacher emails were available in Teacher Email Management.',
        });
        setTitle('');
        setMessage('');
        setPriority('Normal');
        setDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
        setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        await loadData();
        return;
      }

      // 3. Dispatch to saved Google Apps Script Web App URL via secure server proxy
      const dispatchRes = await Promise.race([
        dispatchAnnouncementEmails(created, activeTeacherEmails),
        timeoutPromise as Promise<any>,
      ]);

      if (dispatchRes.success) {
        setSendStage('sent');
        setStatusFeedback({
          type: 'success',
          text: dispatchRes.message,
        });

        // Reset form on success
        setTitle('');
        setMessage('');
        setPriority('Normal');
        setDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
        setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setIsFormOpen(false);
      } else {
        setSendStage('failed');
        const rawErr = dispatchRes.message || 'Unknown error occurred.';
        setStatusFeedback({
          type: 'error',
          text: rawErr.startsWith('Email delivery failed') ? rawErr : `Email delivery failed: ${rawErr}`,
        });
      }

      await loadData();
    } catch (err: any) {
      setSendStage('failed');
      setStatusFeedback({
        type: 'error',
        text: err.message || 'Failed to send announcement.',
      });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncement(id);
      setDeletingId(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete announcement:', err);
    }
  };

  const filteredAnnouncements = announcements.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Page Header (Requirement 6) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Official School Dispatches
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">Real-Time Hub</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 font-serif">
            Official Announcements
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Published institutional notices and automated faculty email broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isPrincipal && (
            <button
              type="button"
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className={`w-4 h-4 transition-transform ${isFormOpen ? 'rotate-45' : ''}`} />
              <span>{isFormOpen ? 'Close Composer' : '+ Create Announcement'}</span>
            </button>
          )}

          {isPrincipal && onOpenEmailLogs && (
            <button
              type="button"
              onClick={onOpenEmailLogs}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Inspect delivery audit logs"
            >
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Audit Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* Creation Composer Form (Principal Only) */}
      {isPrincipal && isFormOpen && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Compose Official Announcement
                </h3>
                <p className="text-[11px] text-slate-500">
                  Direct publish to notice board & dispatch via Google Apps Script
                </p>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Google Apps Script Ready</span>
            </div>
          </div>

          {/* Feedback Banner */}
          {statusFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs leading-relaxed flex items-start gap-2.5 border ${
                statusFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : statusFeedback.type === 'info'
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : statusFeedback.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {statusFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {statusFeedback.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
              {statusFeedback.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
              {statusFeedback.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
              <span>{statusFeedback.text}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Annual Sports Meet 2026 Schedule & Guidelines"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-slate-900 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 bg-white"
                >
                  <option value="Normal">Normal</option>
                  <option value="Important">Important</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Date
                </label>
                <input
                  type="text"
                  placeholder="e.g. 15 Oct 2026"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 09:30 AM"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Message Content
              </label>
              <textarea
                rows={5}
                placeholder="Type the official message for staff and notice board..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 bg-white leading-relaxed"
              />
            </div>

            {/* Action Buttons (Requirement 6 & Google Apps Script integration) */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => handleSend(false)}
                  className="px-5 py-2.5 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-amber-300" />
                  <span>{sending ? 'Sending...' : 'Send Announcement'}</span>
                </button>

                <button
                  type="button"
                  disabled={sending}
                  onClick={() => handleSend(true)}
                  className={`px-5 py-2.5 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer ${
                    sendStage === 'sent'
                      ? 'bg-emerald-600'
                      : sendStage === 'failed'
                      ? 'bg-rose-700 hover:bg-rose-800'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>
                    {sendStage === 'preparing'
                      ? 'Preparing...'
                      : sendStage === 'sending'
                      ? 'Sending...'
                      : sendStage === 'sent'
                      ? 'Sent ✓'
                      : sendStage === 'failed'
                      ? 'Failed (Retry)'
                      : 'Send by Email'}
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500">
                Dispatches to all active verified faculty members.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by title or content..."
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

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500">
          <span>Showing {filteredAnnouncements.length} announcements</span>
          <button
            onClick={loadData}
            title="Refresh announcements list"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Announcements List (Requirement 6: Professional cards) */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <RefreshCw className="w-6 h-6 text-blue-950 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading institutional announcements...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Announcements Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? 'No announcements match your search criteria. Try a different keyword.'
              : 'There are currently no active announcements published for Saraswati Vidya Academy.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map(ann => {
            const isExpanded = expandedCardId === ann.id;
            const isUrgent = ann.priority === 'Urgent';
            const isImportant = ann.priority === 'Important';

            return (
              <div
                key={ann.id}
                className={`bg-white rounded-2xl border shadow-xs hover:shadow-md transition-all p-5 sm:p-6 relative overflow-hidden ${
                  isUrgent
                    ? 'border-red-200 ring-1 ring-red-100'
                    : isImportant
                    ? 'border-amber-200 ring-1 ring-amber-100'
                    : 'border-slate-200/80'
                }`}
              >
                {/* Left subtle authority accent line */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    isUrgent ? 'bg-red-600' : isImportant ? 'bg-amber-500' : 'bg-blue-900'
                  }`}
                />

                {/* Card Header & Status Badges (Requirement 6) */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mb-1.5">
                      {/* Priority indicator */}
                      <span
                        className={`font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                          isUrgent
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : isImportant
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-blue-50 text-blue-900 border border-blue-200'
                        }`}
                      >
                        ● {ann.priority || 'Normal'}
                      </span>

                      {/* Status badge: Published / Sent */}
                      <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Published</span>
                      </span>

                      {/* Recipient information badge */}
                      <span className="text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>All Faculty Teachers</span>
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-slate-900 leading-snug">
                      {ann.title}
                    </h4>
                  </div>

                  {/* Metadata and Controls */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ann.date || new Date(ann.createdAt).toLocaleDateString('en-GB')}</span>
                    </div>

                    {isPrincipal && (
                      <button
                        type="button"
                        onClick={() => setDeletingId(ann.id)}
                        className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete announcement from hub"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Message Body Preview & Full expand */}
                <div className="mt-2 text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                  {isExpanded ? ann.message : (
                    ann.message.length > 280 ? `${ann.message.slice(0, 280)}...` : ann.message
                  )}
                </div>

                {ann.message.length > 280 && (
                  <button
                    type="button"
                    onClick={() => setExpandedCardId(isExpanded ? null : ann.id)}
                    className="mt-2 text-xs font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Show less' : 'Read full message'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}

                {/* Card Footer: Attribution & Metadata */}
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Dispatched by: <strong className="text-slate-700">{ann.createdBy || 'Principal'}</strong></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-400">Ref: {ann.id.slice(0, 8)}</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Google Apps Script Email Active
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal (Requirement 22) */}
      {deletingId && isPrincipal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Announcement?</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              This action will remove this official announcement permanently from the school communication hub.
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
