import type { JsonObject } from "./context";
import type { ConversationMessage } from "./conversation";
import type { ToolExecutionResult } from "./executor";
import type { AgentMemory } from "./memory";

export type ProviderId = "openai" | "gemini" | "claude";

export interface ProviderCitation {
  title: string;
  url?: string;
  source?: string;
}

export interface ProviderRequest {
  requestId: string;
  systemPrompt: string;
  message: string;
  conversation: ConversationMessage[];
  context: JsonObject;
  memory: AgentMemory;
  toolResults: ToolExecutionResult[];
  signal?: AbortSignal;
}

export interface ProviderResponse {
  content: string;
  citations?: ProviderCitation[];
  usage?: JsonObject;
}

export interface AIProvider {
  id: ProviderId;
  isAvailable(): Promise<boolean>;
  generate(request: ProviderRequest): Promise<ProviderResponse>;
}

export interface ProviderAttempt {
  provider: ProviderId;
  error: string;
}

export interface RoutedProviderResponse {
  provider: ProviderId;
  response: ProviderResponse;
  attempts: ProviderAttempt[];
}

const environmentProvider = (): string | undefined => {
  const runtime = globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } };
  return runtime.process?.env?.AI_PROVIDER;
};

export class ProviderRoutingError extends Error {
  public constructor(public readonly attempts: ProviderAttempt[]) {
    super("No configured AI provider could generate a response.");
    this.name = "ProviderRoutingError";
  }
}

export class ProviderRouter {
  private readonly providers = new Map<ProviderId, AIProvider>();

  public constructor(
    providers: AIProvider[],
    private readonly readProvider: () => string | undefined = environmentProvider,
    private readonly fallbackOrder: ProviderId[] = ["openai", "gemini", "claude"],
    private readonly retriesPerProvider = 1,
  ) {
    for (const provider of providers) this.providers.set(provider.id, provider);
  }

  public async generate(request: ProviderRequest): Promise<RoutedProviderResponse> {
    const attempts: ProviderAttempt[] = [];
    for (const providerId of this.order()) {
      const provider = this.providers.get(providerId);
      if (!provider) continue;
      if (!(await provider.isAvailable())) {
        attempts.push({ provider: providerId, error: "Provider is not available." });
        continue;
      }
      for (let attempt = 0; attempt <= this.retriesPerProvider; attempt += 1) {
        try {
          const response = await provider.generate(request);
          if (!response.content.trim()) throw new Error("Provider returned an empty response.");
          return { provider: providerId, response, attempts };
        } catch (error) {
          attempts.push({ provider: providerId, error: this.errorMessage(error) });
        }
      }
    }
    throw new ProviderRoutingError(attempts);
  }

  public order(): ProviderId[] {
    const configured = this.normalizedProvider(this.readProvider());
    return Array.from(new Set([...(configured ? [configured] : []), ...this.fallbackOrder]));
  }

  private normalizedProvider(value: string | undefined): ProviderId | undefined {
    const normalized = value?.trim().toLowerCase();
    return normalized === "openai" || normalized === "gemini" || normalized === "claude" ? normalized : undefined;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Provider request failed.";
  }
}
