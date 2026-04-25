import { hashToken } from "@/lib/auth/tokens";
import { getPrisma } from "@/lib/db";

export async function findTenantSessionByRawToken(token: string) {
  return getPrisma().authSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      workspace: true,
      user: {
        include: {
          memberships: true,
        },
      },
    },
  });
}

export async function deleteSessionById(id: string) {
  await getPrisma().authSession.deleteMany({
    where: { id },
  });
}
