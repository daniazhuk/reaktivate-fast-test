# Reaktivate Fast-Test Homework

[![CI](https://github.com/daniazhuk/reaktivate-fast-test/actions/workflows/ci.yml/badge.svg)](https://github.com/daniazhuk/reaktivate-fast-test/actions/workflows/ci.yml)

Refactoring of the CodeSandbox starter `reaktivate-tdd-challenge-1-sample-begin` into a fast-test
(MVP / MVVM) architecture: React views only render, all logic lives in MobX controllers covered by unit tests.

- **Part 1:** logic separated from rendering, MobX + mobx-react, book creation, tests.
- **Part 2:** "All books" / "Private books" switch (mutually exclusive tabs) and a sticky app-wide
  header with the counter "Your books: N".

The git history starts with the untouched starter, so each refactoring step can be reviewed as a separate commit.

## How to run

Requirements: Node.js 24 (`nvm use` reads `.nvmrc`).

```bash
npm ci
npm run dev            # http://localhost:5173
```

| Command                            | What it does                                                         |
| ---------------------------------- | -------------------------------------------------------------------- |
| `npm test`                         | all tests once (~1 s)                                                |
| `npm run test:watch`               | tests in watch mode                                                  |
| `npm run test:coverage`            | tests + coverage report (`coverage/index.html`) and thresholds       |
| `npm run typecheck`                | TypeScript                                                           |
| `npm run lint`                     | ESLint, including the "no logic in views" rules                      |
| `npm run format`                   | Prettier                                                             |
| `npm run check`                    | typecheck + lint + format check + tests with coverage (CI runs this) |
| `npm run build && npm run preview` | production build served locally                                      |

WebStorm picks up the shared run configurations `dev`, `test` and `check` from `.run/`.

### API user and the self-signed certificate

The API (`https://tdd.demo.reaktivate.com/v1/books/[user]`) uses a self-signed certificate.

- **Default (nothing to do):** in `dev` and `preview`, requests go through the Vite proxy
  (`/api` → API, `secure: false`), so the browser never sees the certificate.
- **Without the proxy** (`VITE_API_BASE=https://tdd.demo.reaktivate.com`): first open
  https://tdd.demo.reaktivate.com/v1/books/daniazhuk in the browser and accept the certificate
  ("Advanced" → "Proceed"). Otherwise every request fails with a network error.

Optional settings (copy `.env.example` to `.env`):

| Variable        | Default     | Meaning                                                |
| --------------- | ----------- | ------------------------------------------------------ |
| `VITE_API_USER` | `daniazhuk` | the `[user]` nickname in the API url                   |
| `VITE_API_BASE` | `/api`      | API base url; set the full API url to bypass the proxy |

To clear the books created under a nickname:
`curl -k -X PUT https://tdd.demo.reaktivate.com/v1/books/daniazhuk/reset`.

## Architecture

```
            actions                    PM                       DTO
  View  ───────────────▶  Controller  ─────▶  Repository  ─────────▶  ApiGateway  ──▶  HTTP API
        ◀─────────────               ◀─────               ◀─────────
          VM (observable)              PM          zod-validated DTO
```

| Layer      | Files                               | Responsibility                                                                     |
| ---------- | ----------------------------------- | ---------------------------------------------------------------------------------- |
| View       | `*.view.tsx`, `Shared/Components/*` | Functional `observer` components; connect a controller and render its VM           |
| Controller | `*.controller.ts`                   | Local per-component state, VM getters, UI actions, lifecycle                       |
| Repository | `Books/Books.repository.ts`         | Shared books state (PM) per scope, DTO validation and mapping, API paths           |
| Gateway    | `Shared/ApiGateway.ts`              | `fetch` behind the `HttpGateway` interface; an in-memory fake replaces it in tests |
| Stores     | `Shared/Stores/*`                   | App-wide `UserStore`, composition root `createAppStores`, React context            |

```
src/
  index.tsx                    renders <App/> inside the stores context
  bootstrap.ts                 MobX config + composition of app stores
  App.tsx                      Header + Books
  Books/                       feature: books
    Books.repository.ts        shared books state (PM) per scope, API calls
    Books.dto.ts               zod schemas and DTO types of the API
    Books.types.ts             PM types
    BooksList/                 list + "All / Private" switch   (controller, view, item view)
    AddBook/                   add-book form                   (controller, view)
  Header/                      feature: sticky header with "Your books: N" (controller, view)
  Shared/                      reusable, feature-agnostic code
    ApiGateway.ts, config.ts
    Components/                Tabs, TextField (props-only views)
    Lifecycle/                 useController, Controller, DisposerBag
    Stores/                    UserStore, createAppStores, Stores.context
  Test/                        FakeBooksGateway (in-memory API), test helpers
```

## Acceptance criteria → implementation → tests

| Criterion (PDF)                                   | Where                                                                                       | Verified by                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1. Zero logic in TSX, MVP / MVVM                  | `*.view.tsx` read ready-made VM values; logic in `*.controller.ts`                          | ESLint `no-restricted-syntax` / `no-restricted-imports` for `src/**/*.tsx` (`npm run lint`)                    |
| 2. MobX for state, mobx-react for reactivity      | `makeAutoObservable` in controllers / repository, `observer` views                          | all controller tests; `App.test.tsx`                                                                           |
| 3. Books creation                                 | `AddBook.controller.ts`, `BooksRepository.addBook`                                          | `AddBook.controller.test.ts`, "adds a book with POST…" in `Books.repository.test.ts`, `App.test.tsx`           |
| 4. Logic covered by tests                         | `*.test.ts` next to each controller / repository                                            | 48 tests; coverage thresholds (100% lines for controllers) in `vite.config.ts`                                 |
| Part 2a. Mutually exclusive All / Private switch  | `BooksList.controller.ts` (`scope`, `tabs`), `Shared/Components/Tabs.tsx`                   | "keeps tabs mutually exclusive", "switches to private books…" in `BooksList.controller.test.ts`                |
| Part 2b. Sticky app-wide header "Your books: N"   | `Header/*`, `position: sticky` in `styles.css`; count from the shared `BooksRepository`     | `Header.controller.test.ts`, including "keeps the counter correct while the list shows all / private"          |
| Appendix 1. Reusable vs feature components        | `Shared/Components` vs `Books/*`, `Header/*`                                                | structure                                                                                                      |
| Appendix 2. A controller per component with logic | `BooksList`, `AddBook`, `Header` controllers; `Tabs`, `TextField`, `BookItem` have no logic | ESLint view rules                                                                                              |
| Appendix 3. Global store only for shared data     | `UserStore` (user), `BooksRepository` (books shared by the list and the header)             | `Books.repository.test.ts`                                                                                     |
| Appendix 4. View uses only MobX stores            | views call `useController` only; `useState` / `useEffect` are banned in views               | ESLint `no-restricted-imports`                                                                                 |
| Appendix 5. Logic tests are a must                | see above                                                                                   | `npm run check` in CI                                                                                          |
| Appendix 6. Views are functional                  | all views are function components                                                           | —                                                                                                              |
| Appendix 7. Lifecycle and resource disposal       | `useController` → `mount` / `unmount`, `DisposerBag`                                        | "stops reacting to scope changes after unmount", "can be re-mounted (React StrictMode)", `DisposerBag.test.ts` |
| Appendix 8. No unnecessary renders (runInAction)  | each async result applied in one `runInAction`; `enforceActions: 'always'`                  | "notifies observers once per state transition", "recomputes the books view model only when data changes"       |
| Appendix 9. No `console.log`                      | `console.debug` for failures                                                                | ESLint `no-console` (only `debug` allowed)                                                                     |

Beyond the PDF: race safety ("applies only the latest response…"), double-submit guard ("ignores repeated
submits…"), creation errors keep the input ("shows an error and keeps the input…"), malformed API responses
("treats a malformed response… as an error").

## Decisions and trade-offs

- **Views without conditionals.** Visibility uses the `hidden` attribute driven by controller flags
  (`isStatusHidden`, `isRetryHidden`, `isErrorHidden`) instead of `{flag && <X/>}`. Views stay free of branching,
  and the lint rule can enforce it. Trade-off: hidden nodes stay in the DOM, which is negligible here. `.map` is the only expression left in views.
- **DOM-agnostic controllers.** Handlers accept minimal event shapes (`{ target: { value } }`, `{ preventDefault() }`),
  so controllers are tested as plain classes without jsdom.
- **Shared state lives in the repository.** "All" and "private" books are kept in `BooksRepository`, which is shared by
  the list and the header. Adding a book refreshes both scopes, so the counter is correct on any tab. Trade-off: one
  extra GET after a creation instead of an optimistic update; the API returns no created entity to insert anyway.
- **Last request wins.** A per-scope request id drops stale responses. Requests are not cancelled with
  `AbortController`: this saves no correctness, only bandwidth.
- **IDs.** Books created through the API have no `id`. The repository generates `local-N` keys, which is stable because
  the API only appends.
- **Validation at the boundary.** The swagger types every response as `object`, so `zod` parses responses in the
  repository. Malformed data becomes an error state instead of crashing a view.
- **Async handlers.** `AddBookController.onSubmit` is a synchronous form handler that starts the async `submit()`.
  Progress and errors are observable state, never a promise returned to React (`no-misused-promises`).
- **Tooling.** The starter's CRA 3 is deprecated and does not run on current Node.js, so the project moved to Vite + TypeScript + Vitest.
  TypeScript is pinned to 6.0, the latest release supported by `typescript-eslint` (TypeScript 7 is not supported by it yet).
  No deprecated APIs: React 19 `<Context>`, `createRoot`, ESLint flat config through `defineConfig`, MobX 7 without legacy decorators.

## What I would improve next

- Optimistic creation with rollback on failure, if the API returned the created book with its id.
- Cancel in-flight requests with `AbortController` when a controller unmounts.
- Route-level code splitting and a router once there is more than one page.
- Visual regression or component tests (Storybook + Playwright) for the views. They are intentionally thin now.
- Error reporting (e.g. Sentry) instead of `console.debug`.

## What changed compared to the starter

| Starter                                                       | Now                                                                                           |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `index.js`: `App` with `useState`/`useEffect`, `alert("TBD")` | `index.tsx` only renders; logic moved to controllers; "Add" creates a book through a form     |
| `Books.repository.js`: module singleton, returns raw DTO      | `Books.repository.ts`: MobX store of PM per scope, zod validation, DTO → PM mapping, DI       |
| `addBook` posted to `.../postnikov/books` (no such endpoint)  | posts to `/v1/books/[user]` and checks `{ status: "ok" }`, then refreshes both scopes         |
| `ApiGateway.js`: no error handling, URL contains the user     | `ApiGateway.ts`: `HttpGateway` interface, `HttpError` on non-2xx, user comes from `UserStore` |
| `react-scripts@3` (CRA 3, deprecated), React 16.8, JS         | Vite 8 + TypeScript 6 + Vitest 5, React 19                                                    |
| MobX 6 / mobx-react 7 (installed, unused)                     | MobX 7 / mobx-react 10                                                                        |
| no linting, no CI                                             | ESLint 10 + typescript-eslint + react-hooks, Prettier, GitHub Actions                         |
