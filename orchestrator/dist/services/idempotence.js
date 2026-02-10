export class IdempotenceService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    hasSeen(actionId) {
        return this.repo.seen(actionId);
    }
    markSeen(actionId) {
        this.repo.markSeen(actionId);
    }
}
