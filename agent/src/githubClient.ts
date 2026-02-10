import { request } from 'undici';

export class GithubClient {
  constructor(
    private readonly apiUrl: string,
    private readonly token: string,
    private readonly owner: string,
    private readonly repo: string,
  ) {}

  async createPullRequest(input: {
    title: string;
    body: string;
    base: string;
    head: string;
  }): Promise<string> {
    const response = await request(
      `${this.apiUrl}/repos/${this.owner}/${this.repo}/pulls`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.token}`,
          'content-type': 'application/json',
          accept: 'application/vnd.github+json',
          'user-agent': 'ai-dev-orchestrator-mvp-agent',
        },
        body: JSON.stringify(input),
      },
    );
    const text = await response.body.text();
    if (response.statusCode >= 400) {
      throw new Error(`GitHub PR failed: ${response.statusCode} ${text}`);
    }
    const parsed = JSON.parse(text) as { html_url: string };
    return parsed.html_url;
  }
}
