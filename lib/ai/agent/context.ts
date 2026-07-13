export type JsonObject = Record<string, unknown>;

export interface AgentUser {
  id: string;
  name: string;
  email?: string;
  role: string;
  permissions: string[];
}

export interface LeadSelection {
  id: string;
  name: string;
  company?: string;
  ownerId?: string;
  status?: string;
}

export interface ExecutiveSelection {
  id: string;
  name: string;
  role?: string;
  team?: string;
}

export interface RecentActivity {
  id: string;
  type: string;
  summary: string;
  occurredAt: string;
  actorName?: string;
  entityType?: string;
  entityId?: string;
}

export interface AgentContext {
  requestId: string;
  workspaceId: string;
  conversationId: string;
  currentUser: AgentUser;
  selectedLead?: LeadSelection;
  selectedExecutive?: ExecutiveSelection;
  today: string;
  timezone: string;
  crmStatistics: JsonObject;
  recentActivity: RecentActivity[];
  companyInformation: JsonObject;
  crmContext: JsonObject;
  pinnedContext: JsonObject[];
}

export interface ContextBuildInput {
  requestId: string;
  workspaceId: string;
  conversationId: string;
  userId: string;
  timezone?: string;
}

export interface AgentContextRepository {
  getCurrentUser(input: ContextBuildInput): Promise<AgentUser>;
  getSelectedLead(input: ContextBuildInput): Promise<LeadSelection | undefined>;
  getSelectedExecutive(input: ContextBuildInput): Promise<ExecutiveSelection | undefined>;
  getCrmStatistics(input: ContextBuildInput): Promise<JsonObject>;
  getRecentActivity(input: ContextBuildInput, limit: number): Promise<RecentActivity[]>;
  getCompanyInformation(input: ContextBuildInput): Promise<JsonObject>;
  getCrmContext(input: ContextBuildInput): Promise<JsonObject>;
  getPinnedContext(input: ContextBuildInput): Promise<JsonObject[]>;
}

export class ContextBuilder {
  public constructor(
    private readonly repository: AgentContextRepository,
    private readonly activityLimit = 12,
    private readonly defaultTimezone = "UTC",
  ) {}

  public async build(input: ContextBuildInput): Promise<AgentContext> {
    const timezone = input.timezone ?? this.defaultTimezone;
    const currentUser = await this.repository.getCurrentUser(input);
    const [selectedLead, selectedExecutive, crmStatistics, recentActivity, companyInformation, crmContext, pinnedContext] =
      await Promise.all([
        this.optional(() => this.repository.getSelectedLead(input)),
        this.optional(() => this.repository.getSelectedExecutive(input)),
        this.optional(() => this.repository.getCrmStatistics(input), {}),
        this.optional(() => this.repository.getRecentActivity(input, this.activityLimit), []),
        this.optional(() => this.repository.getCompanyInformation(input), {}),
        this.optional(() => this.repository.getCrmContext(input), {}),
        this.optional(() => this.repository.getPinnedContext(input), []),
      ]);

    return {
      requestId: input.requestId,
      workspaceId: input.workspaceId,
      conversationId: input.conversationId,
      currentUser,
      selectedLead,
      selectedExecutive,
      today: this.todayIn(timezone),
      timezone,
      crmStatistics,
      recentActivity,
      companyInformation,
      crmContext,
      pinnedContext,
    };
  }

  public toProviderContext(context: AgentContext): JsonObject {
    return {
      currentUser: {
        id: context.currentUser.id,
        name: context.currentUser.name,
        role: context.currentUser.role,
        permissions: context.currentUser.permissions,
      },
      selectedLead: context.selectedLead,
      selectedExecutive: context.selectedExecutive,
      today: context.today,
      timezone: context.timezone,
      crmStatistics: context.crmStatistics,
      recentActivity: context.recentActivity,
      companyInformation: context.companyInformation,
      crmContext: context.crmContext,
      pinnedContext: context.pinnedContext,
    };
  }

  private async optional<T>(operation: () => Promise<T>, fallback: T = undefined as T): Promise<T> {
    try {
      return await operation();
    } catch {
      return fallback;
    }
  }

  private todayIn(timezone: string): string {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
    } catch {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: this.defaultTimezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
    }
  }
}
