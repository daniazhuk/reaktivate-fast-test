import type { BookDto } from '@/Books/Books.dto';
import { HttpError, type HttpGateway } from '@/Shared/ApiGateway';

type Request = { method: string; path: string; payload?: unknown };

const BOOKS_PATH = /^\/v1\/books\/([^/]+)(\/private)?$/;

export const SHARED_BOOKS: BookDto[] = [
  { id: 111, name: 'Wind in the willows', ownerId: 'postnikov', author: 'Kenneth Graeme' },
  { id: 121, name: 'I, Robot', ownerId: 'postnikov', author: 'Isaac Asimov' },
];

/**
 * In-memory implementation of the books API with the same semantics as the real one:
 * "all" = shared books + user's books, "private" = user's books only.
 * Can pause responses and fail requests to drive async states in tests.
 */
export class FakeBooksGateway implements HttpGateway {
  readonly requests: Request[] = [];
  private readonly ownBooks = new Map<string, BookDto[]>();
  private failures = 0;
  private nextBody: { body: unknown } | null = null;
  private paused: Promise<void> | null = null;
  private release: (() => void) | null = null;

  seedPrivate(user: string, books: BookDto[]): void {
    this.ownBooks.set(user, [...books]);
  }

  /** Makes the next `count` requests fail with HTTP 500. */
  failNext(count = 1): void {
    this.failures = count;
  }

  /** Replaces the body of the next response, e.g. with a malformed payload. */
  respondNextWith(body: unknown): void {
    this.nextBody = { body };
  }

  /** Holds every response until `resume()` is called. */
  pause(): void {
    this.paused = new Promise((resolve) => (this.release = resolve));
  }

  resume(): void {
    this.release?.();
    this.paused = null;
    this.release = null;
  }

  get = <T>(path: string): Promise<T> =>
    this.handle<T>({ method: 'GET', path }, ([, user, isPrivate]) => {
      const own = this.ownBooks.get(user) ?? [];
      return isPrivate ? own : [...SHARED_BOOKS, ...own];
    });

  post = <T>(path: string, payload: unknown): Promise<T> =>
    this.handle<T>({ method: 'POST', path, payload }, ([, user, isPrivate]) => {
      if (isPrivate) throw new HttpError(404, 'Cannot POST to /private');
      this.ownBooks.set(user, [...(this.ownBooks.get(user) ?? []), payload as BookDto]);
      return { status: 'ok' };
    });

  private async handle<T>(request: Request, respond: (match: RegExpMatchArray) => unknown): Promise<T> {
    this.requests.push(request);
    const paused = this.paused;
    if (paused) await paused;

    if (this.failures > 0) {
      this.failures -= 1;
      throw new HttpError(500, `${request.method} ${request.path} failed`);
    }

    if (this.nextBody) {
      const { body } = this.nextBody;
      this.nextBody = null;
      return body as T;
    }

    const match = request.path.match(BOOKS_PATH);
    if (!match) throw new HttpError(404, `Unknown path ${request.path}`);
    return structuredClone(respond(match)) as T;
  }
}
