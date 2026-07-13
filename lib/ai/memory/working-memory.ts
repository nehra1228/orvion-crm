export type WorkingMemory = { conversationId: string; currentTask?: string; currentWorkflow?: string; currentObjective?: string; selectedLeadId?: string; selectedExecutiveId?: string; selectedReportId?: string; currentPage?: string; temporaryContext: Record<string, string | number | boolean | null>; updatedAt: string };

/** Tracks transient task state separately from long-term user and company memory. */
export interface WorkingMemoryStore { get(conversationId: string): Promise<WorkingMemory | null>; set(memory: WorkingMemory): Promise<void>; patch(conversationId: string, patch: Partial<Omit<WorkingMemory, "conversationId" | "updatedAt">>): Promise<WorkingMemory>; clear(conversationId: string): Promise<void>; }

/** In-process working-memory store with explicit patch semantics. */
export class InMemoryWorkingMemoryStore implements WorkingMemoryStore {
  private readonly values = new Map<string, WorkingMemory>();
  async get(conversationId: string): Promise<WorkingMemory | null> { return this.values.get(conversationId) ?? null; }
  async set(memory: WorkingMemory): Promise<void> { this.values.set(memory.conversationId, { ...memory, updatedAt: new Date().toISOString() }); }
 async patch(
  conversationId: string,
  patch: Partial<Omit<WorkingMemory, "conversationId" | "updatedAt">>
): Promise<WorkingMemory> {
  const current = this.values.get(conversationId);

  const next: WorkingMemory = {
    conversationId,
    ...(current ?? {}),
    ...patch,
    temporaryContext: {
      ...(current?.temporaryContext ?? {}),
      ...(patch.temporaryContext ?? {}),
    },
    updatedAt: new Date().toISOString(),
  };

  await this.set(next);
  return next;
}
  async clear(conversationId: string): Promise<void> { this.values.delete(conversationId); }
}
