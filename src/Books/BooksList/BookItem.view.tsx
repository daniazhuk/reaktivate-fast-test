import type { BookVm } from './BooksList.controller';

type Props = {
  book: BookVm;
};

export const BookItemView = ({ book }: Props) => <li className="book">{book.label}</li>;
