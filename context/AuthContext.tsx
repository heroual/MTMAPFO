
import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { AuthService, UserProfile, UserRole } from '../lib/service/auth-service';

type User = any;

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkAccess: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    // Initialisation immédiate depuis le cache pour éviter le "MODE LOCAL"
    const cached = localStorage.getItem('mtmap-cached-profile');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(true);

  const resolveIdentity = async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      localStorage.removeItem('mtmap-cached-profile');
      setLoading(false);
      return;
    }

    try {
      const data = await AuthService.fetchMyProfile();
      if (data) {
        setProfile(data);
        localStorage.setItem('mtmap-cached-profile', JSON.stringify(data));
      }
    } catch (err) {
      console.error("[Auth] Sync failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        // On résout l'identité en tâche de fond si on a déjà un cache, sinon on attend
        if (currentUser) {
            resolveIdentity(currentUser);
        } else {
            setLoading(false);
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      const newUser = session?.user ?? null;
      
      if (newUser?.id !== user?.id || event === 'SIGNED_IN') {
        setUser(newUser);
        resolveIdentity(newUser);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        localStorage.removeItem('mtmap-cached-profile');
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      localStorage.removeItem('mtmap-cached-profile');
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    setLoading(true);
    if (user) await resolveIdentity(user);
    else setLoading(false);
  };

  const checkAccess = (requiredRole: UserRole): boolean => {
    if (!profile) return false;
    return AuthService.hasAccess(profile.role, requiredRole);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile, checkAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
