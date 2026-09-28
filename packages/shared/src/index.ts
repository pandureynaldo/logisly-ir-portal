import { z } from "zod";

export const INCIDENT_STATUSES = [
  "Pending",
  "Open",
  "In Progress",
  "Closed",
] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const SEVERITIES = ["Critical", "High", "Medium", "Low"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const INCIDENT_TYPES = [
  "Phishing",
  "Compromised Account",
  "Malware",
  "Ransomware",
  "Data Leak",
  "Unauthorized Access",
  "Cloud",
  "Other",
] as const;

export const REPORTING_CHANNELS = [
  "Email devops@logisly.com",
  "WhatsApp backup path",
  "Emergency phone path",
  "Other",
] as const;

export const ALLOWED_EVIDENCE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "pdf",
  "txt",
  "log",
  "zip",
] as const;

export const createIncidentSchema = z.object({
  title: z.string().trim().max(500).optional().nullable(),
  description: z.string().trim().min(1, "Description required"),
  report_datetime: z.string().datetime({ offset: true }).optional(),
  detected_datetime: z.string().datetime({ offset: true }).optional().nullable(),
  occurred_datetime: z.string().datetime({ offset: true }).optional().nullable(),
  reporting_channel: z.string().trim().max(500).optional().nullable(),
  affected_systems: z.string().optional().nullable(),
  affected_users: z.string().optional().nullable(),
  potential_data: z.string().optional().nullable(),
  observed_activity: z.string().optional().nullable(),
  evidence_notes: z.string().optional().nullable(),
  actions_taken: z.string().optional().nullable(),
  current_impact: z.string().optional().nullable(),
  other_info: z.string().optional().nullable(),
});
export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;

export const updateIncidentSchema = z.object({
  title: z.string().trim().max(500).optional().nullable(),
  description: z.string().trim().min(1).optional(),
  report_datetime: z.string().datetime({ offset: true }).optional(),
  detected_datetime: z.string().datetime({ offset: true }).optional().nullable(),
  occurred_datetime: z.string().datetime({ offset: true }).optional().nullable(),
  reporting_channel: z.string().trim().max(500).optional().nullable(),
  affected_systems: z.string().optional().nullable(),
  affected_users: z.string().optional().nullable(),
  potential_data: z.string().optional().nullable(),
  observed_activity: z.string().optional().nullable(),
  evidence_notes: z.string().optional().nullable(),
  actions_taken: z.string().optional().nullable(),
  current_impact: z.string().optional().nullable(),
  other_info: z.string().optional().nullable(),
  assigned_owner_email: z
    .union([z.string().email(), z.literal(""), z.null()])
    .optional(),
  incident_type: z.string().optional().nullable(),
  severity: z.enum(SEVERITIES).optional().nullable(),
  status: z.enum(INCIDENT_STATUSES).optional(),
  detection_source: z.string().optional().nullable(),
  timeline_summary: z.string().optional().nullable(),
  containment_actions: z.string().optional().nullable(),
  eradication_actions: z.string().optional().nullable(),
  recovery_actions: z.string().optional().nullable(),
  root_cause: z.string().optional().nullable(),
  impact_assessment: z.string().optional().nullable(),
  notifications_made: z.string().optional().nullable(),
  related_tickets: z.string().optional().nullable(),
  related_runbooks: z.string().optional().nullable(),
  risk_acceptance_ref: z.string().optional().nullable(),
  closure_date: z.string().datetime({ offset: true }).optional().nullable(),
  postmortem_ref: z.string().optional().nullable(),
  admin_notes: z.string().optional().nullable(),
});
export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;

export type UserRole = "reporter" | "admin";
