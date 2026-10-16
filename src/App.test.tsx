import { StrictMode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoresContext } from '@/Shared/Stores/Stores.context';
import { createTestStores, TEST_USER } from '@/Test/createTestStores';
import { App } from './App';

/** Smoke test: views only wire controllers, so one integration pass is enough. */
describe('App', () => {
  it('renders books, switches scope and adds a book', async () => {
    const user = userEvent.setup();
    const stores = createTestStores();
    stores.gateway.seedPrivate(TEST_USER, [{ name: 'Mine', author: 'Me' }]);
    render(
      <StrictMode>
        <StoresContext value={stores}>
          <App />
        </StoresContext>
      </StrictMode>,
    );

    expect(await screen.findByText('Kenneth Graeme: Wind in the willows')).toBeInTheDocument();
    expect(screen.getByText('Your books: 1')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Private books' }));
    expect(screen.getByRole('tab', { name: 'Private books' })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByText('Me: Mine')).toBeInTheDocument();
    expect(screen.queryByText('Kenneth Graeme: Wind in the willows')).not.toBeInTheDocument();

    const form = screen.getByRole('form', { name: 'Add book' });
    await user.type(within(form).getByLabelText('Name'), 'Dune');
    await user.type(within(form).getByLabelText('Author'), 'Frank Herbert');
    await user.click(within(form).getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Frank Herbert: Dune')).toBeInTheDocument();
    expect(screen.getByText('Your books: 2')).toBeInTheDocument();
    expect(within(form).getByLabelText('Name')).toHaveValue('');
  });
});
