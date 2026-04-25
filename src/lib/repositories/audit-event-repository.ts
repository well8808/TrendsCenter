import type { Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/db";

export async function createAuditEvent(data: Prisma.AuditEventUncheckedCreateInput) {
  return getPrisma().auditEvent.create({ data });
}
