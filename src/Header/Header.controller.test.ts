import { createTestStores, flushPromises, TEST_USER } from '@/Test/createTestStores';
import { BooksListController } from '@/Books/BooksList/BooksList.controller';
import { HeaderController } from './Header.controller';

const setup = () => {
  const stores = createTestStores();
  const controller = HeaderController.create(stores);
  return { ...stores, controller };
};

describe('HeaderController', () => {
  it('shows a placeholder until private books are loaded', () => {
    const { controller } = setup();

    expect(controller.counterLabel).toBe('Your books: …');
    expect(controller.isRetryHidden).toBe(true);
  });

  it('shows a dash and offers retry when the count cannot be loaded', async () => {
    const { controller, gateway } = setup();
    gateway.failNext();

    controller.mount();
    await flushPromises();

    expect(controller.counterLabel).toBe('Your books: —');
    expect(controller.isRetryHidden).toBe(false);

    controller.retry();
    await flushPromises();

    expect(controller.counterLabel).toBe('Your books: 0');
    expect(controller.isRetryHidden).toBe(true);
  });

  it('keeps the last known count when a refresh fails', async () => {
    const { controller, booksRepository, gateway } = setup();
    controller.mount();
    await flushPromises();
    gateway.failNext();

    await booksRepository.getBooks('private');

    expect(controller.counterLabel).toBe('Your books: 0');
    expect(controller.isRetryHidden).toBe(true);
  });

  it('loads private books on mount and shows their count', async () => {
    const { controller, gateway } = setup();
    gateway.seedPrivate(TEST_USER, [
      { name: 'A', author: 'A' },
      { name: 'B', author: 'B' },
    ]);

    controller.mount();
    await flushPromises();

    expect(gateway.requests).toEqual([{ method: 'GET', path: `/v1/books/${TEST_USER}/private` }]);
    expect(controller.counterLabel).toBe('Your books: 2');
  });

  it('updates the counter after a book is added anywhere in the app', async () => {
    const { controller, booksRepository } = setup();
    controller.mount();
    await flushPromises();
    expect(controller.counterLabel).toBe('Your books: 0');

    await booksRepository.addBook({ name: 'Dune', author: 'Frank Herbert' });

    expect(controller.counterLabel).toBe('Your books: 1');
  });

  it.each(['all', 'private'] as const)(
    'keeps the counter correct while the list shows "%s"',
    async (scope) => {
      const stores = createTestStores();
      stores.gateway.seedPrivate(TEST_USER, [{ name: 'Mine', author: 'Me' }]);
      const header = HeaderController.create(stores);
      const list = BooksListController.create(stores);
      list.selectScope(scope);
      header.mount();
      list.mount();
      await flushPromises();
      expect(header.counterLabel).toBe('Your books: 1');

      await stores.booksRepository.addBook({ name: 'Dune', author: 'Frank Herbert' });

      expect(header.counterLabel).toBe('Your books: 2');
      expect(list.books).toHaveLength(scope === 'all' ? 4 : 2);
      list.unmount();
    },
  );
});
