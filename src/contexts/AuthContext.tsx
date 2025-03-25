import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState, User } from '../types';
import * as SecureStore from 'expo-secure-store';
import { 
  signIn, 
  signUp, 
  signOut as supabaseSignOut, 
  resetPassword, 
  getCurrentUser, 
  getCurrentSession,
  getUserProfile,
} from '../services/supabase';

interface AuthContextProps {
  authState: AuthState;
  login: (email: string, password: string) => Promise<{ error: any }>;
  register: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<{ error: any }>;
  forgotPassword: (email: string) => Promise<{ error: any }>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const defaultAuthState: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  error: null,
};

const AuthContext = createContext<AuthContextProps>({
  authState: defaultAuthState,
  login: async () => ({ error: null }),
  register: async () => ({ error: null }),
  logout: async () => ({ error: null }),
  forgotPassword: async () => ({ error: null }),
  isAuthenticated: false,
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);
  const isAuthenticated = !!authState.session;
  const isLoading = authState.isLoading;

  useEffect(() => {
    // Check for existing session on app start
    const loadSession = async () => {
      try {
        // Check if user is already logged in
        const { session, error: sessionError } = await getCurrentSession();
        
        if (sessionError || !session) {
          setAuthState({
            user: null,
            session: null,
            isLoading: false,
            error: sessionError?.message || null,
          });
          return;
        }

        // Get user data
        const { user, error: userError } = await getCurrentUser();
        
        if (userError || !user) {
          setAuthState({
            user: null,
            session: null,
            isLoading: false,
            error: userError?.message || null,
          });
          return;
        }

        // Get user profile
        const { data: profile, error: profileError } = await getUserProfile(user.id);

        setAuthState({
          user: {
            id: user.id,
            email: user.email as string,
            firstName: profile?.first_name || '',
            lastName: profile?.last_name || '',
            diabetesType: profile?.diabetes_type || undefined,
            birthdate: profile?.birthdate || undefined,
            createdAt: user.created_at || '',
            updatedAt: profile?.updated_at || '',
          },
          session,
          isLoading: false,
          error: null,
        });
      } catch (error: any) {
        setAuthState({
          user: null,
          session: null,
          isLoading: false,
          error: error.message,
        });
      }
    };

    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
        return { error };
      }

      if (data.user) {
        // Get user profile
        const { data: profile } = await getUserProfile(data.user.id);

        setAuthState({
          user: {
            id: data.user.id,
            email: data.user.email as string,
            firstName: profile?.first_name || '',
            lastName: profile?.last_name || '',
            diabetesType: profile?.diabetes_type || undefined,
            birthdate: profile?.birthdate || undefined,
            createdAt: data.user.created_at || '',
            updatedAt: profile?.updated_at || '',
          },
          session: data.session,
          isLoading: false,
          error: null,
        });
      }
      
      return { error: null };
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      return { error };
    }
  };

  const register = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { data, error } = await signUp(email, password);
      
      if (error) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
        return { error };
      }

      if (data.user) {
        // Auto login after registration
        return await login(email, password);
      }
      
      return { error: null };
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      return { error };
    }
  };

  const logout = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { error } = await supabaseSignOut();
      
      if (error) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
        return { error };
      }

      setAuthState({
        user: null,
        session: null,
        isLoading: false,
        error: null,
      });
      
      return { error: null };
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      return { error };
    }
  };

  const forgotPassword = async (email: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { data, error } = await resetPassword(email);
      
      if (error) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
        return { error };
      }

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
      }));
      
      return { error: null };
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      return { error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        register,
        logout,
        forgotPassword,
        isAuthenticated,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 