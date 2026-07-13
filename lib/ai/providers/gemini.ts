import {
  asArray, asRecord, asString, parseJsonObject, readJson,
  type AiChatRequest, type AiChatResponse, type AiMessage, type AiProvider, type AiToolCall,
  ProviderConfigurationError,
} from "./provider";

export class GeminiProvider implements AiProvider {
  readonly name = "gemini" as const;
  private readonly apiKey = process.env.GEMINI_API_KEY;
  private readonly model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

  async chat(request: AiChatRequest, signal?: AbortSignal): Promise<AiChatResponse> {
    if (!this.apiKey) throw new ProviderConfigurationError("GEMINI_API_KEY is not configured.");
    const system = request.messages.filter((message) => message.role === "system").map((message) => message.content).join("\n");
    const contents = request.messages.filter((message) => message.role !== "system").map(toGeminiMessage);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const response = await fetch(endpoint, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents,
        generationConfig: { temperature: request.temperature ?? 0.2, maxOutputTokens: request.maxTokens ?? 2048 },
        tools: request.tools?.length ? [{ functionDeclarations: request.tools }] : undefined,
      }),
    });
    const body = await readJson(response, "Gemini");
    const candidate = asRecord(asArray(body.candidates)[0]);
    const parts = asArray(asRecord(candidate.content).parts);
    const toolCalls: AiToolCall[] = parts.flatMap((value) => {
      const call = asRecord(asRecord(value).functionCall); const name = asString(call.name);
      return name ? [{ id: crypto.randomUUID(), name, arguments: parseJsonObject(call.args) }] : [];
    });
    const usage = asRecord(body.usageMetadata);
    return {
      content: parts.map((value) => asString(asRecord(value).text)).filter(Boolean).join("\n"), toolCalls, provider: this.name, model: this.model,
      usage: { inputTokens: numberValue(usage.promptTokenCount), outputTokens: numberValue(usage.candidatesTokenCount), totalTokens: numberValue(usage.totalTokenCount) },
    };
  }
}

function toGeminiMessage(message: AiMessage) { return { role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] }; }
function numberValue(value: unknown): number | undefined { const number = Number(value); return Number.isFinite(number) ? number : undefined; }
