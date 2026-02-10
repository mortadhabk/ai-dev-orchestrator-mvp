import { withRetries, jsonRequest } from './http.js';

export class TrelloService {
  constructor(
    private readonly baseUrl: string,
    private readonly key: string,
    private readonly token: string,
  ) {}

  private url(path: string): string {
    const qp = `key=${this.key}&token=${this.token}`;
    return `${this.baseUrl}${path}${path.includes('?') ? '&' : '?'}${qp}`;
  }

  async addComment(cardId: string, text: string): Promise<void> {
    await withRetries(async () => {
      await jsonRequest({
        url: this.url(`/cards/${cardId}/actions/comments`),
        method: 'POST',
        body: { text },
      });
    });
  }

  async moveCard(cardId: string, listId: string): Promise<void> {
    await withRetries(async () => {
      await jsonRequest({
        url: this.url(`/cards/${cardId}`),
        method: 'PUT',
        body: { idList: listId },
      });
    });
  }
}
