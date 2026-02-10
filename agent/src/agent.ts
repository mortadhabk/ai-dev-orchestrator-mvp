import dotenv from 'dotenv';
import { appendFile, access, writeFile, mkdir } from 'node:fs/promises';
import pino from 'pino';
import { TrelloClient } from './trelloClient.js';
import { GithubClient } from './githubClient.js';
import { cloneAndCheckout, runGit } from './gitOps.js';

dotenv.config();
const logger = pino({ name: 'agent' });

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const required = [
    'JOB_ID',
    'AGENT_NAME',
    'CARD_ID',
    'BRANCH_NAME',
    'REPO_HTTP_URL',
    'GITHUB_TOKEN',
    'TRELLO_KEY',
    'TRELLO_TOKEN',
    'GITHUB_OWNER',
    'GITHUB_REPO',
  ];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing env var ${key}`);
    }
  }

  const workspace = '/workspace';
  await mkdir(workspace, { recursive: true });

  const trello = new TrelloClient(
    process.env.TRELLO_BASE_URL ?? 'https://api.trello.com/1',
    process.env.TRELLO_KEY as string,
    process.env.TRELLO_TOKEN as string,
  );
  const github = new GithubClient(
    process.env.GITHUB_API_URL ?? 'https://api.github.com',
    process.env.GITHUB_TOKEN as string,
    process.env.GITHUB_OWNER as string,
    process.env.GITHUB_REPO as string,
  );

  const card = await trello.getCard(process.env.CARD_ID as string);
  const repoDir = await cloneAndCheckout({
    repoHttpUrl: process.env.REPO_HTTP_URL as string,
    branch: process.env.BRANCH_NAME as string,
    workspace,
    token: process.env.GITHUB_TOKEN as string,
  });

  const readmePath = `${repoDir}/README.md`;
  const changelogPath = `${repoDir}/AI_CHANGELOG.md`;
  const shortCardId = (process.env.CARD_ID as string).slice(0, 8);
  const line = `- ${new Date().toISOString()} | ${process.env.AGENT_NAME} | card ${shortCardId} | ${card.name}`;

  if (await fileExists(readmePath)) {
    await appendFile(readmePath, `\n\n${line}\n`);
  } else {
    await writeFile(changelogPath, `# AI Changelog\n\n${line}\n`);
  }

  await runGit(['add', '.'], repoDir);
  await runGit(
    ['commit', '-m', `chore(${process.env.AGENT_NAME}): work on ${shortCardId}`],
    repoDir,
  );
  await runGit(['push', 'origin', process.env.BRANCH_NAME as string], repoDir);

  const prUrl = await github.createPullRequest({
    title: `[${shortCardId}] ${process.env.AGENT_NAME} - ${card.name}`,
    body: `Trello card: https://trello.com/c/${process.env.CARD_ID}\n\nAuto-generated MVP update by ${process.env.AGENT_NAME}.\n\nDescription:\n${card.desc || '(empty)'}`,
    base: process.env.PR_BASE_BRANCH ?? 'main',
    head: process.env.BRANCH_NAME as string,
  });

  logger.info({ prUrl }, 'agent completed');
  process.stdout.write(`${JSON.stringify({ prUrl })}\n`);
}

main().catch((error) => {
  logger.error({ err: error }, 'agent failed');
  process.exit(1);
});
