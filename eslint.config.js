import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const MOVE_TO_CONTROLLER =
  'Views must not contain logic: move it to the controller and expose a ready-to-render value.';

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat['recommended-latest'],
      prettier,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // Appendix #9: only console.debug is allowed.
      'no-console': ['error', { allow: ['debug'] }],
      '@typescript-eslint/consistent-type-imports': 'error',
      // Controllers use makeAutoObservable({ autoBind: true }), so methods are safe to pass as handlers.
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    // One export style across the codebase: named exports only.
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: 'ExportDefaultDeclaration', message: 'Use named exports.' },
      ],
    },
  },
  {
    // Acceptance criterion #1: zero logic and calculations in TSX views.
    files: ['src/**/*.tsx'],
    ignores: ['src/**/*.test.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: 'IfStatement', message: MOVE_TO_CONTROLLER },
        { selector: 'SwitchStatement', message: MOVE_TO_CONTROLLER },
        { selector: 'ConditionalExpression', message: MOVE_TO_CONTROLLER },
        { selector: 'LogicalExpression', message: MOVE_TO_CONTROLLER },
        { selector: 'BinaryExpression', message: MOVE_TO_CONTROLLER },
        { selector: 'UnaryExpression', message: MOVE_TO_CONTROLLER },
        { selector: 'TemplateLiteral', message: MOVE_TO_CONTROLLER },
        // Repeated here because this block overrides no-restricted-syntax for views.
        { selector: 'ExportDefaultDeclaration', message: 'Use named exports.' },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              importNames: ['useState', 'useEffect', 'useReducer', 'useMemo', 'useCallback', 'useRef'],
              message: 'Views keep no local state or effects: use a controller via useController.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/Test/**'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
]);
