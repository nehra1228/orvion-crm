import type { AgentIntent } from "./intent";
import type { AgentPlan } from "./planner";
import type { ProviderCitation, ProviderId } from "./router";
import type { ToolExecutionResult } from "./executor";

export interface AgentCitation extends ProviderCitation {
  toolId?: string;
}

export interface AgentSuggestion {
  label: string;
  prompt: string;
}

export interface RecommendedAction {
  label: string;
  action: string;
  payload?: Record<string, unknown>;
}

export interface AgentResponse {
  answer: string;
  toolResults: ToolExecutionResult[];
  confidence: number;
  citations: AgentCitation[];
  suggestions: AgentSuggestion[];
  recommendedActions: RecommendedAction[];
  intent: AgentIntent["type"];
  provider?: ProviderId;
  plan: AgentPlan;
  errors: string[];
}

export interface ResponseBuildInput {
  intent: AgentIntent;
  plan: AgentPlan;
  toolResults: ToolExecutionResult[];
  answer?: string;
  provider?: ProviderId;
  providerCitations?: ProviderCitation[];
  errors?: string[];
}

export class ResponseBuilder {
  public build(input: ResponseBuildInput): AgentResponse {
    const errors = [...(input.errors ?? []), ...input.toolResults.filter((result) => !result.success).map((result) => result.error ?? "Tool execution failed.")];
    return {
      answer: input.answer?.trim() || this.gracefulAnswer(input.toolResults),
      toolResults: input.toolResults,
      confidence: this.confidence(input.intent.confidence, input.toolResults, input.provider),
      citations: this.citations(input.providerCitations ?? [], input.toolResults),
      suggestions: this.suggestions(input.intent.type),
      recommendedActions: this.actions(input.intent.type, input.toolResults),
      intent: input.intent.type,
      provider: input.provider,
      plan: input.plan,
      errors: Array.from(new Set(errors)),
    };
  }

  private confidence(intentConfidence: number, results: ToolExecutionResult[], provider?: ProviderId): number {
    const toolScore = results.length === 0 ? 100 : (results.filter((result) => result.success).length / results.length) * 100;
    const providerScore = provider ? 100 : 70;
    return Math.round(Math.max(0, Math.min(100, intentConfidence * 0.45 + toolScore * 0.35 + providerScore * 0.2)));
  }

  private citations(providerCitations: ProviderCitation[], results: ToolExecutionResult[]): AgentCitation[] {
    const citations = providerCitations.map((citation) => ({ ...citation }));
    for (const result of results) {
      if (!result.success || !this.hasCitations(result.data)) continue;
      for (const citation of result.data.citations) {
        if (this.isCitation(citation)) {
  const agentCitation: AgentCitation = {
    title: citation.title,
    url: citation.url,
    source: citation.source,
    toolId: result.toolId,
  };

  citations.push(agentCitation);
}
      }
    }
    return this.uniqueCitations(citations);
  }

  private suggestions(intent: AgentIntent["type"]): AgentSuggestion[] {
    const byIntent: Record<AgentIntent["type"], AgentSuggestion[]> = {
      "lead-search": [
        { label: "Open lead details", prompt: "Show the selected lead's full activity and status." },
        { label: "Find similar leads", prompt: "Find leads with similar profile and qualification." },
      ],
      "lead-assignment": [
        { label: "Explain the assignment", prompt: "Explain why this executive is the best assignment choice." },
        { label: "Review workload", prompt: "Show the current workload across the sales team." },
      ],
      "executive-analysis": [
        { label: "Compare team performance", prompt: "Compare all executives by conversion and pipeline performance." },
        { label: "Show coaching opportunities", prompt: "Identify the highest-impact coaching opportunities." },
      ],
      calling: [
        { label: "Show call history", prompt: "Show recent call history for the selected lead." },
        { label: "Schedule follow-up", prompt: "Recommend the best time for a follow-up call." },
      ],
      reports: [
        { label: "Create a summary", prompt: "Create an executive summary of this report." },
        { label: "Compare periods", prompt: "Compare this reporting period with the previous one." },
      ],
      dashboard: [
        { label: "Explain key changes", prompt: "Explain the most important changes on the dashboard." },
        { label: "Show risk areas", prompt: "Highlight pipeline risks that require attention." },
      ],
      settings: [{ label: "Show integrations", prompt: "Show the available CRM integrations and their status." }],
      greeting: [{ label: "CRM overview", prompt: "Give me a concise CRM overview for today." }],
      help: [{ label: "Lead management", prompt: "How can you help me manage and assign leads?" }],
      "general-chat": [{ label: "CRM overview", prompt: "What needs my attention in the CRM today?" }],
    };
    return byIntent[intent];
  }

  private actions(intent: AgentIntent["type"], results: ToolExecutionResult[]): RecommendedAction[] {
    const successfulToolIds = results.filter((result) => result.success).map((result) => result.toolId);
    if (intent === "lead-assignment") return [{ label: "Confirm assignment", action: "lead.assign.confirm", payload: { toolIds: successfulToolIds } }];
    if (intent === "calling") return [{ label: "Log follow-up", action: "calling.follow-up.create", payload: { toolIds: successfulToolIds } }];
    if (intent === "reports") return [{ label: "Export report", action: "report.export", payload: { toolIds: successfulToolIds } }];
    return [];
  }

  private gracefulAnswer(results: ToolExecutionResult[]): string {
    const successful = results.filter((result) => result.success);
    if (successful.length > 0) return "I completed the available CRM actions and prepared the results.";
    return "I could not complete that request right now. Please try again or refine the request.";
  }

  private hasCitations(value: unknown): value is { citations: unknown[] } {
    return typeof value === "object" && value !== null && "citations" in value && Array.isArray(value.citations);
  }

  private isCitation(value: unknown): value is ProviderCitation {
    return typeof value === "object" && value !== null && "title" in value && typeof value.title === "string";
  }

  private uniqueCitations(citations: AgentCitation[]): AgentCitation[] {
    const seen = new Set<string>();
    return citations.filter((citation) => {
      const key = `${citation.title}|${citation.url ?? ""}|${citation.toolId ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
