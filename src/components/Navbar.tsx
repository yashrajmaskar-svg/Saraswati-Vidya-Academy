import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Shield, GraduationCap, Menu, X, Bell } from 'lucide-react';
import { SchoolSettings } from '../types';

interface NavbarProps {
  settings: SchoolSettings;
  activeSection: string;
  onSelectSection: (section: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onSelectSection,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const { profile, isPrincipal, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const schoolName = settings.institutionName || settings.schoolName || 'Saraswati Vidya Academy';

  return (
    <>
      <header className="bg-slate-950 text-white shadow-md sticky top-0 z-40 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            
            {/* School Brand & Name Area */}
            <div
              className="flex items-center space-x-3 sm:space-x-4 cursor-pointer group"
              onClick={() => onSelectSection('dashboard')}
            >
              {/* SVA Monogram Crest */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 rounded-xl flex items-center justify-center border border-amber-400/40 shadow-inner ring-1 ring-white/10 group-hover:border-amber-400 transition-colors shrink-0">
                <span className="font-serif font-black text-amber-300 text-sm sm:text-base tracking-widest">
                  SVA
                </span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm sm:text-base lg:text-lg font-bold tracking-tight text-white leading-tight font-serif uppercase group-hover:text-amber-200 transition-colors">
                  {schoolName}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-amber-300/90 tracking-wider uppercase">
                    SVA School Communication Hub
                  </span>
                  <span className="hidden lg:inline text-slate-500 text-xs">·</span>
                  <span className="hidden lg:inline text-[10px] font-medium text-slate-400">
                    AY 2025–26
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Right Controls */}
            <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
              
              {/* Notification Indicator */}
              <button
                type="button"
                onClick={() => onSelectSection('announcements')}
                className="relative p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
                title="View Announcements & Notifications"
              >
                <Bell className="w-4 h-4 text-amber-300/80" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-950" />
              </button>

              {/* User Profile Pill */}
              <div
                onClick={() => onSelectSection(isPrincipal ? 'settings' : 'profile')}
                className="flex items-center gap-3 bg-slate-900 hover:bg-slate-850 py-1.5 px-3 rounded-xl border border-slate-800 transition-colors cursor-pointer"
                title="View Profile / Account Settings"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-900 to-slate-800 flex items-center justify-center text-amber-300 font-bold text-xs border border-blue-700/60 shrink-0">
                  {isPrincipal ? (
                    <Shield className="w-4 h-4 text-amber-400" />
                  ) : (
                    <GraduationCap className="w-4 h-4 text-blue-300" />
                  )}
                </div>
                <div className="text-left text-xs">
                  <div className="font-bold text-white truncate max-w-[130px] lg:max-w-[180px]">
                    {profile?.name || (isPrincipal ? 'Principal Administrator' : 'Faculty Member')}
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider">
                    {isPrincipal ? (
                      <span className="text-amber-300 font-bold">Principal / Admin</span>
                    ) : (
                      <span className="text-blue-300">Faculty Teacher</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Secure Logout Trigger */}
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-900 hover:bg-red-950/60 text-slate-300 hover:text-red-200 rounded-xl border border-slate-800 hover:border-red-800/60 transition-colors shadow-2xs cursor-pointer"
                title="Logout from portal"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">Logout</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-850 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Confirmation Dialog: Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Sign Out</h3>
                <p className="text-xs text-slate-500">End your active portal session?</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              You will be signed out of Saraswati Vidya Academy communication portal. Any unsaved drafts will remain safely in Firestore.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
