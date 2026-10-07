import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { setupFirstPrincipal } from '../services/authService';
import { saveSchoolSettings } from '../services/schoolService';
import { SchoolSettings } from '../types';
import { School, User, Mail, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface FirstTimeSetupScreenProps {
  onSetupComplete: (settings: SchoolSettings) => void;
  onSwitchToLogin: () => void;
}

export const FirstTimeSetupScreen: React.FC<FirstTimeSetupScreenProps> = ({
  onSetupComplete,
  onSwitchToLogin,
}) => {
  const [institutionName, setInstitutionName] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [principalEmail, setPrincipalEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!institutionName.trim()) {
      setError('Please enter the Institution / School Name.');
      return;
    }
    if (!principalName.trim()) {
      setError('Please enter the Principal Name.');
      return;
    }
    if (!principalEmail.trim() || !principalEmail.includes('@')) {
      setError('Please enter a valid Principal Email Address.');
      return;
    }
    if (password.length < 6) {
      setError('Please set an administrative password (at least 6 characters) to secure your account.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create real Firebase Auth user for the Principal
      const userCred = await createUserWithEmailAndPassword(
        auth,
        principalEmail.trim().toLowerCase(),
        password
      );

      // 2. Save the school settings
      const settingsPayload: SchoolSettings = {
        institutionName: institutionName.trim(),
        principalName: principalName.trim(),
        principalEmail: principalEmail.trim().toLowerCase(),
        schoolAddress: '',
        contactPhone: '',
        schoolLogo: '🏛️',
        isConfigured: true,
      };
      await saveSchoolSettings(settingsPayload, principalName.trim());

      // 3. Save Principal profile in Firestore users/{uid}
      await setupFirstPrincipal(userCred.user, principalName.trim());

      // 4. Complete setup and notify parent
      onSetupComplete(settingsPayload);
    } catch (err: any) {
      console.error('Setup error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account already exists with this email address. Please sign in or use another email.');
      } else {
        setError(err.message || 'Failed to complete initial setup. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-900 rounded-2xl flex items-center justify-center text-white shadow-xl ring-4 ring-blue-200">
            <School className="w-9 h-9 text-blue-100" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-black text-slate-900 tracking-tight">
          School Smart Hub
        </h2>
        <p className="mt-1 text-center text-xs font-semibold uppercase tracking-widest text-blue-800">
          Initial Application Setup
        </p>
        <p className="text-center text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Please enter your official institution details to initialize the school communication system.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Institution / School Name */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                Institution / School Name
              </label>
              <div className="relative">
                <School className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Enter institution name"
                  value={institutionName}
                  onChange={e => setInstitutionName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                />
              </div>
            </div>

            {/* 2. Principal Name */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                Principal Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Enter principal name"
                  value={principalName}
                  onChange={e => setPrincipalName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                />
              </div>
            </div>

            {/* 3. Principal Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                Principal Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="Enter principal email"
                  value={principalEmail}
                  onChange={e => setPrincipalEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Administrative Account Security */}
            <div className="pt-2 border-t border-slate-100">
              <span className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                Administrator Password
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Set password (min 6)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg shadow-sm text-sm transition-colors disabled:opacity-50"
            >
              <span>{loading ? 'Initializing School Smart Hub...' : 'Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-xs text-blue-900 font-bold hover:underline"
            >
              Already configured? Sign in to existing account →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
