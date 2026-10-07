import React from 'react';
import { useAuth } from '../context/AuthContext';
import { SchoolSettings } from '../types';
import { User, Mail, Shield, GraduationCap, CheckCircle2, Clock, Building } from 'lucide-react';

interface TeacherProfileViewProps {
  settings: SchoolSettings;
}

export const TeacherProfileView: React.FC<TeacherProfileViewProps> = ({ settings }) => {
  const { profile, user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-3xl font-bold">
              {profile?.role === 'principal' ? '🏛️' : '👨‍🏫'}
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile?.name || 'Faculty Member'}</h2>
              <p className="text-xs text-blue-200 mt-0.5">{profile?.email}</p>
              <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white uppercase tracking-wider">
                {profile?.role === 'principal' ? (
                  <>
                    <Shield className="w-3 h-3 text-amber-300" />
                    <span>Principal / Administrator</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-3 h-3 text-blue-200" />
                    <span>Teaching Faculty (Read Only)</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Details List */}
        <div className="p-6 space-y-4 text-xs sm:text-sm">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Institution</span>
            <span className="font-bold text-slate-900">{settings.schoolName}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Account Email</span>
            <span className="font-mono text-slate-800">{profile?.email || user?.email}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Account Status</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active Member
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500 font-medium">System Role</span>
            <span className="font-semibold capitalize text-slate-800">{profile?.role}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Permissions Level</span>
            <span className="text-slate-600">
              {profile?.role === 'principal'
                ? 'Full Administrative & Email Dispatch Authority'
                : 'View-Only Access (Announcements, Circulars, Events, Timetable)'}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-100 text-xs text-slate-500 text-center">
          For email modifications or official record updates, please consult the Principal's office.
        </div>
      </div>
    </div>
  );
};
