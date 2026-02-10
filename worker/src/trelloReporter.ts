import { request } from 'undici';

export class TrelloReporter {
  constructor(
    private readonly baseUrl: string,
    private readonly key: string,
    private readonly token: string,
  ) {}

  private url(path: string): string {
    return `${this.baseUrl}${path}?key=${this.key}&token=${this.token}`;
  }

  async comment(cardId: string, text: string): Promise<void> {
    const response = await request(this.url(`/cards/${cardId}/actions/comments`), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (response.statusCode >= 400) {
      throw new Error(`Trello comment failed: ${response.statusCode}`);
    }
  }

  async move(cardId: string, listId: string): Promise<void> {
    const response = await request(this.url(`/cards/${cardId}`), {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idList: listId }),
    });
    if (response.statusCode >= 400) {
      throw new Error(`Trello move failed: ${response.statusCode}`);
    }
  }
}
