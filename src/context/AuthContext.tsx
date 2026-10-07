import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  ensureUserProfile,
  getUserProfile,
  logoutUser,
  subscribeToAuth,
  checkBootstrapStatus,
  BOOTSTRAP_ADMIN_EMAIL,
  isBootstrapAdmin,
} from '../services/authService';
import { UserProfile } from '../types';
import { testFirebaseConnection } from '../lib/firebase';
import { seedInitialSchoolDataIfEmpty } from '../services/schoolService';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isPrincipal: boolean;
  isTeacher: boolean;
  bootstrapNeeded: boolean;
  deactivatedNotice: string | null;
  clearDeactivatedNotice: () => void;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isPrincipal: false,
  isTeacher: false,
  bootstrapNeeded: false,
  deactivatedNotice: null,
  clearDeactivatedNotice: () => {},
  refreshProfile: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapNeeded, setBootstrapNeeded] = useState(false);
  const [deactivatedNotice, setDeactivatedNotice] = useState<string | null>(null);

  const fetchProfileForUser = async (firebaseUser: User) => {
    try {
      let p = await getUserProfile(firebaseUser.uid);
      if (!p) {
        p = await ensureUserProfile(firebaseUser);
      }

      // Check if user account is deactivated
      if (p.active === false) {
        console.warn(`User ${firebaseUser.email} is deactivated.`);
        await logoutUser();
        setUser(null);
        setProfile(null);
        setDeactivatedNotice('Access Denied: Your account has been deactivated by the Principal. Please contact administration.');
        return;
      }

      setProfile(p);
      setDeactivatedNotice(null);

      // Seed initial sample school records if principal signs in
      if (p.role === 'principal') {
        seedInitialSchoolDataIfEmpty(p.name);
      }
    } catch (err) {
      console.error('Error fetching/ensuring user profile:', err);
      const isOwner = isBootstrapAdmin(firebaseUser.email);
      setProfile({
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || (isOwner ? 'Principal Administrator' : 'Staff Member'),
        email: firebaseUser.email || '',
        role: isOwner ? 'principal' : 'teacher',
        active: true,
      });
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileForUser(user);
    }
    const bNeeded = await checkBootstrapStatus();
    setBootstrapNeeded(bNeeded);
  };

  useEffect(() => {
    testFirebaseConnection();

    checkBootstrapStatus().then(needed => {
      setBootstrapNeeded(needed);
    });

    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfileForUser(firebaseUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
    setDeactivatedNotice(null);
  };

  const clearDeactivatedNotice = () => {
    setDeactivatedNotice(null);
  };

  const isPrincipal = profile?.role === 'principal';
  const isTeacher = profile?.role === 'teacher';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isPrincipal,
        isTeacher,
        bootstrapNeeded,
        deactivatedNotice,
        clearDeactivatedNotice,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
