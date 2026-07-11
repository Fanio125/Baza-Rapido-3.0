import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInAsDemo: (fullName?: string, phone?: string, email?: string) => void;
  updateUserMetadata: (metadata: { 
    full_name?: string; 
    phone?: string; 
    city?: string; 
    avatar_url?: string; 
    photo_url?: string;
  }) => Promise<void>;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const clearInvalidSupabaseSession = () => {
    try {
      console.warn("Clearing invalid Supabase session from storage...");
      localStorage.removeItem('sb-pbcoftqdqyitgzwyadjc-auth-token');
      localStorage.removeItem('supabase.auth.token');
      
      // Loop through all localStorage items to find any key related to supabase or auth-token
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('auth-token') || key.includes('supabase.auth') || key.startsWith('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      
      // Clear cookies starting with sb- or containing auth-token
      document.cookie.split(";").forEach((c) => {
        const trimmed = c.trim();
        if (trimmed.startsWith("sb-") || trimmed.includes("auth-token") || trimmed.includes("supabase")) {
          document.cookie = trimmed.replace(/=.*/, "=;expires=" + new Date(0).toUTCString() + ";path=/");
        }
      });
    } catch (e) {
      console.error("Error clearing supabase storage:", e);
    }
  };

  useEffect(() => {
    // Check if there is a demo session in localStorage first
    const savedDemo = localStorage.getItem('demo_user');
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        setUser(parsed.user);
        setSession(parsed.session);
        setIsDemo(true);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('demo_user');
      }
    }

    // Set up global error and unhandled promise rejection listeners to catch invalid refresh token errors
    const handleGlobalError = (event: PromiseRejectionEvent | ErrorEvent) => {
      let errorMsg = '';
      if ('reason' in event) {
        errorMsg = String(event.reason?.message || event.reason || '');
      } else if ('message' in event) {
        errorMsg = String(event.message || '');
      }

      const lowerMsg = errorMsg.toLowerCase();
      if (
        lowerMsg.includes('refresh token') || 
        lowerMsg.includes('token not found') ||
        lowerMsg.includes('invalid_grant') ||
        lowerMsg.includes('invalid refresh token')
      ) {
        console.warn("Caught invalid refresh token error globally. Cleaning up...", errorMsg);
        clearInvalidSupabaseSession();
        setUser(null);
        setSession(null);
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    };

    window.addEventListener('unhandledrejection', handleGlobalError);
    window.addEventListener('error', handleGlobalError);

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!localStorage.getItem('demo_user')) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    }).catch(err => {
      console.warn("Supabase initial session fetch failed (offline or blocked):", err);
      const errMsg = String(err?.message || err || '').toLowerCase();
      if (
        errMsg.includes('refresh token') || 
        errMsg.includes('token not found') || 
        errMsg.includes('invalid_grant') ||
        errMsg.includes('invalid refresh token')
      ) {
        clearInvalidSupabaseSession();
        setUser(null);
        setSession(null);
      }
      if (!localStorage.getItem('demo_user')) {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!localStorage.getItem('demo_user')) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      window.removeEventListener('unhandledrejection', handleGlobalError);
      window.removeEventListener('error', handleGlobalError);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    localStorage.removeItem('demo_user');
    sessionStorage.removeItem('bypass_admin_redirect');
    setIsDemo(false);
    setUser(null);
    setSession(null);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase auth signOut failed or not connected:", e);
    }
  };

  const signInAsDemo = (fullName = 'Utilizador Demo', phone = '923456789', email = 'demo@bazarapido.com') => {
    const demoUser = {
      id: 'demo-user-id',
      email,
      user_metadata: {
        full_name: fullName,
        phone,
      },
      aud: 'authenticated',
      role: 'authenticated',
    } as unknown as User;

    const demoSession = {
      user: demoUser,
      access_token: 'demo-access-token',
    } as unknown as Session;

    localStorage.setItem('demo_user', JSON.stringify({ user: demoUser, session: demoSession }));
    setIsDemo(true);
    setUser(demoUser);
    setSession(demoSession);
  };

  const updateUserMetadata = async (metadata: { 
    full_name?: string; 
    phone?: string; 
    city?: string;
    avatar_url?: string;
    photo_url?: string;
  }) => {
    if (isDemo) {
      const updatedUser = {
        ...user,
        user_metadata: {
          ...user?.user_metadata,
          ...metadata,
        }
      } as unknown as User;

      const updatedSession = {
        ...session,
        user: updatedUser,
      } as unknown as Session;

      localStorage.setItem('demo_user', JSON.stringify({ user: updatedUser, session: updatedSession }));
      setUser(updatedUser);
      setSession(updatedSession);
    } else {
      const { data, error } = await supabase.auth.updateUser({
        data: metadata
      });
      if (error) throw error;
      if (data.user) {
        setUser(data.user);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, signInAsDemo, updateUserMetadata, isDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
