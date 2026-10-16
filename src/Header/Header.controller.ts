import { makeAutoObservable } from 'mobx';
import type BooksRepository from '@/Books/Books.repository';
import type { Controller } from '@/Shared/Lifecycle/Controller';
import type { AppStores } from '@/Shared/Stores/createAppStores';

export default class HeaderController implements Controller {
  static create = ({ booksRepository }: AppStores) => new HeaderController(booksRepository);

  readonly title = 'Books';

  private readonly booksRepository: BooksRepository;

  constructor(booksRepository: BooksRepository) {
    this.booksRepository = booksRepository;
    makeAutoObservable<this, 'booksRepository'>(this, { booksRepository: false }, { autoBind: true });
  }

  get counterLabel(): string {
    const { isLoaded } = this.booksRepository.getScope('private');
    const count = isLoaded ? String(this.booksRepository.privateBooksCount) : '…';
    return `Your books: ${count}`;
  }

  mount(): void {
    void this.booksRepository.getBooks('private');
  }
}
