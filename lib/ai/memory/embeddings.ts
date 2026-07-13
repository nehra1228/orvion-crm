export type Embedding = number[];
export type EmbeddingRequest = { input: string | string[]; model?: string; signal?: AbortSignal };
export type EmbeddingResponse = { vectors: Embedding[]; model: string; dimensions: number };

/** Provider-neutral contract for OpenAI, Gemini, or future embedding implementations. */
export interface EmbeddingProvider { embed(request: EmbeddingRequest): Promise<EmbeddingResponse>; }

/** Normalizes vectors before persistence or similarity scoring. */
export function normalizeEmbedding(vector: Embedding): Embedding { const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)); return magnitude ? vector.map((value) => value / magnitude) : vector; }
/** Calculates cosine similarity for normalized or raw vectors. */
export function cosineSimilarity(left: Embedding, right: Embedding): number { const size = Math.min(left.length, right.length); if (!size) return 0; let dot = 0; let a = 0; let b = 0; for (let index = 0; index < size; index++) { dot += left[index] * right[index]; a += left[index] * left[index]; b += right[index] * right[index]; } return a && b ? dot / Math.sqrt(a * b) : 0; }
