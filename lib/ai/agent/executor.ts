import type { AgentContext, JsonObject } from "./context";
import type { AgentMemory } from "./memory";
import type { AgentPlan, AgentToolCatalog, PlanStep, ToolDescriptor } from "./planner";

export interface ToolExecutionContext {
  requestId: string;
  message: string;
  context: AgentContext;
  memory: AgentMemory;
  priorResults: ToolExecutionResult[];
  signal: AbortSignal;
}

export interface AgentTool extends ToolDescriptor {
  execute(input: JsonObject, context: ToolExecutionContext): Promise<unknown>;
}

export interface ToolExecutionResult {
  stepId: string;
  toolId: string;
  success: boolean;
  data?: unknown;
  error?: string;
  attempts: number;
  durationMs: number;
}

export interface ToolExecutionInput {
  requestId: string;
  message: string;
  plan: AgentPlan;
  context: AgentContext;
  memory: AgentMemory;
  signal?: AbortSignal;
}

export class ToolRegistry implements AgentToolCatalog {
  private readonly tools = new Map<string, AgentTool>();

  public constructor(tools: AgentTool[] = []) {
    for (const tool of tools) this.register(tool);
  }

  public register(tool: AgentTool): void {
    if (this.tools.has(tool.id)) throw new Error(`Duplicate AI tool registration: ${tool.id}`);
    this.tools.set(tool.id, tool);
  }

  public get(toolId: string): AgentTool | undefined {
    return this.tools.get(toolId);
  }

  public list(): ToolDescriptor[] {
    return Array.from(this.tools.values()).map(({ execute: _execute, ...descriptor }) => descriptor);
  }
}

export class ToolExecutor {
  public constructor(private readonly registry: ToolRegistry) {}

  public async execute(input: ToolExecutionInput): Promise<ToolExecutionResult[]> {
    const pending = new Map(input.plan.steps.map((step) => [step.id, step]));
    const results: ToolExecutionResult[] = [];

    while (pending.size > 0) {
      const ready = Array.from(pending.values()).filter((step) => step.dependsOn.every((id) => results.some((result) => result.stepId === id)));
      if (ready.length === 0) {
        for (const step of pending.values()) {
          results.push(this.failed(step, "Invalid tool plan: unresolved dependency."));
        }
        break;
      }

      const batch = await Promise.all(ready.map((step) => this.executeStep(step, input, results)));
      for (const result of batch) results.push(result);
      for (const step of ready) pending.delete(step.id);

      if (input.signal?.aborted) break;
    }

    return results;
  }

  private async executeStep(
    step: PlanStep,
    input: ToolExecutionInput,
    completed: ToolExecutionResult[],
  ): Promise<ToolExecutionResult> {
    const failedDependency = step.dependsOn.some((id) => !completed.find((result) => result.stepId === id)?.success);
    if (failedDependency) return this.failed(step, "Skipped because a required dependent tool failed.");
    const tool = this.registry.get(step.toolId);
    if (!tool) return this.failed(step, `Tool not registered: ${step.toolId}`);

    const startedAt = Date.now();
    const attempts = Math.max(1, (tool.retryable ? tool.maxRetries ?? 1 : 0) + 1);
    let lastError = "Tool execution failed.";
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const controller = new AbortController();
        const stop = this.forwardAbort(input.signal, controller);
        try {
          const data = await this.withTimeout(
            tool.execute(step.input, {
              requestId: input.requestId,
              message: input.message,
              context: input.context,
              memory: input.memory,
              priorResults: completed,
              signal: controller.signal,
            }),
            tool.timeoutMs ?? 20_000,
            controller,
          );
          return { stepId: step.id, toolId: tool.id, success: true, data, attempts: attempt, durationMs: Date.now() - startedAt };
        } finally {
          stop();
        }
      } catch (error) {
        lastError = this.errorMessage(error);
        if (input.signal?.aborted) break;
      }
    }

    return { stepId: step.id, toolId: tool.id, success: false, error: lastError, attempts, durationMs: Date.now() - startedAt };
  }

  private failed(step: PlanStep, error: string): ToolExecutionResult {
    return { stepId: step.id, toolId: step.toolId, success: false, error, attempts: 0, durationMs: 0 };
  }

  private withTimeout<T>(operation: Promise<T>, timeoutMs: number, controller: AbortController): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        controller.abort();
        reject(new Error(`Tool execution timed out after ${timeoutMs}ms.`));
      }, timeoutMs);
      operation.then(resolve, reject).finally(() => clearTimeout(timeout));
    });
  }

  private forwardAbort(source: AbortSignal | undefined, target: AbortController): () => void {
    if (!source) return () => undefined;
    const abort = () => target.abort(source.reason);
    if (source.aborted) abort();
    else source.addEventListener("abort", abort, { once: true });
    return () => source.removeEventListener("abort", abort);
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Tool execution failed.";
  }
}
