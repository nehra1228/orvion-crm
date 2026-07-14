import { NextResponse } from "next/server";
import { pushToQueue } from "@/services/dialer/queue";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, campaignId, priority = 0, when } = body;
    const score = when ? new Date(when).getTime() : Date.now() + (priority || 0);
    await pushToQueue("dialer:queue:default", score, `${leadId}|${campaignId}|`);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
