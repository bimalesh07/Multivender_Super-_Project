import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../lib/api';

function displayNameFromEmail(email: string): string {
  const part = email.split('@')[0] || email;
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

interface AuthContextValue {
  token: string | null;
  role: string | null;
  organizationName: string | null;
  userDisplayName: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [role, setRole] = useState<string | null>(() => localStorage.getItem('role'));
  const [organizationName, setOrganizationName] = useState<string | null>(
    () => localStorage.getItem('organization_name')
  );
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem('user_email'));
  const [isLoading, setLoading] = useState(true);

  const userDisplayName = userEmail ? displayNameFromEmail(userEmail) : null;

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('token', res.token);
    localStorage.setItem('role', res.role);
    if (res.email != null) {
      localStorage.setItem('user_email', res.email);
      setUserEmail(res.email);
    } else {
      localStorage.removeItem('user_email');
      setUserEmail(null);
    }
    if (res.organization_name != null) {
      localStorage.setItem('organization_name', res.organization_name);
      setOrganizationName(res.organization_name);
    } else {
      localStorage.removeItem('organization_name');
      setOrganizationName(null);
    }
    setToken(res.token);
    setRole(res.role);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('organization_name');
    localStorage.removeItem('user_email');
    setToken(null);
    setRole(null);
    setOrganizationName(null);
    setUserEmail(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        organizationName,
        userDisplayName,
        login,
        logout,
        isAuthenticated: !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
