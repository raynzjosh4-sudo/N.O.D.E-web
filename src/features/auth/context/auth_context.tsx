import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/core/api/api_client';
import { API_ENDPOINTS } from '@/core/api/api_endpoints';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  legalBusinessName?: string;
  avatarUrl?: string;
  role?: string;
  token?: string; // JWT Bearer token from backend
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  getToken: () => string | null;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string, name?: string, businessName?: string) => Promise<{ success: boolean; userId: string }>;
  signInWithGoogle: () => Promise<boolean>;
  verifyOtp: (email: string, code: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const STORAGE_KEYS = {
  USER: '@node_auth_user',
  TOKEN: '@node_auth_token',
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  getToken: () => null,
  signInWithEmail: async () => false,
  signUpWithEmail: async () => ({ success: false, userId: '' }),
  signInWithGoogle: async () => false,
  verifyOtp: async () => false,
  sendPasswordReset: async () => false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore stored session on mount
  useEffect(() => {
    (async () => {
      try {
        const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          parsedUser.token = storedToken;
          setUser(parsedUser);
        }
      } catch (err) {
        console.warn('Failed to restore auth session:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  /** Returns the JWT token for authenticated API calls, or null */
  const getToken = (): string | null => user?.token ?? null;

  const persistSession = async (authUser: AuthUser, token: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authUser));
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } catch (e) {
      console.warn('Error saving auth token:', e);
    }
  };

  const clearSession = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    } catch (e) {
      console.warn('Error clearing auth token:', e);
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiClient<{
        access_token: string;
        token_type: string;
        user: {
          id: string;
          email: string;
          full_name?: string;
          role?: string;
          profile_pic_url?: string;
        };
      }>(API_ENDPOINTS.AUTH.SIGN_IN, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        headers: { 'Content-Type': 'application/json' },
      });

      const token = response.access_token;
      const u = response.user;
      const authUser: AuthUser = {
        id: u.id,
        email: u.email,
        name: u.full_name || email.split('@')[0],
        legalBusinessName: 'Wholesale Partner',
        avatarUrl: u.profile_pic_url || undefined,
        role: u.role || 'buyer',
        token,
      };

      setUser(authUser);
      await persistSession(authUser, token);

      // Fetch full business profile in background
      refreshProfile(authUser, token).catch(() => {});
      return true;
    } catch (error) {
      console.warn('Sign-in failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    _name?: string,
    _businessName?: string
  ): Promise<{ success: boolean; userId: string }> => {
    setIsLoading(true);
    try {
      const response = await apiClient<{ id?: string; message?: string }>(API_ENDPOINTS.AUTH.SIGN_UP, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        headers: { 'Content-Type': 'application/json' },
      });
      return { success: true, userId: response.id || 'usr_registered' };
    } catch (error) {
      console.warn('Sign-up failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (email: string, code: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiClient<{
        access_token: string;
        token_type: string;
        user: {
          id: string;
          email: string;
          full_name?: string;
          role?: string;
          profile_pic_url?: string;
        };
      }>(API_ENDPOINTS.AUTH.OTP_VERIFY, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), token: code.trim() }),
        headers: { 'Content-Type': 'application/json' },
      });

      const token = response.access_token;
      const u = response.user;
      const authUser: AuthUser = {
        id: u.id,
        email: u.email,
        name: u.full_name || email.split('@')[0],
        avatarUrl: u.profile_pic_url || undefined,
        role: u.role || 'buyer',
        token,
      };

      setUser(authUser);
      await persistSession(authUser, token);
      refreshProfile(authUser, token).catch(() => {});
      return true;
    } catch (error) {
      console.warn('OTP verify failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await apiClient(API_ENDPOINTS.AUTH.PASSWORD_RESET, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
        headers: { 'Content-Type': 'application/json' },
      });
      return true;
    } catch (error) {
      console.warn('Password reset failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    // If google OAuth is triggered, stub or redirect appropriately
    return false;
  };

  const refreshProfile = async (targetUser?: AuthUser, targetToken?: string) => {
    const curToken = targetToken || getToken();
    if (!curToken) return;

    try {
      const profile = await apiClient<{
        user: { id: string; full_name?: string; email: string; profile_pic_url?: string; role?: string };
        business?: { legal_name?: string };
      }>(API_ENDPOINTS.PROFILE.ME, { token: curToken });

      const base = targetUser || user;
      if (!base) return;

      const updated: AuthUser = {
        ...base,
        id: profile.user.id || base.id,
        name: profile.user.full_name || base.name,
        email: profile.user.email || base.email,
        legalBusinessName: profile.business?.legal_name || base.legalBusinessName,
        avatarUrl: profile.user.profile_pic_url || base.avatarUrl,
        role: profile.user.role || base.role,
        token: curToken,
      };

      setUser(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
  };

  const signOut = async () => {
    setUser(null);
    await clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        getToken,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        verifyOtp,
        sendPasswordReset,
        signOut,
        refreshProfile: () => refreshProfile(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
