import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // basic webhook handler: expects { providerCallId, event, details }
    const { providerCallId, event, details } = body;
    console.log("Dialer webhook:", event, providerCallId);
    // In a real implementation, map providerCallId -> Call record and update
    // For PoC, we persist a simple log entry
    await prisma.activity.create({ data: { leadId: details?.leadId || "unknown", userId: "000000000000000000000000", note: JSON.stringify(body) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("webhook error", error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
