import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Incident } from "../api";
import { StatusChip } from "../components/Chips";

export function MyReportsPage() {
  const [rows, setRows] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Incident[]>("/api/incidents/mine")
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="card">
      <h1>Laporan saya</h1>
      <p className="sub">My submissions</p>
      {error && <p className="error">{error}</p>}
      <table className="table">
        <thead>
          <tr>
            <th>Incident ID</th>
            <th>Judul</th>
            <th>Status</th>
            <th>Dibuat</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <Link to={`/my-reports/${r.id}`}>{r.incident_id}</Link>
              </td>
              <td>{r.title || r.description.slice(0, 60)}</td>
              <td>
                <StatusChip status={r.status} />
              </td>
              <td>{new Date(r.created_at).toLocaleString()}</td>
            </tr>
          ))}
          {!rows.length && !error && (
            <tr>
              <td colSpan={4} className="muted">
                Belum ada laporan
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
