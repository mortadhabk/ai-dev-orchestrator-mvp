import { request } from 'undici';
export class TrelloReporter {
    baseUrl;
    key;
    token;
    constructor(baseUrl, key, token) {
        this.baseUrl = baseUrl;
        this.key = key;
        this.token = token;
    }
    url(path) {
        return `${this.baseUrl}${path}?key=${this.key}&token=${this.token}`;
    }
    async comment(cardId, text) {
        const response = await request(this.url(`/cards/${cardId}/actions/comments`), {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ text }),
        });
        if (response.statusCode >= 400) {
            throw new Error(`Trello comment failed: ${response.statusCode}`);
        }
    }
    async move(cardId, listId) {
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
