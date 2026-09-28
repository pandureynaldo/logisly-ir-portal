import { Router } from "express";
import multer from "multer";
import path from "node:path";
import rateLimit from "express-rate-limit";
import {
  ALLOWED_EVIDENCE_EXTENSIONS,
  createIncidentSchema,
  updateIncidentSchema,
} from "@logisly/shared";
import { prisma } from "../db.js";
import { allocateIncidentId } from "../incidentId.js";
import { storage } from "../storage.js";
import { env } from "../config.js";
import { notifyNewIncident } from "../notify.js";
import { runBridgeSafe } from "../ticketBridge.js";
import { generateCasePacket } from "../casePacket.js";
import {
  requireAuth,
  requireAdmin,
  isAdmin,
  getUser,
} from "../middleware/auth.js";

export const incidentsRouter = Router();

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadBytes, files: 10 },
});

function parseOptionalDate(v: string | null | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function canAccess(userId: string, role: string, reporterUserId: string): boolean {
  return role === "admin" || reporterUserId === userId;
}

incidentsRouter.post("/", requireAuth, submitLimiter, async (req, res, next) => {
  try {
    const parsed = createIncidentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const data = parsed.data;
    const incidentId = await allocateIncidentId();
    const incident = await prisma.incident.create({
      data: {
        incidentId,
        reporterUserId: getUser(req)!.id,
        title: data.title || null,
        description: data.description,
        reportDatetime: data.report_datetime
          ? new Date(data.report_datetime)
          : new Date(),
        detectedDatetime: parseOptionalDate(data.detected_datetime ?? null),
        occurredDatetime: parseOptionalDate(data.occurred_datetime ?? null),
        reportingChannel: data.reporting_channel || null,
        affectedSystems: data.affected_systems || null,
        affectedUsers: data.affected_users || null,
        potentialData: data.potential_data || null,
        observedActivity: data.observed_activity || null,
        evidenceNotes: data.evidence_notes || null,
        actionsTaken: data.actions_taken || null,
        currentImpact: data.current_impact || null,
        otherInfo: data.other_info || null,
        status: "Pending",
      },
      include: { reporter: { select: { name: true, email: true } } },
    });
    void notifyNewIncident(incident, getUser(req)!.email);
    void runBridgeSafe("created", incident);
    res.status(201).json(serializeIncident(incident));
  } catch (err) {
    next(err);
  }
});

incidentsRouter.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const rows = await prisma.incident.findMany({
      where: { reporterUserId: getUser(req)!.id },
      orderBy: { createdAt: "desc" },
      include: { reporter: { select: { name: true, email: true } }, evidence: true },
    });
    res.json(rows.map(serializeIncident));
  } catch (err) {
    next(err);
  }
});

incidentsRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: req.params.id },
      include: { reporter: { select: { name: true, email: true } }, evidence: true },
    });
    if (!incident) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (!canAccess(getUser(req)!.id, getUser(req)!.role, incident.reporterUserId)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    res.json(serializeIncident(incident));
  } catch (err) {
    next(err);
  }
});

incidentsRouter.patch("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = updateIncidentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const d = parsed.data;
    const existing = await prisma.incident.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const ownerEmail =
      d.assigned_owner_email === "" ? null : d.assigned_owner_email ?? undefined;
    const incident = await prisma.incident.update({
      where: { id: req.params.id },
      data: {
        ...(d.title !== undefined ? { title: d.title } : {}),
        ...(d.description !== undefined ? { description: d.description } : {}),
        ...(d.report_datetime !== undefined
          ? { reportDatetime: new Date(d.report_datetime) }
          : {}),
        ...(d.detected_datetime !== undefined
          ? { detectedDatetime: parseOptionalDate(d.detected_datetime) }
          : {}),
        ...(d.occurred_datetime !== undefined
          ? { occurredDatetime: parseOptionalDate(d.occurred_datetime) }
          : {}),
        ...(d.reporting_channel !== undefined
          ? { reportingChannel: d.reporting_channel }
          : {}),
        ...(d.affected_systems !== undefined
          ? { affectedSystems: d.affected_systems }
          : {}),
        ...(d.affected_users !== undefined ? { affectedUsers: d.affected_users } : {}),
        ...(d.potential_data !== undefined ? { potentialData: d.potential_data } : {}),
        ...(d.observed_activity !== undefined
          ? { observedActivity: d.observed_activity }
          : {}),
        ...(d.evidence_notes !== undefined ? { evidenceNotes: d.evidence_notes } : {}),
        ...(d.actions_taken !== undefined ? { actionsTaken: d.actions_taken } : {}),
        ...(d.current_impact !== undefined ? { currentImpact: d.current_impact } : {}),
        ...(d.other_info !== undefined ? { otherInfo: d.other_info } : {}),
        ...(d.assigned_owner_email !== undefined
          ? { assignedOwnerEmail: ownerEmail ?? null }
          : {}),
        ...(d.incident_type !== undefined ? { incidentType: d.incident_type } : {}),
        ...(d.severity !== undefined ? { severity: d.severity } : {}),
        ...(d.status !== undefined ? { status: d.status } : {}),
        ...(d.detection_source !== undefined
          ? { detectionSource: d.detection_source }
          : {}),
        ...(d.timeline_summary !== undefined
          ? { timelineSummary: d.timeline_summary }
          : {}),
        ...(d.containment_actions !== undefined
          ? { containmentActions: d.containment_actions }
          : {}),
        ...(d.eradication_actions !== undefined
          ? { eradicationActions: d.eradication_actions }
          : {}),
        ...(d.recovery_actions !== undefined
          ? { recoveryActions: d.recovery_actions }
          : {}),
        ...(d.root_cause !== undefined ? { rootCause: d.root_cause } : {}),
        ...(d.impact_assessment !== undefined
          ? { impactAssessment: d.impact_assessment }
          : {}),
        ...(d.notifications_made !== undefined
          ? { notificationsMade: d.notifications_made }
          : {}),
        ...(d.related_tickets !== undefined ? { relatedTickets: d.related_tickets } : {}),
        ...(d.related_runbooks !== undefined
          ? { relatedRunbooks: d.related_runbooks }
          : {}),
        ...(d.risk_acceptance_ref !== undefined
          ? { riskAcceptanceRef: d.risk_acceptance_ref }
          : {}),
        ...(d.closure_date !== undefined
          ? { closureDate: parseOptionalDate(d.closure_date) }
          : {}),
        ...(d.postmortem_ref !== undefined ? { postmortemRef: d.postmortem_ref } : {}),
        ...(d.admin_notes !== undefined ? { adminNotes: d.admin_notes } : {}),
      },
      include: { reporter: { select: { name: true, email: true } }, evidence: true },
    });
    void runBridgeSafe("updated", incident);
    res.json(serializeIncident(incident));
  } catch (err) {
    next(err);
  }
});

incidentsRouter.post(
  "/:id/evidence",
  requireAuth,
  upload.array("files", 10),
  async (req, res, next) => {
    try {
      const incident = await prisma.incident.findUnique({ where: { id: req.params.id } });
      if (!incident) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      if (!canAccess(getUser(req)!.id, getUser(req)!.role, incident.reporterUserId)) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      const files = (req.files as Express.Multer.File[]) ?? [];
      if (!files.length) {
        res.status(400).json({ error: "No files" });
        return;
      }
      console.info(
        `[evidence] upload ${files.length} file(s) incident=${incident.incidentId} by=${getUser(req)!.email}`,
      );
      const created = [];
      for (const file of files) {
        const ext = path.extname(file.originalname).replace(".", "").toLowerCase();
        if (!(ALLOWED_EVIDENCE_EXTENSIONS as readonly string[]).includes(ext)) {
          res.status(400).json({
            error: `File type .${ext} not allowed. Allowed: ${ALLOWED_EVIDENCE_EXTENSIONS.join(", ")}`,
          });
          return;
        }
        // Reject common executable/script masquerades by extension only (allowlist already set)
        const stored = await storage.put(file.buffer, ext);
        const row = await prisma.evidenceFile.create({
          data: {
            incidentId: incident.id,
            originalFilename: file.originalname,
            storageKey: stored.storageKey,
            contentType: file.mimetype || "application/octet-stream",
            sizeBytes: file.size,
            uploadedByUserId: getUser(req)!.id,
          },
        });
        created.push(row);
      }
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },
);

incidentsRouter.get(
  "/:id/evidence/:fileId/download",
  requireAuth,
  async (req, res, next) => {
    try {
      const file = await prisma.evidenceFile.findUnique({
        where: { id: req.params.fileId },
        include: { incident: true },
      });
      if (!file || file.incidentId !== req.params.id) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      if (!canAccess(getUser(req)!.id, getUser(req)!.role, file.incident.reporterUserId)) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      console.info(
        `[evidence] download ${file.id} incident=${file.incident.incidentId} by=${getUser(req)!.email} size=${file.sizeBytes}`,
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(file.originalFilename)}"`,
      );
      res.setHeader("Content-Type", file.contentType);
      const stream = await storage.openReadStream(file.storageKey);
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  },
);

incidentsRouter.get(
  "/:id/case-packet",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const incident = await prisma.incident.findUnique({
        where: { id: req.params.id },
        include: { reporter: { select: { name: true, email: true } } },
      });
      if (!incident) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      const buf = generateCasePacket(incident);
      const filename = `${incident.incidentId}-case-packet.docx`;
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(buf);
    } catch (err) {
      next(err);
    }
  },
);

export const adminRouter = Router();

adminRouter.get("/incidents", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { status, severity, from, to, q } = req.query;
    const where: Record<string, unknown> = {};
    if (typeof status === "string" && status) where.status = status;
    if (typeof severity === "string" && severity) where.severity = severity;
    if (typeof from === "string" || typeof to === "string") {
      where.createdAt = {
        ...(typeof from === "string" ? { gte: new Date(from) } : {}),
        ...(typeof to === "string" ? { lte: new Date(to) } : {}),
      };
    }
    if (typeof q === "string" && q.trim()) {
      where.OR = [
        { incidentId: { contains: q.trim(), mode: "insensitive" } },
        { title: { contains: q.trim(), mode: "insensitive" } },
        { description: { contains: q.trim(), mode: "insensitive" } },
        { reporter: { email: { contains: q.trim(), mode: "insensitive" } } },
      ];
    }
    const rows = await prisma.incident.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { reporter: { select: { name: true, email: true } }, evidence: true },
      take: 200,
    });
    res.json(rows.map(serializeIncident));
  } catch (err) {
    next(err);
  }
});

function serializeIncident(
  i: Awaited<ReturnType<typeof prisma.incident.findUnique>> & {
    reporter?: { name: string; email: string };
    evidence?: unknown[];
  },
) {
  if (!i) return null;
  return {
    id: i.id,
    incident_id: i.incidentId,
    title: i.title,
    description: i.description,
    report_datetime: i.reportDatetime.toISOString(),
    detected_datetime: i.detectedDatetime?.toISOString() ?? null,
    occurred_datetime: i.occurredDatetime?.toISOString() ?? null,
    reporting_channel: i.reportingChannel,
    affected_systems: i.affectedSystems,
    affected_users: i.affectedUsers,
    potential_data: i.potentialData,
    observed_activity: i.observedActivity,
    evidence_notes: i.evidenceNotes,
    actions_taken: i.actionsTaken,
    current_impact: i.currentImpact,
    other_info: i.otherInfo,
    assigned_owner_email: i.assignedOwnerEmail,
    incident_type: i.incidentType,
    severity: i.severity,
    status: i.status,
    detection_source: i.detectionSource,
    timeline_summary: i.timelineSummary,
    containment_actions: i.containmentActions,
    eradication_actions: i.eradicationActions,
    recovery_actions: i.recoveryActions,
    root_cause: i.rootCause,
    impact_assessment: i.impactAssessment,
    notifications_made: i.notificationsMade,
    related_tickets: i.relatedTickets,
    related_runbooks: i.relatedRunbooks,
    risk_acceptance_ref: i.riskAcceptanceRef,
    closure_date: i.closureDate?.toISOString() ?? null,
    postmortem_ref: i.postmortemRef,
    admin_notes: i.adminNotes,
    external_ticket_id: i.externalTicketId,
    external_ticket_url: i.externalTicketUrl,
    external_sync_status: i.externalSyncStatus,
    created_at: i.createdAt.toISOString(),
    updated_at: i.updatedAt.toISOString(),
    reporter: i.reporter
      ? { name: i.reporter.name, email: i.reporter.email }
      : undefined,
    evidence: Array.isArray(i.evidence)
      ? (i.evidence as Array<{
          id: string;
          originalFilename: string;
          contentType: string;
          sizeBytes: number;
          createdAt: Date;
        }>).map((e) => ({
          id: e.id,
          original_filename: e.originalFilename,
          content_type: e.contentType,
          size_bytes: e.sizeBytes,
          created_at: e.createdAt.toISOString(),
        }))
      : undefined,
  };
}

void isAdmin; // kept for future role helpers

