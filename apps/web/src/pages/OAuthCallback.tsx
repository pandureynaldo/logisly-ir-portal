import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";

/** Completes the authorization-code redirect from Keycloak. */
export function OAuthCallbackPage() {
  const auth = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (auth.isLoading) return;
    if (auth.error) {
      nav(`/login?error=${encodeURIComponent(auth.error.message)}`, {
        replace: true,
      });
      return;
    }
    if (auth.isAuthenticated) {
      nav("/report", { replace: true });
    }
  }, [auth.isLoading, auth.error, auth.isAuthenticated, nav]);

  return <p className="muted">Menyelesaikan login…</p>;
}
