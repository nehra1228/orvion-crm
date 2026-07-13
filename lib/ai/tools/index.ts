import * as analytics from "./analytics-tools";
import * as calling from "./calling-tools";
import * as dashboard from "./dashboard-tools";
import * as email from "./email-tools";
import * as executives from "./executive-tools";
import * as leads from "./lead-tools";
import * as reports from "./report-tools";
import * as system from "./system-tools";
import * as whatsapp from "./whatsapp-tools";

export * from "./analytics-tools";
export * from "./calling-tools";
export * from "./dashboard-tools";
export * from "./email-tools";
export { getExecutives, getExecutive, assignLead as assignLeadToExecutive, executivePerformance, topExecutive, resetExecutivePassword } from "./executive-tools";
export * from "./lead-tools";
export * from "./report-tools";
export * from "./system-tools";
export * from "./whatsapp-tools";

type ToolFunction = (input: Record<string, unknown>) => Promise<unknown>;

const implementations: Record<string, ToolFunction> = {
  ...leads, ...executives, ...calling, ...reports, ...dashboard, ...whatsapp, ...email, ...analytics,
  getCurrentUser: system.getCurrentUser, currentDate: system.currentDate, currentTime: system.currentTime, companyInfo: system.companyInfo, crmVersion: system.crmVersion,
};

/** Registry used by OpenAI, Gemini, or Claude tool calling adapters. */
export const aiTools = Object.fromEntries(Object.entries(implementations).filter(([, value]) => typeof value === "function"));

/** Executes a named ORVION AI tool with its validated input envelope. */
export async function executeAiTool(name: string, input: Record<string, unknown> = {}) { const tool = aiTools[name]; if (!tool) throw new Error(`Unknown AI tool: ${name}`); return tool(input); }
