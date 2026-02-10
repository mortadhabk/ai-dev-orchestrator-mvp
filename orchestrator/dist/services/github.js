import { withRetries, jsonRequest } from './http.js';
export class GithubService {
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
    headers() {
        return {
            authorization: `Bearer ${this.token}`,
            'user-agent': 'ai-dev-orchestrator-mvp',
            accept: 'application/vnd.github+json',
        };
    }
    async getRef(branch) {
        const result = await withRetries(() => jsonRequest({
            url: `${this.apiUrl}/repos/${this.owner}/${this.repo}/git/ref/heads/${branch}`,
            headers: this.headers(),
        }));
        return result.object.sha;
    }
    async createBranch(branchName, baseBranch) {
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
