import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  formatFirebaseAuthErrorMessage,
  registerTeacherAccount,
  resetUserPassword,
  setupFirstPrincipal,
  signInGoogle,
} from '../services/authService';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  GraduationCap,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  School,
  KeyRound,
  Database,
  Server,
  Info,
  ArrowRight,
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

export const AuthPage: React.FC = () => {
  const { bootstrapNeeded, refreshProfile, deactivatedNotice, clearDeactivatedNotice } = useAuth();
  const [tab, setTab] = useState<'login' | 'register_teacher' | 'setup_principal'>(
    bootstrapNeeded ? 'setup_principal' : 'login'
  );

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot password modal state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const cleanInputs = () => {
    setError(null);
    setSuccessMsg(null);
    if (clearDeactivatedNotice) {
      clearDeactivatedNotice();
    }
  };

  // 1. Real Firebase Email/Password Sign-In
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    cleanInputs();

    if (!email.trim() || !password) {
      setError('Please provide both your registered email address and password.');
      return;
    }

    setLoading(true);
    try {
      // Call Firebase Authentication directly
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Successful auth -> refresh profile and trigger onAuthStateChanged
      await refreshProfile();
    } catch (err: any) {
      console.error('Firebase Login Error:', err);
      // Map and display actual useful Firebase error with error code
      const usefulMessage = formatFirebaseAuthErrorMessage(err);
      setError(usefulMessage);
    } finally {
      setLoading(false);
    }
  };

  // 2. Real Firebase Teacher Account Registration (Locked to 'teacher' role)
  const handleRegisterTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    cleanInputs();

    if (!name.trim()) {
      setError('Please enter your full faculty name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid school email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);
    try {
      // Creates real Firebase Auth account and creates users/{uid} with role: 'teacher'
      await registerTeacherAccount(name.trim(), email.trim(), password);
      setSuccessMsg('Teacher account registered in Firebase Authentication! Accessing portal...');
      await refreshProfile();
    } catch (err: any) {
      console.error('Teacher Registration Error:', err);
      setError(formatFirebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // 3. Real First-Admin Setup Page (Creates first Principal account in Firebase Auth + Firestore)
  const handleSetupPrincipal = async (e: React.FormEvent) => {
    e.preventDefault();
    cleanInputs();

    if (!name.trim()) {
      setError('Please enter the Principal Administrator full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid official email address for the Principal.');
      return;
    }
    if (password.length < 6) {
      setError('Administrator password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please check confirmation.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create real account in Firebase Authentication
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      // 2. Set up Firestore document users/{uid} with role: 'principal', active: true, createdAt
      await setupFirstPrincipal(userCred.user, name.trim());
      
      setSuccessMsg('First Principal Administrator account created in Firebase! Entering Dashboard...');
      await refreshProfile();
    } catch (err: any) {
      console.error('Principal Setup Error:', err);
      if (err.code === 'auth/email-already-in-use') {
        // If account already exists in Firebase Auth, attempt sign in and verify role
        try {
          const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
          await setupFirstPrincipal(userCred.user, name.trim());
          setSuccessMsg('Principal account verified and authenticated! Entering Dashboard...');
          await refreshProfile();
          return;
        } catch (subErr: any) {
          setError(formatFirebaseAuthErrorMessage(subErr));
        }
      } else {
        setError(formatFirebaseAuthErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Forgot Password handler using sendPasswordResetEmail
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setResetError('Please enter a valid email address.');
      return;
    }

    setResetLoading(true);
    try {
      await resetUserPassword(resetEmail.trim());
      setResetSuccess(`A password reset link has been dispatched by Firebase to ${resetEmail.trim()}. Please check your email inbox.`);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setResetError(formatFirebaseAuthErrorMessage(err));
    } finally {
      setResetLoading(false);
    }
  };

  // Google Sign-In helper
  const handleGoogleSignIn = async () => {
    cleanInputs();
    setLoading(true);
    try {
      await signInGoogle();
      await refreshProfile();
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(formatFirebaseAuthErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-0 lg:p-6 antialiased">
      <div className="w-full max-w-6xl min-h-screen lg:min-h-[720px] bg-slate-900 lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border-0 lg:border border-slate-800">
        
        {/* LEFT PANE: Premium School Branding & Visual Identity */}
        <div className="relative w-full lg:w-5/12 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-8 sm:p-12 text-white flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
          {/* Subtle architectural background pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

          {/* Top Brand Identity */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 mb-8 shadow-inner">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 border border-amber-400/40 text-amber-300 font-serif font-black flex items-center justify-center text-sm tracking-wider shadow-md">
                SVA
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-serif font-bold text-white tracking-wider uppercase">
                  Saraswati Vidya Academy
                </span>
                <span className="text-[10px] font-semibold tracking-widest text-amber-300/90 uppercase">
                  School Communication Hub
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-widest text-blue-300 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Official Administrative Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight font-serif">
                SARASWATI VIDYA ACADEMY
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
                Connecting the school community with clarity and confidence.
              </p>
            </div>
          </div>

          {/* Middle Decorative Academic Crest / Feature Badges */}
          <div className="relative z-10 my-8 hidden sm:block">
            <div className="space-y-3 bg-white/[0.03] border border-white/10 p-5 rounded-2xl backdrop-blur-xs">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="w-7 h-7 rounded-lg bg-blue-900/60 border border-blue-700/50 flex items-center justify-center text-amber-300">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <span>Secured Principal & Faculty Access Control</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="w-7 h-7 rounded-lg bg-blue-900/60 border border-blue-700/50 flex items-center justify-center text-amber-300">
                  <School className="w-3.5 h-3.5" />
                </div>
                <span>Real-Time Dispatches & Google Apps Script Delivery</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="w-7 h-7 rounded-lg bg-blue-900/60 border border-blue-700/50 flex items-center justify-center text-amber-300">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <span>Active Timetable & Notice Board Coordination</span>
              </div>
            </div>
          </div>

          {/* Bottom Accreditation / Security Notice */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>© {new Date().getFullYear()} Saraswati Vidya Academy</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Portal Online
            </span>
          </div>
        </div>

        {/* RIGHT PANE: Modern High-End Authentication Card */}
        <div className="w-full lg:w-7/12 bg-white flex flex-col justify-center p-6 sm:p-12 lg:p-16">
          <div className="max-w-md w-full mx-auto">
            
            {/* Header Kicker */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                {tab === 'login'
                  ? 'Sign in to your account'
                  : tab === 'register_teacher'
                  ? 'Faculty Account Registration'
                  : 'Principal System Setup'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {tab === 'login'
                  ? 'Enter your official credentials to access the communication hub.'
                  : tab === 'register_teacher'
                  ? 'Register your faculty email address to access teacher resources.'
                  : 'Initialize administrative credentials for school leadership.'}
              </p>
            </div>

            {/* Navigation Tabs (Segmented Control) */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200/80 text-xs">
              <button
                type="button"
                onClick={() => { setTab('login'); cleanInputs(); }}
                className={`flex-1 py-2 font-bold rounded-lg transition-all ${
                  tab === 'login'
                    ? 'bg-white text-blue-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setTab('register_teacher'); cleanInputs(); }}
                className={`flex-1 py-2 font-bold rounded-lg transition-all ${
                  tab === 'register_teacher'
                    ? 'bg-white text-blue-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Teacher Sign Up
              </button>
              <button
                type="button"
                onClick={() => { setTab('setup_principal'); cleanInputs(); }}
                className={`flex-1 py-2 font-bold rounded-lg transition-all relative ${
                  tab === 'setup_principal'
                    ? 'bg-blue-950 text-white shadow-xs'
                    : 'text-blue-950 hover:text-blue-800'
                }`}
              >
                {bootstrapNeeded && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                )}
                Admin Setup
              </button>
            </div>

            {/* Deactivation Banner */}
            {deactivatedNotice && (
              <div className="mb-5 rounded-xl bg-amber-50 p-4 border border-amber-300 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Account Access Disabled</strong>
                  <p className="mt-0.5 leading-relaxed">{deactivatedNotice}</p>
                </div>
              </div>
            )}

            {/* Actual Firebase Error Notice */}
            {error && (
              <div className="mb-5 rounded-xl bg-red-50 p-4 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold block">Authentication Notice:</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Success Notice */}
            {successMsg && (
              <div className="mb-5 rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span>{successMsg}</span>
                </div>
              </div>
            )}

            {/* TAB 1: SIGN IN */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Official Email
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@saraswatividya.edu.in"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-slate-900 bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(email);
                        setForgotPasswordOpen(true);
                        setResetSuccess(null);
                        setResetError(null);
                      }}
                      className="text-xs text-blue-900 hover:text-blue-700 font-bold transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-slate-900 bg-white transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex justify-center items-center py-2.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-blue-950 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 disabled:opacity-50 transition-all hover:shadow-md cursor-pointer"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Portal'}
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                    <span className="bg-white px-3 text-slate-400 font-semibold">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2.5 py-2.5 px-4 border border-slate-300 rounded-xl shadow-2xs text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  Sign In with Google
                </button>
              </form>
            )}

            {/* TAB 2: TEACHER SIGN UP */}
            {tab === 'register_teacher' && (
              <form onSubmit={handleRegisterTeacher} className="space-y-4">
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-950 flex items-start gap-2.5">
                  <GraduationCap className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong>Faculty Self-Registration:</strong> Creates a faculty account in Firebase Authentication. Role is designated as <strong>"teacher"</strong>.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Full Name
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Mrs. Priya Deshmukh"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Official Email
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="priya.deshmukh@saraswatividya.edu.in"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Password (min 6 characters)
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex justify-center items-center py-2.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-blue-950 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating Account...' : 'Register Faculty Account'}
                </button>
              </form>
            )}

            {/* TAB 3: FIRST ADMIN SETUP */}
            {tab === 'setup_principal' && (
              <form onSubmit={handleSetupPrincipal} className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950">
                  <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-900">
                    <Shield className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>First Admin Setup (Principal Account Creation)</span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-amber-900/90">
                    Create the school's primary <strong>Principal</strong> account in Firebase Authentication. This account will be securely recorded with <code className="font-mono bg-amber-100 px-1 rounded">role: "principal"</code>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Full Name
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Enter principal full name"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Official Email
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="principal@saraswatividya.edu.in"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Password
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex justify-center items-center py-2.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-blue-950 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating Principal...' : 'Create Principal Account'}
                </button>

                <div className="mt-6 pt-4 border-t border-slate-200">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-blue-900" />
                    <span>Firebase Infrastructure Status</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-amber-600" />
                        Firebase Authentication:
                      </span>
                      <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                        Connected
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Database className="w-3 h-3 text-blue-600" />
                        Cloud Firestore:
                      </span>
                      <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                        Connected
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Current Auth State:</span>
                      <span className="font-mono text-slate-800 text-[10px]">
                        {auth.currentUser ? `Authenticated (${auth.currentUser.email})` : 'Not Signed In'}
                      </span>
                    </div>
                  </div>
                </div>
              </form>
            )}

          </div>
        </div>

      </div>

      {/* Requirement 11: FORGOT PASSWORD MODAL */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset Password</h3>
                <p className="text-xs text-slate-500">Firebase Password Reset Service</p>
              </div>
            </div>

            {resetSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs leading-relaxed mb-4">
                {resetSuccess}
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                {resetError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs leading-relaxed">
                    {resetError}
                  </div>
                )}

                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your registered school email address below. Firebase will dispatch an official password reset link directly to your inbox.
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="name@saraswatividya.edu.in"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(false)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-4 py-1.5 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-lg shadow-xs"
                  >
                    {resetLoading ? 'Sending link...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}

            {resetSuccess && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(false)}
                  className="px-4 py-1.5 text-xs font-bold bg-slate-800 text-white rounded-lg"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
