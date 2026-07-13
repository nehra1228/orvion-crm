import { PrismaClient } from "@prisma/client";

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
export type RecordValue = Record<string, unknown>;
export type ToolMetadata = { executedAt: string; durationMs: number; count?: number };
export type ToolResult<T extends Json = Json> = { success: boolean; data: T | null; message: string; metadata: ToolMetadata };
export type ModelDelegate = { findMany: (args?: RecordValue) => Promise<RecordValue[]>; findUnique: (args: RecordValue) => Promise<RecordValue | null>; findFirst?: (args: RecordValue) => Promise<RecordValue | null>; create?: (args: RecordValue) => Promise<RecordValue>; update?: (args: RecordValue) => Promise<RecordValue>; delete?: (args: RecordValue) => Promise<RecordValue>; deleteMany?: (args: RecordValue) => Promise<{ count: number }>; updateMany?: (args: RecordValue) => Promise<{ count: number }>; count?: (args?: RecordValue) => Promise<number> };

const prisma = globalThis.__orvionAiToolsPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.__orvionAiToolsPrisma = prisma;
declare global { var __orvionAiToolsPrisma: PrismaClient | undefined; }

export class ToolError extends Error { constructor(message: string, readonly status = 400) { super(message); this.name = "ToolError"; } }

/** Runs a tool operation inside the standard enterprise result envelope. */
export async function execute<T extends Json>(operation: () => Promise<T>, successMessage: string): Promise<ToolResult<T>> { const started = Date.now(); try { const data = await operation(); return { success: true, data, message: successMessage, metadata: { executedAt: new Date().toISOString(), durationMs: Date.now() - started, count: countOf(data) } }; } catch (error) { return { success: false, data: null, message: error instanceof Error ? error.message : "The CRM tool could not complete the request.", metadata: { executedAt: new Date().toISOString(), durationMs: Date.now() - started } }; } }

/** Returns a Prisma delegate without coupling AI tools to generated model types. */
export function model(name: string): ModelDelegate { const candidate = (prisma as unknown as Record<string, unknown>)[name]; if (!candidate || typeof (candidate as ModelDelegate).findMany !== "function") throw new ToolError(`The Prisma ${name} model is not available.`, 503); return candidate as ModelDelegate; }
/** Returns a Prisma delegate only when the model is available. */
export function optionalModel(name: string): ModelDelegate | null { try { return model(name); } catch { return null; } }
/** Converts arbitrary data to a plain object. */
export function record(value: unknown): RecordValue { return value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {}; }
/** Converts an unknown value to a safe string. */
export function text(value: unknown): string { return typeof value === "string" ? value : typeof value === "number" ? String(value) : ""; }
/** Converts an unknown value to a finite numeric value. */
export function numeric(value: unknown): number { const result = Number(value); return Number.isFinite(result) ? result : 0; }
/** Validates a required string input. */
export function required(input: RecordValue, key: string): string { const value = text(input[key]).trim(); if (!value) throw new ToolError(`${key} is required.`); return value; }
/** Reads a bounded record limit. */
export function limit(input: RecordValue, fallback = 100, maximum = 250): number { const value = Number(input.limit); return Number.isFinite(value) ? Math.max(1, Math.min(Math.trunc(value), maximum)) : fallback; }
/** Converts database values into JSON-safe output. */
export function json(value: unknown): Json { return JSON.parse(JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item instanceof Date ? item.toISOString() : item)); }
/** Gets a normalized lead status. */
export function leadStatus(lead: RecordValue): string { return text(lead.status ?? lead.leadStatus ?? lead.lead_status).trim().toLowerCase(); }
/** Gets a normalized display name for an executive or user relation. */
export function entityName(value: unknown): string { const item = record(value); return text(item.name ?? item.fullName ?? item.username ?? item.email ?? value); }
/** Safely maps a lead to data suitable for AI use. */
export function leadView(lead: RecordValue): Json { return json({ id: lead.id ?? lead._id ?? null, name: lead.name ?? lead.fullName ?? lead.full_name ?? null, email: lead.email ?? null, phone: lead.phone ?? lead.mobile ?? null, status: lead.status ?? lead.leadStatus ?? lead.lead_status ?? null, source: lead.source ?? lead.leadSource ?? lead.lead_source ?? null, city: lead.city ?? lead.location ?? null, budget: lead.budget ?? lead.budgetRange ?? null, priority: lead.priority ?? null, assignedExecutive: lead.assignedExecutive ?? lead.executive ?? lead.assignee ?? lead.owner ?? null, followUpDate: lead.followUpDate ?? lead.follow_up_date ?? lead.nextFollowUp ?? null, createdAt: lead.createdAt ?? lead.created_at ?? null, updatedAt: lead.updatedAt ?? lead.updated_at ?? null }); }
/** Loads leads from Prisma with a safe upper bound. */
export async function loadLeads(maximum = 250): Promise<RecordValue[]> { return model("lead").findMany({ take: Math.max(1, Math.min(maximum, 500)) }); }
/** Retrieves one lead by identifier. */
export async function loadLead(id: string): Promise<RecordValue> { const item = await model("lead").findUnique({ where: { id } }); if (!item) throw new ToolError("Lead not found.", 404); return item; }
/** Updates a lead using a set of schema-compatible field alternatives. */
export async function updateLeadFields(id: string, fields: RecordValue[]): Promise<RecordValue> { const delegate = model("lead"); if (!delegate.update) throw new ToolError("Lead updates are not available.", 503); let lastError: unknown; for (const data of fields) { try { return await delegate.update({ where: { id }, data }); } catch (error) { lastError = error; if (!unknownField(error)) throw error; } } throw new ToolError(lastError instanceof Error ? lastError.message : "No compatible lead field was found.", 503); }
/** Checks whether a Prisma error indicates a mismatched generated field. */
export function unknownField(error: unknown): boolean { return /unknown argument|unknown field|invalid.*argument/i.test(error instanceof Error ? error.message : ""); }
/** Gets a date value when valid. */
export function dateValue(value: unknown): Date | null { const date = new Date(text(value)); return Number.isNaN(date.getTime()) ? null : date; }
/** Returns ISO date text after validation. */
export function isoDate(value: unknown, key = "date"): string { const date = new Date(text(value)); if (Number.isNaN(date.getTime())) throw new ToolError(`${key} must be a valid ISO-8601 date.`); return date.toISOString(); }
/** Returns a model delegate for executives or user records. */
export function executiveModel(): ModelDelegate { return optionalModel("executive") ?? model("user"); }
/** Converts a generic database record to a safe executive view. */
export function executiveView(item: RecordValue): Json { return json({ id: item.id ?? item._id ?? null, name: item.name ?? item.fullName ?? item.username ?? null, email: item.email ?? null, role: item.role ?? null, status: item.status ?? null, createdAt: item.createdAt ?? item.created_at ?? null }); }
/** Counts records or simple JSON collections for metadata. */
function countOf(value: Json): number | undefined { if (Array.isArray(value)) return value.length; if (value && typeof value === "object" && typeof value.total === "number") return value.total; return undefined; }

/** Gets the current user when the caller provides the authenticated user identifier. */
export async function getCurrentUser(input: RecordValue): Promise<ToolResult> { return execute(async () => { const userId = required(input, "userId"); const user = await model("user").findUnique({ where: { id: userId } }); if (!user) throw new ToolError("Current user was not found.", 404); return executiveView(user); }, "Current user retrieved."); }
/** Gets the current server date in ISO format. */
export async function currentDate(): Promise<ToolResult> { return execute(async () => ({ date: new Date().toISOString().slice(0, 10) }), "Current date retrieved."); }
/** Gets the current server time in ISO format. */
export async function currentTime(): Promise<ToolResult> { return execute(async () => ({ time: new Date().toISOString() }), "Current time retrieved."); }
/** Gets company information from Prisma settings when configured. */
export async function companyInfo(): Promise<ToolResult> { return execute(async () => { const settings = optionalModel("setting") ?? optionalModel("company"); if (!settings) return { name: process.env.CRM_COMPANY_NAME ?? "ORVION", configured: false }; const company = settings.findFirst ? await settings.findFirst({}) : (await settings.findMany({ take: 1 }))[0] ?? null; return json(company ?? { name: process.env.CRM_COMPANY_NAME ?? "ORVION", configured: false }); }, "Company information retrieved."); }
/** Gets the configured CRM version and build identifier. */
export async function crmVersion(): Promise<ToolResult> { return execute(async () => ({ version: process.env.CRM_VERSION ?? "unknown", build: process.env.CRM_BUILD ?? "unknown", environment: process.env.NODE_ENV ?? "production" }), "CRM version retrieved."); }
