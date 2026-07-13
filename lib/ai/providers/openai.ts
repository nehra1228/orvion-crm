import {
  asArray, asRecord, asString, parseJsonObject, readJson,
  type AiChatRequest, type AiChatResponse, type AiProvider, type AiToolCall,
  ProviderConfigurationError,
} from "./provider";

export class OpenAIProvider implements AiProvider {
  readonly name = "openai" as const;
  private readonly apiKey = process.env.OPENAI_API_KEY;
  private readonly model = process.env.OPENAI_MODEL ?? "gpt-5.5";

  async chat(request: AiChatRequest, signal?: AbortSignal): Promise<AiChatResponse> {
    if (!this.apiKey) throw new ProviderConfigurationError("OPENAI_API_KEY is not configured.");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.2,
        max_tokens: request.maxTokens ?? 2048,
        tools: request.tools?.map((tool) => ({ type: "function", function: tool })),
        tool_choice: request.tools?.length ? "auto" : undefined,
      }),
    });
    const body = await readJson(response, "OpenAI");
    const choice = asRecord(asArray(body.choices)[0]);
    const message = asRecord(choice.message);
    const toolCalls: AiToolCall[] = asArray(message.tool_calls).flatMap((value) => {
      const call = asRecord(value); const fn = asRecord(call.function); const name = asString(fn.name);
      return name ? [{ id: asString(call.id) || crypto.randomUUID(), name, arguments: parseJsonObject(fn.arguments) }] : [];
    });
    const usage = asRecord(body.usage);
    return {
      content: asString(message.content), toolCalls, provider: this.name, model: asString(body.model) || this.model,
      usage: { inputTokens: numberValue(usage.prompt_tokens), outputTokens: numberValue(usage.completion_tokens), totalTokens: numberValue(usage.total_tokens) },
    };
  }
}

function numberValue(value: unknown): number | undefined { const number = Number(value); return Number.isFinite(number) ? number : undefined; }
