import { request } from 'undici';

export type TrelloCard = { id: string; name: string; desc: string };

export class TrelloClient {
  constructor(
    private readonly baseUrl: string,
    private readonly key: string,
    private readonly token: string,
  ) {}

  async getCard(cardId: string): Promise<TrelloCard> {
    const url = `${this.baseUrl}/cards/${cardId}?key=${this.key}&token=${this.token}&checklists=all`;
    const response = await request(url);
    const body = await response.body.text();
    if (response.statusCode >= 400) {
      throw new Error(`Trello get card failed: ${response.statusCode} ${body}`);
    }
    return JSON.parse(body) as TrelloCard;
  }
}
