import express from 'express';
import { pinoHttp } from 'pino-http';
import pino from 'pino';
import { config } from './config.js';
import { createAgentQueue } from './queue.js';
import { SqliteRepository } from './services/repository.js';
import { IdempotenceService } from './services/idempotence.js';
import { LockService } from './services/locks.js';
import { GithubService } from './services/github.js';
import { TrelloService } from './services/trello.js';
import { trelloWebhookRouter } from './routes/trelloWebhook.js';
const logger = pino({ name: 'orchestrator' });
const app = express();
app.use(express.json());
app.use(pinoHttp());
const repo = new SqliteRepository(config.dbPath);
const queue = createAgentQueue(config.redisUrl);
const idempotence = new IdempotenceService(repo);
const locks = new LockService(repo);
const github = new GithubService(config.githubApiUrl, config.githubToken, config.githubOwner, config.githubRepo);
const trello = new TrelloService(config.trelloBaseUrl, config.trelloKey, config.trelloToken);
app.get('/healthz', (_req, res) => res.json({ ok: true }));
app.use('/webhooks', trelloWebhookRouter({
    webhookSecret: config.webhookSecret,
    queue,
    idempotence,
    locks,
    github,
    trello,
    repoUrl: config.repoHttpUrl,
    prBaseBranch: config.repoDefaultBranch,
    trelloListInProgressId: config.trelloListInProgressId,
}));
app.listen(config.port, () => {
    logger.info({ port: config.port }, 'orchestrator started');
});
