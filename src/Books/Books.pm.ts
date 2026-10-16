/** Programmer's model: what controllers work with. */
export type BookPm = {
  id: string;
  name: string;
  author: string;
};

export type AddBookPm = Pick<BookPm, 'name' | 'author'>;

export type BooksScope = 'all' | 'private';

export type BooksScopePm = {
  books: BookPm[];
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
};
