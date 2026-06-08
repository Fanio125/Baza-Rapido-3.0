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

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!localStorage.getItem('demo_user')) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    }).catch(err => {
      console.warn("Supabase initial session fetch failed (offline or blocked):", err);
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
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    localStorage.removeItem('demo_user');
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
