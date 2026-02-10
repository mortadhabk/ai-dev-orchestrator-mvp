import Database from 'better-sqlite3';

export interface EventRepo {
  seen(actionId: string): boolean;
  markSeen(actionId: string): void;
}

export interface CardLockRepo {
  tryAcquire(cardId: string, ttlSeconds: number): boolean;
  release(cardId: string): void;
}

export class SqliteRepository implements EventRepo, CardLockRepo {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS events_seen (
        action_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS card_locks (
        card_id TEXT PRIMARY KEY,
        expires_at INTEGER NOT NULL
      );
    `);
  }

  seen(actionId: string): boolean {
    const row = this.db
      .prepare('SELECT action_id FROM events_seen WHERE action_id = ?')
      .get(actionId);
    return Boolean(row);
  }

  markSeen(actionId: string): void {
    this.db
      .prepare('INSERT OR IGNORE INTO events_seen(action_id) VALUES (?)')
      .run(actionId);
  }

  tryAcquire(cardId: string, ttlSeconds: number): boolean {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + ttlSeconds;
    this.db.prepare('DELETE FROM card_locks WHERE expires_at <= ?').run(now);
    const result = this.db
      .prepare(
        'INSERT OR IGNORE INTO card_locks(card_id, expires_at) VALUES (?, ?)',
      )
      .run(cardId, expiry);
    return result.changes === 1;
  }

  release(cardId: string): void {
    this.db.prepare('DELETE FROM card_locks WHERE card_id = ?').run(cardId);
  }
}
