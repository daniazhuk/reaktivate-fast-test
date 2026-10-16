import { observer } from 'mobx-react';
import { TextField } from '@/Shared/Components/TextField';
import { useController } from '@/Shared/Lifecycle/useController';
import AddBookController from './AddBook.controller';

export const AddBookView = observer(() => {
  const controller = useController(AddBookController.create);

  return (
    <form className="add-book" aria-label={controller.formLabel} onSubmit={controller.onSubmit}>
      <TextField
        label={controller.nameLabel}
        name="name"
        value={controller.name}
        disabled={controller.isSubmitting}
        onChange={controller.onNameChange}
      />
      <TextField
        label={controller.authorLabel}
        name="author"
        value={controller.author}
        disabled={controller.isSubmitting}
        onChange={controller.onAuthorChange}
      />
      <button type="submit" disabled={controller.isSubmitDisabled}>
        {controller.submitLabel}
      </button>
      <p className="add-book__error" role="alert" hidden={controller.isErrorHidden}>
        {controller.errorText}
      </p>
    </form>
  );
});
