import { AddBookView } from './AddBook/AddBook.view';
import { BooksListView } from './BooksList/BooksList.view';

export const BooksView = () => (
  <main className="App">
    <BooksListView />
    <AddBookView />
  </main>
);
