import { autorun } from 'mobx';
import { createTestStores, TEST_USER } from '@/Test/createTestStores';

describe('BooksRepository', () => {
  it('starts empty and not loaded', () => {
    const { booksRepository } = createTestStores();

    expect(booksRepository.getScope('all')).toEqual({
      books: [],
      isLoading: false,
      isLoaded: false,
      hasError: false,
    });
  });

  it('loads all books from /v1/books/[user] and maps DTO to PM', async () => {
    const { booksRepository, gateway } = createTestStores();

    await booksRepository.getBooks('all');

    expect(gateway.requests).toEqual([{ method: 'GET', path: `/v1/books/${TEST_USER}` }]);
    expect(booksRepository.getScope('all')).toEqual({
      books: [
        { id: '111', name: 'Wind in the willows', author: 'Kenneth Graeme' },
        { id: '121', name: 'I, Robot', author: 'Isaac Asimov' },
      ],
      isLoading: false,
      isLoaded: true,
      hasError: false,
    });
  });

  it('loads private books from /private and generates ids for books without one', async () => {
    const { booksRepository, gateway } = createTestStores();
    gateway.seedPrivate(TEST_USER, [{ name: 'Mine', author: 'Me' }]);

    await booksRepository.getBooks('private');

    expect(gateway.requests[0].path).toBe(`/v1/books/${TEST_USER}/private`);
    expect(booksRepository.getScope('private').books).toEqual([
      { id: 'local-0', name: 'Mine', author: 'Me' },
    ]);
    expect(booksRepository.privateBooksCount).toBe(1);
  });

  it('marks the scope as loading while the request is in flight', async () => {
    const { booksRepository, gateway } = createTestStores();
    gateway.pause();

    const loading = booksRepository.getBooks('all');
    expect(booksRepository.getScope('all').isLoading).toBe(true);

    gateway.resume();
    await loading;
    expect(booksRepository.getScope('all').isLoading).toBe(false);
  });

  it('stores an error flag and keeps previous books when loading fails', async () => {
    const { booksRepository, gateway } = createTestStores();
    await booksRepository.getBooks('all');
    gateway.failNext();

    await booksRepository.getBooks('all');

    const scopePm = booksRepository.getScope('all');
    expect(scopePm.hasError).toBe(true);
    expect(scopePm.isLoading).toBe(false);
    expect(scopePm.books).toHaveLength(2);
  });

  it.each([
    ['not an array', { books: [] }],
    ['a book without a name', [{ id: 1, author: 'A' }]],
    ['a book with a non-numeric id', [{ id: '1', name: 'N', author: 'A' }]],
  ])('treats a malformed response (%s) as an error', async (_case, body) => {
    const { booksRepository, gateway } = createTestStores();
    gateway.respondNextWith(body);

    await booksRepository.getBooks('all');

    expect(booksRepository.getScope('all')).toMatchObject({ hasError: true, isLoaded: false, books: [] });
  });

  it('drops unknown fields from the API', async () => {
    const { booksRepository, gateway } = createTestStores();
    gateway.respondNextWith([{ id: 1, name: 'N', author: 'A', extra: true }]);

    await booksRepository.getBooks('all');

    expect(booksRepository.getScope('all').books).toEqual([{ id: '1', name: 'N', author: 'A' }]);
  });

  it('applies only the latest response when requests overlap', async () => {
    const { booksRepository, gateway } = createTestStores();
    gateway.pause();
    const first = booksRepository.getBooks('private');
    gateway.resume();

    gateway.seedPrivate(TEST_USER, [{ name: 'Fresh', author: 'Me' }]);
    const second = booksRepository.getBooks('private');
    await Promise.all([first, second]);

    expect(booksRepository.getScope('private').books.map((book) => book.name)).toEqual(['Fresh']);
  });

  it('adds a book with POST to /v1/books/[user] and refreshes both scopes', async () => {
    const { booksRepository, gateway } = createTestStores();

    await booksRepository.addBook({ name: 'Dune', author: 'Frank Herbert' });

    expect(gateway.requests[0]).toEqual({
      method: 'POST',
      path: `/v1/books/${TEST_USER}`,
      payload: { name: 'Dune', author: 'Frank Herbert' },
    });
    expect(booksRepository.getScope('all').books).toHaveLength(3);
    expect(booksRepository.getScope('private').books).toEqual([
      { id: 'local-0', name: 'Dune', author: 'Frank Herbert' },
    ]);
  });

  it('rethrows when adding a book fails', async () => {
    const { booksRepository, gateway } = createTestStores();
    gateway.failNext();

    await expect(booksRepository.addBook({ name: 'X', author: 'Y' })).rejects.toThrow();
  });

  it('rejects when the API does not confirm the creation', async () => {
    const { booksRepository, gateway } = createTestStores();
    gateway.respondNextWith({ status: 'error' });

    await expect(booksRepository.addBook({ name: 'X', author: 'Y' })).rejects.toThrow();
  });

  it('encodes the user nickname in the path', async () => {
    const { booksRepository, gateway } = createTestStores(undefined, 'another user');

    await booksRepository.getBooks('all');

    expect(gateway.requests[0].path).toBe('/v1/books/another%20user');
  });

  it('notifies observers once per state transition (no intermediate renders)', async () => {
    const { booksRepository } = createTestStores();
    const snapshots: string[] = [];
    const dispose = autorun(() => {
      const { isLoading, isLoaded, books } = booksRepository.getScope('all');
      snapshots.push(`loading=${isLoading} loaded=${isLoaded} books=${books.length}`);
    });

    await booksRepository.getBooks('all');
    dispose();

    expect(snapshots).toEqual([
      'loading=false loaded=false books=0',
      'loading=true loaded=false books=0',
      'loading=false loaded=true books=2',
    ]);
  });
});
