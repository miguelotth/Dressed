import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError, json } from '../services/api';

export type CurrentUser = { id: string; name: string; email: string };
type AuthContextValue = {
  user: CurrentUser | null;
  loading: boolean;
  connectionError: string;
  retry: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};
const Context = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: {children: ReactNode}) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState('');
  const retry = useCallback(async () => {
    setLoading(true);
    setConnectionError('');
    try {
      const result = await api<{user: CurrentUser}>('/api/auth/me');
      setUser(result.user);
    } catch (error) {
      setUser(null);
      if (!(error instanceof ApiError) || error.status !== 401) {
        setConnectionError(error instanceof Error ? error.message : 'Falha ao conectar à API.');
      }
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void retry(); }, [retry]);
  const login = useCallback(async (email: string, password: string) => {
    const result = await api<{user: CurrentUser}>('/api/auth/login', {method:'POST',body:json({email,password})});
    setUser(result.user);
    setConnectionError('');
  }, []);
  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await api<{user: CurrentUser}>('/api/auth/register', {method:'POST',body:json({name,email,password})});
    setUser(result.user);
    setConnectionError('');
  }, []);
  const logout = useCallback(async () => {
    await api<{ok: boolean}>('/api/auth/logout', {method:'POST'});
    setUser(null);
  }, []);
  const value = useMemo(() => ({user,loading,connectionError,retry,login,register,logout}), [user,loading,connectionError,retry,login,register,logout]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('AuthProvider não encontrado.');
  return value;
}
