import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();

    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const startOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    const [
      totalLeads,
      todaysLeads,
      monthlyLeads,
      booked,
      lost,
      followUps,
      siteVisits,
      executives,
    ] = await Promise.all([
      prisma.lead.count(),

      prisma.lead.count({
        where: {
          createdAt: {
            gte: startOfToday,
          },
        },
      }),

      prisma.lead.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),

      prisma.lead.count({
        where: {
          status: "BOOKED",
        },
      }),

      prisma.lead.count({
        where: {
          status: "LOST",
        },
      }),

      prisma.lead.count({
        where: {
          status: "FOLLOW_UP",
        },
      }),

      prisma.lead.count({
        where: {
          status: "SITE_VISIT",
        },
      }),

      prisma.user.count({
        where: {
          role: "EXECUTIVE",
          active: true,
        },
      }),
    ]);

    return NextResponse.json({
      totalLeads,
      todaysLeads,
      monthlyLeads,
      booked,
      lost,
      followUps,
      siteVisits,
      executives,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Dashboard failed" },
      { status: 500 }
    );
  }
}