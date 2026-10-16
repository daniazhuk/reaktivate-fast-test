import BooksRepository from '@/Books/Books.repository';
import type { HttpGateway } from '@/Shared/ApiGateway';
import UserStore from './User.store';

export type AppStores = {
  userStore: UserStore;
  booksRepository: BooksRepository;
};

type Dependencies = {
  gateway: HttpGateway;
  userId: string;
};

/** Composition root: the only place where app-wide singletons are wired. */
export function createAppStores({ gateway, userId }: Dependencies): AppStores {
  const userStore = new UserStore(userId);
  const booksRepository = new BooksRepository(gateway, userStore);
  return { userStore, booksRepository };
}
