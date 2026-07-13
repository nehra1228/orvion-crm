import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
type RecordValue = Record<string, unknown>;
type ChatRole = "system" | "user" | "assistant";
type ProviderName = "openai" | "gemini" | "claude";
type ToolCall = { id: string; name: ToolName; arguments: RecordValue };
type ToolResult = { toolCallId: string; name: ToolName; result: Json };
type ChatMessage = { role: ChatRole; content: string };

const prisma = globalThis.__orvionPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.__orvionPrisma = prisma;

declare global {
  var __orvionPrisma: PrismaClient | undefined;
}

const toolNames = [
  "getAllLeads", "getInterestedLeads", "getFollowUps", "getExecutives", "assignLead",
  "updateLead", "generateWhatsApp", "generateEmail", "generateReport", "dashboardSummary",
] as const;
type ToolName = typeof toolNames[number];

const tools = [
  tool("getAllLeads", "Return recent CRM leads with their current status, source, assignment, and follow-up context.", { limit: integer("Maximum records to return", 1, 250) }),
  tool("getInterestedLeads", "Return leads currently marked as interested.", { limit: integer("Maximum records to return", 1, 250) }),
  tool("getFollowUps", "Return leads awaiting a follow-up. Optionally filter by an ISO-8601 calendar date.", { date: string("Optional ISO-8601 follow-up date"), limit: integer("Maximum records to return", 1, 250) }),
  tool("getExecutives", "Return executive or user records available for assignments.", { limit: integer("Maximum records to return", 1, 250) }),
  tool("assignLead", "Assign a lead to an executive. Use only after the user clearly requests this action.", { leadId: requiredString("Lead identifier"), executiveId: requiredString("Executive identifier") }),
  tool("updateLead", "Update allowed lead fields. Use only after the user clearly requests this action.", { leadId: requiredString("Lead identifier"), data: { type: "object", description: "Allowed fields: status, notes, followUpDate, source, budget, priority", properties: { status: string("Lead status"), notes: string("Internal note"), followUpDate: string("ISO-8601 follow-up date"), source: string("Lead source"), budget: string("Budget or price range"), priority: string("Priority") }, additionalProperties: false } }),
  tool("generateWhatsApp", "Create a concise WhatsApp follow-up draft using an existing lead record.", { leadId: requiredString("Lead identifier"), purpose: string("Optional purpose for the message") }),
  tool("generateEmail", "Create a professional email draft using an existing lead record.", { leadId: requiredString("Lead identifier"), purpose: string("Optional purpose for the email") }),
  tool("generateReport", "Generate data for a sales, executive, monthly, or pipeline report from live CRM data.", { reportType: requiredString("sales, executive, monthly, or pipeline"), period: string("Optional reporting period") }),
  tool("dashboardSummary", "Return live dashboard metrics, conversion, lead source, executive, and pipeline summaries.", {}),
] as const;

export async function POST(request: NextRequest) {
  try {
    const payload = await parseBody(request);
    const directToolCalls = parseToolCalls(payload.toolCalls);

    if (directToolCalls.length) {
      const toolResults = await executeToolCalls(directToolCalls);
      return NextResponse.json({ provider: "tool-runtime", toolResults });
    }

    const messages = normalizeMessages(payload.messages, payload.conversation);
    if (!messages.some((message) => message.role === "user")) {
      return NextResponse.json({ error: "At least one user message is required." }, { status: 400 });
    }

    const provider = configuredProvider(payload.provider);
    const context = normalizeContext(payload.context, payload.selectedLead, payload.selectedExecutive);
    const system = buildSystemInstruction(context);
    const response = await runAgent(provider, [system, ...messages]);

    return NextResponse.json({
      provider,
      message: { role: "assistant", content: response.content },
      toolResults: response.toolResults,
    });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unable to process the AI request.";
    return NextResponse.json({ error: message }, { status });
  }
}

class ApiError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

async function parseBody(request: NextRequest): Promise<RecordValue> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) throw new ApiError("Content-Type must be application/json.", 415);
  try {
    const payload = await request.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new ApiError("Request body must be a JSON object.");
    return payload as RecordValue;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Invalid JSON request body.");
  }
}

function normalizeMessages(messages: unknown, conversation: unknown): ChatMessage[] {
  const source = Array.isArray(messages) ? messages : Array.isArray(conversation) ? conversation : [];
  if (!source.length) return [];
  return source.slice(-40).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const value = item as RecordValue;
    const role = value.role;
    const content = typeof value.content === "string" ? value.content.trim() : "";
    return (role === "user" || role === "assistant" || role === "system") && content ? [{ role, content }] : [];
  });
}

function normalizeContext(context: unknown, selectedLead: unknown, selectedExecutive: unknown): RecordValue {
  const value = context && typeof context === "object" && !Array.isArray(context) ? context as RecordValue : {};
  return {
    ...value,
    selectedLead: normalizeSelectedEntity(selectedLead ?? value.selectedLead),
    selectedExecutive: normalizeSelectedEntity(selectedExecutive ?? value.selectedExecutive),
  };
}

function normalizeSelectedEntity(value: unknown): Json | null {
  if (!value) return null;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value !== "object" || Array.isArray(value)) return null;
  const entity = value as RecordValue;
  return {
    id: stringValue(entity.id ?? entity._id),
    name: stringValue(entity.name ?? entity.fullName ?? entity.username),
  };
}

function buildSystemInstruction(context: RecordValue): ChatMessage {
  return {
    role: "system",
    content: [
      "You are ORVION AI, the enterprise CRM copilot.",
      "Use tools for all CRM facts, counts, lead data, assignments, updates, and reports. Never invent CRM data.",
      "Before calling assignLead or updateLead, ensure the user explicitly asked for that change. Explain the result concisely after a successful tool call.",
      "For follow-up drafts, adapt to the live lead context returned by the relevant tool.",
      `Current client context: ${JSON.stringify(toJson(context))}`,
    ].join("\n"),
  };
}

function configuredProvider(value: unknown): ProviderName {
  const provider = String(value ?? process.env.AI_PROVIDER ?? "openai").toLowerCase();
  if (provider === "openai" || provider === "gemini" || provider === "claude") return provider;
  throw new ApiError("AI_PROVIDER must be openai, gemini, or claude.");
}

type AgentResponse = { content: string; toolResults: ToolResult[] };

async function runAgent(provider: ProviderName, messages: ChatMessage[]): Promise<AgentResponse> {
  let conversation = messages;
  const toolResults: ToolResult[] = [];
  for (let pass = 0; pass < 4; pass++) {
    const turn = await callProvider(provider, conversation);
    if (!turn.toolCalls.length) return { content: turn.content, toolResults };
    const results = await executeToolCalls(turn.toolCalls);
    toolResults.push(...results);
    conversation = [...conversation, { role: "user", content: `Verified CRM tool results. Use these results to answer the prior request accurately:\n${JSON.stringify(results)}` }];
  }
  throw new ApiError("The AI requested too many tool execution rounds.", 502);
}

type ProviderTurn = { content: string; toolCalls: ToolCall[] };

async function callProvider(provider: ProviderName, messages: ChatMessage[]): Promise<ProviderTurn> {
  if (provider === "openai") return callOpenAi(messages);
  if (provider === "gemini") return callGemini(messages);
  return callClaude(messages);
}

async function callOpenAi(messages: ChatMessage[]): Promise<ProviderTurn> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new ApiError("OPENAI_API_KEY is not configured.", 503);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini", temperature: 0.2, messages, tools: tools.map((definition) => ({ type: "function", function: definition })), tool_choice: "auto" }),
  });
  const body = await readProviderBody(response, "OpenAI");
  const message = asRecord((asRecord(asArray(body.choices)[0]).message));
  const toolCalls = asArray(message.tool_calls).flatMap((call) => { const item = asRecord(call); const fn = asRecord(item.function); return parseToolCall({ id: stringValue(item.id) || crypto.randomUUID(), name: fn.name, arguments: safeJson(fn.arguments) }); });
  return { content: stringValue(message.content), toolCalls };
}

async function callGemini(messages: ChatMessage[]): Promise<ProviderTurn> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new ApiError("GEMINI_API_KEY is not configured.", 503);
  const system = messages.filter((message) => message.role === "system").map((message) => message.content).join("\n");
  const contents = messages.filter((message) => message.role !== "system").map((message) => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] }));
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, tools: [{ functionDeclarations: tools.map((definition) => ({ name: definition.name, description: definition.description, parameters: definition.parameters })) }] }),
  });
  const body = await readProviderBody(response, "Gemini");
  const candidate = asRecord(asArray(body.candidates)[0]);
  const parts = asArray(asRecord(candidate.content).parts);
  const toolCalls = parts.flatMap((part) => { const functionCall = asRecord(asRecord(part).functionCall); return parseToolCall({ id: crypto.randomUUID(), name: functionCall.name, arguments: functionCall.args }); });
  return { content: parts.map((part) => stringValue(asRecord(part).text)).filter(Boolean).join("\n"), toolCalls };
}

async function callClaude(messages: ChatMessage[]): Promise<ProviderTurn> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ApiError("ANTHROPIC_API_KEY is not configured.", 503);
  const system = messages.filter((message) => message.role === "system").map((message) => message.content).join("\n");
  const chat = messages.filter((message) => message.role !== "system").map((message) => ({ role: message.role === "assistant" ? "assistant" : "user", content: message.content }));
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest", max_tokens: 2048, temperature: 0.2, system, messages: chat, tools: tools.map((definition) => ({ name: definition.name, description: definition.description, input_schema: definition.parameters })) }),
  });
  const body = await readProviderBody(response, "Claude");
  const parts = asArray(body.content);
  const toolCalls = parts.flatMap((part) => { const item = asRecord(part); return item.type === "tool_use" ? parseToolCall({ id: stringValue(item.id) || crypto.randomUUID(), name: item.name, arguments: item.input }) : []; });
  return { content: parts.filter((part) => asRecord(part).type === "text").map((part) => stringValue(asRecord(part).text)).filter(Boolean).join("\n"), toolCalls };
}

async function readProviderBody(response: Response, provider: string): Promise<RecordValue> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = stringValue(asRecord(body).error && asRecord(asRecord(body).error).message) || `${provider} could not process this request.`;
    throw new ApiError(message, response.status >= 400 && response.status < 600 ? response.status : 502);
  }
  return asRecord(body);
}

function parseToolCalls(value: unknown): ToolCall[] {
  return asArray(value).flatMap((item) => parseToolCall(item));
}

function parseToolCall(value: unknown): ToolCall[] {
  const call = asRecord(value);
  const name = stringValue(call.name) as ToolName;
  if (!toolNames.includes(name)) return [];
  const args = call.arguments && typeof call.arguments === "object" && !Array.isArray(call.arguments) ? call.arguments as RecordValue : {};
  return [{ id: stringValue(call.id) || crypto.randomUUID(), name, arguments: args }];
}

async function executeToolCalls(calls: ToolCall[]): Promise<ToolResult[]> {
  return Promise.all(calls.map(async (call) => ({ toolCallId: call.id, name: call.name, result: await executeTool(call.name, call.arguments) })));
}

async function executeTool(name: ToolName, args: RecordValue): Promise<Json> {
  if (name === "getAllLeads") return getAllLeads(args);
  if (name === "getInterestedLeads") return getInterestedLeads(args);
  if (name === "getFollowUps") return getFollowUps(args);
  if (name === "getExecutives") return getExecutives(args);
  if (name === "assignLead") return assignLead(args);
  if (name === "updateLead") return updateLead(args);
  if (name === "generateWhatsApp") return generateWhatsApp(args);
  if (name === "generateEmail") return generateEmail(args);
  if (name === "generateReport") return generateReport(args);
  return dashboardSummary();
}

type Delegate = {
  findMany: (args?: RecordValue) => Promise<RecordValue[]>;
  findUnique: (args: RecordValue) => Promise<RecordValue | null>;
  update: (args: RecordValue) => Promise<RecordValue>;
};

function delegate(name: "lead" | "executive" | "user"): Delegate {
  const candidate = (prisma as unknown as Record<string, unknown>)[name];
  if (!candidate || typeof (candidate as Delegate).findMany !== "function") throw new ApiError(`The Prisma ${name} model is not available.`, 503);
  return candidate as Delegate;
}

async function getAllLeads(args: RecordValue): Promise<Json> {
  const leads = await loadLeads(limitFrom(args));
  return { total: leads.length, leads: leads.map(publicLead) };
}

async function getInterestedLeads(args: RecordValue): Promise<Json> {
  const leads = (await loadLeads(limitFrom(args))).filter((lead) => normalizedStatus(lead).includes("interest"));
  return { total: leads.length, leads: leads.map(publicLead) };
}

async function getFollowUps(args: RecordValue): Promise<Json> {
  const date = optionalDate(args.date);
  const leads = (await loadLeads(limitFrom(args))).filter((lead) => {
    if (!normalizedStatus(lead).includes("follow")) return false;
    if (!date) return true;
    const followUp = dateValue(lead.followUpDate ?? lead.follow_up_date ?? lead.nextFollowUp ?? lead.next_follow_up);
    return followUp?.toISOString().slice(0, 10) === date;
  });
  return { total: leads.length, date: date ?? null, leads: leads.map(publicLead) };
}

async function getExecutives(args: RecordValue): Promise<Json> {
  const model = hasDelegate("executive") ? delegate("executive") : delegate("user");
  const records = await model.findMany({ take: limitFrom(args) });
  const executives = records.filter((item) => { const role = stringValue(item.role).toLowerCase(); return !role || role.includes("executive") || role.includes("admin") || role.includes("sales"); }).map((item) => ({ id: stringValue(item.id ?? item._id), name: stringValue(item.name ?? item.fullName ?? item.username ?? item.email), email: stringValue(item.email), role: stringValue(item.role), status: stringValue(item.status) }));
  return { total: executives.length, executives };
}

async function assignLead(args: RecordValue): Promise<Json> {
  const leadId = requiredArg(args, "leadId"); const executiveId = requiredArg(args, "executiveId");
  const lead = delegate("lead");
  const updated = await updateWithSchemaFallback(lead, leadId, [{ assignedExecutiveId: executiveId }, { executiveId }, { assignedToId: executiveId }, { assigneeId: executiveId }]);
  return { updated: publicLead(updated), assignment: { leadId, executiveId } };
}

async function updateLead(args: RecordValue): Promise<Json> {
  const leadId = requiredArg(args, "leadId");
  const changes = asRecord(args.data);
  const permitted = ["status", "notes", "followUpDate", "source", "budget", "priority"];
  const data = Object.fromEntries(Object.entries(changes).filter(([key, value]) => permitted.includes(key) && (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null)));
  if (!Object.keys(data).length) throw new ApiError("No permitted lead fields were supplied.");
  const updated = await delegate("lead").update({ where: { id: leadId }, data });
  return { updated: publicLead(updated) };
}

async function generateWhatsApp(args: RecordValue): Promise<Json> {
  const lead = await findLead(requiredArg(args, "leadId")); const name = stringValue(lead.name ?? lead.fullName ?? lead.full_name) || "there"; const purpose = stringValue(args.purpose) || "your requirements";
  return { channel: "whatsapp", lead: publicLead(lead), draft: `Hello ${name}, this is the ORVION team. I’m following up regarding ${purpose}. I’d be happy to help with the next best step at a time that works for you.`, requiresReview: true };
}

async function generateEmail(args: RecordValue): Promise<Json> {
  const lead = await findLead(requiredArg(args, "leadId")); const name = stringValue(lead.name ?? lead.fullName ?? lead.full_name) || "there"; const purpose = stringValue(args.purpose) || "your requirements";
  return { channel: "email", lead: publicLead(lead), subject: `A quick follow-up from ORVION`, body: `Hi ${name},\n\nI’m reaching out to follow up on ${purpose}. Our team is ready to help you evaluate the next step and answer any questions.\n\nPlease let us know a convenient time to connect.\n\nRegards,\nORVION Team`, requiresReview: true };
}

async function generateReport(args: RecordValue): Promise<Json> {
  const reportType = requiredArg(args, "reportType").toLowerCase();
  if (!["sales", "executive", "monthly", "pipeline"].includes(reportType)) throw new ApiError("reportType must be sales, executive, monthly, or pipeline.");
  const summary = await dashboardSummary();
  const leads = await loadLeads(250);
  const report: Record<string, Json> = { reportType, period: stringValue(args.period) || "all available data", summary };
  if (reportType === "executive") report.executives = await executivePerformance(leads);
  if (reportType === "monthly") report.months = monthlyTotals(leads);
  if (reportType === "pipeline") report.pipeline = pipelineTotals(leads);
  if (reportType === "sales") report.bookings = leads.filter((lead) => normalizedStatus(lead).includes("book")).map(publicLead);
  return report;
}

async function dashboardSummary(): Promise<Json> {
  const leads = await loadLeads(500);
  const pipeline = pipelineTotals(leads); const booked = leads.filter((lead) => normalizedStatus(lead).includes("book")).length;
  const sources = Object.entries(leads.reduce<Record<string, number>>((totals, lead) => { const source = stringValue(lead.source ?? lead.leadSource ?? lead.lead_source) || "Direct"; totals[source] = (totals[source] ?? 0) + 1; return totals; }, {})).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);
  return { totalLeads: leads.length, conversionRate: leads.length ? Number((booked / leads.length * 100).toFixed(2)) : 0, pipeline, sources, executives: await executivePerformance(leads) };
}

async function loadLeads(limit: number): Promise<RecordValue[]> { return delegate("lead").findMany({ take: limit }); }
async function findLead(id: string): Promise<RecordValue> { const lead = await delegate("lead").findUnique({ where: { id } }); if (!lead) throw new ApiError("Lead not found.", 404); return lead; }
function pipelineTotals(leads: RecordValue[]): Json { return Object.entries(leads.reduce<Record<string, number>>((totals, lead) => { const status = normalizedStatus(lead) || "new"; totals[status] = (totals[status] ?? 0) + 1; return totals; }, {})).map(([status, count]) => ({ status, count })); }
function monthlyTotals(leads: RecordValue[]): Json { return Object.entries(leads.reduce<Record<string, number>>((totals, lead) => { const date = dateValue(lead.createdAt ?? lead.created_at ?? lead.updatedAt ?? lead.updated_at); if (date) { const month = date.toLocaleDateString("en-US", { month: "short", year: "numeric" }); totals[month] = (totals[month] ?? 0) + 1; } return totals; }, {})).map(([month, count]) => ({ month, count })); }
async function executivePerformance(leads: RecordValue[]): Promise<Json> { const totals = leads.reduce<Record<string, { assigned: number; interested: number; booked: number; followUps: number }>>((result, lead) => { const owner = entityName(lead.assignedExecutive ?? lead.executive ?? lead.assignee ?? lead.owner) || "Unassigned"; const current = result[owner] ?? { assigned: 0, interested: 0, booked: 0, followUps: 0 }; const status = normalizedStatus(lead); current.assigned++; if (status.includes("interest")) current.interested++; if (status.includes("book")) current.booked++; if (status.includes("follow")) current.followUps++; result[owner] = current; return result; }, {}); return Object.entries(totals).map(([executive, value]) => ({ executive, ...value, conversionRate: value.assigned ? Number((value.booked / value.assigned * 100).toFixed(2)) : 0 })).sort((a, b) => b.booked - a.booked); }

async function updateWithSchemaFallback(model: Delegate, id: string, options: RecordValue[]): Promise<RecordValue> {
  let lastError: unknown;
  for (const data of options) { try { return await model.update({ where: { id }, data }); } catch (error) { lastError = error; if (!isUnknownFieldError(error)) throw error; } }
  throw new ApiError("No compatible lead assignment field was found in the Prisma schema.", 503);
}

function publicLead(lead: RecordValue): Json { return toJson({ id: lead.id ?? lead._id ?? null, name: lead.name ?? lead.fullName ?? lead.full_name ?? null, email: lead.email ?? null, phone: lead.phone ?? lead.mobile ?? null, status: lead.status ?? lead.leadStatus ?? lead.lead_status ?? null, source: lead.source ?? lead.leadSource ?? lead.lead_source ?? null, assignedExecutive: lead.assignedExecutive ?? lead.executive ?? lead.assignee ?? lead.owner ?? null, followUpDate: lead.followUpDate ?? lead.follow_up_date ?? lead.nextFollowUp ?? lead.next_follow_up ?? null, budget: lead.budget ?? null, createdAt: lead.createdAt ?? lead.created_at ?? null, updatedAt: lead.updatedAt ?? lead.updated_at ?? null }); }
function normalizedStatus(lead: RecordValue): string { return stringValue(lead.status ?? lead.leadStatus ?? lead.lead_status).toLowerCase(); }
function entityName(value: unknown): string { const item = asRecord(value); return stringValue(item.name ?? item.fullName ?? item.username ?? item.email ?? value); }
function hasDelegate(name: "executive" | "user"): boolean { const candidate = (prisma as unknown as Record<string, unknown>)[name]; return Boolean(candidate && typeof (candidate as Delegate).findMany === "function"); }
function limitFrom(args: RecordValue): number { const value = Number(args.limit); return Number.isFinite(value) ? Math.max(1, Math.min(Math.trunc(value), 250)) : 100; }
function requiredArg(args: RecordValue, key: string): string { const value = stringValue(args[key]).trim(); if (!value) throw new ApiError(`${key} is required.`); return value; }
function optionalDate(value: unknown): string | null { const textValue = stringValue(value); if (!textValue) return null; const date = new Date(textValue); if (Number.isNaN(date.getTime())) throw new ApiError("date must be a valid ISO-8601 date."); return date.toISOString().slice(0, 10); }
function dateValue(value: unknown): Date | null { const date = new Date(stringValue(value)); return Number.isNaN(date.getTime()) ? null : date; }
function isUnknownFieldError(error: unknown): boolean { const message = error instanceof Error ? error.message : ""; return /unknown argument|unknown field|invalid.*argument/i.test(message); }
function asRecord(value: unknown): RecordValue { return value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {}; }
function asArray(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function stringValue(value: unknown): string { return typeof value === "string" ? value : typeof value === "number" ? String(value) : ""; }
function safeJson(value: unknown): unknown { if (typeof value !== "string") return value; try { return JSON.parse(value); } catch { return {}; } }
function toJson(value: unknown): Json { return JSON.parse(JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item instanceof Date ? item.toISOString() : item)); }
function string(description: string): RecordValue { return { type: "string", description }; }
function requiredString(description: string): RecordValue { return { type: "string", description }; }
function integer(description: string, minimum: number, maximum: number): RecordValue { return { type: "integer", description, minimum, maximum }; }
function tool(name: ToolName, description: string, properties: Record<string, RecordValue>) { const required = Object.entries(properties).filter(([key]) => key === "leadId" || key === "executiveId" || key === "reportType" || key === "data").map(([key]) => key); return { name, description, parameters: { type: "object", properties, required, additionalProperties: false } }; }
