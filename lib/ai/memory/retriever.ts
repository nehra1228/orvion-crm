import type { EmbeddingProvider } from "./embeddings";
import type { KnowledgeCategory } from "./knowledge-base";
import type { VectorMatch, VectorStore } from "./vector-store";

export type RetrievalQuery = { text: string; companyId?: string; category?: KnowledgeCategory; limit?: number; minScore?: number };
export type RetrievedContext = { id: string; content: string; score: number; title?: string; category?: string; metadata: Record<string, unknown> };

/** Retrieves relevant knowledge and vectorized CRM context for agent prompts. */
export class Retriever {
  constructor(private readonly embeddings: EmbeddingProvider, private readonly vectors: VectorStore<Record<string, unknown>>) {}
  async retrieve(query: RetrievalQuery): Promise<RetrievedContext[]> { const embedded = await this.embeddings.embed({ input: query.text }); const matches = await this.vectors.query({ vector: embedded.vectors[0], limit: query.limit ?? 8, minScore: query.minScore ?? 0.2, filter: { ...(query.companyId ? { companyId: query.companyId } : {}), ...(query.category ? { category: query.category } : {}) } }); return matches.map(toContext); }
}
function toContext(match: VectorMatch<Record<string, unknown>>): RetrievedContext { return { id: match.id, content: match.content, score: Number(match.score.toFixed(4)), title: typeof match.metadata.title === "string" ? match.metadata.title : undefined, category: typeof match.metadata.category === "string" ? match.metadata.category : undefined, metadata: match.metadata }; }
