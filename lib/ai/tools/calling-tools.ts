import { execute, dateValue, leadView, model, optionalModel, record, required, text, ToolError, type Json, type RecordValue, type ToolResult } from "./system-tools";

function callModel() { return optionalModel("call") ?? optionalModel("callingData") ?? model("callLog"); }
function callView(item: RecordValue): Json {
  return {
    id: text(item.id ?? item._id),
    lead: leadView(record(item.lead)),

    executive:
      item.executive || item.assignee
        ? JSON.parse(JSON.stringify(item.executive ?? item.assignee))
        : null,

    status: item.status ?? null,
    remark: item.remark ?? item.notes ?? null,

    scheduledAt: text(
      item.scheduledAt ?? item.callAt ?? item.createdAt ?? ""
    ),

    updatedAt: text(item.updatedAt ?? ""),
  } as Json;
}
/** Returns call records created today. */
export async function todayCalls(): Promise<ToolResult> { return execute(async () => { const today = new Date().toDateString(); const calls = (await callModel().findMany({ take: 250 })).filter((call) => dateValue(call.createdAt ?? call.callAt ?? call.scheduledAt)?.toDateString() === today); return { total: calls.length, calls: calls.map(callView) }; }, "Today’s calls retrieved."); }
/** Returns calls that remain pending. */
export async function pendingCalls(): Promise<ToolResult> { return execute(async () => { const calls = (await callModel().findMany({ take: 250 })).filter((call) => /pending|scheduled|open/i.test(text(call.status))); return { total: calls.length, calls: calls.map(callView) }; }, "Pending calls retrieved."); }
/** Returns aggregate call status metrics. */
export async function callSummary(): Promise<ToolResult> { return execute(async () => { const calls = await callModel().findMany({ take: 500 }); const summary = calls.reduce<Record<string, number>>((result, call) => { const status = text(call.status).toLowerCase() || "unknown"; result[status] = (result[status] ?? 0) + 1; return result; }, {}); return { total: calls.length, statuses: summary }; }, "Call summary retrieved."); }
/** Returns upcoming calls and follow-up records. */
export async function nextFollowUps(input: RecordValue = {}): Promise<ToolResult> { return execute(async () => { const now = Date.now(); const calls = (await callModel().findMany({ take: Math.max(1, Math.min(Number(input.limit) || 50, 250)) })).filter((call) => { const date = dateValue(call.scheduledAt ?? call.nextFollowUp ?? call.callAt); return date && date.getTime() >= now; }).sort((a, b) => (dateValue(a.scheduledAt ?? a.nextFollowUp)?.getTime() ?? 0) - (dateValue(b.scheduledAt ?? b.nextFollowUp)?.getTime() ?? 0)); return { total: calls.length, calls: calls.map(callView) }; }, "Upcoming follow-ups retrieved."); }
/** Updates the remark for a recorded call. */
export async function updateCallRemark(input: RecordValue): Promise<ToolResult> { return execute(async () => { const delegate = callModel(); if (!delegate.update) throw new ToolError("Call updates are not available.", 503); const callId = required(input, "callId"); const remark = required(input, "remark"); const updated = await delegate.update({ where: { id: callId }, data: { remark } }); return callView(updated); }, "Call remark updated."); }
