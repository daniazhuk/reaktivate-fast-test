import { makeAutoObservable, reaction } from 'mobx';
import type { BooksScope, BooksScopePm } from '@/Books/Books.types';
import type BooksRepository from '@/Books/Books.repository';
import type { TabVm } from '@/Shared/Components/Tabs';
import type { Controller } from '@/Shared/Lifecycle/Controller';
import { DisposerBag } from '@/Shared/Lifecycle/DisposerBag';
import type { AppStores } from '@/Shared/Stores/createAppStores';

export type BookVm = {
  id: string;
  label: string;
};

const SCOPE_LABELS: Record<BooksScope, string> = {
  all: 'All books',
  private: 'Private books',
};

const EMPTY_TEXTS: Record<BooksScope, string> = {
  all: 'No books yet.',
  private: 'You have no private books yet.',
};

const SCOPES = Object.keys(SCOPE_LABELS) as BooksScope[];

export default class BooksListController implements Controller {
  static create = ({ booksRepository }: AppStores) => new BooksListController(booksRepository);

  readonly tabsLabel = 'Books filter';
  readonly retryLabel = 'Retry';

  scope: BooksScope = 'all';

  private readonly booksRepository: BooksRepository;
  private readonly disposers = new DisposerBag();

  constructor(booksRepository: BooksRepository) {
    this.booksRepository = booksRepository;
    makeAutoObservable<this, 'booksRepository' | 'disposers'>(
      this,
      { booksRepository: false, disposers: false },
      { autoBind: true },
    );
  }

  get tabs(): TabVm[] {
    return SCOPES.map((scope) => ({
      key: scope,
      label: SCOPE_LABELS[scope],
      isActive: scope === this.scope,
      select: () => this.selectScope(scope),
    }));
  }

  get books(): BookVm[] {
    return this.scopePm.books.map((book) => ({
      id: book.id,
      label: `${book.author}: ${book.name}`,
    }));
  }

  /** Loading / error / empty message; an empty string means "nothing to show". */
  get statusText(): string {
    const { isLoading, isLoaded, hasError, books } = this.scopePm;
    if (hasError) return 'Failed to load books.';
    if (isLoading && !isLoaded) return 'Loading books…';
    if (isLoaded && !isLoading && books.length === 0) return EMPTY_TEXTS[this.scope];
    return '';
  }

  get isStatusHidden(): boolean {
    return this.statusText === '';
  }

  get isRetryHidden(): boolean {
    return !this.scopePm.hasError;
  }

  selectScope(scope: BooksScope): void {
    this.scope = scope;
  }

  retry(): void {
    void this.booksRepository.getBooks(this.scope);
  }

  mount(): void {
    this.disposers.add(
      reaction(
        () => this.scope,
        (scope) => void this.booksRepository.getBooks(scope),
        { fireImmediately: true },
      ),
    );
  }

  unmount(): void {
    this.disposers.dispose();
  }

  private get scopePm(): BooksScopePm {
    return this.booksRepository.getScope(this.scope);
  }
}
