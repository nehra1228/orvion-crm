import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const currentYear = new Date().getFullYear();

    const data = await Promise.all(
      months.map(async (_, index) => {
        const start = new Date(currentYear, index, 1);
        const end = new Date(currentYear, index + 1, 1);

        const count = await prisma.lead.count({
          where: {
            createdAt: {
              gte: start,
              lt: end,
            },
          },
        });

        return {
          month: months[index],
          leads: count,
        };
      })
    );

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to fetch monthly data" },
      { status: 500 }
    );
  }
}