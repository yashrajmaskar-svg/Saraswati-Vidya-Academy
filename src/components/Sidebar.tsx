import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Megaphone,
  Bell,
  FileText,
  CalendarDays,
  CalendarRange,
  Users,
  Settings,
  MailCheck,
  User,
  Shield,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSelectSection: (section: string) => void;
  onOpenEmailLogs: () => void;
  closeMobileMenu?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  onOpenEmailLogs,
  closeMobileMenu,
}) => {
  const { profile, isPrincipal } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleNav = (section: string) => {
    onSelectSection(section);
    if (closeMobileMenu) {
      closeMobileMenu();
    }
  };

  const isScheduleActive =
    activeSection === 'schedules' ||
    activeSection === 'events' ||
    activeSection === 'meetings' ||
    activeSection === 'competitions';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['all'],
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: Megaphone,
      roles: ['all'],
    },
    {
      id: 'notices',
      label: 'Notice Board',
      icon: Bell,
      roles: ['all'],
    },
    {
      id: 'circulars',
      label: 'Circulars',
      icon: FileText,
      roles: ['all'],
    },
    {
      id: 'schedules',
      label: 'Schedules & Events',
      icon: CalendarDays,
      roles: ['all'],
    },
    {
      id: 'timetable',
      label: 'Timetable',
      icon: CalendarRange,
      roles: ['all'],
    },
  ];

  const adminNavItems = [
    {
      id: 'teachers',
      label: 'Teacher Email Management',
      icon: Users,
      action: () => handleNav('teachers'),
    },
    {
      id: 'email_logs',
      label: 'Email Logs & Audit',
      icon: MailCheck,
      action: () => {
        onOpenEmailLogs();
        if (closeMobileMenu) closeMobileMenu();
      },
    },
    {
      id: 'settings',
      label: 'School Settings',
      icon: Settings,
      action: () => handleNav('settings'),
    },
  ];

  return (
    <aside
      className={`bg-slate-950 text-slate-300 flex flex-col justify-between shrink-0 h-full border-r border-slate-800/80 transition-all duration-300 relative select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header / Profile area */}
      <div className="p-3.5 space-y-5">
        
        {/* Desktop Collapse Toggle Button */}
        <div className="hidden md:flex justify-end pr-1">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-amber-300" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* User Card */}
        <div
          className={`bg-slate-900/90 rounded-2xl border border-slate-800/80 p-3 transition-all ${
            collapsed ? 'flex justify-center' : 'flex items-center gap-3'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center text-amber-300 border border-amber-400/30 shrink-0 shadow-xs">
            {isPrincipal ? (
              <Shield className="w-4 h-4 text-amber-400" />
            ) : (
              <GraduationCap className="w-4 h-4 text-blue-300" />
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate">
                {profile?.name || (isPrincipal ? 'Principal' : 'Faculty')}
              </h4>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/80 truncate">
                {isPrincipal ? 'Principal / Admin' : 'Teaching Faculty'}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1">
          {!collapsed && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1.5">
              Hub Navigation
            </div>
          )}

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive =
              item.id === 'schedules' ? isScheduleActive : activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer relative group ${
                  isActive
                    ? 'bg-blue-950/80 text-white font-bold border border-blue-800/80 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-amber-400 rounded-r-full" />
                )}
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-amber-300' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}

          {/* Teacher Profile link for teachers */}
          {!isPrincipal && (
            <button
              type="button"
              onClick={() => handleNav('profile')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer relative group ${
                activeSection === 'profile'
                  ? 'bg-blue-950/80 text-white font-bold border border-blue-800/80 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? 'Faculty Profile' : undefined}
            >
              {activeSection === 'profile' && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-amber-400 rounded-r-full" />
              )}
              <User
                className={`w-4 h-4 shrink-0 ${
                  activeSection === 'profile' ? 'text-amber-300' : 'text-slate-400'
                }`}
              />
              {!collapsed && <span>My Profile</span>}
            </button>
          )}

          {/* Principal-Only Administrative Nav Links */}
          {isPrincipal && (
            <>
              {!collapsed && (
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80 px-3 pt-4 pb-1.5 flex items-center justify-between">
                  <span>Administration</span>
                  <span className="text-[9px] bg-amber-400/10 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded font-mono">
                    Admin
                  </span>
                </div>
              )}

              {adminNavItems.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer relative group ${
                      isActive
                        ? 'bg-blue-950/80 text-white font-bold border border-blue-800/80 shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                    } ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-amber-400 rounded-r-full" />
                    )}
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-amber-300' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </>
          )}
        </nav>
      </div>

      {/* Sidebar Footer: Service Status */}
      <div className="p-3 border-t border-slate-900">
        <div
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/60 text-[11px] text-slate-400 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 ring-2 ring-emerald-950" />
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-slate-300 font-semibold truncate">Google Apps Script</span>
              <span className="text-[9px] text-slate-500 truncate">Email Dispatch Ready</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
