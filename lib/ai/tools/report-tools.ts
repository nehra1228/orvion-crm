import { executivePerformance } from "./executive-tools";
import { dashboardSummary } from "./dashboard-tools";
import { execute, leadStatus, leadView, loadLeads, text, type ToolResult } from "./system-tools";

/** Builds a report for leads created today. */
export async function dailyReport(): Promise<ToolResult> { return periodReport("day", "Daily report generated."); }
/** Builds a report for the last seven days. */
export async function weeklyReport(): Promise<ToolResult> { return periodReport("week", "Weekly report generated."); }
/** Builds a report for the current month. */
export async function monthlyReport(): Promise<ToolResult> { return periodReport("month", "Monthly report generated."); }
/** Builds a report for executive performance. */
export async function executiveReport(): Promise<ToolResult> { return execute(async () => ({ dashboard: (await dashboardSummary()).data, executives: (await executivePerformance()).data }), "Executive report generated."); }
/** Builds a report grouped by source. */
export async function leadSourceReport(): Promise<ToolResult> { return execute(async () => { const leads = await loadLeads(500); const sources = leads.reduce<Record<string, number>>((result, lead) => { const source = text(lead.source ?? lead.leadSource ?? lead.lead_source) || "Direct"; result[source] = (result[source] ?? 0) + 1; return result; }, {}); return { totalLeads: leads.length, sources: Object.entries(sources).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count) }; }, "Lead source report generated."); }
/** Builds a report for booked leads. */
export async function bookingReport(): Promise<ToolResult> { return execute(async () => { const bookings = (await loadLeads(500)).filter((lead) => leadStatus(lead).includes("book")); return { totalBookings: bookings.length, bookings: bookings.map(leadView) }; }, "Booking report generated."); }

async function periodReport(period: "day" | "week" | "month", message: string): Promise<ToolResult> { return execute(async () => { const now = new Date(); const start = new Date(now); if (period === "day") start.setHours(0, 0, 0, 0); if (period === "week") start.setDate(start.getDate() - 7); if (period === "month") start.setDate(1), start.setHours(0, 0, 0, 0); const leads = (await loadLeads(500)).filter((lead) => new Date(text(lead.createdAt ?? lead.created_at ?? lead.updatedAt)).getTime() >= start.getTime()); const booked = leads.filter((lead) => leadStatus(lead).includes("book")).length; return { period, from: start.toISOString(), to: now.toISOString(), totalLeads: leads.length, booked, conversionRate: leads.length ? Number((booked / leads.length * 100).toFixed(2)) : 0, leads: leads.map(leadView) }; }, message); }
