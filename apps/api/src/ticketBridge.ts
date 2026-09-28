import type { Incident } from "@prisma/client";
import { prisma } from "./db.js";
import { env } from "./config.js";

export interface TicketBridge {
  onIncidentCreated(incident: Incident): Promise<void>;
  onIncidentUpdated(incident: Incident): Promise<void>;
}

/** Prepare-only: custom ticketing wired later via TICKETING_PROVIDER=custom */
export class NoopTicketBridge implements TicketBridge {
  async onIncidentCreated(incident: Incident): Promise<void> {
    console.info("[ticket-bridge:noop] created", incident.incidentId);
  }
  async onIncidentUpdated(incident: Incident): Promise<void> {
    console.info("[ticket-bridge:noop] updated", incident.incidentId, incident.status);
  }
}

export function getTicketBridge(): TicketBridge {
  if (env.ticketingProvider === "noop" || !env.ticketingProvider) {
    return new NoopTicketBridge();
  }
  // ponytail: custom HTTP client goes here when TICKETING_PROVIDER=custom
  console.warn(`[ticket-bridge] unknown provider ${env.ticketingProvider}, using noop`);
  return new NoopTicketBridge();
}

export async function runBridgeSafe(
  kind: "created" | "updated",
  incident: Incident,
): Promise<void> {
  const bridge = getTicketBridge();
  try {
    if (kind === "created") await bridge.onIncidentCreated(incident);
    else await bridge.onIncidentUpdated(incident);
  } catch (err) {
    console.error("[ticket-bridge] failed (non-blocking)", err);
    await prisma.incident.update({
      where: { id: incident.id },
      data: { externalSyncStatus: "error" },
    });
  }
}
