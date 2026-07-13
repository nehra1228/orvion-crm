import { execute, leadView, loadLead, required, text, type RecordValue, type ToolResult } from "./system-tools";

/** Generates a professional email draft for a lead. */
export async function generateEmail(input: RecordValue): Promise<ToolResult> { return emailDraft(input, "A quick follow-up from ORVION", "your requirements", "Email draft generated."); }
/** Generates a quotation email draft for a lead. */
export async function generateQuotation(input: RecordValue): Promise<ToolResult> { return emailDraft(input, "Your ORVION quotation", "your requested quotation", "Quotation email generated."); }
/** Generates a proposal email draft for a lead. */
export async function generateProposal(input: RecordValue): Promise<ToolResult> { return emailDraft(input, "Your ORVION proposal", "the proposal prepared for you", "Proposal email generated."); }

async function emailDraft(input: RecordValue, subject: string, fallbackPurpose: string, message: string): Promise<ToolResult> { return execute(async () => { const lead = await loadLead(required(input, "leadId")); const name = text(lead.name ?? lead.fullName ?? lead.full_name) || "there"; const purpose = text(input.purpose) || fallbackPurpose; return { channel: "email", lead: leadView(lead), subject: text(input.subject) || subject, body: `Hi ${name},\n\nI’m reaching out regarding ${purpose}. Our ORVION team is ready to answer your questions and help you evaluate the next step.\n\nPlease reply with a convenient time to connect.\n\nRegards,\nORVION Team`, requiresReview: true }; }, message); }
