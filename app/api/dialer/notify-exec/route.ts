import { NextResponse } from "next/server";
import { publish } from "@/lib/executiveEvents";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { executiveId, leadId, campaignId, providerCallId } = body;
    if (!executiveId || !leadId) return NextResponse.json({ error: "executiveId and leadId required" }, { status: 400 });
    // fetch lead details
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    // create call record
    const call = await prisma.call.create({ data: { leadId, campaignId: campaignId ?? undefined, executiveId: executiveId ?? undefined, providerCallId: providerCallId ?? undefined, startedAt: new Date() } });
    // publish event with lead data
    publish(executiveId, { type: "incoming_call", callId: call.id, leadId, campaignId, providerCallId, lead });
    return NextResponse.json({ success: true, callId: call.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
