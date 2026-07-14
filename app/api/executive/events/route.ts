import { NextResponse } from "next/server";
import { subscribe, unsubscribe } from "@/lib/executiveEvents";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") || "";
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const stream = new ReadableStream({
    start(controller) {
      const id = String(Date.now()) + Math.random().toString(36).slice(2, 8);
      const push = (payload: string) => {
        controller.enqueue(new TextEncoder().encode(`data: ${payload}\n\n`));
      };
      subscribe(userId, { id, push });
      // keep-alive
      const iv = setInterval(() => controller.enqueue(new TextEncoder().encode(`:\n\n`)), 15000);
      controller.enqueue(new TextEncoder().encode(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`));
      req.signal.addEventListener("abort", () => {
        clearInterval(iv);
        unsubscribe(userId, id);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
