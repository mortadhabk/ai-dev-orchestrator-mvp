import { CardLockRepo } from './repository.js';

export class LockService {
  constructor(private readonly repo: CardLockRepo) {}

  acquire(cardId: string, ttlSeconds = 600): boolean {
    return this.repo.tryAcquire(cardId, ttlSeconds);
  }

  release(cardId: string): void {
    this.repo.release(cardId);
  }
}
