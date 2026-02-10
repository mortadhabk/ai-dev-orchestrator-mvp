import dotenv from 'dotenv';
import { Worker } from 'bullmq';
import pino from 'pino';
import { runAgentContainer } from './dockerRunner.js';
import { TrelloReporter } from './trelloReporter.js';

dotenv.config();
const logger = pino({ name: 'worker' });

const redisUrl = process.env.REDIS_URL as string;
const trello = new TrelloReporter(
  process.env.TRELLO_BASE_URL ?? 'https://api.trello.com/1',
  process.env.TRELLO_KEY as string,
  process.env.TRELLO_TOKEN as string,
);

const worker = new Worker(
  'agent-jobs',
  async (job) => {
    const jobId = String(job.id);
    const data = job.data as {
      agent: string;
      cardId: string;
      branch: string;
      repoUrl: string;
      prBaseBranch: string;
    };

    logger.info({ jobId, data }, 'starting agent job');

    const result = await runAgentContainer({
      jobId,
      image: process.env.AGENT_IMAGE ?? 'ai-dev-orchestrator-agent:latest',
      env: {
        JOB_ID: jobId,
        AGENT_NAME: data.agent,
        CARD_ID: data.cardId,
        BRANCH_NAME: data.branch,
        REPO_HTTP_URL: data.repoUrl,
        GITHUB_TOKEN: process.env.GITHUB_TOKEN as string,
        TRELLO_KEY: process.env.TRELLO_KEY as string,
        TRELLO_TOKEN: process.env.TRELLO_TOKEN as string,
        TRELLO_BASE_URL: process.env.TRELLO_BASE_URL ?? 'https://api.trello.com/1',
        GITHUB_API_URL: process.env.GITHUB_API_URL ?? 'https://api.github.com',
        GITHUB_OWNER: process.env.GITHUB_OWNER as string,
        GITHUB_REPO: process.env.GITHUB_REPO as string,
        PR_BASE_BRANCH: data.prBaseBranch,
        TRELLO_LIST_REVIEW_ID: process.env.TRELLO_LIST_REVIEW_ID as string,
      },
    });

    logger.info({ jobId, output: result.output }, 'agent output');

    if (!result.success) {
      await trello.comment(data.cardId, `❌ Échec job ${jobId}. Consulte les logs.`);
      if (process.env.TRELLO_LIST_BLOCKED_ID) {
        await trello.move(data.cardId, process.env.TRELLO_LIST_BLOCKED_ID);
      }
      throw new Error('agent failed');
    }

    const jsonLine = result.output
      .split('\n')
      .find((line) => line.trim().startsWith('{') && line.includes('prUrl'));
    const prUrl = jsonLine ? JSON.parse(jsonLine).prUrl : 'PR créée (URL introuvable)';

    await trello.comment(data.cardId, `✅ PR créée: ${prUrl}`);
    await trello.move(data.cardId, process.env.TRELLO_LIST_REVIEW_ID as string);
    return { prUrl };
  },
  { connection: { url: redisUrl } },
);

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'job failed');
});

worker.on('completed', (job, result) => {
  logger.info({ jobId: job.id, result }, 'job completed');
});
