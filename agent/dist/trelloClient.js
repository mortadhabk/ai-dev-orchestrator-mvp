import { request } from 'undici';
export class TrelloClient {
    baseUrl;
    key;
    token;
    constructor(baseUrl, key, token) {
        this.baseUrl = baseUrl;
        this.key = key;
        this.token = token;
    }
    async getCard(cardId) {
        const url = `${this.baseUrl}/cards/${cardId}?key=${this.key}&token=${this.token}&checklists=all`;
        const response = await request(url);
        const body = await response.body.text();
        if (response.statusCode >= 400) {
            throw new Error(`Trello get card failed: ${response.statusCode} ${body}`);
        }
        return JSON.parse(body);
    }
}
