export type CacheEntry<T> = { value: T; expiresAt: number };

/** A bounded TTL cache for low-latency memory and retrieval lookups. */
export class TtlCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  constructor(private readonly maximumEntries = 500, private readonly defaultTtlMs = 300_000) {}
  get(key: string): T | null { const entry = this.entries.get(key); if (!entry || entry.expiresAt <= Date.now()) { this.entries.delete(key); return null; } return entry.value; }
  set(key: string, value: T, ttlMs = this.defaultTtlMs): void { this.prune(); this.entries.set(key, { value, expiresAt: Date.now() + Math.max(1, ttlMs) }); }
  delete(key: string): void { this.entries.delete(key); }
  clear(prefix?: string): void { if (!prefix) { this.entries.clear(); return; } for (const key of this.entries.keys()) if (key.startsWith(prefix)) this.entries.delete(key); }
  private prune(): void { for (const [key, value] of this.entries) if (value.expiresAt <= Date.now()) this.entries.delete(key); while (this.entries.size >= this.maximumEntries) { const oldest = this.entries.keys().next().value; if (!oldest) break; this.entries.delete(oldest); } }
}
