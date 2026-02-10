export class LockService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    acquire(cardId, ttlSeconds = 600) {
        return this.repo.tryAcquire(cardId, ttlSeconds);
    }
    release(cardId) {
        this.repo.release(cardId);
    }
}
