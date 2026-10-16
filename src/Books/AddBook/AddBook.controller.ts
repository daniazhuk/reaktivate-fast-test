import { makeAutoObservable, runInAction } from 'mobx';
import type { BooksRepository } from '@/Books/Books.repository';
import type { AppStores } from '@/Shared/Stores/createAppStores';
import type { ChangeEventLike, SubmitEventLike } from '@/Shared/Events.types';

/** Has no subscriptions or resources to release, hence no mount/unmount. */
export class AddBookController {
  static create = ({ booksRepository }: AppStores) => new AddBookController(booksRepository);

  readonly formLabel = 'Add book';
  readonly nameLabel = 'Name';
  readonly authorLabel = 'Author';
  readonly errorText = 'Could not add the book. Please try again.';

  name = '';
  author = '';
  isSubmitting = false;
  hasError = false;

  private readonly booksRepository: BooksRepository;

  constructor(booksRepository: BooksRepository) {
    this.booksRepository = booksRepository;
    makeAutoObservable<this, 'booksRepository'>(this, { booksRepository: false }, { autoBind: true });
  }

  get isSubmitDisabled(): boolean {
    return this.isSubmitting || !this.name.trim() || !this.author.trim();
  }

  get submitLabel(): string {
    return this.isSubmitting ? 'Adding…' : 'Add';
  }

  get isErrorHidden(): boolean {
    return !this.hasError;
  }

  onNameChange(event: ChangeEventLike): void {
    this.name = event.target.value;
    this.hasError = false;
  }

  onAuthorChange(event: ChangeEventLike): void {
    this.author = event.target.value;
    this.hasError = false;
  }

  /** Form handler: submit progress and errors are exposed via `isSubmitting` / `hasError`. */
  onSubmit(event: SubmitEventLike): void {
    event.preventDefault();
    void this.submit();
  }

  async submit(): Promise<void> {
    if (this.isSubmitDisabled) return;

    this.isSubmitting = true;
    this.hasError = false;

    try {
      await this.booksRepository.addBook({ name: this.name.trim(), author: this.author.trim() });
      runInAction(() => {
        this.name = '';
        this.author = '';
        this.isSubmitting = false;
      });
    } catch (error) {
      console.debug('[AddBookController] failed to add book', error);
      runInAction(() => {
        this.hasError = true;
        this.isSubmitting = false;
      });
    }
  }
}
