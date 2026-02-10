import { EventRepo } from './repository.js';

export class IdempotenceService {
  constructor(private readonly repo: EventRepo) {}

  hasSeen(actionId: string): boolean {
    return this.repo.seen(actionId);
  }

  markSeen(actionId: string): void {
    this.repo.markSeen(actionId);
  }
}
