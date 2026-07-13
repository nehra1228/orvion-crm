import type { EmbeddingProvider } from "./embeddings";
import type { VectorStore } from "./vector-store";

export type KnowledgeCategory = "faq" | "project" | "sales-document" | "policy" | "pricing" | "crm-documentation";
export type KnowledgeDocument = { id: string; companyId: string; category: KnowledgeCategory; title: string; content: string; tags: string[]; sourceUrl?: string; updatedAt: string };
export type KnowledgeDocumentStore = { upsert(document: KnowledgeDocument): Promise<void>; get(id: string): Promise<KnowledgeDocument | null>; list(companyId: string, category?: KnowledgeCategory): Promise<KnowledgeDocument[]>; remove(id: string): Promise<void>; };

/** In-memory document metadata store for injectable knowledge-base persistence. */
export class InMemoryKnowledgeDocumentStore implements KnowledgeDocumentStore {
  private readonly documents = new Map<string, KnowledgeDocument>();
  async upsert(document: KnowledgeDocument): Promise<void> { this.documents.set(document.id, { ...document, tags: [...new Set(document.tags.map((tag) => tag.trim()).filter(Boolean))], updatedAt: new Date().toISOString() }); }
  async get(id: string): Promise<KnowledgeDocument | null> { return this.documents.get(id) ?? null; }
  async list(companyId: string, category?: KnowledgeCategory): Promise<KnowledgeDocument[]> { return [...this.documents.values()].filter((item) => item.companyId === companyId && (!category || item.category === category)); }
  async remove(id: string): Promise<void> { this.documents.delete(id); }
}

/** Indexes company documents using a provider-neutral embedding service and vector store. */
export class KnowledgeBase {
  constructor(private readonly documents: KnowledgeDocumentStore, private readonly embeddings: EmbeddingProvider, private readonly vectors: VectorStore<{ companyId: string; category: KnowledgeCategory; title: string; tags: string[] }>) {}
  async upsert(document: Omit<KnowledgeDocument, "id" | "updatedAt"> & { id?: string }): Promise<KnowledgeDocument> { const saved: KnowledgeDocument = { ...document, id: document.id ?? crypto.randomUUID(), updatedAt: new Date().toISOString() }; const embedding = await this.embeddings.embed({ input: `${saved.title}\n${saved.content}` }); await this.documents.upsert(saved); await this.vectors.upsert([{ id: saved.id, vector: embedding.vectors[0], content: saved.content, metadata: { companyId: saved.companyId, category: saved.category, title: saved.title, tags: saved.tags }, updatedAt: saved.updatedAt }]); return saved; }
  async remove(id: string): Promise<void> { await Promise.all([this.documents.remove(id), this.vectors.delete([id])]); }
}
