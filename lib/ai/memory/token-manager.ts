import type { ConversationTurn } from "./conversation-memory";

/** Estimates tokens conservatively without binding the memory layer to one model tokenizer. */
export function estimateTokens(text: string): number { return Math.ceil(text.trim().length / 4); }
/** Estimates the aggregate token use for conversation turns. */
export function estimateConversationTokens(turns: ConversationTurn[]): number { return turns.reduce((total, turn) => total + (turn.tokenEstimate ?? estimateTokens(turn.content)), 0); }
/** Trims old turns within a token budget while retaining system, pinned, and latest turns. */
export function trimConversation(turns: ConversationTurn[], maximumTokens: number, retainRecent = 8): ConversationTurn[] { const mandatory = turns.filter((turn) => turn.role === "system" || turn.pinned); const recent = turns.slice(-retainRecent); const retained = [...mandatory, ...recent].filter((turn, index, all) => all.findIndex((item) => item.id === turn.id) === index); let budget = estimateConversationTokens(retained); for (const turn of [...turns].reverse()) { if (retained.some((item) => item.id === turn.id)) continue; const tokens = turn.tokenEstimate ?? estimateTokens(turn.content); if (budget + tokens > maximumTokens) continue; retained.push(turn); budget += tokens; } return retained.sort((left, right) => left.createdAt.localeCompare(right.createdAt)); }
