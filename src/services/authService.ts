import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  getAuth,
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

export const ADMIN_EMAILS = [
  'maskaryashraj@gmail.com',
  'yashrajmaskar@gmail.com',
];

export const BOOTSTRAP_ADMIN_EMAIL = 'maskaryashraj@gmail.com';

export function isBootstrapAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.includes(normalized);
}

// Format Firebase Auth errors into helpful, human-readable messages without masking
export function formatFirebaseAuthErrorMessage(error: any): string {
  if (!error) return 'An unexpected authentication error occurred.';
  const code = error.code || '';
  const message = error.message || '';

  switch (code) {
    case 'auth/invalid-credential':
      return 'Invalid credentials. If this is your first time setting up the school portal, please use the "First Admin Setup" tab to create your Principal account. [auth/invalid-credential]';
    case 'auth/user-not-found':
      return 'No account exists with this email address. Please verify your email or click "First Admin Setup" to initialize the Principal account. [auth/user-not-found]';
    case 'auth/wrong-password':
      return 'Incorrect password entered. Please verify your password or use "Forgot Password" to receive a reset link. [auth/wrong-password]';
    case 'auth/invalid-email':
      return 'Invalid email address format. Please enter an email like name@saraswatividya.edu.in. [auth/invalid-email]';
    case 'auth/too-many-requests':
      return 'Access to this account is temporarily disabled due to multiple failed login attempts. Please wait a few minutes or reset your password. [auth/too-many-requests]';
    case 'auth/network-request-failed':
      return 'Network connection failure. Please check your internet connection and try again. [auth/network-request-failed]';
    case 'auth/email-already-in-use':
      return 'This email address is already in use by another account. Please sign in instead or reset your password. [auth/email-already-in-use]';
    case 'auth/weak-password':
      return 'The password entered is too weak. Please use at least 6 characters. [auth/weak-password]';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Console. Please enable Email/Password under Firebase Console -> Authentication -> Sign-in method, or sign in via Google. [auth/operation-not-allowed]';
    case 'auth/user-disabled':
      return 'This user account has been disabled by the administrator. [auth/user-disabled]';
    default:
      return `${message} ${code ? `[${code}]` : ''}`.trim() || 'Authentication failed. Please verify credentials.';
  }
}

// Check if first-time bootstrap is available (no principal account has claimed bootstrap yet)
export async function checkBootstrapStatus(): Promise<boolean> {
  const bootstrapPath = 'system/bootstrap';
  try {
    const docSnap = await getDoc(doc(db, bootstrapPath));
    return !docSnap.exists();
  } catch (error) {
    console.warn('Error checking bootstrap status:', error);
    return false;
  }
}

// Fetch user profile from Firestore
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// Register initial principal during first-time setup
export async function setupFirstPrincipal(
  user: User,
  name: string
): Promise<UserProfile> {
  const bootstrapPath = 'system/bootstrap';
  const userPath = `users/${user.uid}`;

  try {
    // 1. Create bootstrap marker if not already existing
    const bootstrapSnap = await getDoc(doc(db, bootstrapPath));
    if (!bootstrapSnap.exists()) {
      await setDoc(doc(db, bootstrapPath), {
        principalUid: user.uid,
        principalEmail: user.email,
        createdAt: serverTimestamp(),
        claimedAt: new Date().toISOString(),
      });
    }

    // 2. Create the principal profile in Firestore
    const profile: UserProfile = {
      uid: user.uid,
      name: name.trim() || user.displayName || 'Principal Administrator',
      email: user.email || '',
      role: 'principal',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', user.uid), {
      ...profile,
      serverCreatedAt: serverTimestamp(),
    });

    return profile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
    throw error;
  }
}

// Create or ensure profile exists for authenticated user
export async function ensureUserProfile(user: User, name?: string): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  try {
    const existing = await getUserProfile(user.uid);
    if (existing) {
      if (isBootstrapAdmin(user.email) && existing.role !== 'principal') {
        const updated = { ...existing, role: 'principal' as const, updatedAt: new Date().toISOString() };
        await setDoc(doc(db, 'users', user.uid), updated, { merge: true });
        return updated;
      }
      return existing;
    }

    const isOwner = isBootstrapAdmin(user.email);
    const isBootstrapAvailable = await checkBootstrapStatus();
    const role = (isOwner || isBootstrapAvailable) ? 'principal' : 'teacher';

    if (role === 'principal' && isBootstrapAvailable) {
      await setDoc(doc(db, 'system/bootstrap'), {
        principalUid: user.uid,
        principalEmail: user.email,
        createdAt: serverTimestamp(),
      });
    }

    const newProfile: UserProfile = {
      uid: user.uid,
      name: name || user.displayName || (role === 'principal' ? 'Principal Administrator' : 'Faculty Member'),
      email: user.email || '',
      role,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', user.uid), {
      ...newProfile,
      serverCreatedAt: serverTimestamp(),
    });

    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// Sign in with Google
export async function signInGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

// Sign in with Email and Password
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return result.user;
}

// Send Password Reset Email
export async function resetUserPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

// Register Teacher with Email and Password
export async function registerTeacherAccount(name: string, email: string, pass: string): Promise<UserProfile> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const user = result.user;

  const profile: UserProfile = {
    uid: user.uid,
    name: name.trim(),
    email: user.email || email.trim(),
    role: 'teacher',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const path = `users/${user.uid}`;
  try {
    await setDoc(doc(db, 'users', user.uid), {
      ...profile,
      serverCreatedAt: serverTimestamp(),
    });
    return profile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// Create a teacher account directly from the Principal Dashboard without logging out the principal
export async function createTeacherAccountByPrincipal(data: {
  name: string;
  email: string;
  initialPassword?: string;
  phone?: string;
  subject?: string;
}): Promise<{ success: boolean; teacherUid?: string; message: string }> {
  const email = data.email.trim().toLowerCase();
  const password = data.initialPassword?.trim() || 'Teacher@123';
  let teacherUid = '';

  try {
    // Use an isolated secondary Firebase app so current principal session is undisturbed
    const tempAppName = 'SecondaryAuth_' + Date.now();
    const secondaryApp = initializeApp(firebaseConfig, tempAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      teacherUid = userCred.user.uid;
      await signOut(secondaryAuth);
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-in-use') {
        // Teacher auth account already exists in Firebase Auth
        console.info('Teacher auth account already in Firebase Auth:', email);
      } else if (authErr.code === 'auth/operation-not-allowed') {
        console.warn('Firebase Email/Password provider not active; registering teacher profile directly in school directory for Google or portal login:', email);
      } else {
        console.warn('Notice during Firebase Auth user creation:', authErr.code, authErr.message);
      }
    }

    // Save profile in users collection with role: 'teacher'
    const profileDocId = teacherUid || `teacher_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    await setDoc(doc(db, 'users', profileDocId), {
      uid: profileDocId,
      name: data.name.trim(),
      email,
      role: 'teacher',
      active: true,
      phone: data.phone?.trim() || '',
      subject: data.subject?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      serverCreatedAt: serverTimestamp(),
    }, { merge: true });

    return {
      success: true,
      teacherUid,
      message: `Teacher account for ${data.name.trim()} successfully registered in school directory!`,
    };
  } catch (err: any) {
    console.error('Error creating teacher by principal:', err);
    throw err;
  }
}

// Sign out
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// Auth subscriber
export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
