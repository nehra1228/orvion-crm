import type { AgentContext, JsonObject } from "./context";
import type { AgentIntent, AgentIntentType } from "./intent";

export type ToolCategory =
  | "lead-tools"
  | "executive-tools"
  | "dashboard-tools"
  | "report-tools"
  | "calling-tools"
  | "analytics-tools"
  | "whatsapp-tools"
  | "email-tools"
  | "system-tools";

export interface ToolDescriptor {
  id: string;
  category: ToolCategory;
  description: string;
  capabilities: string[];
  priority?: number;
  retryable?: boolean;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface AgentToolCatalog {
  list(): ToolDescriptor[];
}

export type PlanStrategy = "none" | "single" | "parallel" | "sequential" | "mixed";

export interface PlanStep {
  id: string;
  toolId: string;
  input: JsonObject;
  dependsOn: string[];
  required: boolean;
}

export interface AgentPlan {
  intent: AgentIntentType;
  strategy: PlanStrategy;
  steps: PlanStep[];
}

export interface PlanningInput {
  message: string;
  intent: AgentIntent;
  context: AgentContext;
}

const CATEGORY_BY_INTENT: Record<AgentIntentType, ToolCategory[]> = {
  "lead-search": ["lead-tools"],
  "lead-assignment": ["lead-tools", "executive-tools"],
  "executive-analysis": ["executive-tools", "analytics-tools"],
  calling: ["calling-tools"],
  reports: ["report-tools", "analytics-tools"],
  dashboard: ["dashboard-tools", "analytics-tools"],
  settings: ["system-tools"],
  greeting: [],
  help: [],
  "general-chat": [],
};

const CAPABILITIES_BY_INTENT: Record<AgentIntentType, string[]> = {
  "lead-search": ["lead.search"],
  "lead-assignment": ["lead.search", "lead.assign", "executive.analysis"],
  "executive-analysis": ["executive.analysis", "analytics.query"],
  calling: ["calling.initiate", "calling.history"],
  reports: ["report.generate", "report.export", "analytics.query"],
  dashboard: ["dashboard.read", "analytics.query"],
  settings: ["system.settings"],
  greeting: [],
  help: [],
  "general-chat": [],
};

export class Planner {
  public constructor(private readonly tools: AgentToolCatalog, private readonly maximumTools = 4) {}

  public create(input: PlanningInput): AgentPlan {
    const candidates = this.selectTools(input);
    if (candidates.length === 0) {
      return { intent: input.intent.type, strategy: "none", steps: [] };
    }

    if (input.intent.type === "lead-assignment") return this.assignmentPlan(input, candidates);
    const steps = candidates.map((tool, index) => this.step(tool, index, input));
    return {
      intent: input.intent.type,
      strategy: steps.length === 1 ? "single" : "parallel",
      steps,
    };
  }

  private selectTools(input: PlanningInput): ToolDescriptor[] {
    const requestedChannel = this.requestedChannel(input.message);
    const categories: ToolCategory[] = requestedChannel ? [requestedChannel] : CATEGORY_BY_INTENT[input.intent.type];
    const capabilities = requestedChannel
      ? requestedChannel === "email-tools"
        ? ["email.send", "email.search"]
        : ["whatsapp.send", "whatsapp.search"]
      : CAPABILITIES_BY_INTENT[input.intent.type];
    return this.tools
      .list()
      .filter((tool) => categories.includes(tool.category))
      .filter((tool) => capabilities.some((capability) => this.supports(tool, capability)))
      .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))
      .slice(0, this.maximumTools);
  }

  private supports(tool: ToolDescriptor, capability: string): boolean {
    return tool.capabilities.includes("*") || tool.capabilities.includes(capability) || tool.capabilities.includes(`${tool.category}.*`);
  }

  private requestedChannel(message: string): "email-tools" | "whatsapp-tools" | undefined {
    if (/\b(email|mail)\b/i.test(message)) return "email-tools";
    if (/\b(whatsapp|wa)\b/i.test(message)) return "whatsapp-tools";
    return undefined;
  }

  private assignmentPlan(input: PlanningInput, candidates: ToolDescriptor[]): AgentPlan {
    const lookup = candidates.find((tool) => this.supports(tool, "lead.search"));
    const analysis = candidates.find((tool) => tool.id !== lookup?.id && this.supports(tool, "executive.analysis"));
    const assignment = candidates.find(
      (tool) => tool.id !== lookup?.id && tool.id !== analysis?.id && this.supports(tool, "lead.assign"),
    );
    const steps: PlanStep[] = [];

    if (lookup) steps.push(this.step(lookup, steps.length, input));
    if (analysis) steps.push(this.step(analysis, steps.length, input));
    if (assignment) {
      steps.push({
        ...this.step(assignment, steps.length, input),
        dependsOn: steps.map((step) => step.id),
      });
    }

    if (steps.length === 0) steps.push(this.step(candidates[0], 0, input));
    if (steps.length === 1) return { intent: input.intent.type, strategy: "single", steps };
    return {
      intent: input.intent.type,
      strategy: assignment ? "mixed" : "parallel",
      steps,
    };
  }

  private step(tool: ToolDescriptor, index: number, input: PlanningInput): PlanStep {
    return {
      id: `${tool.id}:${index + 1}`,
      toolId: tool.id,
      input: {
        message: input.message,
        intent: input.intent.type,
        entities: input.intent.entities,
        selectedLeadId: input.context.selectedLead?.id,
        selectedExecutiveId: input.context.selectedExecutive?.id,
      },
      dependsOn: [],
      required: true,
    };
  }
}
