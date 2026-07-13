import { ContextBuilder, type ContextBuildInput } from "./context";
import { ConversationService } from "./conversation";
import { ToolExecutor } from "./executor";
import { IntentDetector } from "./intent";
import { MemoryService } from "./memory";
import { Planner } from "./planner";
import { ResponseBuilder, type AgentResponse } from "./response";
import { ProviderRouter, ProviderRoutingError, type ProviderRequest } from "./router";

export interface AgentRequest extends Omit<ContextBuildInput, "requestId"> {
  message: string;
  requestId?: string;
  signal?: AbortSignal;
}

export interface AgentDependencies {
  contextBuilder: ContextBuilder;
  conversations: ConversationService;
  memory: MemoryService;
  intentDetector: IntentDetector;
  planner: Planner;
  executor: ToolExecutor;
  providers: ProviderRouter;
  responses: ResponseBuilder;
}

export class OrvionAgent {
  public constructor(private readonly dependencies: AgentDependencies) {}

  public async run(request: AgentRequest): Promise<AgentResponse> {
    const message = request.message.trim();
    if (!message) throw new Error("An agent message is required.");
    const requestId = request.requestId ?? this.id();
    const contextInput: ContextBuildInput = {
      requestId,
      workspaceId: request.workspaceId,
      conversationId: request.conversationId,
      userId: request.userId,
      timezone: request.timezone,
    };

    const [context] = await Promise.all([
      this.dependencies.contextBuilder.build(contextInput),
      this.safeRecord(request.conversationId, "user", message, { requestId }),
    ]);
    const memory = await this.dependencies.memory.build(context);
    const intent = this.dependencies.intentDetector.detect(message, context);
    const plan = this.dependencies.planner.create({ message, intent, context });
    const toolResults = await this.dependencies.executor.execute({
      requestId,
      message,
      plan,
      context,
      memory,
      signal: request.signal,
    });

    try {
      const generated = await this.dependencies.providers.generate(this.providerRequest({ requestId, message, context, memory, toolResults, signal: request.signal }));
      const response = this.dependencies.responses.build({
        intent,
        plan,
        toolResults,
        answer: generated.response.content,
        provider: generated.provider,
        providerCitations: generated.response.citations,
        errors: generated.attempts.map((attempt) => `${attempt.provider}: ${attempt.error}`),
      });
      await this.safeRecord(request.conversationId, "assistant", response.answer, { requestId, provider: generated.provider });
      return response;
    } catch (error) {
      const errors = error instanceof ProviderRoutingError
        ? error.attempts.map((attempt) => `${attempt.provider}: ${attempt.error}`)
        : [this.errorMessage(error)];
      const response = this.dependencies.responses.build({ intent, plan, toolResults, errors });
      await this.safeRecord(request.conversationId, "assistant", response.answer, { requestId, providerError: true });
      return response;
    }
  }

  private providerRequest(input: {
    requestId: string;
    message: string;
    context: Awaited<ReturnType<ContextBuilder["build"]>>;
    memory: Awaited<ReturnType<MemoryService["build"]>>;
    toolResults: Awaited<ReturnType<ToolExecutor["execute"]>>;
    signal?: AbortSignal;
  }): ProviderRequest {
    return {
      requestId: input.requestId,
      systemPrompt: [
        "You are ORVION CRM's AI agent.",
        "Answer accurately, use the supplied CRM context and tool results, and never claim an action completed unless a tool result confirms it.",
        "Be concise, actionable, and respect the current user's role and permissions.",
      ].join(" "),
      message: input.message,
      conversation: input.memory.recentMessages,
      context: this.dependencies.contextBuilder.toProviderContext(input.context),
      memory: input.memory,
      toolResults: input.toolResults,
      signal: input.signal,
    };
  }

  private async safeRecord(
    conversationId: string,
    role: "user" | "assistant",
    content: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.dependencies.conversations.record(conversationId, role, content, metadata);
    } catch {}
  }

  private id(): string {
    if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
    return `agent_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Unable to generate an AI response.";
  }
}
