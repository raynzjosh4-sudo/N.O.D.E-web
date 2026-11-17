import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  legalBusinessName?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string, name?: string, businessName?: string) => Promise<{ success: boolean; userId: string }>;
  signInWithGoogle: () => Promise<boolean>;
  verifyOtp: (email: string, code: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const DEFAULT_DEMO_USER: AuthUser = {
  id: 'usr_apex_01',
  email: 'procurement@apexwholesale.ug',
  name: 'Apex Wholesale Importers',
  legalBusinessName: 'Apex Commercial Supplies Ltd',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
};

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_DEMO_USER,
  isAuthenticated: true,
  isLoading: false,
  signInWithEmail: async () => true,
  signUpWithEmail: async () => ({ success: true, userId: 'usr_new' }),
  signInWithGoogle: async () => true,
  verifyOtp: async () => true,
  sendPasswordReset: async () => true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(DEFAULT_DEMO_USER);
  const [isLoading, setIsLoading] = useState(false);

  const signInWithEmail = async (email: string, _password: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600)); // simulate auth network
    setUser({
      id: 'usr_' + Date.now(),
      email,
      name: email.split('@')[0],
      legalBusinessName: 'Wholesale Partner Ltd',
      avatarUrl: DEFAULT_DEMO_USER.avatarUrl,
    });
    setIsLoading(false);
    return true;
  };

  const signUpWithEmail = async (
    email: string,
    _password: string,
    name?: string,
    businessName?: string
  ): Promise<{ success: boolean; userId: string }> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const newId = 'usr_' + Date.now();
    setUser({
      id: newId,
      email,
      name: name || email.split('@')[0],
      legalBusinessName: businessName || 'Enterprise Importer',
      avatarUrl: DEFAULT_DEMO_USER.avatarUrl,
    });
    setIsLoading(false);
    return { success: true, userId: newId };
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800)); // simulate Google OAuth
    setUser({
      id: 'usr_google_' + Date.now(),
      email: 'alex.procurement@gmail.com',
      name: 'Alex Mugisha',
      legalBusinessName: 'Kampala Express Wholesalers',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    });
    setIsLoading(false);
    return true;
  };

  const verifyOtp = async (_email: string, _code: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsLoading(false);
    return true;
  };

  const sendPasswordReset = async (_email: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setIsLoading(false);
    return true;
  };

  const signOut = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        verifyOtp,
        sendPasswordReset,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
