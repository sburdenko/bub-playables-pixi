import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { layerRule } from './tools/eslint/layer-rule.js';

const LAYERS = {
  core: { layers: [], packages: [] },
  domain: { layers: ['core'], packages: [] },
  game: { layers: ['domain', 'core'], packages: [] },
  view: { layers: ['game/ports', 'domain', 'core'], packages: ['pixi.js'] },
  platform: {
    layers: ['game/ports', 'core'],
    packages: [],
    packagesBySubPath: { 'platform/assets': ['pixi.js'] },
  },
  app: { layers: ['*'], packages: ['*'] },
  dev: { layers: ['*'], packages: ['*'] },
};

const BROWSER_GLOBALS_FORBIDDEN_IN_PURE_LAYERS = [
  'window',
  'self',
  'globalThis',
  'document',
  'navigator',
  'location',
  'performance',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'fetch',
  'XMLHttpRequest',
  'Image',
  'crypto',
  'localStorage',
  'sessionStorage',
].map((name) => ({ name, message: 'Pure layers (core/domain/game) must not touch the browser.' }));

const ASYNC_FORBIDDEN_IN_PURE_LAYERS = [
  'FunctionDeclaration[async=true]',
  'FunctionExpression[async=true]',
  'ArrowFunctionExpression[async=true]',
  'AwaitExpression',
].map((selector) => ({ selector, message: 'Game logic uses explicit state machines updated per frame, not async (docs/SPEC.md §11).' }));

export default tseslint.config(
  { ignores: ['dist/', 'coverage/', 'node_modules/', 'src/generated/', 'playwright-report/', 'test-results/'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'max-depth': ['error', 4],
      'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      // Convention: `interface` (I-prefixed) declares a behavior contract, `type` declares plain data.
      '@typescript-eslint/consistent-type-definitions': 'off',
    },
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { layers: { rules: { 'dependency-direction': layerRule } } },
    rules: {
      'layers/dependency-direction': ['error', { sourceRoot: 'src', layers: LAYERS }],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'interface', format: ['PascalCase'], prefix: ['I'] },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'classProperty', modifiers: ['private'], format: ['camelCase'], leadingUnderscore: 'require' },
        { selector: 'classProperty', modifiers: ['static', 'readonly'], format: ['UPPER_CASE', 'camelCase'] },
        { selector: 'variable', modifiers: ['const', 'global'], format: ['UPPER_CASE', 'camelCase', 'PascalCase'] },
      ],
    },
  },
  {
    // Declaration files merge into library types and must use the library's names.
    files: ['src/**/*.d.ts'],
    rules: { '@typescript-eslint/naming-convention': 'off' },
  },
  {
    files: ['src/core/**/*.ts', 'src/domain/**/*.ts', 'src/game/**/*.ts'],
    rules: {
      'no-restricted-globals': ['error', ...BROWSER_GLOBALS_FORBIDDEN_IN_PURE_LAYERS],
      'no-restricted-syntax': ['error', ...ASYNC_FORBIDDEN_IN_PURE_LAYERS],
    },
  },
  {
    files: ['tools/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['tests/**/*.ts'],
    rules: { 'no-console': 'off', 'max-lines-per-function': 'off' },
  },
);
