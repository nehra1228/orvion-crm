export type ConversationRole = "system" | "user" | "assistant" | "tool";

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: ConversationRole;
  content: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface ConversationStore {
  append(message: ConversationMessage): Promise<void>;
  list(conversationId: string, limit: number): Promise<ConversationMessage[]>;
}

export class ConversationService {
  public constructor(private readonly store: ConversationStore, private readonly recentLimit = 20) {}

  public async recent(conversationId: string): Promise<ConversationMessage[]> {
    const messages = await this.store.list(conversationId, this.recentLimit);
    return messages
      .filter((message) => message.content.trim().length > 0)
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  }

  public async record(
    conversationId: string,
    role: ConversationRole,
    content: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const normalizedContent = content.trim();
    if (!normalizedContent) return;

    await this.store.append({
      id: this.id(),
      conversationId,
      role,
      content: normalizedContent,
      createdAt: new Date(),
      metadata,
    });
  }

  private id(): string {
    if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export class InMemoryConversationStore implements ConversationStore {
  private readonly messages = new Map<string, ConversationMessage[]>();

  public async append(message: ConversationMessage): Promise<void> {
    const current = this.messages.get(message.conversationId) ?? [];
    current.push(message);
    this.messages.set(message.conversationId, current);
  }

  public async list(conversationId: string, limit: number): Promise<ConversationMessage[]> {
    const messages = this.messages.get(conversationId) ?? [];
    return messages.slice(Math.max(0, messages.length - limit));
  }
}
