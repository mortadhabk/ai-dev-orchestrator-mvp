import { request } from 'undici';
export class GithubClient {
    apiUrl;
    token;
    owner;
    repo;
    constructor(apiUrl, token, owner, repo) {
        this.apiUrl = apiUrl;
        this.token = token;
        this.owner = owner;
        this.repo = repo;
    }
    async createPullRequest(input) {
        const response = await request(`${this.apiUrl}/repos/${this.owner}/${this.repo}/pulls`, {
            method: 'POST',
            headers: {
                authorization: `Bearer ${this.token}`,
                'content-type': 'application/json',
                accept: 'application/vnd.github+json',
                'user-agent': 'ai-dev-orchestrator-mvp-agent',
            },
            body: JSON.stringify(input),
        });
        const text = await response.body.text();
        if (response.statusCode >= 400) {
            throw new Error(`GitHub PR failed: ${response.statusCode} ${text}`);
        }
        const parsed = JSON.parse(text);
        return parsed.html_url;
    }
}
