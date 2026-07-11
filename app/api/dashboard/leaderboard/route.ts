import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const executives = await prisma.user.findMany({
      where: {
        role: "EXECUTIVE",
        active: true,
      },
      include: {
        leads: true,
      },
    });

    const data = executives.map((user) => ({
      id: user.id,
      name: user.username,
      total: user.leads.length,
      interested: user.leads.filter(
        (lead) => lead.status === "INTERESTED"
      ).length,
      followUps: user.leads.filter(
        (lead) => lead.status === "FOLLOW_UP"
      ).length,
      booked: user.leads.filter(
        (lead) => lead.status === "BOOKED"
      ).length,
    }));

    data.sort((a, b) => b.total - a.total);

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load leaderboard" },
      { status: 500 }
    );
  }
}