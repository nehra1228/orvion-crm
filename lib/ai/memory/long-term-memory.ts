export type LongTermMemoryType = "company" | "project" | "executive" | "preference" | "prompt" | "setting" | "sales-rule" | "fact";
export type LongTermMemory = { id: string; scope: "company" | "user" | "executive" | "project"; scopeId?: string; type: LongTermMemoryType; key: string; value: string; importance: number; expiresAt?: string; createdAt: string; updatedAt: string };

/** Persistence boundary for durable, scoped AI facts and preferences. */
export interface LongTermMemoryStore { upsert(memory: Omit<LongTermMemory, "id" | "createdAt" | "updatedAt">): Promise<LongTermMemory>; list(scope: LongTermMemory["scope"], scopeId?: string, types?: LongTermMemoryType[]): Promise<LongTermMemory[]>; remove(id: string): Promise<void>; }

/** In-memory durable-memory implementation; inject a Prisma adapter in production persistence boundaries. */
export class InMemoryLongTermMemoryStore implements LongTermMemoryStore {
  private readonly entries = new Map<string, LongTermMemory>();
  async upsert(memory: Omit<LongTermMemory, "id" | "createdAt" | "updatedAt">): Promise<LongTermMemory> { const existing = [...this.entries.values()].find((item) => item.scope === memory.scope && item.scopeId === memory.scopeId && item.type === memory.type && item.key === memory.key); const now = new Date().toISOString(); const saved: LongTermMemory = { ...existing, ...memory, id: existing?.id ?? crypto.randomUUID(), createdAt: existing?.createdAt ?? now, updatedAt: now }; this.entries.set(saved.id, saved); return saved; }
  async list(scope: LongTermMemory["scope"], scopeId?: string, types?: LongTermMemoryType[]): Promise<LongTermMemory[]> { const now = Date.now(); return [...this.entries.values()].filter((item) => item.scope === scope && item.scopeId === scopeId && (!types?.length || types.includes(item.type)) && (!item.expiresAt || new Date(item.expiresAt).getTime() > now)).sort((a, b) => b.importance - a.importance); }
  async remove(id: string): Promise<void> { this.entries.delete(id); }
}
