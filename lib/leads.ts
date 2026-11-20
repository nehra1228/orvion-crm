import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function deleteLeads(where: Prisma.LeadWhereInput) {
  return prisma.$transaction(async (transaction) => {
    const leads = await transaction.lead.findMany({
      where,
      select: { id: true },
    });

    if (leads.length === 0) {
      return 0;
    }

    await transaction.activity.deleteMany({
      where: { leadId: { in: leads.map((lead) => lead.id) } },
    });

    const result = await transaction.lead.deleteMany({ where });
    return result.count;
  });
}
