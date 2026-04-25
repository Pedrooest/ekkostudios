import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabase';
import { PerfilUsuario } from '../types';

interface AuthContextValue {
  currentUser: any | null;
  setCurrentUser: (user: any | null) => void;
  perfilUsuario: PerfilUsuario | null;
  setPerfilUsuario: (profile: PerfilUsuario | null) => void;
  authLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [perfilUsuario, setPerfilUsuario] = useState<PerfilUsuario | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setCurrentUser(session?.user ?? null);
        setAuthLoading(false);
      })
      .catch((err) => {
        console.error('Supabase getSession Error:', err);
        setAuthLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        const savedProfile = localStorage.getItem(`profile_${session.user.id}`);
        if (savedProfile) {
          setPerfilUsuario(JSON.parse(savedProfile));
        } else {
          const newProfile: PerfilUsuario = {
            id: session.user.id,
            email: session.user.email ?? '',
            full_name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Usuário',
            role: 'Especialista EKKO',
            status: 'online'
          };
          setPerfilUsuario(newProfile);
          localStorage.setItem(`profile_${session.user.id}`, JSON.stringify(newProfile));
          // Async profile sync (detached from render cycle)
          supabase.from('profiles').upsert(newProfile).then(({ error }) => {
            if (error) console.warn('Secondary profile sync failed:', error);
          });
        }
      } else {
        setPerfilUsuario(null);
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      currentUser,
      setCurrentUser,
      perfilUsuario,
      setPerfilUsuario,
      authLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
