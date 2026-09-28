import type { Prisma } from "@prisma/client";
import { prisma } from "./db.js";

export async function allocateIncidentId(now = new Date()): Promise<string> {
  const year = now.getFullYear();
  const row = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const existing = await tx.incidentIdCounter.findUnique({ where: { year } });
    if (!existing) {
      return tx.incidentIdCounter.create({ data: { year, lastSeq: 1 } });
    }
    return tx.incidentIdCounter.update({
      where: { year },
      data: { lastSeq: { increment: 1 } },
    });
  });
  return `INC-${year}-${String(row.lastSeq).padStart(3, "0")}`;
}
