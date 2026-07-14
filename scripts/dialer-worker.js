#!/usr/bin/env node
/* Simple dialer worker PoC
   - Uses services/dialer/queue and provider adapter
   - Requires Prisma client; ensure `prisma generate` has been run after schema changes
*/
const { prisma } = require("@/lib/prisma");
const { popDue } = require("@/services/dialer/queue");
const provider = require("@/services/dialer/provider");

async function loop() {
  console.log("Dialer worker starting...");
  while (true) {
    try {
      const item = await popDue("dialer:queue:default", Date.now());
      if (!item) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      console.log("Got queue item:", item);
      // item format: `${leadId}|${campaignId}|${executiveId}`
      const [leadId, campaignId, executiveId] = item.split("|");
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (!lead) continue;
      // Originate call to executive
      const execRes = await provider.originateCallToExecutive( (lead.assignedToId) || "exec-number", { leadId, campaignId, executiveId } );
      if (!execRes.success) {
        console.error("Exec call failed", execRes);
        continue;
      }
      // Notify executive via server so their UI can show incoming call
      try {
        await fetch(process.env.DASHBOARD_URL ? `${process.env.DASHBOARD_URL}/api/dialer/notify-exec` : "http://localhost:3000/api/dialer/notify-exec", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ executiveId, leadId, campaignId, providerCallId: execRes.providerCallId }) });
      } catch (e) {
        console.warn("notify-exec failed", e);
      }

      // Simulate exec answered immediately, originate to customer
      const custRes = await provider.originateCallToCustomer(lead.mobile, { leadId, campaignId, executiveId });
      if (!custRes.success) {
        console.error("Customer call failed", custRes);
        continue;
      }
      // Bridge
      await provider.bridgeCalls(execRes.providerCallId || "", custRes.providerCallId || "");
      console.log("Bridged", leadId);
    } catch (e) {
      console.error("Worker error", e);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

loop();
