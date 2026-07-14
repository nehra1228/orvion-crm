import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
let cachedConfig: { provider?: string; key?: string; config?: any } | null = null;

async function loadConfig() {
  if (cachedConfig) return cachedConfig;
  // prefer DB config if present
  try {
    const cfg = await prisma.dialerConfig.findFirst({ orderBy: { updatedAt: "desc" } });
    if (cfg) {
      const key = cfg.encryptedKey ? decrypt(cfg.encryptedKey) : undefined;
      cachedConfig = { provider: cfg.provider, key, config: cfg.config };
      return cachedConfig;
    }
  } catch (e) {
    console.error("loadConfig error", e);
  }
  // fallback to env
  cachedConfig = { provider: process.env.DIALER_PROVIDER || undefined, key: process.env.DIALER_API_KEY || undefined, config: undefined };
  return cachedConfig;
}

export type OutboundResult = {
  providerCallId?: string;
  success: boolean;
  reason?: string;
};

// Simple provider adapter. If no provider configured, use an in-process simulator.
export async function originateCallToExecutive(executiveNumber: string, meta: any): Promise<OutboundResult> {
  const cfg = await loadConfig();
  if (!cfg?.provider || !cfg?.key) return simulateOutgoing(`exec:${executiveNumber}`, meta);
  if (cfg.provider === "twilio") {
    try {
      const { accountSid, authToken, from } = cfg.config || {};
      const client = require("twilio")(accountSid, authToken);
      // create call to executive (call exec first)
      const call = await client.calls.create({ to: executiveNumber, from: from, url: process.env.TWIML_URL || "http://example.com/twiml" });
      return { providerCallId: call.sid, success: true };
    } catch (e) {
      console.error("twilio exec error", e);
      return { success: false, reason: (e as Error).message };
    }
  }
  return simulateOutgoing(`exec:${executiveNumber}`, meta);
}

export async function originateCallToCustomer(customerNumber: string, meta: any): Promise<OutboundResult> {
  const cfg = await loadConfig();
  if (!cfg?.provider || !cfg?.key) return simulateOutgoing(`cust:${customerNumber}`, meta);
  if (cfg.provider === "twilio") {
    try {
      const { accountSid, authToken, from } = cfg.config || {};
      const client = require("twilio")(accountSid, authToken);
      const call = await client.calls.create({ to: customerNumber, from: from, url: process.env.TWIML_URL || "http://example.com/twiml" });
      return { providerCallId: call.sid, success: true };
    } catch (e) {
      console.error("twilio cust error", e);
      return { success: false, reason: (e as Error).message };
    }
  }
  return simulateOutgoing(`cust:${customerNumber}`, meta);
}

export async function bridgeCalls(callAId: string, callBId: string): Promise<OutboundResult> {
  const cfg = await loadConfig();
  if (!cfg?.provider || !cfg?.key) return { providerCallId: `${callAId}-${callBId}`, success: true };
  if (cfg.provider === "twilio") {
    try {
      // Twilio bridging often handled via conference — implementation depends on account setup
      // For scaffold, return success
      return { providerCallId: `${callAId}-${callBId}`, success: true };
    } catch (e) {
      return { success: false, reason: (e as Error).message };
    }
  }
  return { providerCallId: `${callAId}-${callBId}`, success: true };
}

async function simulateOutgoing(tag: string, meta: any): Promise<OutboundResult> {
  // Create a placeholder Call row to track simulated provider id
  try {
    const call = await prisma.call.create({ data: { leadId: meta.leadId, campaignId: meta.campaignId, executiveId: meta.executiveId, providerCallId: `${tag}:${Date.now()}`, startedAt: new Date() } });
    // simulate short delay
    await new Promise((r) => setTimeout(r, 400));
    return { providerCallId: call.providerCallId ?? undefined, success: true };
  } catch (e) {
    return { success: false, reason: (e as Error).message };
  }
}
