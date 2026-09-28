import nodemailer from "nodemailer";
import type { Incident } from "@prisma/client";
import { env } from "./config.js";

export async function notifyNewIncident(incident: Incident, reporterEmail: string): Promise<void> {
  console.info(
    `[notify] new incident ${incident.incidentId} by ${reporterEmail} → ${env.notifyEmail}`,
  );
  if (!env.smtp.host) {
    console.info("[notify] SMTP not configured — skip email");
    return;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
    await transporter.sendMail({
      from: env.smtp.from,
      to: env.notifyEmail,
      subject: `[IR] New report ${incident.incidentId}`,
      text: [
        `Incident: ${incident.incidentId}`,
        `Title: ${incident.title ?? "(none)"}`,
        `Reporter: ${reporterEmail}`,
        `Status: ${incident.status}`,
        "",
        incident.description,
        "",
        `Open: ${env.appOrigin}/admin/${incident.id}`,
      ].join("\n"),
    });
  } catch (err) {
    console.error("[notify] email failed (non-blocking)", err);
  }
}
