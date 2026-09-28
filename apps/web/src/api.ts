const API_BASE = import.meta.env.VITE_API_ORIGIN ?? "";

let accessTokenGetter: (() => string | undefined) | null = null;

export function setAccessTokenGetter(fn: () => string | undefined): void {
  accessTokenGetter = fn;
}

export async function api<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  // Let the browser set multipart boundary for FormData — never force Content-Type.
  if (init?.body instanceof FormData) {
    headers.delete("Content-Type");
  }
  const token = accessTokenGetter?.();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message =
        body.error?.formErrors?.[0] ??
        body.error ??
        JSON.stringify(body.error) ??
        message;
      if (typeof body.error === "object" && body.error?.fieldErrors) {
        message =
          Object.values(body.error.fieldErrors).flat().join(", ") || message;
      }
    } catch {
      /* ignore */
    }
    throw new Error(typeof message === "string" ? message : "Request failed");
  }
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return res.json();
  return res.blob() as unknown as T;
}

/** Authenticated download (Bearer) → browser save. */
export async function downloadAuthenticated(
  path: string,
  filename: string,
): Promise<void> {
  const blob = await api<Blob>(path);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type Me = { id: string; email: string; name: string; role: "reporter" | "admin" };

export type Evidence = {
  id: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
};

export type Incident = {
  id: string;
  incident_id: string;
  title: string | null;
  description: string;
  report_datetime: string;
  detected_datetime: string | null;
  occurred_datetime: string | null;
  reporting_channel: string | null;
  affected_systems: string | null;
  affected_users: string | null;
  potential_data: string | null;
  observed_activity: string | null;
  evidence_notes: string | null;
  actions_taken: string | null;
  current_impact: string | null;
  other_info: string | null;
  assigned_owner_email: string | null;
  incident_type: string | null;
  severity: string | null;
  status: string;
  detection_source: string | null;
  timeline_summary: string | null;
  containment_actions: string | null;
  eradication_actions: string | null;
  recovery_actions: string | null;
  root_cause: string | null;
  impact_assessment: string | null;
  notifications_made: string | null;
  related_tickets: string | null;
  related_runbooks: string | null;
  risk_acceptance_ref: string | null;
  closure_date: string | null;
  postmortem_ref: string | null;
  admin_notes: string | null;
  external_ticket_id: string | null;
  external_ticket_url: string | null;
  external_sync_status: string;
  created_at: string;
  updated_at: string;
  reporter?: { name: string; email: string };
  evidence?: Evidence[];
};
