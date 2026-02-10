import { withRetries, jsonRequest } from './http.js';

export class GithubService {
  constructor(
    private readonly apiUrl: string,
    private readonly token: string,
    private readonly owner: string,
    private readonly repo: string,
  ) {}

  private headers(): Record<string, string> {
    return {
      authorization: `Bearer ${this.token}`,
      'user-agent': 'ai-dev-orchestrator-mvp',
      accept: 'application/vnd.github+json',
    };
  }

  async getRef(branch: string): Promise<string> {
    const result = await withRetries(() =>
      jsonRequest<{ object: { sha: string } }>({
        url: `${this.apiUrl}/repos/${this.owner}/${this.repo}/git/ref/heads/${branch}`,
        headers: this.headers(),
      }),
    );
    return result.object.sha;
  }

  async createBranch(branchName: string, baseBranch: string): Promise<void> {
    const sha = await this.getRef(baseBranch);
    await withRetries(async () => {
      await jsonRequest({
        url: `${this.apiUrl}/repos/${this.owner}/${this.repo}/git/refs`,
        method: 'POST',
        headers: this.headers(),
        body: { ref: `refs/heads/${branchName}`, sha },
      });
    });
  }
}
