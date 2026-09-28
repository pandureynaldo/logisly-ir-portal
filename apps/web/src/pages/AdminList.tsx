import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { INCIDENT_STATUSES, SEVERITIES } from "@logisly/shared";
import { api, type Incident } from "../api";
import { SeverityChip, StatusChip } from "../components/Chips";

export function AdminListPage() {
  const [rows, setRows] = useState<Incident[]>([]);
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (severity) params.set("severity", severity);
    if (from) params.set("from", new Date(from).toISOString());
    if (to) params.set("to", new Date(to).toISOString());
    if (q.trim()) params.set("q", q.trim());
    try {
      const data = await api<Incident[]>(`/api/admin/incidents?${params}`);
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="card">
      <h1>Admin — semua laporan</h1>
      <p className="sub">Logisly Security Report Portal</p>
      <div className="filters">
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Semua</option>
            {INCIDENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Severity
          <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="">Semua</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Dari
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          Sampai
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label>
          Cari
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ID / judul / email" />
        </label>
      </div>
      <button type="button" onClick={() => void load()}>
        Terapkan filter
      </button>
      {error && <p className="error">{error}</p>}
      <table className="table" style={{ marginTop: "1rem" }}>
        <thead>
          <tr>
            <th>Incident ID</th>
            <th>Judul</th>
            <th>Pelapor</th>
            <th>Dibuat</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <Link to={`/admin/${r.id}`}>{r.incident_id}</Link>
              </td>
              <td>{r.title || r.description.slice(0, 40)}</td>
              <td>{r.reporter?.email}</td>
              <td>{new Date(r.created_at).toLocaleString()}</td>
              <td>
                <SeverityChip severity={r.severity} />
              </td>
              <td>
                <StatusChip status={r.status} />
              </td>
              <td>{r.incident_type || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
