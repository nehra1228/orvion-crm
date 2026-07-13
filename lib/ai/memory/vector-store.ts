import { cosineSimilarity, type Embedding } from "./embeddings";

export type VectorRecord<T = Record<string, unknown>> = { id: string; vector: Embedding; content: string; metadata: T; updatedAt: string };
export type VectorQuery = { vector: Embedding; limit?: number; minScore?: number; filter?: Record<string, string | number | boolean | null> };
export type VectorMatch<T = Record<string, unknown>> = VectorRecord<T> & { score: number };

/** Abstract vector persistence contract compatible with pgvector, Pinecone, Qdrant, Weaviate, and Chroma. */
export interface VectorStore<T = Record<string, unknown>> { upsert(records: VectorRecord<T>[]): Promise<void>; query(query: VectorQuery): Promise<VectorMatch<T>[]>; delete(ids: string[]): Promise<void>; clear?(filter?: Record<string, string | number | boolean | null>): Promise<void>; }

/** Bounded in-process vector store suitable for dependency injection, testing, and local development. */
export class InMemoryVectorStore<T = Record<string, unknown>> implements VectorStore<T> {
  private readonly records = new Map<string, VectorRecord<T>>();
  constructor(private readonly maximumRecords = 10_000) {}
  async upsert(records: VectorRecord<T>[]): Promise<void> { for (const record of records) this.records.set(record.id, record); while (this.records.size > this.maximumRecords) { const oldest = this.records.keys().next().value; if (!oldest) break; this.records.delete(oldest); } }
  async query(query: VectorQuery): Promise<VectorMatch<T>[]> { return [...this.records.values()].filter((record) => matchesFilter(record.metadata as Record<string, unknown>, query.filter)).map((record) => ({ ...record, score: cosineSimilarity(query.vector, record.vector) })).filter((record) => record.score >= (query.minScore ?? 0)).sort((a, b) => b.score - a.score).slice(0, Math.max(1, Math.min(query.limit ?? 8, 100))); }
  async delete(ids: string[]): Promise<void> { ids.forEach((id) => this.records.delete(id)); }
  async clear(filter?: Record<string, string | number | boolean | null>): Promise<void> { if (!filter) { this.records.clear(); return; } for (const [id, record] of this.records) if (matchesFilter(record.metadata as Record<string, unknown>, filter)) this.records.delete(id); }
}

function matchesFilter(metadata: Record<string, unknown>, filter?: Record<string, string | number | boolean | null>): boolean { return !filter || Object.entries(filter).every(([key, value]) => metadata[key] === value); }
