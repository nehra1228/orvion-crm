import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publish } from "@/lib/executiveEvents";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { callId, action, note } = body;
    if (!callId || !action) return NextResponse.json({ error: "callId and action required" }, { status: 400 });
    const call = await prisma.call.update({ where: { id: callId }, data: { metadata: { ...(body.metadata || {}), lastAction: action }, endedAt: action === "end" ? new Date() : undefined } });
    // publish update to executive
    if (call.executiveId) publish(call.executiveId, { type: "call_update", callId, action, note });
    return NextResponse.json({ success: true, call });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
