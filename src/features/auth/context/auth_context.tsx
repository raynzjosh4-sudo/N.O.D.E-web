import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
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
  isProfileReady: boolean; // true once role/profile has been confirmed from the API
  getToken: () => string | null;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string) => Promise<{ success: boolean; userId: string }>;
  signInWithGoogle: (options?: { idToken?: string; email?: string; name?: string; avatarUrl?: string }) => Promise<boolean>;
  verifyOtp: (email: string, code: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  resetPasswordWithPin: (email: string, pin: string, newPassword: string) => Promise<boolean>;
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
  isProfileReady: false,
  getToken: () => null,
  signInWithEmail: async () => false,
  signUpWithEmail: async () => ({ success: false, userId: '' }),
  signInWithGoogle: async () => false,
  verifyOtp: async () => false,
  sendPasswordReset: async () => false,
  resetPasswordWithPin: async () => false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileReady, setIsProfileReady] = useState(false);

  // Restore stored session on mount & fetch fresh profile from DB
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // 1. Check for Google OAuth redirect tokens in URL hash or query params (Supabase OAuth flow on Web)
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const hash = window.location.hash ? window.location.hash.substring(1) : '';
          const search = window.location.search ? window.location.search.substring(1) : '';
          const params = new URLSearchParams(hash || search);
          const accessToken = params.get('access_token');

          if (accessToken) {
            try {
              let email = '';
              let name = '';
              let avatarUrl = '';

              // Decode user info from JWT payload
              try {
                const base64Url = accessToken.split('.')[1];
                if (base64Url) {
                  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                  const jsonPayload = decodeURIComponent(
                    atob(base64)
                      .split('')
                      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                      .join('')
                  );
                  const payload = JSON.parse(jsonPayload);
                  email = payload.email || '';
                  name = payload.user_metadata?.full_name || payload.user_metadata?.name || '';
                  avatarUrl = payload.user_metadata?.avatar_url || payload.user_metadata?.picture || '';
                }
              } catch (decodeErr) {
                console.warn('JWT payload decode fallback:', decodeErr);
              }

              // Also query Supabase user endpoint directly as backup
              if (!email) {
                try {
                  const sbRes = await fetch('https://lihoygvdnnfqodjjxqnz.supabase.co/auth/v1/user', {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      apikey: 'sb_publishable_xknRF_gqAzQqznqNvSONRg_j6GkQdrS',
                    },
                  });
                  if (sbRes.ok) {
                    const sbData = await sbRes.json();
                    email = sbData.email || email;
                    name = sbData.user_metadata?.full_name || sbData.user_metadata?.name || name;
                    avatarUrl = sbData.user_metadata?.avatar_url || sbData.user_metadata?.picture || avatarUrl;
                  }
                } catch (sbErr) {
                  console.warn('Supabase auth user query error:', sbErr);
                }
              }

              if (email) {
                // Exchange with backend /api/v1/auth/google to create/sync account and get app session token
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
                }>(API_ENDPOINTS.AUTH.GOOGLE, {
                  method: 'POST',
                  body: JSON.stringify({
                    id_token: accessToken,
                    email,
                    name,
                    avatar_url: avatarUrl,
                  }),
                  headers: { 'Content-Type': 'application/json' },
                });

                const token = response.access_token || accessToken;
                const u = response.user || { id: email, email, full_name: name, role: 'customer' };
                const authUser: AuthUser = {
                  id: u.id,
                  email: u.email,
                  name: u.full_name || name || u.email.split('@')[0],
                  avatarUrl: u.profile_pic_url || avatarUrl,
                  role: u.role ? u.role.toLowerCase() : 'buyer',
                  token,
                };

                if (isMounted) setUser(authUser);
                await persistSession(authUser, token);

                // Clean the URL hash in the browser address bar
                if (window.history && window.history.replaceState) {
                  window.history.replaceState(null, '', window.location.pathname);
                }

                try {
                  await refreshProfile(authUser, token);
                } catch (e) {
                  console.warn('Profile refresh after Google OAuth error:', e);
                }

                return; // Successfully restored from Google OAuth
              }
            } catch (googleOAuthErr) {
              console.warn('Handling Google OAuth redirect failed:', googleOAuthErr);
            }
          }
        }

        // 2. Standard AsyncStorage session restoration
        const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          parsedUser.token = storedToken;
          if (isMounted) setUser(parsedUser);

          // Always fetch newest profile (role, avatar, legal name) from backend
          try {
            await refreshProfile(parsedUser, storedToken);
          } catch (e) {
            console.warn('Initial profile refresh error:', e);
          }
        }
      } catch (err) {
        console.warn('Failed to restore auth session:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsProfileReady(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
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
    setIsProfileReady(false);
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
        legalBusinessName: undefined,
        avatarUrl: u.profile_pic_url || undefined,
        role: u.role ? u.role.toLowerCase() : 'buyer',
        token,
      };

      setUser(authUser);
      await persistSession(authUser, token);

      // Await refreshProfile so the true role and avatar are confirmed before completing sign in
      try {
        await refreshProfile(authUser, token);
      } catch (e) {
        console.warn('Profile refresh during sign in failed:', e);
      }
      return true;
    } catch (error) {
      console.warn('Sign-in failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setIsProfileReady(true);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string
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
    setIsProfileReady(false);
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
        role: u.role ? u.role.toLowerCase() : 'buyer',
        token,
      };

      setUser(authUser);
      await persistSession(authUser, token);

      try {
        await refreshProfile(authUser, token);
      } catch (e) {
        console.warn('Profile refresh during OTP verify failed:', e);
      }
      return true;
    } catch (error) {
      console.warn('OTP verify failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setIsProfileReady(true);
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

  const resetPasswordWithPin = async (
    email: string,
    pin: string,
    newPassword: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      await apiClient(API_ENDPOINTS.AUTH.PASSWORD_UPDATE, {
        method: 'PUT',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          token: pin.trim(),
          password: newPassword,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      return true;
    } catch (error) {
      console.warn('Reset password with PIN failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async (options?: {
    idToken?: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
  }): Promise<boolean> => {
    setIsLoading(true);
    setIsProfileReady(false);
    try {
      // If no credentials passed on web, trigger direct Google OAuth flow
      if (!options?.idToken && !options?.email) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const redirectUri = window.location.origin;
          window.location.href = `https://lihoygvdnnfqodjjxqnz.supabase.co/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUri)}`;
          return false;
        }
      }

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
      }>(API_ENDPOINTS.AUTH.GOOGLE, {
        method: 'POST',
        body: JSON.stringify({
          id_token: options?.idToken,
          email: options?.email,
          name: options?.name,
          avatar_url: options?.avatarUrl,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const token = response.access_token;
      const u = response.user;
      const authUser: AuthUser = {
        id: u.id,
        email: u.email,
        name: u.full_name || options?.name || u.email.split('@')[0],
        avatarUrl: u.profile_pic_url || options?.avatarUrl,
        role: u.role ? u.role.toLowerCase() : 'buyer',
        token,
      };

      setUser(authUser);
      await persistSession(authUser, token);

      try {
        await refreshProfile(authUser, token);
      } catch (e) {
        console.warn('Profile refresh during Google sign in failed:', e);
      }
      return true;
    } catch (error) {
      console.warn('Google sign in failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setIsProfileReady(true);
    }
  };

  const refreshProfile = async (targetUser?: AuthUser, targetToken?: string): Promise<AuthUser | null> => {
    const curToken = targetToken || getToken();
    if (!curToken) return null;

    try {
      const profile = await apiClient<{
        user: { id: string; full_name?: string; email: string; profile_pic_url?: string; role?: string };
        business?: { legal_name?: string; logo_url?: string };
      }>(API_ENDPOINTS.PROFILE.ME, { token: curToken });

      const base = targetUser || user;
      if (!base) return null;

      const avatarUrl = profile.user.profile_pic_url || profile.business?.logo_url || base.avatarUrl;
      const role = (profile.user.role || base.role || 'buyer').toLowerCase();

      const updated: AuthUser = {
        ...base,
        id: profile.user.id || base.id,
        name: profile.user.full_name || profile.business?.legal_name || base.name,
        email: profile.user.email || base.email,
        legalBusinessName: profile.business?.legal_name || base.legalBusinessName,
        avatarUrl: avatarUrl || undefined,
        role,
        token: curToken,
      };

      setUser(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
      setIsProfileReady(true);
      return updated;
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
      return null;
    }
  };

  const signOut = async () => {
    setUser(null);
    setIsProfileReady(false);
    await clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isProfileReady,
        getToken,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        verifyOtp,
        sendPasswordReset,
        resetPasswordWithPin,
        signOut,
        refreshProfile: async () => {
          await refreshProfile();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
