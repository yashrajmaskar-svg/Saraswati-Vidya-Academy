import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { FirstTimeSetupScreen } from './components/FirstTimeSetupScreen';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardHome } from './components/DashboardHome';
import { AnnouncementsView } from './components/AnnouncementsView';
import { NoticeBoardView } from './components/NoticeBoardView';
import { CircularsView } from './components/CircularsView';
import { SchedulesMeetingsCompetitionsView } from './components/SchedulesMeetingsCompetitionsView';
import { TimetableSection } from './components/TimetableSection';
import { TeacherEmailManagement } from './components/TeacherEmailManagement';
import { SchoolSettingsView } from './components/SchoolSettingsView';
import { TeacherProfileView } from './components/TeacherProfileView';
import { EmailLogsModal } from './components/EmailLogsModal';
import { DEFAULT_SETTINGS, getSchoolSettings } from './services/schoolService';
import { SchoolSettings } from './types';
import { RefreshCw, X, ShieldAlert } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, profile, loading, isPrincipal } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [settings, setSettings] = useState<SchoolSettings>(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [emailLogsOpen, setEmailLogsOpen] = useState(false);
  const [forceShowLogin, setForceShowLogin] = useState(false);

  useEffect(() => {
    getSchoolSettings().then(s => {
      setSettings(s);
      setSettingsLoading(false);
    });
  }, []);

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-900 flex items-center justify-center text-3xl shadow-2xl mb-4 border border-blue-700">
          🏛️
        </div>
        <h2 className="text-white text-lg font-bold tracking-wide uppercase">
          {settings.institutionName || settings.schoolName || 'School Smart Hub'}
        </h2>
        <p className="text-xs text-blue-300 font-semibold uppercase tracking-widest mt-1">
          School Communication Hub
        </p>
        <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          <span>Verifying security credentials & role access...</span>
        </div>
      </div>
    );
  }

  // Not logged in yet
  if (!user) {
    // If first-time launch and school has not been configured yet, show setup screen
    if (!settings.isConfigured && !forceShowLogin) {
      return (
        <FirstTimeSetupScreen
          onSetupComplete={(newSettings) => {
            setSettings(newSettings);
          }}
          onSwitchToLogin={() => setForceShowLogin(true)}
        />
      );
    }
    return <AuthPage />;
  }

  // Guard against non-principals accessing admin tabs
  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <DashboardHome
            settings={settings}
            onNavigate={setActiveSection}
            onOpenEmailLogs={() => setEmailLogsOpen(true)}
          />
        );
      case 'announcements':
        return <AnnouncementsView settings={settings} onOpenEmailLogs={() => setEmailLogsOpen(true)} />;
      case 'notices':
        return <NoticeBoardView />;
      case 'circulars':
        return <CircularsView settings={settings} />;
      case 'schedules':
        return <SchedulesMeetingsCompetitionsView initialTab="schedules" />;
      case 'meetings':
        return <SchedulesMeetingsCompetitionsView initialTab="meetings" />;
      case 'competitions':
        return <SchedulesMeetingsCompetitionsView initialTab="competitions" />;
      case 'events':
        return <SchedulesMeetingsCompetitionsView initialTab="events" />;
      case 'timetable':
        return <TimetableSection />;
      case 'teachers':
        if (!isPrincipal) {
          return (
            <div className="bg-red-50 border border-red-200 p-8 rounded-xl text-center">
              <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-2" />
              <h3 className="font-bold text-red-900">Access Denied</h3>
              <p className="text-xs text-red-700 mt-1">Only the school principal has access to Teacher Email Management.</p>
            </div>
          );
        }
        return <TeacherEmailManagement onOpenEmailLogs={() => setEmailLogsOpen(true)} />;
      case 'settings':
        if (!isPrincipal) {
          return (
            <div className="bg-red-50 border border-red-200 p-8 rounded-xl text-center">
              <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-2" />
              <h3 className="font-bold text-red-900">Access Denied</h3>
              <p className="text-xs text-red-700 mt-1">Only the school principal has access to School Settings.</p>
            </div>
          );
        }
        return <SchoolSettingsView onSettingsUpdated={setSettings} />;
      case 'profile':
        return <TeacherProfileView settings={settings} />;
      default:
        return (
          <DashboardHome
            settings={settings}
            onNavigate={setActiveSection}
            onOpenEmailLogs={() => setEmailLogsOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased text-slate-800">
      {/* Top Navigation */}
      <Navbar
        settings={settings}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            onOpenEmailLogs={() => setEmailLogsOpen(true)}
          />
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-10 shadow-2xl">
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <Sidebar
                activeSection={activeSection}
                onSelectSection={setActiveSection}
                onOpenEmailLogs={() => setEmailLogsOpen(true)}
                closeMobileMenu={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderSection()}
        </main>
      </div>

      {/* Global Email Logs Audit Modal */}
      {isPrincipal && (
        <EmailLogsModal
          isOpen={emailLogsOpen}
          onClose={() => setEmailLogsOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
