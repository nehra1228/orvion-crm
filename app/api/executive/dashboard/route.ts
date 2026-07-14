import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = {
      executive: { name: "Executive", shift: null, campaign: null, status: "ONLINE" },
      metrics: { todayCalls: 0, connectedCalls: 0, interested: 0, booked: 0, followUps: 0, averageTalkTime: 0, conversion: 0, queueRemaining: 0 },
      queue: [],
      followUps: [],
      missed: [],
      recentCalls: [],
    };
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
