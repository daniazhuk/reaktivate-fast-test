import { createTestStores, flushPromises } from '@/Test/createTestStores';
import AddBookController from './AddBook.controller';

const change = (value: string) => ({ target: { value } });
const submitEvent = () => ({ preventDefault: vi.fn() });

const setup = () => {
  const stores = createTestStores();
  const controller = AddBookController.create(stores);
  return { ...stores, controller };
};

const fillForm = (controller: AddBookController, name = 'Dune', author = 'Frank Herbert') => {
  controller.onNameChange(change(name));
  controller.onAuthorChange(change(author));
};

describe('AddBookController', () => {
  it('starts with an empty form, disabled submit and hidden error', () => {
    const { controller } = setup();

    expect(controller.name).toBe('');
    expect(controller.author).toBe('');
    expect(controller.isSubmitDisabled).toBe(true);
    expect(controller.submitLabel).toBe('Add');
    expect(controller.isErrorHidden).toBe(true);
  });

  it.each([
    ['', 'Author'],
    ['Name', ''],
    ['   ', 'Author'],
    ['Name', '   '],
  ])('keeps submit disabled for name=%j author=%j', (name, author) => {
    const { controller } = setup();

    fillForm(controller, name, author);

    expect(controller.isSubmitDisabled).toBe(true);
  });

  it('enables submit when both fields are filled', () => {
    const { controller } = setup();

    fillForm(controller);

    expect(controller.isSubmitDisabled).toBe(false);
  });

  it('prevents the native form submit and starts creation', async () => {
    const { controller, gateway } = setup();
    fillForm(controller);
    const event = submitEvent();

    controller.onSubmit(event);
    await flushPromises();

    expect(event.preventDefault).toHaveBeenCalled();
    expect(gateway.requests[0]).toMatchObject({ method: 'POST' });
  });

  it('creates a trimmed book and resets the form', async () => {
    const { controller, booksRepository, gateway } = setup();
    fillForm(controller, '  Dune ', ' Frank Herbert  ');

    await controller.submit();

    expect(gateway.requests[0]).toMatchObject({
      method: 'POST',
      payload: { name: 'Dune', author: 'Frank Herbert' },
    });
    expect(booksRepository.privateBooksCount).toBe(1);
    expect(controller.name).toBe('');
    expect(controller.author).toBe('');
    expect(controller.isSubmitting).toBe(false);
  });

  it('shows submitting state while the request is in flight', async () => {
    const { controller, gateway } = setup();
    fillForm(controller);
    gateway.pause();

    const submitting = controller.submit();

    expect(controller.isSubmitting).toBe(true);
    expect(controller.isSubmitDisabled).toBe(true);
    expect(controller.submitLabel).toBe('Adding…');

    gateway.resume();
    await submitting;
    expect(controller.isSubmitting).toBe(false);
  });

  it('ignores repeated submits while a request is in flight', async () => {
    const { controller, gateway } = setup();
    fillForm(controller);
    gateway.pause();

    void controller.submit();
    void controller.submit();
    gateway.resume();
    await flushPromises();

    expect(gateway.requests.filter((request) => request.method === 'POST')).toHaveLength(1);
  });

  it('does nothing when the form is invalid', async () => {
    const { controller, gateway } = setup();

    controller.onSubmit(submitEvent());
    await flushPromises();

    expect(gateway.requests).toHaveLength(0);
  });

  it('shows an error and keeps the input when creation fails', async () => {
    const { controller, gateway } = setup();
    fillForm(controller);
    gateway.failNext();

    await controller.submit();

    expect(controller.isErrorHidden).toBe(false);
    expect(controller.name).toBe('Dune');
    expect(controller.isSubmitting).toBe(false);
  });

  it('hides the error once the user edits the form', async () => {
    const { controller, gateway } = setup();
    fillForm(controller);
    gateway.failNext();
    await controller.submit();

    controller.onNameChange(change('Dune Messiah'));

    expect(controller.isErrorHidden).toBe(true);
  });
});
