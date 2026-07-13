export type HistoryEventType = "message" | "tool" | "action" | "summary" | "context";
export type HistoryEvent = { id: string; conversationId: string; type: HistoryEventType; content: string; payload?: Record<string, unknown>; createdAt: string };

/** Append-only history contract for auditable AI conversation activity. */
export interface HistoryStore { append(event: Omit<HistoryEvent, "id" | "createdAt">): Promise<HistoryEvent>; list(conversationId: string, limit?: number): Promise<HistoryEvent[]>; }

/** Bounded in-memory history implementation. */
export class InMemoryHistoryStore implements HistoryStore {
  private readonly items = new Map<string, HistoryEvent[]>();
  constructor(private readonly maximumPerConversation = 250) {}
  async append(event: Omit<HistoryEvent, "id" | "createdAt">): Promise<HistoryEvent> { const saved = { ...event, id: crypto.randomUUID(), createdAt: new Date().toISOString() }; const entries = [...(this.items.get(event.conversationId) ?? []), saved].slice(-this.maximumPerConversation); this.items.set(event.conversationId, entries); return saved; }
  async list(conversationId: string, limit = 80): Promise<HistoryEvent[]> { return (this.items.get(conversationId) ?? []).slice(-Math.max(1, limit)); }
}
