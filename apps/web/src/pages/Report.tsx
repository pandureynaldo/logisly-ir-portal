import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { REPORTING_CHANNELS } from "@logisly/shared";
import { api, type Incident } from "../api";
import { useAuth } from "../auth";
import {
  RichTextEditor,
  isRichTextEmpty,
} from "../components/RichTextEditor";

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(v: string): string | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function ReportPage() {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [reportDt, setReportDt] = useState(toLocalInputValue(new Date()));
  const [detectedDt, setDetectedDt] = useState("");
  const [occurredDt, setOccurredDt] = useState("");
  const [channel, setChannel] = useState("");
  const [channelOther, setChannelOther] = useState("");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [affectedSystems, setAffectedSystems] = useState("");
  const [affectedUsers, setAffectedUsers] = useState("");
  const [potentialData, setPotentialData] = useState("");
  const [observedActivity, setObservedActivity] = useState("");
  const [actionsTaken, setActionsTaken] = useState("");
  const [currentImpact, setCurrentImpact] = useState("");
  const [otherInfo, setOtherInfo] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Incident | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (isRichTextEmpty(description)) {
      setError("Deskripsi wajib diisi / Description is required");
      return;
    }
    setBusy(true);
    try {
      const reporting_channel =
        channel === "Other"
          ? channelOther || "Other"
          : channel || null;
      const incident = await api<Incident>("/api/incidents", {
        method: "POST",
        json: {
          description,
          title: title || null,
          report_datetime: localInputToIso(reportDt),
          detected_datetime: localInputToIso(detectedDt) ?? null,
          occurred_datetime: localInputToIso(occurredDt) ?? null,
          reporting_channel,
          evidence_notes: evidenceNotes || null,
          affected_systems: affectedSystems || null,
          affected_users: affectedUsers || null,
          potential_data: potentialData || null,
          observed_activity: observedActivity || null,
          actions_taken: actionsTaken || null,
          current_impact: currentImpact || null,
          other_info: otherInfo || null,
        },
      });
      if (files && files.length > 0) {
        const fd = new FormData();
        Array.from(files).forEach((f) => fd.append("files", f));
        await api(`/api/incidents/${incident.id}/evidence`, {
          method: "POST",
          body: fd,
        });
      }
      setCreated(incident);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim");
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div className="card">
        <h1>Laporan terkirim</h1>
        <p className="sub">Report submitted</p>
        <p>Incident ID</p>
        <p className="incident-id">{created.incident_id}</p>
        <div className="stack">
          <Link className="btn" to={`/my-reports/${created.id}`}>
            Lihat detail
          </Link>
          <button
            className="secondary"
            type="button"
            onClick={() => {
              setCreated(null);
              setDescription("");
              setTitle("");
              setFiles(null);
            }}
          >
            Lapor lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h1>Lapor insiden keamanan</h1>
      <p className="sub">
        Logisly Security Report Portal — incomplete OK, do not delay
      </p>
      <div className="warn">
        Jangan unggah password, private key, malware hidup, atau rahasia tanpa redaksi.
        <span className="en"> Do not upload passwords, private keys, live malware, or unredacted secrets.</span>
      </div>
      <p className="muted">
        Pelapor: {user?.name} ({user?.email})
      </p>
      <form onSubmit={onSubmit}>
        <label>
          Apa yang terjadi / diamati *
          <span className="en">What happened or was observed (required)</span>
        </label>
        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder="Jelaskan apa yang terjadi…"
          minHeight={180}
        />

        <label>
          Judul singkat
          <span className="en">Short title (optional)</span>
        </label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />

        <label>
          Tanggal/waktu lapor
          <span className="en">Report date/time</span>
        </label>
        <input
          type="datetime-local"
          value={reportDt}
          onChange={(e) => setReportDt(e.target.value)}
        />

        <label>
          Tanggal/waktu ditemukan
          <span className="en">Detected date/time (optional)</span>
        </label>
        <input
          type="datetime-local"
          value={detectedDt}
          onChange={(e) => setDetectedDt(e.target.value)}
        />

        <label>
          Bukti / screenshot
          <span className="en">Evidence files (png, jpg, pdf, txt, log, zip — max 20MB)</span>
        </label>
        <input
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.pdf,.txt,.log,.zip"
          onChange={(e) => setFiles(e.target.files)}
        />

        <label>
          Catatan bukti
          <span className="en">Evidence notes (optional)</span>
        </label>
        <textarea
          value={evidenceNotes}
          onChange={(e) => setEvidenceNotes(e.target.value)}
          style={{ minHeight: 60 }}
        />

        <details className="optional">
          <summary>Detail tambahan (opsional) / Additional details</summary>

          <label>
            Tanggal/waktu kejadian
            <span className="en">Occurred date/time</span>
          </label>
          <input
            type="datetime-local"
            value={occurredDt}
            onChange={(e) => setOccurredDt(e.target.value)}
          />

          <label>
            Channel pelaporan
            <span className="en">Reporting channel used</span>
          </label>
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="">—</option>
            {REPORTING_CHANNELS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {channel === "Other" && (
            <input
              placeholder="Other channel"
              value={channelOther}
              onChange={(e) => setChannelOther(e.target.value)}
              style={{ marginTop: "0.5rem" }}
            />
          )}

          <label>
            Sistem terdampak
            <span className="en">Affected systems</span>
          </label>
          <textarea
            value={affectedSystems}
            onChange={(e) => setAffectedSystems(e.target.value)}
            style={{ minHeight: 60 }}
          />

          <label>
            Pengguna / identitas terdampak
            <span className="en">Affected users</span>
          </label>
          <textarea
            value={affectedUsers}
            onChange={(e) => setAffectedUsers(e.target.value)}
            style={{ minHeight: 60 }}
          />

          <label>
            Potensi data terkait
            <span className="en">Potential data involved</span>
          </label>
          <textarea
            value={potentialData}
            onChange={(e) => setPotentialData(e.target.value)}
            style={{ minHeight: 60 }}
          />

          <label>
            Aktivitas mencurigakan
            <span className="en">Observed suspicious activity</span>
          </label>
          <textarea
            value={observedActivity}
            onChange={(e) => setObservedActivity(e.target.value)}
            style={{ minHeight: 60 }}
          />

          <label>
            Tindakan yang sudah dilakukan
            <span className="en">Actions already taken</span>
          </label>
          <textarea
            value={actionsTaken}
            onChange={(e) => setActionsTaken(e.target.value)}
            style={{ minHeight: 60 }}
          />

          <label>
            Dampak saat ini
            <span className="en">Current impact</span>
          </label>
          <textarea
            value={currentImpact}
            onChange={(e) => setCurrentImpact(e.target.value)}
            style={{ minHeight: 60 }}
          />

          <label>
            Informasi lain
            <span className="en">Other information</span>
          </label>
          <textarea
            value={otherInfo}
            onChange={(e) => setOtherInfo(e.target.value)}
            style={{ minHeight: 60 }}
          />
        </details>

        {error && <p className="error">{error}</p>}
        <div className="stack">
          <button type="submit" disabled={busy}>
            {busy ? "Mengirim…" : "Kirim laporan"}
          </button>
        </div>
      </form>
    </div>
  );
}
