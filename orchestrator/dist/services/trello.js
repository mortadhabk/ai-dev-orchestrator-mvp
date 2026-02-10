import { withRetries, jsonRequest } from './http.js';
export class TrelloService {
    baseUrl;
    key;
    token;
    constructor(baseUrl, key, token) {
        this.baseUrl = baseUrl;
        this.key = key;
        this.token = token;
    }
    url(path) {
        const qp = `key=${this.key}&token=${this.token}`;
        return `${this.baseUrl}${path}${path.includes('?') ? '&' : '?'}${qp}`;
    }
    async addComment(cardId, text) {
        await withRetries(async () => {
            await jsonRequest({
                url: this.url(`/cards/${cardId}/actions/comments`),
                method: 'POST',
                body: { text },
            });
        });
    }
    async moveCard(cardId, listId) {
        await withRetries(async () => {
            await jsonRequest({
                url: this.url(`/cards/${cardId}`),
                method: 'PUT',
                body: { idList: listId },
            });
        });
    }
}
