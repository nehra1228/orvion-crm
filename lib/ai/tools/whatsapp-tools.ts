import { execute, leadView, loadLead, required, text, type RecordValue, type ToolResult } from "./system-tools";

/** Generates a WhatsApp draft based on a live lead record. */
export async function generateWhatsApp(input: RecordValue): Promise<ToolResult> { return messageDraft(input, "whatsapp", "your requirements", "WhatsApp draft generated."); }
/** Generates a concise WhatsApp reminder. */
export async function generateReminder(input: RecordValue): Promise<ToolResult> { return messageDraft(input, "whatsapp", "our upcoming follow-up", "WhatsApp reminder generated."); }
/** Generates a WhatsApp follow-up message. */
export async function generateFollowUp(input: RecordValue): Promise<ToolResult> { return messageDraft(input, "whatsapp", "the next step in your enquiry", "WhatsApp follow-up generated."); }

async function messageDraft(input: RecordValue, channel: string, fallbackPurpose: string, message: string): Promise<ToolResult> { return execute(async () => { const lead = await loadLead(required(input, "leadId")); const name = text(lead.name ?? lead.fullName ?? lead.full_name) || "there"; const purpose = text(input.purpose) || fallbackPurpose; return { channel, lead: leadView(lead), draft: `Hello ${name}, this is the ORVION team. I’m following up about ${purpose}. Please let us know a convenient time to connect so we can help with the next best step.`, requiresReview: true }; }, message); }
