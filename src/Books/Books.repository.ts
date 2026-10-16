import { makeAutoObservable, runInAction } from 'mobx';
import type { HttpGateway } from '@/Shared/ApiGateway';
import type UserStore from '@/Shared/Stores/User.store';
import type { AddBookDto, AddBookPm, BookDto, BookPm, BooksScope, BooksScopePm } from './Books.types';

const createScopePm = (): BooksScopePm => ({
  books: [],
  isLoading: false,
  isLoaded: false,
  hasError: false,
});

const toBookPm = (dto: BookDto, index: number): BookPm => ({
  // Books added through the API have no id, so fall back to a position-based key.
  id: dto.id === undefined ? `local-${index}` : String(dto.id),
  name: dto.name,
  author: dto.author,
});

/**
 * Shared source of truth for books. Holds one state slot per scope
 * ("all" / "private") so that several features (list, header counter)
 * observe the same data.
 */
export default class BooksRepository {
  readonly scopes: Record<BooksScope, BooksScopePm> = {
    all: createScopePm(),
    private: createScopePm(),
  };

  private readonly httpGateway: HttpGateway;
  private readonly userStore: UserStore;
  // Only the latest request per scope may write its result (last-request-wins).
  private readonly requestIds: Record<BooksScope, number> = { all: 0, private: 0 };

  constructor(httpGateway: HttpGateway, userStore: UserStore) {
    this.httpGateway = httpGateway;
    this.userStore = userStore;
    makeAutoObservable<this, 'httpGateway' | 'userStore' | 'requestIds'>(
      this,
      { httpGateway: false, userStore: false, requestIds: false },
      { autoBind: true },
    );
  }

  getScope(scope: BooksScope): BooksScopePm {
    return this.scopes[scope];
  }

  get privateBooksCount(): number {
    return this.scopes.private.books.length;
  }

  async getBooks(scope: BooksScope): Promise<void> {
    const requestId = ++this.requestIds[scope];
    const scopePm = this.scopes[scope];
    scopePm.isLoading = true;
    scopePm.hasError = false;

    try {
      const booksDto = await this.httpGateway.get<BookDto[]>(this.path(scope));
      if (requestId !== this.requestIds[scope]) return;
      // One batch: observers see a single "loading" -> "loaded" transition.
      runInAction(() => {
        scopePm.books = booksDto.map(toBookPm);
        scopePm.isLoaded = true;
        scopePm.isLoading = false;
      });
    } catch (error) {
      if (requestId !== this.requestIds[scope]) return;
      console.debug(`[BooksRepository] failed to load "${scope}" books`, error);
      runInAction(() => {
        scopePm.hasError = true;
        scopePm.isLoading = false;
      });
    }
  }

  /** Creates a book and refreshes both scopes. Throws if creation fails. */
  async addBook({ name, author }: AddBookPm): Promise<void> {
    const bookAddDto: AddBookDto = { name, author };
    await this.httpGateway.post(this.path('all'), bookAddDto);
    await Promise.all([this.getBooks('all'), this.getBooks('private')]);
  }

  private path(scope: BooksScope): string {
    const base = `/v1/books/${encodeURIComponent(this.userStore.userId)}`;
    return scope === 'private' ? `${base}/private` : base;
  }
}
