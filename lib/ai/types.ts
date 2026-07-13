export type AiProvider = "openai" | "azure-openai" | "gemini" | "claude" | "custom";

export type CopilotCapability =
  | "chat"
  | "lead-analysis"
  | "follow-up"
  | "sales-coach"
  | "dashboard-insights"
  | "daily-briefing"
  | "search"
  | "workflow"
  | "report";

export type CopilotRole = "user" | "assistant" | "system";

export type CopilotArtifact =
  | { kind: "table"; title?: string; columns: string[]; rows: string[][] }
  | { kind: "metrics"; title?: string; values: { label: string; value: string | number; trend?: "up" | "down" | "neutral" }[] }
  | { kind: "link"; label: string; href: string };

export type CopilotAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  file?: File;
};

export type CopilotMessage = {
  id: string;
  role: CopilotRole;
  content: string;
  createdAt: Date;
  capability?: CopilotCapability;
  artifacts?: CopilotArtifact[];
};

export type CopilotContext = {
  userId?: string;
  organizationId?: string;
  page?: string;
  selectedLeadId?: string;
  selectedExecutiveId?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type CopilotRequest = {
  message: string;
  history: CopilotMessage[];
  capability: CopilotCapability;
  context: CopilotContext;
  attachments?: CopilotAttachment[];
};

export type CopilotService = {
  provider: AiProvider;
  complete?: (request: CopilotRequest, signal?: AbortSignal) => Promise<Omit<CopilotMessage, "id" | "role" | "createdAt">>;
  stream?: (request: CopilotRequest, signal?: AbortSignal) => AsyncIterable<string>;
};

export type CopilotConfig = {
  service: CopilotService;
  context?: CopilotContext | (() => CopilotContext | Promise<CopilotContext>);
  onAttachment?: (files: File[]) => void;
  onVoiceRequest?: () => void;
  onOpenChange?: (open: boolean) => void;
};
