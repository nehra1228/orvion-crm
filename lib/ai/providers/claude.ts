import {
  asArray, asRecord, asString, parseJsonObject, readJson,
  type AiChatRequest, type AiChatResponse, type AiProvider, type AiToolCall,
  ProviderConfigurationError,
} from "./provider";

export class ClaudeProvider implements AiProvider {
  readonly name = "claude" as const;
  private readonly apiKey = process.env.ANTHROPIC_API_KEY;
  private readonly model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest";

  async chat(request: AiChatRequest, signal?: AbortSignal): Promise<AiChatResponse> {
    if (!this.apiKey) throw new ProviderConfigurationError("ANTHROPIC_API_KEY is not configured.");
    const system = request.messages.filter((message) => message.role === "system").map((message) => message.content).join("\n");
    const messages = request.messages.filter((message) => message.role !== "system").map((message) => ({ role: message.role === "assistant" ? "assistant" : "user", content: message.content }));
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal,
      headers: { "x-api-key": this.apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        max_tokens: request.maxTokens ?? 2048,
        temperature: request.temperature ?? 0.2,
        system: system || undefined,
        messages,
        tools: request.tools?.map((tool) => ({ name: tool.name, description: tool.description, input_schema: tool.parameters })),
      }),
    });
    const body = await readJson(response, "Claude");
    const parts = asArray(body.content);
    const toolCalls: AiToolCall[] = parts.flatMap((value) => {
      const call = asRecord(value); const name = call.type === "tool_use" ? asString(call.name) : "";
      return name ? [{ id: asString(call.id) || crypto.randomUUID(), name, arguments: parseJsonObject(call.input) }] : [];
    });
    const usage = asRecord(body.usage);
    return {
      content: parts.filter((value) => asRecord(value).type === "text").map((value) => asString(asRecord(value).text)).filter(Boolean).join("\n"), toolCalls, provider: this.name, model: asString(body.model) || this.model,
      usage: { inputTokens: numberValue(usage.input_tokens), outputTokens: numberValue(usage.output_tokens) },
    };
  }
}

function numberValue(value: unknown): number | undefined { const number = Number(value); return Number.isFinite(number) ? number : undefined; }
