import { z } from 'zod';

// The swagger types every response as a bare `object`, so DTOs are validated at the repository boundary.

export const BookDtoSchema = z.object({
  // Books created through the API come back without `id` and `ownerId`.
  id: z.number().optional(),
  name: z.string(),
  author: z.string(),
  ownerId: z.string().optional(),
});

export const BooksDtoSchema = z.array(BookDtoSchema);

export const AddBookResponseDtoSchema = z.object({ status: z.literal('ok') });

export type BookDto = z.infer<typeof BookDtoSchema>;

export type AddBookDto = Pick<BookDto, 'name' | 'author'>;
