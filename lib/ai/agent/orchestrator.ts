import { OrvionAgent, type AgentDependencies, type AgentRequest } from "./agent";
import type { AgentResponse } from "./response";

export interface AgentExecution {
  response: AgentResponse;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
}

export class AgentOrchestrator {
  private readonly agent: OrvionAgent;

  public constructor(dependencies: AgentDependencies | OrvionAgent) {
    this.agent = dependencies instanceof OrvionAgent ? dependencies : new OrvionAgent(dependencies);
  }

  public async execute(request: AgentRequest): Promise<AgentExecution> {
    const startedAt = new Date();
    const response = await this.agent.run(request);
    const completedAt = new Date();
    return {
      response,
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
    };
  }

  public async respond(request: AgentRequest): Promise<AgentResponse> {
    return (await this.execute(request)).response;
  }
}
