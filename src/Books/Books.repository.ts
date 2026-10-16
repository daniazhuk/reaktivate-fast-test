import { makeAutoObservable, runInAction } from 'mobx';
import type { HttpGateway } from '@/Shared/ApiGateway';
import { AddBookResponseDtoSchema, BooksDtoSchema, type AddBookDto, type BookDto } from './Books.dto';
import type { AddBookPm, BookPm, BooksScope, BooksScopePm } from './Books.pm';

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
export class BooksRepository {
  readonly scopes: Record<BooksScope, BooksScopePm> = {
    all: createScopePm(),
    private: createScopePm(),
  };

  private readonly httpGateway: HttpGateway;
  private readonly userId: string;
  // Only the latest request per scope may write its result (last-request-wins).
  private readonly requestIds: Record<BooksScope, number> = { all: 0, private: 0 };

  constructor(httpGateway: HttpGateway, userId: string) {
    this.httpGateway = httpGateway;
    this.userId = userId;
    makeAutoObservable<this, 'httpGateway' | 'userId' | 'requestIds'>(
      this,
      { httpGateway: false, userId: false, requestIds: false },
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
      const booksDto = BooksDtoSchema.parse(await this.httpGateway.get<unknown>(this.path(scope)));
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

  /** Creates a book and refreshes both scopes. Throws if the API does not confirm creation. */
  async addBook({ name, author }: AddBookPm): Promise<void> {
    const bookAddDto: AddBookDto = { name, author };
    AddBookResponseDtoSchema.parse(await this.httpGateway.post<unknown>(this.path('all'), bookAddDto));
    await Promise.all([this.getBooks('all'), this.getBooks('private')]);
  }

  private path(scope: BooksScope): string {
    const base = `/v1/books/${encodeURIComponent(this.userId)}`;
    return scope === 'private' ? `${base}/private` : base;
  }
}
