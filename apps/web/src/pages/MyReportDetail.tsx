import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, downloadAuthenticated, type Incident } from "../api";
import { RichTextView } from "../components/RichTextEditor";
import { SeverityChip, StatusChip } from "../components/Chips";

export function MyReportDetailPage() {
  const { id } = useParams();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api<Incident>(`/api/incidents/${id}`)
      .then(setIncident)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!incident) return <p className="muted">Memuat…</p>;

  return (
    <div className="card">
      <p className="muted">
        <Link to="/my-reports">← Laporan saya</Link>
      </p>
      <h1 className="incident-id">{incident.incident_id}</h1>
      <p className="sub">{incident.title || "Tanpa judul"}</p>
      <div className="chip-row">
        <StatusChip status={incident.status} />
        <SeverityChip severity={incident.severity} />
      </div>
      <div className="field-grid">
        <div className="field-row">
          <div className="k">Deskripsi</div>
          <div>
            <RichTextView html={incident.description} />
          </div>
        </div>
        <Row k="Waktu lapor" v={fmt(incident.report_datetime)} />
        <Row k="Waktu ditemukan" v={fmt(incident.detected_datetime)} />
        <Row k="Catatan bukti" v={incident.evidence_notes} />
      </div>
      <h2 style={{ fontSize: "1.1rem", marginTop: "1.5rem" }}>Evidence</h2>
      <ul>
        {(incident.evidence ?? []).map((e) => (
          <li key={e.id}>
            <button
              type="button"
              className="secondary"
              style={{ padding: "0.2rem 0.5rem" }}
              onClick={() =>
                void downloadAuthenticated(
                  `/api/incidents/${incident.id}/evidence/${e.id}/download`,
                  e.original_filename,
                )
              }
            >
              {e.original_filename}
            </button>{" "}
            <span className="muted">({Math.round(e.size_bytes / 1024)} KB)</span>
          </li>
        ))}
        {!incident.evidence?.length && <li className="muted">Tidak ada file</li>}
      </ul>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div className="field-row">
      <div className="k">{k}</div>
      <div>{v || "—"}</div>
    </div>
  );
}

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}
