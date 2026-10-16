import { BooksRepository } from '@/Books/Books.repository';
import type { HttpGateway } from '@/Shared/ApiGateway';

export type AppStores = {
  booksRepository: BooksRepository;
};

type Dependencies = {
  gateway: HttpGateway;
  userId: string;
};

/** Composition root: the only place where app-wide singletons are wired. */
export function createAppStores({ gateway, userId }: Dependencies): AppStores {
  return { booksRepository: new BooksRepository(gateway, userId) };
}
