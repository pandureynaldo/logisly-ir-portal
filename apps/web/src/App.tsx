import { Navigate, Route, Routes, Link } from "react-router-dom";
import { useAuth } from "./auth";
import { LoginPage } from "./pages/Login";
import { OAuthCallbackPage } from "./pages/OAuthCallback";
import { ReportPage } from "./pages/Report";
import { MyReportsPage } from "./pages/MyReports";
import { MyReportDetailPage } from "./pages/MyReportDetail";
import { AdminListPage } from "./pages/AdminList";
import { AdminDetailPage } from "./pages/AdminDetail";

function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <header className="top">
        <div className="nav-links">
          <Link to="/report" className="brand">
            <img src="/images/logo.svg" alt="Logisly" width={36} height={36} />
            <span className="brand-text">
              Logisly SRP
              <span className="brand-full">Security Report Portal</span>
            </span>
          </Link>
          {user && (
            <>
              <Link to="/report">Lapor</Link>
              <Link to="/my-reports">Laporan saya</Link>
              {user.role === "admin" && <Link to="/admin">Admin</Link>}
            </>
          )}
        </div>
        {user && (
          <div style={{ fontSize: "0.85rem", flexShrink: 0 }}>
            {user.name} · {user.email}
            <button
              className="secondary"
              style={{ marginLeft: "0.75rem", padding: "0.35rem 0.7rem" }}
              onClick={() => void logout()}
            >
              Logout
            </button>
          </div>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted">Memuat…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <Shell>{children}</Shell>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted">Memuat…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/report" replace />;
  return <Shell>{children}</Shell>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
      <Route
        path="/report"
        element={
          <RequireAuth>
            <ReportPage />
          </RequireAuth>
        }
      />
      <Route
        path="/my-reports"
        element={
          <RequireAuth>
            <MyReportsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/my-reports/:id"
        element={
          <RequireAuth>
            <MyReportDetailPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminListPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/:id"
        element={
          <RequireAdmin>
            <AdminDetailPage />
          </RequireAdmin>
        }
      />
      <Route path="*" element={<Navigate to="/report" replace />} />
    </Routes>
  );
}
