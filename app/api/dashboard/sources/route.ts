import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      select: {
        source: true,
      },
    });

    const counts: Record<string, number> = {};

    for (const lead of leads) {
      const source =
        lead.source && lead.source.trim() !== ""
          ? lead.source.trim().charAt(0).toUpperCase() +
            lead.source.trim().slice(1).toLowerCase()
          : "Unknown";

      counts[source] = (counts[source] || 0) + 1;
    }

    const data = Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch lead sources" },
      { status: 500 }
    );
  }
}