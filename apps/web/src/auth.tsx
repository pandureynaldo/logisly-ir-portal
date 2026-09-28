import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth as useOidc } from "react-oidc-context";
import { api, setAccessTokenGetter, type Me } from "./api";

type AuthState = {
  user: Me | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  login: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const oidc = useOidc();
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAccessTokenGetter(() => oidc.user?.access_token);
  }, [oidc.user?.access_token]);

  const refresh = useCallback(async () => {
    if (oidc.isLoading) {
      setLoading(true);
      return;
    }
    if (!oidc.isAuthenticated || !oidc.user?.access_token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<Me>("/api/me");
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [oidc.isLoading, oidc.isAuthenticated, oidc.user?.access_token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    setUser(null);
    await oidc.signoutRedirect();
  }, [oidc]);

  const login = useCallback(() => {
    void oidc.signinRedirect();
  }, [oidc]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: loading || oidc.isLoading,
        refresh,
        logout,
        login,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
