import type { AgentContext, JsonObject } from "./context";
import type { ConversationMessage } from "./conversation";
import { ConversationService } from "./conversation";

export interface AgentMemory {
  recentMessages: ConversationMessage[];
  selectedLead?: AgentContext["selectedLead"];
  selectedExecutive?: AgentContext["selectedExecutive"];
  companyContext: JsonObject;
  crmContext: JsonObject;
  pinnedContext: JsonObject[];
}

export class MemoryService {
  public constructor(private readonly conversations: ConversationService) {}

  public async build(context: AgentContext): Promise<AgentMemory> {
    let recentMessages: ConversationMessage[] = [];
    try {
      recentMessages = await this.conversations.recent(context.conversationId);
    } catch {
      recentMessages = [];
    }

    return {
      recentMessages,
      selectedLead: context.selectedLead,
      selectedExecutive: context.selectedExecutive,
      companyContext: context.companyInformation,
      crmContext: context.crmContext,
      pinnedContext: context.pinnedContext,
    };
  }

  public toProviderMemory(memory: AgentMemory): JsonObject {
    return {
      recentMessages: memory.recentMessages.map((message) => ({
        role: message.role,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      })),
      selectedLead: memory.selectedLead,
      selectedExecutive: memory.selectedExecutive,
      companyContext: memory.companyContext,
      crmContext: memory.crmContext,
      pinnedContext: memory.pinnedContext,
    };
  }
}
