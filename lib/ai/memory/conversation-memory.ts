import type { HistoryEvent, HistoryStore } from "./history";

export type ConversationTurn = { id: string; role: "system" | "user" | "assistant"; content: string; createdAt: string; tokenEstimate?: number; pinned?: boolean };
export type ConversationSnapshot = { conversationId: string; turns: ConversationTurn[]; summary?: string; selectedLeadId?: string; selectedExecutiveId?: string; selectedReportId?: string; currentPage?: string; updatedAt: string };

/** Persistence boundary for conversation turns, summaries, and selected CRM entities. */
export interface ConversationStore { get(conversationId: string): Promise<ConversationSnapshot | null>; save(snapshot: ConversationSnapshot): Promise<void>; remove(conversationId: string): Promise<void>; }

/** Bounded conversation store that can be replaced by a Prisma-backed adapter through dependency injection. */
export class InMemoryConversationStore implements ConversationStore {
  private readonly conversations = new Map<string, ConversationSnapshot>();
  constructor(private readonly maximumTurns = 100) {}
  async get(conversationId: string): Promise<ConversationSnapshot | null> { return this.conversations.get(conversationId) ?? null; }
  async save(snapshot: ConversationSnapshot): Promise<void> { this.conversations.set(snapshot.conversationId, { ...snapshot, turns: snapshot.turns.slice(-this.maximumTurns), updatedAt: new Date().toISOString() }); }
  async remove(conversationId: string): Promise<void> { this.conversations.delete(conversationId); }
}

/** Adds a conversation turn and records it in the optional audit history. */
export async function appendTurn(store: ConversationStore, conversationId: string, role: ConversationTurn["role"], content: string, options: Partial<Pick<ConversationSnapshot, "selectedLeadId" | "selectedExecutiveId" | "selectedReportId" | "currentPage">> = {}, history?: HistoryStore): Promise<ConversationSnapshot> { const current = await store.get(conversationId); const turn: ConversationTurn = { id: crypto.randomUUID(), role, content: content.trim(), createdAt: new Date().toISOString(), pinned: role === "system" }; const next: ConversationSnapshot = { conversationId, turns: [...(current?.turns ?? []), turn], summary: current?.summary, selectedLeadId: options.selectedLeadId ?? current?.selectedLeadId, selectedExecutiveId: options.selectedExecutiveId ?? current?.selectedExecutiveId, selectedReportId: options.selectedReportId ?? current?.selectedReportId, currentPage: options.currentPage ?? current?.currentPage, updatedAt: new Date().toISOString() }; await store.save(next); if (history) await history.append({ conversationId, type: "message", content, payload: { role } }); return next; }
/** Records a summarized snapshot without discarding pinned conversation turns. */
export async function setConversationSummary(store: ConversationStore, conversationId: string, summary: string): Promise<ConversationSnapshot> { const current = await store.get(conversationId); if (!current) throw new Error("Conversation not found."); const next = { ...current, summary: summary.trim(), updatedAt: new Date().toISOString() }; await store.save(next); return next; }
