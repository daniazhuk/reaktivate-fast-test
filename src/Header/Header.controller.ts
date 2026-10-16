import { makeAutoObservable } from 'mobx';
import type { BooksRepository } from '@/Books/Books.repository';
import type { Controller } from '@/Shared/Lifecycle/Controller';
import type { AppStores } from '@/Shared/Stores/createAppStores';

export class HeaderController implements Controller {
  static create = ({ booksRepository }: AppStores) => new HeaderController(booksRepository);

  readonly title = 'Books';
  readonly retryLabel = 'Retry';

  private readonly booksRepository: BooksRepository;

  constructor(booksRepository: BooksRepository) {
    this.booksRepository = booksRepository;
    makeAutoObservable<this, 'booksRepository'>(this, { booksRepository: false }, { autoBind: true });
  }

  get counterLabel(): string {
    return `Your books: ${this.counterValue}`;
  }

  /** Retry is offered only when there is no count to show at all. */
  get isRetryHidden(): boolean {
    const { hasError, isLoaded } = this.booksRepository.getScope('private');
    return !hasError || isLoaded;
  }

  retry(): void {
    this.load();
  }

  mount(): void {
    this.load();
  }

  private get counterValue(): string {
    const { isLoaded, hasError } = this.booksRepository.getScope('private');
    if (isLoaded) return String(this.booksRepository.privateBooksCount);
    return hasError ? '—' : '…';
  }

  private load(): void {
    void this.booksRepository.getBooks('private');
  }
}
