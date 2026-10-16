import { createTestStores, flushPromises, TEST_USER } from '@/Test/createTestStores';
import HeaderController from './Header.controller';

const setup = () => {
  const stores = createTestStores();
  const controller = HeaderController.create(stores);
  return { ...stores, controller };
};

describe('HeaderController', () => {
  it('shows a placeholder until private books are loaded', () => {
    const { controller } = setup();

    expect(controller.counterLabel).toBe('Your books: …');
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
});
