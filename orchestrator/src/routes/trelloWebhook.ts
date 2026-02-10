import { Router } from 'express';
import pino from 'pino';
import { Queue } from 'bullmq';
import { AgentJobPayload, AgentName } from '../queue.js';
import { IdempotenceService } from '../services/idempotence.js';
import { LockService } from '../services/locks.js';
import { GithubService } from '../services/github.js';
import { TrelloService } from '../services/trello.js';

const logger = pino({ name: 'trello-webhook' });
const AGENTS: AgentName[] = ['ai-backend', 'ai-frontend', 'ai-devops'];

function detectAgent(commentText: string): AgentName | null {
  const lowered = commentText.toLowerCase();
  return AGENTS.find((agent) => lowered.includes(`@${agent}`)) ?? null;
}

function getShortCardId(cardId: string): string {
  return cardId.slice(0, 8);
}

export function trelloWebhookRouter(deps: {
  webhookSecret: string;
  queue: Queue<AgentJobPayload>;
  idempotence: IdempotenceService;
  locks: LockService;
  github: GithubService;
  trello: TrelloService;
  repoUrl: string;
  prBaseBranch: string;
  trelloListInProgressId: string;
}) {
  const router = Router();

  router.post('/trello', async (req, res) => {
    try {
      const provided = req.header('x-webhook-secret');
      if (provided !== deps.webhookSecret) {
        return res.status(401).json({ error: 'invalid secret' });
      }

      const action = req.body?.action;
      if (!action || action.type !== 'commentCard') {
        return res.status(200).json({ ignored: true, reason: 'not commentCard' });
      }

      const actionId = String(action.id ?? '');
      if (!actionId) {
        return res.status(400).json({ error: 'missing action.id' });
      }
      if (deps.idempotence.hasSeen(actionId)) {
        return res.status(200).json({ ok: true, duplicate: true });
      }

      const cardId = String(action.data?.card?.id ?? '');
      const boardId = String(action.data?.board?.id ?? '');
      const listId = String(action.data?.list?.id ?? '');
      const text = String(action.data?.text ?? '');
      const agent = detectAgent(text);

      if (!cardId || !boardId || !listId || !agent) {
        return res.status(200).json({ ignored: true, reason: 'no agent mention or missing IDs' });
      }

      if (!deps.locks.acquire(cardId, 900)) {
        return res.status(200).json({ ignored: true, reason: 'card lock already held' });
      }

      const timestamp = Date.now();
      const shortCardId = getShortCardId(cardId);
      const branch = `feature/${shortCardId}-${agent}-${timestamp}`;

      await deps.github.createBranch(branch, deps.prBaseBranch);
      await deps.trello.addComment(
        cardId,
        `✅ Job démarré par ${agent}. Branch: ${branch}`,
      );
      await deps.trello.moveCard(cardId, deps.trelloListInProgressId);
      await deps.queue.add('agent-job', {
        agent,
        cardId,
        branch,
        repoUrl: deps.repoUrl,
        prBaseBranch: deps.prBaseBranch,
      });

      deps.idempotence.markSeen(actionId);
      logger.info({ cardId, actionId, branch, agent }, 'job enqueued');
      return res.status(200).json({ ok: true, enqueued: true });
    } catch (error) {
      logger.error({ err: error }, 'failed to process webhook');
      return res.status(500).json({ error: 'internal error' });
    }
  });

  return router;
}
