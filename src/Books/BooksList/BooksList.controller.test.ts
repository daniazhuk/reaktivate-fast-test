import { reaction } from 'mobx';
import { createTestStores, flushPromises, TEST_USER } from '@/Test/createTestStores';
import { BooksListController } from './BooksList.controller';

const setup = () => {
  const stores = createTestStores();
  const controller = BooksListController.create(stores);
  return { ...stores, controller };
};

describe('BooksListController', () => {
  it('shows "All books" tab as active by default', () => {
    const { controller } = setup();

    expect(controller.tabs.map(({ key, label, isActive }) => ({ key, label, isActive }))).toEqual([
      { key: 'all', label: 'All books', isActive: true },
      { key: 'private', label: 'Private books', isActive: false },
    ]);
  });

  it('loads all books on mount and shows them as "author: name"', async () => {
    const { controller, gateway } = setup();

    controller.mount();
    expect(controller.statusText).toBe('Loading books…');
    expect(controller.isStatusHidden).toBe(false);
    await flushPromises();

    expect(gateway.requests).toEqual([{ method: 'GET', path: `/v1/books/${TEST_USER}` }]);
    expect(controller.isStatusHidden).toBe(true);
    expect(controller.books).toEqual([
      { id: '111', label: 'Kenneth Graeme: Wind in the willows' },
      { id: '121', label: 'Isaac Asimov: I, Robot' },
    ]);
  });

  it('switches to private books when the private tab is selected', async () => {
    const { controller, gateway } = setup();
    gateway.seedPrivate(TEST_USER, [{ name: 'Mine', author: 'Me' }]);
    controller.mount();
    await flushPromises();

    controller.tabs[1].select();
    await flushPromises();

    expect(controller.scope).toBe('private');
    expect(controller.tabs.map((tab) => tab.isActive)).toEqual([false, true]);
    expect(gateway.requests.at(-1)?.path).toBe(`/v1/books/${TEST_USER}/private`);
    expect(controller.books).toEqual([{ id: 'local-0', label: 'Me: Mine' }]);
  });

  it('keeps tabs mutually exclusive', () => {
    const { controller } = setup();

    controller.selectScope('private');
    controller.selectScope('all');

    expect(controller.tabs.filter((tab) => tab.isActive)).toHaveLength(1);
    expect(controller.scope).toBe('all');
  });

  it('shows an empty state for a scope without books', async () => {
    const { controller } = setup();
    controller.selectScope('private');
    controller.mount();
    await flushPromises();

    expect(controller.statusText).toBe('You have no private books yet.');
    expect(controller.isRetryHidden).toBe(true);
  });

  it('shows an error with retry and recovers', async () => {
    const { controller, gateway } = setup();
    gateway.failNext();
    controller.mount();
    await flushPromises();

    expect(controller.statusText).toBe('Failed to load books.');
    expect(controller.isRetryHidden).toBe(false);

    controller.retry();
    await flushPromises();

    expect(controller.isStatusHidden).toBe(true);
    expect(controller.isRetryHidden).toBe(true);
    expect(controller.books).toHaveLength(2);
  });

  it('keeps showing loaded books without a loader while refreshing', async () => {
    const { controller, booksRepository, gateway } = setup();
    controller.mount();
    await flushPromises();
    gateway.pause();

    void booksRepository.getBooks('all');

    expect(controller.isStatusHidden).toBe(true);
    expect(controller.books).toHaveLength(2);
    gateway.resume();
  });

  it('stops reacting to scope changes after unmount', async () => {
    const { controller, gateway } = setup();
    controller.mount();
    await flushPromises();
    controller.unmount();

    controller.selectScope('private');
    await flushPromises();

    expect(gateway.requests).toHaveLength(1);
  });

  it('can be re-mounted (React StrictMode)', async () => {
    const { controller, gateway } = setup();
    controller.mount();
    controller.unmount();
    controller.mount();
    await flushPromises();

    controller.selectScope('private');
    await flushPromises();

    // Only one reaction is alive: 2 initial loads + 1 for the scope change.
    expect(gateway.requests).toHaveLength(3);
    controller.unmount();
  });

  it('recomputes the books view model only when data changes', async () => {
    const { controller } = setup();
    const onBooksChange = vi.fn();
    const dispose = reaction(() => controller.books, onBooksChange);

    controller.mount();
    await flushPromises();
    dispose();

    expect(onBooksChange).toHaveBeenCalledTimes(1);
  });
});
