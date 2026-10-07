import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SchoolSettings, Announcement, Circular, SchoolEvent, TimetableEntry, Teacher, EmailLog } from '../types';
import {
  getAnnouncements,
  getCirculars,
  getEvents,
  getTimetable,
  getTeachers,
  getEmailLogs,
} from '../services/schoolService';
import {
  Megaphone,
  FileText,
  CalendarDays,
  CalendarRange,
  Users,
  Settings,
  Shield,
  GraduationCap,
  ArrowRight,
  Plus,
  Clock,
  Sparkles,
  MapPin,
  MailCheck,
  TrendingUp,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface DashboardHomeProps {
  settings: SchoolSettings;
  onNavigate: (section: string) => void;
  onOpenEmailLogs: () => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  settings,
  onNavigate,
  onOpenEmailLogs,
}) => {
  const { profile, isPrincipal } = useAuth();
  const [counts, setCounts] = useState({
    announcements: 0,
    circulars: 0,
    events: 0,
    teachers: 0,
    activeTeachers: 0,
    timetablePeriods: 0,
    emailSuccessRate: 100,
    totalEmailsSent: 0,
  });

  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [recentCirculars, setRecentCirculars] = useState<Circular[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<SchoolEvent[]>([]);
  const [recentTimetable, setRecentTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const [anns, circs, evts, tts, tchs, logs] = await Promise.all([
          getAnnouncements(isPrincipal),
          getCirculars(),
          getEvents(),
          getTimetable(),
          isPrincipal ? getTeachers() : Promise.resolve([]),
          isPrincipal ? getEmailLogs() : Promise.resolve([]),
        ]);

        const activeTchs = tchs.filter(t => t.active !== false).length;
        const totalLogs = logs.length;
        const sentLogs = logs.filter(l => l.status === 'sent').length;
        const successRate = totalLogs > 0 ? Math.round((sentLogs / totalLogs) * 100) : 100;

        setCounts({
          announcements: anns.length,
          circulars: circs.length,
          events: evts.length,
          timetablePeriods: tts.length,
          teachers: tchs.length,
          activeTeachers: activeTchs,
          emailSuccessRate: successRate,
          totalEmailsSent: sentLogs,
        });

        setRecentAnnouncements(anns.slice(0, 4));
        setRecentCirculars(circs.slice(0, 3));
        setUpcomingEvents(evts.slice(0, 4));
        setRecentTimetable(tts.slice(0, 3));
      } catch (err) {
        console.error('Failed to load overview counters:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [isPrincipal]);

  const schoolName = settings.institutionName || settings.schoolName || 'Saraswati Vidya Academy';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* 1. WELCOME SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white p-7 sm:p-9 shadow-lg border border-slate-800/80">
        <div className="absolute right-0 top-0 bottom-0 opacity-5 flex items-center pr-10 pointer-events-none select-none">
          <span className="text-[160px] font-serif font-black">SVA</span>
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-white/15">
              {isPrincipal ? <Shield className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
              {isPrincipal ? 'Principal Administration Console' : 'Faculty Member Portal'}
            </span>
            <span className="hidden sm:inline text-xs text-slate-400">·</span>
            <span className="hidden sm:inline text-xs text-slate-300">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-serif text-white leading-tight">
            {getGreeting()}, {isPrincipal ? 'Principal' : (profile?.name || 'Faculty Member')}
          </h2>
          
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed font-light">
            Welcome to the <strong className="font-semibold text-white">SVA School Communication Hub</strong> — official administration and real-time faculty dispatches for {schoolName}.
          </p>

          <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-5 text-xs text-slate-400">
            <div>
              Campus: <span className="text-white font-medium">{settings.schoolAddress || 'Main Campus'}</span>
            </div>
            <div>
              Leadership: <span className="text-white font-medium">{settings.principalName || 'Principal Office'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Google Apps Script Email Service Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. QUICK ACTION BAR (Principal prominent actions) */}
      {isPrincipal && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Quick Administrative Actions
            </h3>
            <span className="text-[11px] text-slate-400">One-click creation workflows</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => onNavigate('announcements')}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 text-slate-900 transition-all text-xs font-bold shadow-2xs group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-950 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Plus className="w-4 h-4 text-amber-300" />
              </div>
              <span className="truncate">New Announcement</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('circulars')}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-300 text-slate-900 transition-all text-xs font-bold shadow-2xs group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Plus className="w-4 h-4" />
              </div>
              <span className="truncate">New Circular</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('events')}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 text-slate-900 transition-all text-xs font-bold shadow-2xs group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Plus className="w-4 h-4" />
              </div>
              <span className="truncate">Add Event</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('timetable')}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 text-slate-900 transition-all text-xs font-bold shadow-2xs group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <CalendarRange className="w-4 h-4" />
              </div>
              <span className="truncate">Update Timetable</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('teachers')}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-purple-50/70 border border-slate-200 hover:border-purple-300 text-slate-900 transition-all text-xs font-bold shadow-2xs group cursor-pointer col-span-2 sm:col-span-1"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <span className="truncate">Manage Teachers</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. FOUR CORE STATISTICS CARDS (Requirement 3) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Key Institutional Metrics
          </h3>
          {isPrincipal && (
            <button
              onClick={onOpenEmailLogs}
              className="text-xs text-blue-900 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Email Delivery Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Teachers */}
          <div
            onClick={() => isPrincipal && onNavigate('teachers')}
            className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all group ${
              isPrincipal ? 'cursor-pointer hover:border-purple-300' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total Teachers
              </span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {counts.teachers}
              </span>
              <span className="text-xs text-slate-500 font-medium">registered</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
              <span>Staff directory records</span>
            </p>
          </div>

          {/* Card 2: Active Teachers */}
          <div
            onClick={() => isPrincipal && onNavigate('teachers')}
            className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all group ${
              isPrincipal ? 'cursor-pointer hover:border-emerald-300' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Active Teachers
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700 tracking-tight">
                {counts.activeTeachers}
              </span>
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                Active status
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Recipients for email announcements
            </p>
          </div>

          {/* Card 3: Announcements */}
          <div
            onClick={() => onNavigate('announcements')}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Announcements
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Megaphone className="w-5 h-5 text-blue-900" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {counts.announcements}
              </span>
              <span className="text-xs text-blue-800 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                Published
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Dispatched across school portal
            </p>
          </div>

          {/* Card 4: Upcoming Events */}
          <div
            onClick={() => onNavigate('events')}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Upcoming Events
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarDays className="w-5 h-5 text-amber-700" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {counts.events}
              </span>
              <span className="text-xs text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md">
                Calendar
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Exams, meetings & competitions
            </p>
          </div>

        </div>
      </div>

      {/* 4. RECENT ACTIVITY & UPCOMING EVENTS SPLIT SECTION (Requirement 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recent Activity (Announcements & Circulars) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Recent Announcements */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Recent Announcements
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('announcements')}
                className="text-xs font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({counts.announcements})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {recentAnnouncements.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <span>No official announcements published yet.</span>
                </div>
              ) : (
                recentAnnouncements.map(ann => (
                  <div
                    key={ann.id}
                    onClick={() => onNavigate('announcements')}
                    className="py-3.5 group cursor-pointer hover:bg-slate-50/50 px-2 -mx-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span
                          className={`font-bold ${
                            ann.priority === 'Urgent'
                              ? 'text-red-700'
                              : ann.priority === 'Important'
                              ? 'text-amber-700'
                              : 'text-blue-800'
                          }`}
                        >
                          ● {ann.priority || 'Normal'}
                        </span>
                        <span>·</span>
                        <span>Published by {ann.createdBy || 'Principal'}</span>
                      </div>
                      <span className="text-[11px] font-mono">
                        {ann.date || new Date(ann.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <h5 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
                      {ann.title}
                    </h5>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                      {ann.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Circulars */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Administrative Circulars & Directives
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('circulars')}
                className="text-xs font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({counts.circulars})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {recentCirculars.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <span>No administrative circulars published yet.</span>
                </div>
              ) : (
                recentCirculars.map(circ => (
                  <div
                    key={circ.id}
                    onClick={() => onNavigate('circulars')}
                    className="py-3 group cursor-pointer hover:bg-slate-50/50 px-2 -mx-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                      <span className="font-mono text-slate-500">Ref: CIR/{circ.id.slice(0, 5).toUpperCase()}</span>
                      <span>{circ.date}</span>
                    </div>
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-amber-800 transition-colors">
                      {circ.title}
                    </h5>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Upcoming Events & Timetable Quick View */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Upcoming School Events Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Upcoming Events Timeline
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('events')}
                className="text-xs font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Calendar ({counts.events})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-3">
              {upcomingEvents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <span>No upcoming events scheduled on the calendar.</span>
                </div>
              ) : (
                upcomingEvents.map(evt => (
                  <div
                    key={evt.id}
                    onClick={() => onNavigate('events')}
                    className="py-3 flex items-start gap-3 group cursor-pointer hover:bg-slate-50/50 px-2 -mx-2 rounded-xl transition-colors"
                  >
                    {/* Date Badge */}
                    <div className="w-12 rounded-xl bg-slate-900 text-white p-2 text-center shrink-0 shadow-2xs">
                      <span className="block text-[9px] font-bold uppercase text-amber-300">
                        {new Date(evt.eventDate).toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="block text-base font-black leading-tight">
                        {new Date(evt.eventDate).getDate() || '—'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-xs sm:text-sm text-slate-900 truncate group-hover:text-blue-900 transition-colors">
                        {evt.title}
                      </h5>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{evt.startTime}</span>
                        </span>
                        {evt.location && (
                          <>
                            <span>·</span>
                            <span className="truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{evt.location}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Timetable Overview Quick Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-900 flex items-center justify-center">
                  <CalendarRange className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Timetable Quick Schedule
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('timetable')}
                className="text-xs font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Table</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {recentTimetable.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  Timetable periods not yet configured for Monday.
                </p>
              ) : (
                recentTimetable.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate('timetable')}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 hover:bg-indigo-50/40 hover:border-indigo-200 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-indigo-900 uppercase">
                        {item.period} · {item.startTime} - {item.endTime}
                      </span>
                      <h5 className="font-bold text-xs text-slate-900 mt-0.5">
                        {item.subject}
                      </h5>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                      {item.room}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
