import type { AgentContext } from "../agent/context";
import type { ConversationSnapshot } from "./conversation-memory";
import type { CompanyProfile } from "./company-profile";
import type { RetrievedContext } from "./retriever";
import type { UserProfile } from "./user-profile";
import { estimateTokens } from "./token-manager";

export type MemoryContext = { conversation?: ConversationSnapshot | null; userProfile?: UserProfile | null; companyProfile?: CompanyProfile | null; retrieved?: RetrievedContext[]; agentContext?: AgentContext | null; maximumTokens?: number };

/** Composes bounded memory, company, retrieval, and CRM context into an agent-ready prompt payload. */
export class MemoryContextBuilder {
  build(input: MemoryContext): { text: string; tokenEstimate: number } { const parts = [input.conversation?.summary ? `Conversation summary:\n${input.conversation.summary}` : "", input.userProfile ? `User preferences:\n${JSON.stringify(input.userProfile)}` : "", input.companyProfile ? `Company profile:\n${JSON.stringify(input.companyProfile)}` : "", input.agentContext ? `Live CRM context:\n${JSON.stringify(input.agentContext)}` : "", input.retrieved?.length ? `Relevant knowledge:\n${input.retrieved.map((item) => `[${item.title ?? item.id}] ${item.content}`).join("\n\n")}` : ""].filter(Boolean); const limit = (input.maximumTokens ?? 2200) * 4; let text = parts.join("\n\n"); if (text.length > limit) text = text.slice(0, limit); return { text, tokenEstimate: estimateTokens(text) }; }
}
