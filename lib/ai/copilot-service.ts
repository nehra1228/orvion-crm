import type {
  AiProvider,
  CopilotContext,
  CopilotMessage,
  CopilotRequest,
  CopilotService,
} from "./types";

export type ProviderAdapter = {
  provider: AiProvider;
  stream?: (
    request: CopilotRequest,
    signal?: AbortSignal
  ) => AsyncIterable<string>;
  complete?: (
    request: CopilotRequest,
    signal?: AbortSignal
  ) => Promise<Omit<CopilotMessage, "id" | "role" | "createdAt">>;
};

export function createCopilotService(
  adapter: ProviderAdapter
): CopilotService {
  return {
    provider: adapter.provider,
    stream: adapter.stream,
    complete: adapter.complete,
  };
}

export async function resolveCopilotContext(
  context:
    | CopilotContext
    | (() => CopilotContext | Promise<CopilotContext>)
    | undefined
): Promise<CopilotContext> {
  return typeof context === "function" ? context() : context ?? {};
}

export async function* streamCopilotResponse(
  service: CopilotService,
  request: CopilotRequest,
  signal?: AbortSignal
): AsyncGenerator<string> {
  if (!service.stream) return;

  for await (const chunk of service.stream(request, signal)) {
    if (signal?.aborted) return;
    yield chunk;
  }
}