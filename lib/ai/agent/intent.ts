import type { AgentContext } from "./context";

export type AgentIntentType =
  | "lead-search"
  | "lead-assignment"
  | "executive-analysis"
  | "calling"
  | "reports"
  | "dashboard"
  | "settings"
  | "greeting"
  | "help"
  | "general-chat";

export interface IntentCandidate {
  type: AgentIntentType;
  score: number;
}

export interface AgentIntent {
  type: AgentIntentType;
  confidence: number;
  candidates: IntentCandidate[];
  entities: Record<string, string>;
}

interface IntentRule {
  type: AgentIntentType;
  patterns: RegExp[];
  baseScore: number;
}

const RULES: IntentRule[] = [
  { type: "lead-assignment", baseScore: 0.92, patterns: [/\b(assign|reassign|allocate|distribute)\b.*\b(lead|prospect|owner|executive|rep)\b/i, /\bwho should own\b/i] },
  { type: "lead-search", baseScore: 0.88, patterns: [/\b(find|search|show|list|lookup)\b.*\b(lead|prospect|contact)\b/i, /\bleads?\b.*\b(from|at|in|with|named)\b/i] },
  { type: "executive-analysis", baseScore: 0.9, patterns: [/\b(executive|sales rep|representative|agent)\b.*\b(performance|analysis|productivity|conversion|pipeline)\b/i, /\b(compare|rank)\b.*\b(team|executives?|reps?)\b/i] },
  { type: "calling", baseScore: 0.9, patterns: [/\b(call|dial|phone|telephony|callback|call log)\b/i] },
  { type: "reports", baseScore: 0.9, patterns: [/\b(report|export|download)\b/i, /\bweekly|monthly|quarterly\b.*\b(summary|performance|sales)\b/i] },
  { type: "dashboard", baseScore: 0.86, patterns: [/\b(dashboard|overview|kpi|metrics|pipeline summary)\b/i] },
  { type: "settings", baseScore: 0.86, patterns: [/\b(setting|configuration|configure|preference|integration|permission)\b/i] },
  { type: "help", baseScore: 0.82, patterns: [/\b(help|how do i|what can you do|guide|tutorial)\b/i] },
  { type: "greeting", baseScore: 0.8, patterns: [/^(hi|hello|hey|good morning|good afternoon|good evening)[!,.\s]*$/i] },
];

export class IntentDetector {
  public detect(message: string, context: AgentContext): AgentIntent {
    const normalized = message.trim();
    const candidates = RULES.map((rule) => this.score(rule, normalized))
      .filter((candidate) => candidate.score > 0)
      .sort((left, right) => right.score - left.score);
    const winner = candidates[0];
    const type = winner?.type ?? "general-chat";
    const confidence = Math.round((winner?.score ?? this.generalChatScore(normalized, context)) * 100);

    return {
      type,
      confidence: Math.max(0, Math.min(100, confidence)),
      candidates: candidates.slice(0, 3),
      entities: this.extractEntities(normalized, context),
    };
  }

  private score(rule: IntentRule, message: string): IntentCandidate {
    const matches = rule.patterns.reduce((count, pattern) => count + Number(pattern.test(message)), 0);
    const score = matches === 0 ? 0 : Math.min(0.99, rule.baseScore + (matches - 1) * 0.04);
    return { type: rule.type, score };
  }

  private generalChatScore(message: string, context: AgentContext): number {
    if (!message) return 0;
    if (context.selectedLead && /\b(it|this lead|them)\b/i.test(message)) return 0.7;
    return 0.62;
  }

  private extractEntities(message: string, context: AgentContext): Record<string, string> {
    const entities: Record<string, string> = {};
    const email = message.match(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/);
    const phone = message.match(/\+?[1-9]\d{7,14}\b/);
    const quotedName = message.match(/["“]([^"”]{2,80})["”]/);
    if (email) entities.email = email[0];
    if (phone) entities.phone = phone[0];
    if (quotedName) entities.name = quotedName[1];
    if (context.selectedLead) entities.selectedLeadId = context.selectedLead.id;
    if (context.selectedExecutive) entities.selectedExecutiveId = context.selectedExecutive.id;
    return entities;
  }
}
