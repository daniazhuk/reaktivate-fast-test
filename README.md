# Reaktivate Fast-Test Homework

Refactoring of the CodeSandbox starter `reaktivate-tdd-challenge-1-sample-begin` into a fast-test
(MVP / MVVM) architecture: React views only render, all logic lives in MobX controllers covered by unit tests.

- **Part 1:** logic separated from rendering, MobX + mobx-react, book creation, tests.
- **Part 2:** "All books" / "Private books" switch (mutually exclusive tabs) and a sticky app-wide
  header with the counter "Your books: N".

## How to run

Requirements: Node.js 20.19+.

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # all tests once
npm run test:watch
npm run test:coverage
npm run typecheck
npm run lint
npm run format         # prettier --write
npm run check          # typecheck + lint + format check + tests
npm run build && npm run preview
```

### API user and self-signed certificate

The API (`https://tdd.demo.reaktivate.com/v1/books/[user]`) uses a self-signed certificate.
In `dev` and `preview` requests go through the Vite proxy (`/api` → API, `secure: false`),
so **there is no need to accept the certificate in the browser**.

Optional settings (copy `.env.example` to `.env`):

| Variable        | Default     | Meaning                                                |
| --------------- | ----------- | ------------------------------------------------------ |
| `VITE_API_USER` | `daniazhuk` | the `[user]` nickname in the API url                   |
| `VITE_API_BASE` | `/api`      | API base url; set the full API url to bypass the proxy |

## What changed compared to the starter

The starter structure and naming are kept (`Books/Books.repository`, `Shared/ApiGateway`, `Shared/config`,
"author: name" list items, the "Add" button); the code inside is refactored.

| Starter                                                       | Now                                                                                           |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `index.js`: `App` with `useState`/`useEffect`, `alert("TBD")` | `index.tsx` only renders; logic moved to controllers; "Add" creates a book through a form     |
| `Books.repository.js`: module singleton, returns raw DTO      | `Books.repository.ts`: MobX store of PM per scope, DTO → PM mapping, injected gateway         |
| `addBook` posted to `.../postnikov/books` (no such endpoint)  | posts to `/v1/books/[user]`, then refreshes "all" and "private"                               |
| `ApiGateway.js`: no error handling, URL contains the user     | `ApiGateway.ts`: `HttpGateway` interface, `HttpError` on non-2xx, user comes from `UserStore` |
| `react-scripts@3` (CRA 3, deprecated), React 16.8, JS         | Vite 8 + TypeScript 6 + Vitest 5, React 19                                                    |
| MobX 6 / mobx-react 7 (installed, unused)                     | MobX 7 / mobx-react 10                                                                        |
| no linting                                                    | ESLint 10 (flat config) + typescript-eslint (type-aware) + react-hooks, Prettier              |

## Tooling and versions

All dependencies are on their current major versions, and no deprecated APIs are used: React 19 `<Context>` instead of
`<Context.Provider>`, ESLint flat config through `defineConfig`, `createRoot`, MobX 7 without legacy decorators.

TypeScript is pinned to 6.0, the latest release supported by `typescript-eslint` (TypeScript 7, the native port, is not supported by it yet).

### Lint rules that enforce the task

`eslint.config.js` turns the acceptance criteria into errors instead of conventions:

- **Zero logic in TSX** (`src/**/*.tsx`, tests excluded): `if`, `switch`, ternaries, `&&`/`||`/`??`,
  binary and unary operators and template literals are forbidden.
- **Views hold no state:** importing `useState`, `useEffect`, `useMemo` and similar hooks into views is forbidden.
  State lives in controllers.
- **`no-console`:** only `console.debug` is allowed (Appendix #9).
- **Type-aware rules:** `no-floating-promises`, `no-misused-promises` (e.g. an async function passed as a form handler)
  and `consistent-type-imports`.

## Architecture

```
View ──actions──▶ Controller ──PM──▶ Repository ──DTO──▶ ApiGateway
     ◀──VM (observable)──     ◀──PM──            ◀──DTO──
```

```
src/
  index.tsx                    renders <App/> inside the stores provider
  bootstrap.ts                 MobX config + composition of app stores
  App.tsx                      Header + Books
  Books/                       feature: books
    Books.repository.ts        shared books state (PM) per scope, API calls
    Books.types.ts             DTO / PM types
    Books.view.tsx
    BooksList/                 list + "All / Private" switch   (controller, view, item view)
    AddBook/                   add-book form                   (controller, view)
  Header/                      feature: sticky header with "Your books: N" (controller, view)
  Shared/                      reusable, feature-agnostic code
    ApiGateway.ts, config.ts
    Components/                Tabs, TextField (props-only views)
    Lifecycle/                 useController, Controller, DisposerBag
    Stores/                    UserStore, createAppStores, StoresContext
  Test/                        FakeBooksGateway (in-memory API), test helpers
```

### Decisions

- **Zero logic in TSX.** No `if`, ternaries, `&&` or calculations in `.tsx` files. Views read
  ready-to-render values from the controller (`statusText`, `isStatusHidden`, `isRetryHidden`,
  `isErrorHidden`, `submitLabel`, `tabs[].isActive`) and pass controller methods as handlers.
  Visibility uses the `hidden` attribute instead of conditional rendering. The only expression left is `.map` to render lists.
  Controllers accept minimal event shapes (`{ target: { value } }`, `{ preventDefault() }`), so they are tested without a DOM.
- **A controller for every component with logic:** `BooksList`, `AddBook`, `Header`. `Tabs`, `TextField`,
  `BookItem` are props-only views.
- **Controller lifecycle.** `useController(factory)` creates a controller once per component, calls `mount()`
  after the first render and `unmount()` on teardown. Reaction disposers are kept in a `DisposerBag`.
  `mount`/`unmount` are idempotent, so React StrictMode (mount → unmount → mount) works; this is covered by a test.
- **Shared state for Part 2.** The list and the header both observe `BooksRepository`. Adding a book refreshes
  both scopes, so the header counter updates without the features knowing about each other.
- **No unnecessary renders.** Every async result is applied inside a single `runInAction`.
  `configure({ enforceActions: 'always' })` is on. Tests check the exact number of reactions.
- **Race safety.** Only the latest request per scope may write its result.
- **IDs.** Books created through the API come back without `id`, so the repository generates `local-N` keys.
- **Async handlers.** `AddBookController.onSubmit` is a synchronous form handler that starts the async `submit()`.
  Progress and errors are exposed as observable state, never as a promise returned to React.
- `console.log` is not used (enforced by ESLint); failures are logged with `console.debug`.

### Tests

- `Books/Books.repository.test.ts`: API paths, DTO → PM mapping, loading/error states, races, add + refresh, render batching.
- `Books/BooksList/BooksList.controller.test.ts`: tabs, loading/empty/error/retry, lifecycle and disposal.
- `Books/AddBook/AddBook.controller.test.ts`: validation, trimming, submitting state, double-submit guard, errors.
- `Header/Header.controller.test.ts`: counter placeholder, loading, live update after adding a book.
- `Shared/ApiGateway.test.ts`, `Shared/Lifecycle/DisposerBag.test.ts`: infrastructure.
- `App.test.tsx`: one integration smoke test of the whole app (in StrictMode) with the fake API.
