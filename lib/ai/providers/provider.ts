import { ClaudeProvider } from "./claude";
import { GeminiProvider } from "./gemini";
import { OpenAIProvider } from "./openai";

export type AiProviderName = "openai" | "gemini" | "claude";
export type AiMessageRole = "system" | "user" | "assistant";

export type AiMessage = {
  role: AiMessageRole;
  content: string;
};

export type AiToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type AiToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type AiChatRequest = {
  messages: AiMessage[];
  tools?: AiToolDefinition[];
  temperature?: number;
  maxTokens?: number;
};

export type AiChatResponse = {
  content: string;
  toolCalls: AiToolCall[];
  provider: AiProviderName;
  model: string;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
};

export interface AiProvider {
  readonly name: AiProviderName;
  chat(request: AiChatRequest, signal?: AbortSignal): Promise<AiChatResponse>;
}

export class ProviderConfigurationError extends Error {
  constructor(message: string) { super(message); this.name = "ProviderConfigurationError"; }
}

export class ProviderRequestError extends Error {
  constructor(message: string, readonly status?: number) { super(message); this.name = "ProviderRequestError"; }
}

export function createProvider(name = process.env.AI_PROVIDER): AiProvider {
  const selected = (name ?? "openai").trim().toLowerCase();
  if (selected === "openai") return new OpenAIProvider();
  if (selected === "gemini") return new GeminiProvider();
  if (selected === "claude") return new ClaudeProvider();
  throw new ProviderConfigurationError("AI_PROVIDER must be openai, gemini, or claude.");
}

export const provider: AiProvider = {
  get name() { return providerName(); },
  chat(request, signal) { return createProvider().chat(request, signal); },
};

function providerName(): AiProviderName {
  const selected = (process.env.AI_PROVIDER ?? "openai").trim().toLowerCase();
  if (selected === "openai" || selected === "gemini" || selected === "claude") return selected;
  throw new ProviderConfigurationError("AI_PROVIDER must be openai, gemini, or claude.");
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function asArray(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
export function asString(value: unknown): string { return typeof value === "string" ? value : typeof value === "number" ? String(value) : ""; }

export function parseJsonObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch { return {}; }
}

export async function readJson(response: Response, providerName: string): Promise<Record<string, unknown>> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = asRecord(asRecord(body).error);
    throw new ProviderRequestError(asString(error.message) || `${providerName} could not process the AI request.`, response.status);
  }
  return asRecord(body);
}
