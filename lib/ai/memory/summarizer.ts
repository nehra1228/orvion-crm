import type { ConversationTurn } from "./conversation-memory";

export interface SummaryProvider { summarize(input: { text: string; maxTokens?: number; signal?: AbortSignal }): Promise<string>; }

/** Deterministic extractive summarizer used when no LLM summary provider is injected. */
export class ExtractiveSummarizer implements SummaryProvider {
  async summarize(input: { text: string; maxTokens?: number }): Promise<string> { const limit = Math.max(200, (input.maxTokens ?? 220) * 4); const sentences = input.text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []; return sentences.slice(0, 6).join(" ").slice(0, limit).trim(); }
}
/** Summarizes long conversations while retaining pinned and recent turns. */
export async function summarizeConversation(turns: ConversationTurn[], summarizer: SummaryProvider, keepRecent = 10): Promise<{ summary: string; retainedTurns: ConversationTurn[] }> { const pinned = turns.filter((turn) => turn.pinned); const recent = turns.slice(-keepRecent); const summarizable = turns.filter((turn) => !pinned.includes(turn) && !recent.includes(turn)); const summary = summarizable.length ? await summarizer.summarize({ text: summarizable.map((turn) => `${turn.role}: ${turn.content}`).join("\n") }) : ""; return { summary, retainedTurns: [...pinned, ...recent].filter((turn, index, all) => all.findIndex((item) => item.id === turn.id) === index) }; }
