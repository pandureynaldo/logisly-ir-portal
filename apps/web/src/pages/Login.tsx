import { useSearchParams, Navigate } from "react-router-dom";
import { useAuth } from "../auth";

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const [params] = useSearchParams();
  const error = params.get("error");

  if (!loading && user) return <Navigate to="/report" replace />;

  return (
    <div className="app-shell">
      <header className="top">
        <span className="brand">
          <img src="/images/logo.svg" alt="Logisly" width={36} height={36} />
          <span className="brand-text">
            Logisly SRP
            <span className="brand-full">Security Report Portal</span>
          </span>
        </span>
      </header>
      <main>
        <div className="card" style={{ maxWidth: 420, margin: "2rem auto" }}>
          <div className="login-hero">
            <img src="/images/logo.svg" alt="Logisly" width={72} height={72} />
            <h1>Masuk</h1>
            <p className="sub">Logisly Security Report Portal (SRP)</p>
          </div>
          <p className="sub">Sign in with your Logisly account (@logisly.com)</p>
          {error && <p className="error">{decodeURIComponent(error)}</p>}
          <button type="button" className="btn" onClick={() => login()} disabled={loading}>
            Lanjut dengan Logisly SSO
          </button>
          <p className="muted" style={{ marginTop: "1rem" }}>
            Hanya akun @logisly.com. Laporan tidak lengkap tetap boleh dikirim.
          </p>
        </div>
      </main>
    </div>
  );
}
