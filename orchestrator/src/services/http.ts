import { request } from 'undici';

export async function withRetries<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 300,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  throw lastErr;
}

export async function jsonRequest<T>(opts: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}): Promise<T> {
  const { url, method = 'GET', headers = {}, body } = opts;
  const response = await request(url, {
    method: method as any,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.body.text();
  if (response.statusCode >= 400) {
    throw new Error(`HTTP ${response.statusCode} ${url}: ${text}`);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}
