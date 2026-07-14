import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";

export async function GET() {
  try {
    const cfg = await prisma.dialerConfig.findFirst({ orderBy: { updatedAt: "desc" } });
    if (!cfg) return NextResponse.json({ provider: null });
    return NextResponse.json({ provider: cfg.provider, config: cfg.config });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { provider, apiKey, config } = body;
    const enc = apiKey ? encrypt(apiKey) : null;
    const saved = await prisma.dialerConfig.create({ data: { provider, encryptedKey: enc ?? undefined, config: config ?? undefined } });
    return NextResponse.json({ success: true, id: saved.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
