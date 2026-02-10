import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function runGit(args: string[], cwd: string): Promise<void> {
  await execFileAsync('git', args, { cwd });
}

export async function cloneAndCheckout(opts: {
  repoHttpUrl: string;
  branch: string;
  workspace: string;
  token: string;
}): Promise<string> {
  const repoUrlWithToken = opts.repoHttpUrl.replace(
    'https://',
    `https://x-access-token:${opts.token}@`,
  );
  const repoDir = `${opts.workspace}/repo`;
  await runGit(['clone', repoUrlWithToken, repoDir], opts.workspace);
  await runGit(['checkout', opts.branch], repoDir);
  await runGit(['config', 'user.email', 'ai-agent@example.local'], repoDir);
  await runGit(['config', 'user.name', 'AI Agent'], repoDir);
  return repoDir;
}
