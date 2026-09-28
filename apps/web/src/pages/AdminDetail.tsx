import { type FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  INCIDENT_STATUSES,
  INCIDENT_TYPES,
  SEVERITIES,
} from "@logisly/shared";
import { api, downloadAuthenticated, type Incident } from "../api";
import { RichTextEditor } from "../components/RichTextEditor";
import { SeverityChip, StatusChip } from "../components/Chips";
import { RunbookPicker } from "../components/RunbookPicker";

const EVIDENCE_ACCEPT = ".png,.jpg,.jpeg,.pdf,.txt,.log,.zip";
const EVIDENCE_MAX = 10;

export function AdminDetailPage() {
  const { id } = useParams();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputId = "admin-evidence-input";

  async function reload() {
    if (!id) return;
    const fresh = await api<Incident>(`/api/incidents/${id}`);
    setIncident(fresh);
  }

  useEffect(() => {
    if (!id) return;
    api<Incident>(`/api/incidents/${id}`)
      .then(setIncident)
      .catch((e) => setError(e.message));
  }, [id]);

  async function uploadFiles(list: FileList | null) {
    if (!incident || !list?.length) return;
    const files = Array.from(list).slice(0, EVIDENCE_MAX);
    const input = document.getElementById(fileInputId) as HTMLInputElement | null;
    if (input) input.value = "";

    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      await api(`/api/incidents/${incident.id}/evidence`, {
        method: "POST",
        body: fd,
      });
      await reload();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Gagal upload");
    } finally {
      setUploading(false);
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!incident) return;
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await api<Incident>(`/api/incidents/${incident.id}`, {
        method: "PATCH",
        json: {
          title: incident.title,
          description: incident.description,
          report_datetime: incident.report_datetime,
          detected_datetime: incident.detected_datetime,
          occurred_datetime: incident.occurred_datetime,
          reporting_channel: incident.reporting_channel,
          affected_systems: incident.affected_systems,
          affected_users: incident.affected_users,
          potential_data: incident.potential_data,
          observed_activity: incident.observed_activity,
          evidence_notes: incident.evidence_notes,
          actions_taken: incident.actions_taken,
          current_impact: incident.current_impact,
          other_info: incident.other_info,
          assigned_owner_email: incident.assigned_owner_email || null,
          incident_type: incident.incident_type,
          severity: incident.severity,
          status: incident.status as (typeof INCIDENT_STATUSES)[number],
          detection_source: incident.detection_source,
          timeline_summary: incident.timeline_summary,
          containment_actions: incident.containment_actions,
          eradication_actions: incident.eradication_actions,
          recovery_actions: incident.recovery_actions,
          root_cause: incident.root_cause,
          impact_assessment: incident.impact_assessment,
          notifications_made: incident.notifications_made,
          related_tickets: incident.related_tickets,
          related_runbooks: incident.related_runbooks,
          risk_acceptance_ref: incident.risk_acceptance_ref,
          closure_date: incident.closure_date,
          postmortem_ref: incident.postmortem_ref,
          admin_notes: incident.admin_notes,
        },
      });
      setIncident(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  }

  function setField<K extends keyof Incident>(key: K, value: Incident[K]) {
    setIncident((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  if (error && !incident) return <p className="error">{error}</p>;
  if (!incident) return <p className="muted">Memuat…</p>;

  return (
    <div className="card">
      <p className="muted">
        <Link to="/admin">← Admin</Link>
      </p>
      <h1 className="incident-id">{incident.incident_id}</h1>
      <div className="chip-row">
        <StatusChip status={incident.status} />
        <SeverityChip severity={incident.severity} />
      </div>
      <p className="sub">
        {incident.reporter?.name} ({incident.reporter?.email}) ·{" "}
        {new Date(incident.created_at).toLocaleString()}
      </p>
      {incident.external_ticket_url && (
        <p>
          <a href={incident.external_ticket_url} target="_blank" rel="noreferrer">
            Buka tiket ({incident.external_ticket_id || "external"})
          </a>
        </p>
      )}

      <h2 style={{ fontSize: "1.15rem", marginTop: "1.25rem" }}>Evidence</h2>
      <p className="muted">
        Klik + untuk menambah file (png, jpg, pdf, txt, log, zip — max 20MB,
        hingga {EVIDENCE_MAX} sekaligus). Upload langsung setelah dipilih.
      </p>
      <div className="evidence-grid">
        {(incident.evidence ?? []).map((e) => (
          <button
            key={e.id}
            type="button"
            className="evidence-card"
            title="Download"
            onClick={() =>
              void downloadAuthenticated(
                `/api/incidents/${incident.id}/evidence/${e.id}/download`,
                e.original_filename,
              )
            }
          >
            <span className="evidence-card-name">{e.original_filename}</span>
            <span className="evidence-card-meta">
              {Math.round(e.size_bytes / 1024)} KB
            </span>
          </button>
        ))}
        <label
          className={`evidence-card evidence-add${uploading ? " is-busy" : ""}`}
        >
          <input
            id={fileInputId}
            type="file"
            multiple
            accept={EVIDENCE_ACCEPT}
            className="sr-only"
            disabled={uploading}
            onChange={(e) => void uploadFiles(e.target.files)}
          />
          <span className="evidence-add-plus">{uploading ? "…" : "+"}</span>
          <span className="evidence-card-meta">
            {uploading ? "Mengunggah…" : "Tambah file"}
          </span>
        </label>
      </div>
      {uploadError && <p className="error">{uploadError}</p>}

      <form id="admin-incident-form" onSubmit={onSave}>
        <h2 style={{ fontSize: "1.15rem", marginTop: "1.5rem" }}>Klasifikasi / Classification</h2>
        <label>
          Status
          <select
            value={incident.status}
            onChange={(e) => setField("status", e.target.value)}
          >
            {INCIDENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Severity
          <select
            value={incident.severity ?? ""}
            onChange={(e) => setField("severity", e.target.value || null)}
          >
            <option value="">—</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Incident type
          <select
            value={incident.incident_type ?? ""}
            onChange={(e) => setField("incident_type", e.target.value || null)}
          >
            <option value="">—</option>
            {INCIDENT_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          IR Owner email
          <input
            value={incident.assigned_owner_email ?? ""}
            onChange={(e) => setField("assigned_owner_email", e.target.value)}
          />
        </label>

        <h2 style={{ fontSize: "1.15rem", marginTop: "1.5rem" }}>Fakta pelapor / Reporter facts</h2>
        <Field
          label="Title"
          value={incident.title}
          onChange={(v) => setField("title", v)}
        />
        <RichField
          label="Description"
          value={incident.description}
          onChange={(v) => setField("description", v ?? "")}
        />
        <RichField
          label="Affected systems"
          value={incident.affected_systems}
          onChange={(v) => setField("affected_systems", v)}
        />
        <RichField
          label="Affected users"
          value={incident.affected_users}
          onChange={(v) => setField("affected_users", v)}
        />
        <RichField
          label="Potential data"
          value={incident.potential_data}
          onChange={(v) => setField("potential_data", v)}
        />
        <RichField
          label="Observed activity"
          value={incident.observed_activity}
          onChange={(v) => setField("observed_activity", v)}
        />
        <RichField
          label="Actions taken"
          value={incident.actions_taken}
          onChange={(v) => setField("actions_taken", v)}
        />
        <RichField
          label="Current impact"
          value={incident.current_impact}
          onChange={(v) => setField("current_impact", v)}
        />
        <RichField
          label="Other info"
          value={incident.other_info}
          onChange={(v) => setField("other_info", v)}
        />
        <RichField
          label="Evidence notes"
          value={incident.evidence_notes}
          onChange={(v) => setField("evidence_notes", v)}
        />
        <Field
          label="Reporting channel"
          value={incident.reporting_channel}
          onChange={(v) => setField("reporting_channel", v)}
        />

        <h2 style={{ fontSize: "1.15rem", marginTop: "1.5rem" }}>Penanganan IR / Handling</h2>
        <Field
          label="Detection source"
          value={incident.detection_source}
          onChange={(v) => setField("detection_source", v)}
        />
        <RichField
          label="Timeline summary"
          value={incident.timeline_summary}
          onChange={(v) => setField("timeline_summary", v)}
        />
        <RichField
          label="Containment"
          value={incident.containment_actions}
          onChange={(v) => setField("containment_actions", v)}
        />
        <RichField
          label="Eradication"
          value={incident.eradication_actions}
          onChange={(v) => setField("eradication_actions", v)}
        />
        <RichField
          label="Recovery"
          value={incident.recovery_actions}
          onChange={(v) => setField("recovery_actions", v)}
        />
        <RichField
          label="Root cause"
          value={incident.root_cause}
          onChange={(v) => setField("root_cause", v)}
        />
        <RichField
          label="Impact assessment"
          value={incident.impact_assessment}
          onChange={(v) => setField("impact_assessment", v)}
        />
        <RichField
          label="Notifications made"
          value={incident.notifications_made}
          onChange={(v) => setField("notifications_made", v)}
        />
        <Field
          label="Related tickets"
          value={incident.related_tickets}
          onChange={(v) => setField("related_tickets", v)}
        />
        <RunbookPicker
          value={incident.related_runbooks}
          onChange={(v) => setField("related_runbooks", v)}
        />
        <Field
          label="Risk acceptance ref"
          value={incident.risk_acceptance_ref}
          onChange={(v) => setField("risk_acceptance_ref", v)}
        />
        <Field
          label="Postmortem ref"
          value={incident.postmortem_ref}
          onChange={(v) => setField("postmortem_ref", v)}
        />
        <RichField
          label="Admin notes"
          value={incident.admin_notes}
          onChange={(v) => setField("admin_notes", v)}
        />

        {error && <p className="error">{error}</p>}
      </form>

      <div className="sticky-actions">
        <button type="submit" form="admin-incident-form" disabled={busy}>
          {busy ? "Menyimpan…" : "Simpan"}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() =>
            void downloadAuthenticated(
              `/api/incidents/${incident.id}/case-packet`,
              `${incident.incident_id}-case-packet.docx`,
            )
          }
        >
          Download case packet (.docx)
        </button>
        {saved && <span className="muted">Tersimpan</span>}
        {error && <span className="error">{error}</span>}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string | null) => void;
}) {
  return (
    <>
      <label>{label}</label>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      />
    </>
  );
}

function RichField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string | null) => void;
}) {
  return (
    <>
      <label>{label}</label>
      <RichTextEditor
        value={value ?? ""}
        onChange={(html) => onChange(html || null)}
        minHeight={120}
      />
    </>
  );
}
