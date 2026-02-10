import { Queue } from 'bullmq';

export type AgentName = 'ai-backend' | 'ai-frontend' | 'ai-devops';

export type AgentJobPayload = {
  agent: AgentName;
  cardId: string;
  branch: string;
  repoUrl: string;
  prBaseBranch: string;
};

export function createAgentQueue(redisUrl: string): Queue<AgentJobPayload> {
  return new Queue<AgentJobPayload>('agent-jobs', {
    connection: {
      url: redisUrl,
    },
  });
}
