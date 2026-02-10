import dotenv from 'dotenv';

dotenv.config();

const required = [
  'WEBHOOK_SECRET',
  'REDIS_URL',
  'GITHUB_TOKEN',
  'GITHUB_OWNER',
  'GITHUB_REPO',
  'TRELLO_KEY',
  'TRELLO_TOKEN',
  'TRELLO_LIST_INPROGRESS_ID',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing env var ${key}`);
  }
}

export const config = {
  port: Number(process.env.PORT ?? 8080),
  webhookSecret: process.env.WEBHOOK_SECRET as string,
  redisUrl: process.env.REDIS_URL as string,
  githubToken: process.env.GITHUB_TOKEN as string,
  githubOwner: process.env.GITHUB_OWNER as string,
  githubRepo: process.env.GITHUB_REPO as string,
  githubApiUrl: process.env.GITHUB_API_URL ?? 'https://api.github.com',
  repoDefaultBranch: process.env.PR_BASE_BRANCH ?? 'main',
  repoHttpUrl:
    process.env.REPO_HTTP_URL ??
    `https://github.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}.git`,
  trelloKey: process.env.TRELLO_KEY as string,
  trelloToken: process.env.TRELLO_TOKEN as string,
  trelloBaseUrl: process.env.TRELLO_BASE_URL ?? 'https://api.trello.com/1',
  trelloListInProgressId: process.env.TRELLO_LIST_INPROGRESS_ID as string,
  dbPath: process.env.SQLITE_PATH ?? '/data/orchestrator.db',
};
