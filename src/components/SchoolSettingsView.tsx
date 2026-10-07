import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SchoolSettings } from '../types';
import {
  getSchoolSettings,
  updateSchoolSettings,
} from '../services/schoolService';
import { getAppsScriptUrl, saveAppsScriptUrl } from '../config/appsScript';
import {
  Settings,
  Building,
  User,
  Mail,
  Phone,
  Save,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Server,
  Send,
  RefreshCw,
  Info,
  Key,
  Shield,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';

interface SchoolSettingsViewProps {
  onSettingsUpdated: (settings: SchoolSettings) => void;
}

export const SchoolSettingsView: React.FC<SchoolSettingsViewProps> = ({ onSettingsUpdated }) => {
  const { profile, isPrincipal } = useAuth();
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states - General
  const [schoolName, setSchoolName] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [schoolLogo, setSchoolLogo] = useState('🏛️');

  // Form states - SMTP Server Configuration
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [smtpSenderName, setSmtpSenderName] = useState('');
  const [smtpSenderEmail, setSmtpSenderEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [smtpFeedback, setSmtpFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Google Apps Script Web App configuration state
  const [appsScriptUrlInput, setAppsScriptUrlInput] = useState(getAppsScriptUrl());
  const [appsScriptSavedMsg, setAppsScriptSavedMsg] = useState<string | null>(null);

  const handleSaveAppsScriptUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = appsScriptUrlInput.trim();
    saveAppsScriptUrl(cleanUrl);
    try {
      await updateSchoolSettings({ appsScriptUrl: cleanUrl }, profile?.name || 'Principal');
    } catch (err) {
      console.warn('Could not save Apps Script URL to Firestore schoolSettings:', err);
    }
    setAppsScriptSavedMsg('✓ Google Apps Script Web App URL updated and saved successfully!');
    setTimeout(() => setAppsScriptSavedMsg(null), 4000);
  };

  // SMTP Test state
  const [smtpStatus, setSmtpStatus] = useState<{
    configured: boolean;
    host: string | null;
    port: number;
    user: string | null;
    from: string;
    verified: boolean;
    lastVerificationMessage: string | null;
  } | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadSmtpStatus = async () => {
    try {
      const res = await fetch('/api/email/status');
      if (res.ok) {
        const status = await res.json();
        setSmtpStatus(status);
        if (status.host) setSmtpHost(status.host);
        if (status.port) setSmtpPort(String(status.port));
        if (typeof status.secure === 'boolean') setSmtpSecure(status.secure);
        if (status.from) setSmtpFrom(status.from);
      }
    } catch (err) {
      console.warn('Could not load SMTP status:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getSchoolSettings();
      setSettings(data);
      setSchoolName(data.institutionName || data.schoolName || '');
      setSchoolAddress(data.schoolAddress || '');
      setPrincipalName(data.principalName || '');
      setContactEmail(data.principalEmail || data.contactEmail || '');
      setContactPhone(data.contactPhone || '');
      setSchoolLogo(data.schoolLogo || '🏛️');

      if (data.appsScriptUrl && data.appsScriptUrl.trim() && data.appsScriptUrl !== 'PASTE_MY_APPS_SCRIPT_WEB_APP_URL_HERE') {
        setAppsScriptUrlInput(data.appsScriptUrl.trim());
        saveAppsScriptUrl(data.appsScriptUrl.trim());
      } else {
        try {
          const res = await fetch('/api/settings/apps-script-url');
          if (res.ok) {
            const body = await res.json();
            if (body.appsScriptUrl && body.appsScriptUrl.trim() && body.appsScriptUrl !== 'PASTE_MY_APPS_SCRIPT_WEB_APP_URL_HERE') {
              setAppsScriptUrlInput(body.appsScriptUrl.trim());
              saveAppsScriptUrl(body.appsScriptUrl.trim());
            }
          }
        } catch {
          // ignore
        }
      }

      await loadSmtpStatus();
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPrincipal) return;

    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const updated: SchoolSettings = {
      institutionName: schoolName.trim(),
      schoolName: schoolName.trim(),
      schoolAddress: schoolAddress.trim(),
      principalName: principalName.trim(),
      principalEmail: contactEmail.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      schoolLogo: schoolLogo.trim() || '🏛️',
      appsScriptUrl: appsScriptUrlInput.trim(),
      isConfigured: Boolean(schoolName.trim() && principalName.trim() && contactEmail.trim()),
    };

    try {
      await updateSchoolSettings(updated, profile?.name || 'Principal');
      setSettings(updated);
      onSettingsUpdated(updated);
      setSuccessMsg('School settings successfully saved and updated across the communication hub!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: 'gmail' | 'outlook' | 'yahoo' | 'custom') => {
    if (preset === 'gmail') {
      setSmtpHost('smtp.gmail.com');
      setSmtpPort('587');
      setSmtpSecure(false);
    } else if (preset === 'outlook') {
      setSmtpHost('smtp.office365.com');
      setSmtpPort('587');
      setSmtpSecure(false);
    } else if (preset === 'yahoo') {
      setSmtpHost('smtp.mail.yahoo.com');
      setSmtpPort('465');
      setSmtpSecure(true);
    }
  };

  const handleSaveSmtpConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPrincipal) return;

    if (!smtpHost.trim() || !smtpUser.trim() || !smtpPass.trim()) {
      setSmtpFeedback({
        type: 'error',
        message: 'Please provide SMTP Host, Username/Email, and Password/App Password.',
      });
      return;
    }

    setSavingSmtp(true);
    setSmtpFeedback(null);

    try {
      const res = await fetch('/api/email/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpHost.trim(),
          port: parseInt(smtpPort, 10) || 587,
          secure: smtpSecure,
          user: smtpUser.trim(),
          pass: smtpPass.trim(),
          senderName: smtpSenderName.trim(),
          senderEmail: smtpSenderEmail.trim(),
          from: smtpFrom.trim() || (smtpSenderName && smtpSenderEmail ? `"${smtpSenderName.trim()}" <${smtpSenderEmail.trim()}>` : `"${schoolName || 'Saraswati Vidya Academy'}" <${smtpUser.trim()}>`),
        }),
      });

      const resData = await res.json();

      if (!res.ok || !resData.success) {
        setSmtpFeedback({
          type: 'error',
          message: resData.message || resData.error || 'Failed to connect to SMTP mail server. Please verify credentials.',
        });
      } else {
        setSmtpFeedback({
          type: 'success',
          message: '✓ SMTP settings successfully verified and saved! Live email delivery is active.',
        });
        setSmtpPass(''); // Clear entered password from UI
        await loadSmtpStatus();
      }
    } catch (err: any) {
      setSmtpFeedback({
        type: 'error',
        message: err.message || 'Network error communicating with server email configuration endpoint.',
      });
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress.trim() || !testEmailAddress.includes('@')) {
      setTestResult({ success: false, message: 'Please provide a valid recipient email address for testing.' });
      return;
    }

    setTestingSmtp(true);
    setTestResult(null);

    try {
      const payload: any = { testEmail: testEmailAddress.trim() };
      // If user typed in new credentials, test them directly
      if (smtpHost && smtpUser && smtpPass) {
        payload.host = smtpHost.trim();
        payload.port = parseInt(smtpPort, 10) || 587;
        payload.secure = smtpSecure;
        payload.user = smtpUser.trim();
        payload.pass = smtpPass.trim();
      }

      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({ success: true, message: 'Test email sent successfully.' });
      } else {
        setTestResult({ success: false, message: data.message || data.error || 'SMTP test returned failure.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Network error calling SMTP test endpoint.' });
    } finally {
      setTestingSmtp(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <RefreshCw className="w-6 h-6 text-blue-900 animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-medium">Loading school settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-900 font-bold text-xl sm:text-2xl">
            <Settings className="w-6 h-6 text-blue-800" />
            <span>School Settings & Email Service</span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {isPrincipal
              ? 'Configure official institution credentials, principal details, and server email dispatch.'
              : `Official administrative contact information for ${settings?.institutionName || 'School Name'}.`}
          </p>
        </div>
      </div>

      {/* Success / Error alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2.5 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-center gap-2.5 text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: General Settings Form */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-900" />
              <span>Official Institution Profile</span>
            </h3>

            <form onSubmit={handleSaveGeneral} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Official School / Institution Name
                </label>
                <input
                  type="text"
                  required
                  disabled={!isPrincipal}
                  value={schoolName}
                  onChange={e => setSchoolName(e.target.value)}
                  placeholder="Enter official school name"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Head of Institution (Principal Name)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    disabled={!isPrincipal}
                    value={principalName}
                    onChange={e => setPrincipalName(e.target.value)}
                    placeholder="Enter principal name"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Official Campus Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    disabled={!isPrincipal}
                    value={schoolAddress}
                    onChange={e => setSchoolAddress(e.target.value)}
                    placeholder="e.g. 123 Education Lane, City"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Principal / Office Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      disabled={!isPrincipal}
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      placeholder="principal@school.edu"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Campus Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      disabled={!isPrincipal}
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  School Emblem / Crest Icon
                </label>
                <input
                  type="text"
                  disabled={!isPrincipal}
                  value={schoolLogo}
                  onChange={e => setSchoolLogo(e.target.value)}
                  placeholder="🏛️"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-600"
                />
              </div>

              {isPrincipal && (
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save School Info'}</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right: Server-Side Email Backend Configuration */}
        <div className="space-y-6">
          {/* Google Apps Script Email Service Card (Primary) */}
          <div className="bg-white rounded-xl border border-blue-200 shadow-xs p-6 ring-1 ring-blue-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-900" />
                <span>Google Apps Script Email Service</span>
              </h3>
              <span className="font-bold px-2.5 py-0.5 rounded-full text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Active Provider
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Official school announcements are dispatched to teacher inboxes via this Google Apps Script Web App endpoint. The script reads active teacher emails from the Google Sheet and delivers announcement notifications.
            </p>

            {appsScriptSavedMsg && (
              <div className="mb-4 p-3 rounded-lg text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{appsScriptSavedMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveAppsScriptUrl} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Apps Script Web App URL
                </label>
                <input
                  type="text"
                  disabled={!isPrincipal}
                  value={appsScriptUrlInput}
                  onChange={e => setAppsScriptUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/XXXXXXXXXXXX/exec"
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50"
                />
              </div>

              {isPrincipal && (
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Apps Script URL</span>
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* SMTP Configuration Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-900" />
                <span>Live Email Service (SMTP)</span>
              </h3>
              <span
                className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1 ${
                  smtpStatus?.configured
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${smtpStatus?.configured ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                {smtpStatus?.configured ? 'Active & Ready' : 'Not Configured'}
              </span>
            </div>

            {smtpFeedback && (
              <div
                className={`mb-4 p-3 rounded-lg text-xs flex items-start gap-2 ${
                  smtpFeedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {smtpFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{smtpFeedback.message}</span>
              </div>
            )}

            {isPrincipal ? (
              <form onSubmit={handleSaveSmtpConfig} className="space-y-3.5 text-xs">
                {/* Provider Quick Presets */}
                <div>
                  <span className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Quick Provider Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPreset('gmail')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px] border border-slate-200"
                    >
                      Gmail (smtp.gmail.com:587)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('outlook')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px] border border-slate-200"
                    >
                      Outlook / Office 365
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('yahoo')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px] border border-slate-200"
                    >
                      Yahoo
                    </button>
                  </div>
                </div>

                {/* Host and Port */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      required
                      value={smtpHost}
                      onChange={e => setSmtpHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      SMTP Port
                    </label>
                    <input
                      type="text"
                      required
                      value={smtpPort}
                      onChange={e => setSmtpPort(e.target.value)}
                      placeholder="587"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Security / Encryption */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Security / Encryption
                  </label>
                  <select
                    value={smtpSecure ? 'ssl' : 'starttls'}
                    onChange={e => {
                      const isSsl = e.target.value === 'ssl';
                      setSmtpSecure(isSsl);
                      if (isSsl && smtpPort === '587') setSmtpPort('465');
                      if (!isSsl && smtpPort === '465') setSmtpPort('587');
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                  >
                    <option value="starttls">STARTTLS (Recommended for port 587)</option>
                    <option value="ssl">SSL / TLS (Recommended for port 465)</option>
                  </select>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    SMTP Username
                  </label>
                  <input
                    type="email"
                    required
                    value={smtpUser}
                    onChange={e => setSmtpUser(e.target.value)}
                    placeholder="e.g. principal.school@gmail.com"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                {/* Password / App Password */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    SMTP Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={smtpPass}
                      onChange={e => setSmtpPass(e.target.value)}
                      placeholder={smtpStatus?.configured ? 'Enter new password to change' : 'Enter SMTP password or App Password'}
                      className="w-full pl-3 pr-8 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    The password is saved securely on the server and is never exposed to the frontend.
                  </p>
                </div>

                {/* Sender Details */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Sender Name
                    </label>
                    <input
                      type="text"
                      value={smtpSenderName}
                      onChange={e => setSmtpSenderName(e.target.value)}
                      placeholder={schoolName || 'Saraswati Vidya Academy'}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Sender Email
                    </label>
                    <input
                      type="email"
                      value={smtpSenderEmail}
                      onChange={e => setSmtpSenderEmail(e.target.value)}
                      placeholder={smtpUser || 'principal@school.edu'}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingSmtp}
                    className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{savingSmtp ? 'Verifying with Mail Server...' : 'SAVE SMTP SETTINGS'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
                Email configuration can only be modified by the Principal.
              </div>
            )}

            {/* Test Email Section */}
            {isPrincipal && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <span className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Send Test Email
                </span>
                <form onSubmit={handleTestEmail} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      value={testEmailAddress}
                      onChange={e => setTestEmailAddress(e.target.value)}
                      placeholder="Enter test recipient email"
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                    <button
                      type="submit"
                      disabled={testingSmtp || (!smtpStatus?.configured && !smtpPass)}
                      className="py-1.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      <Send className="w-3 h-3" />
                      <span>{testingSmtp ? 'Sending...' : 'SEND TEST EMAIL'}</span>
                    </button>
                  </div>
                </form>

                {testResult && (
                  <div
                    className={`mt-2 p-2.5 rounded-lg border text-xs leading-relaxed ${
                      testResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    {testResult.message}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Guidance Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-blue-950">
              <Shield className="w-4 h-4 text-blue-800" />
              <span>How to Send Real Emails with Gmail / Google Workspace</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-950/80 leading-relaxed">
              <li>Enable <strong>2-Step Verification</strong> on your Google / Gmail Account.</li>
              <li>Go to <strong>Google Account → Security → App Passwords</strong>.</li>
              <li>Create a new app password named <em>"School Smart Hub"</em> and copy the 16-character code.</li>
              <li>Paste the code into the <strong>SMTP Password</strong> field above and click <strong>Save & Verify Email Service</strong>.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
