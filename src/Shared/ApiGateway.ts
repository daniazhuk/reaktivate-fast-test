import { API_BASE } from './config';

export interface HttpGateway {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, payload: unknown): Promise<T>;
}

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

type FetchFn = typeof fetch;

export default class ApiGateway implements HttpGateway {
  private readonly baseUrl: string;
  private readonly fetchFn: FetchFn;

  constructor(baseUrl: string = API_BASE, fetchFn: FetchFn = (...args) => fetch(...args)) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.fetchFn = fetchFn;
  }

  get = <T>(path: string): Promise<T> => this.request<T>(path, { method: 'GET' });

  post = <T>(path: string, payload: unknown): Promise<T> =>
    this.request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await this.fetchFn(`${this.baseUrl}${path}`, init);
    if (!response.ok) {
      throw new HttpError(response.status, `${init.method} ${path} failed with status ${response.status}`);
    }
    return (await response.json()) as T;
  }
}
