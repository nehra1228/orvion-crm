import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function deleteLeads(where: Prisma.LeadWhereInput) {
  return prisma.$transaction(
    async (transaction) => {
      await transaction.activity.deleteMany({
        where: { lead: { is: where } },
      });
      await transaction.call.deleteMany({
        where: { lead: { is: where } },
      });

      const result = await transaction.lead.deleteMany({ where });
      return result.count;
    },
    { maxWait: 10_000, timeout: 45_000 },
  );
}
