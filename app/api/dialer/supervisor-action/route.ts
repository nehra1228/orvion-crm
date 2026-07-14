import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publish } from "@/lib/executiveEvents";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { callId, action, note } = body;
    if (!callId || !action) return NextResponse.json({ error: "missing" }, { status: 400 });
    const call = await prisma.call.findUnique({ where: { id: callId } });
    if (!call) return NextResponse.json({ error: "call not found" }, { status: 404 });
    if (call.executiveId) {
      publish(call.executiveId, { type: "supervisor_action", payload: { callId, action, note } });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
