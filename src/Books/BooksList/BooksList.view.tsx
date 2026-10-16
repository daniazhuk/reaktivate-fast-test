import { observer } from 'mobx-react';
import { Tabs } from '@/Shared/Components/Tabs';
import { useController } from '@/Shared/Lifecycle/useController';
import { BookItemView } from './BookItem.view';
import BooksListController from './BooksList.controller';

export const BooksListView = observer(() => {
  const controller = useController(BooksListController.create);

  return (
    <section className="books-list">
      <Tabs label={controller.tabsLabel} tabs={controller.tabs} />
      <p className="books-list__status" role="status" hidden={controller.isStatusHidden}>
        {controller.statusText}{' '}
        <button type="button" hidden={controller.isRetryHidden} onClick={controller.retry}>
          {controller.retryLabel}
        </button>
      </p>
      <ul className="books-list__items">
        {controller.books.map((book) => (
          <BookItemView key={book.id} book={book} />
        ))}
      </ul>
    </section>
  );
});
