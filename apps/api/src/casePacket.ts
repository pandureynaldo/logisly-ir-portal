import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import type { Incident, User } from "@prisma/client";

const templatePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../templates/incident-case-packet.docx",
);

function fmt(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}

/** Convert Quill/HTML rich text to clean plain text for Word cells. */
function htmlToPlain(s: string | null | undefined): string {
  if (!s?.trim()) return "";
  return s
    .replace(/\r\n/g, "\n")
    .replace(/<\/(p|div|h[1-6]|tr|table|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/(ul|ol)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function val(s: string | null | undefined): string {
  return htmlToPlain(s);
}

export function generateCasePacket(
  incident: Incident & { reporter: Pick<User, "name" | "email"> },
): Buffer {
  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{", end: "}" },
  });

  doc.render({
    incident_id: incident.incidentId,
    title: val(incident.title),
    reported_by_name: incident.reporter.name,
    reported_by_email: incident.reporter.email,
    report_datetime: fmt(incident.reportDatetime),
    detected_datetime: fmt(incident.detectedDatetime),
    occurred_datetime: fmt(incident.occurredDatetime),
    reporting_channel: val(incident.reportingChannel),
    description: val(incident.description),
    affected_systems: val(incident.affectedSystems),
    affected_users: val(incident.affectedUsers),
    potential_data: val(incident.potentialData),
    observed_activity: val(incident.observedActivity),
    actions_taken: val(incident.actionsTaken),
    current_impact: val(incident.currentImpact),
    other_info: val(incident.otherInfo),
    evidence_notes: val(incident.evidenceNotes),
    assigned_owner_email: val(incident.assignedOwnerEmail),
    incident_type: val(incident.incidentType),
    severity: val(incident.severity),
    status: val(incident.status),
    detection_source: val(incident.detectionSource),
    timeline_summary: val(incident.timelineSummary),
    containment_actions: val(incident.containmentActions),
    eradication_actions: val(incident.eradicationActions),
    recovery_actions: val(incident.recoveryActions),
    root_cause: val(incident.rootCause),
    impact_assessment: val(incident.impactAssessment),
    notifications_made: val(incident.notificationsMade),
    related_tickets: val(incident.relatedTickets),
    related_runbooks: val(incident.relatedRunbooks),
    risk_acceptance_ref: val(incident.riskAcceptanceRef),
    closure_date: fmt(incident.closureDate),
    postmortem_ref: val(incident.postmortemRef),
    admin_notes: val(incident.adminNotes),
    organization: "Logisly",
  });

  return doc.getZip().generate({ type: "nodebuffer" });
}
