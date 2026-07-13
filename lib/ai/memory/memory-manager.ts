import { TtlCache } from "./cache";
import { appendTurn, type ConversationStore, type ConversationSnapshot } from "./conversation-memory";
import { MemoryContextBuilder } from "./context-builder";
import type { CompanyProfileStore } from "./company-profile";
import type { HistoryStore } from "./history";
import type { LongTermMemoryStore } from "./long-term-memory";
import type { Retriever } from "./retriever";
import { summarizeConversation, type SummaryProvider } from "./summarizer";
import { trimConversation } from "./token-manager";
import type { UserProfileStore } from "./user-profile";
import type { WorkingMemoryStore } from "./working-memory";

export type MemoryManagerDependencies = { conversations: ConversationStore; working: WorkingMemoryStore; longTerm: LongTermMemoryStore; history: HistoryStore; userProfiles: UserProfileStore; companies: CompanyProfileStore; contextBuilder: MemoryContextBuilder; summarizer: SummaryProvider; retriever?: Retriever; cache?: TtlCache<unknown> };
export type PrepareContextInput = { conversationId: string; userId?: string; companyId?: string; query: string; selectedLeadId?: string; selectedExecutiveId?: string; agentContext?: Parameters<MemoryContextBuilder["build"]>[0]["agentContext"]; maximumTokens?: number };

/** Facade that manages short-term, working, long-term, profile, history, retrieval, and context memory. */
export class MemoryManager {
  private readonly cache: TtlCache<unknown>;
  constructor(private readonly dependencies: MemoryManagerDependencies) { this.cache = dependencies.cache ?? new TtlCache(); }
  async rememberMessage(input: { conversationId: string; role: "system" | "user" | "assistant"; content: string; selectedLeadId?: string; selectedExecutiveId?: string; currentPage?: string }): Promise<ConversationSnapshot> { const snapshot = await appendTurn(this.dependencies.conversations, input.conversationId, input.role, input.content, input, this.dependencies.history); const trimmed = trimConversation(snapshot.turns, 6000); if (trimmed.length < snapshot.turns.length) { const summarized = await summarizeConversation(snapshot.turns, this.dependencies.summarizer); snapshot.turns = summarized.retainedTurns; snapshot.summary = summarized.summary; await this.dependencies.conversations.save(snapshot); } return snapshot; }
  async rememberToolResult(conversationId: string, tool: string, result: unknown): Promise<void> { await this.dependencies.history.append({ conversationId, type: "tool", content: tool, payload: { result } }); this.cache.delete(`context:${conversationId}`); }
  async rememberAction(conversationId: string, action: string, payload?: Record<string, unknown>): Promise<void> { await this.dependencies.history.append({ conversationId, type: "action", content: action, payload }); }
  async prepareContext(input: PrepareContextInput): Promise<{ text: string; tokenEstimate: number }> { const cacheKey = `context:${input.conversationId}:${input.query}`; const cached = this.cache.get(cacheKey) as { text: string; tokenEstimate: number } | null; if (cached) return cached; const [conversation, userProfile, companyProfile, retrieved] = await Promise.all([this.dependencies.conversations.get(input.conversationId), input.userId ? this.dependencies.userProfiles.get(input.userId) : null, input.companyId ? this.dependencies.companies.get(input.companyId) : null, this.dependencies.retriever ? this.dependencies.retriever.retrieve({ text: input.query, companyId: input.companyId, limit: 6 }) : []]); const context = this.dependencies.contextBuilder.build({ conversation, userProfile, companyProfile, retrieved, agentContext: input.agentContext, maximumTokens: input.maximumTokens }); this.cache.set(cacheKey, context, 60_000); return context; }
  async pinFact(scope: "company" | "user" | "executive" | "project", scopeId: string | undefined, key: string, value: string, importance = 70): Promise<void> { await this.dependencies.longTerm.upsert({ scope, scopeId, type: "fact", key, value, importance }); }
}
