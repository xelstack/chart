/**
 * ESLint Base Configuration
 * 모노레포 공통 ESLint 설정
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginAstro from 'eslint-plugin-astro';

// =============================================================================
// Base Config
// =============================================================================

/** @type {import('eslint').Linter.Config[]} */
export const baseConfig = [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Promise: 'readonly',
      },
    },
  },
];

// =============================================================================
// TypeScript Config
// =============================================================================

/**
 * TypeScript ESLint 설정 생성
 * @param {{ tsconfigRootDir: string, project?: string | string[] | boolean }} options
 */
export function createTypeScriptConfig(options) {
  const { tsconfigRootDir, project = true } = options;

  return tseslint.config(
    ...baseConfig,
    ...tseslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          project,
          tsconfigRootDir,
        },
        globals: {
          window: 'readonly',
          document: 'readonly',
          HTMLElement: 'readonly',
          HTMLCanvasElement: 'readonly',
          CanvasRenderingContext2D: 'readonly',
          OffscreenCanvas: 'readonly',
          OffscreenCanvasRenderingContext2D: 'readonly',
          performance: 'readonly',
          requestAnimationFrame: 'readonly',
          cancelAnimationFrame: 'readonly',
        },
      },
    },
    {
      rules: {
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-inferrable-types': 'error',
        '@typescript-eslint/prefer-as-const': 'error',
        '@typescript-eslint/no-unnecessary-type-arguments': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/strict-boolean-expressions': 'error',
        '@typescript-eslint/no-unnecessary-type-assertion': 'error',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/prefer-nullish-coalescing': 'error',
        '@typescript-eslint/prefer-optional-chain': 'error',
      },
    },
  );
}

/**
 * 테스트 파일용 설정 오버라이드
 * @param {{ tsconfigRootDir: string, testTsconfig: string, files: string[] }} options
 * @returns {import('eslint').Linter.Config}
 */
export function createTestOverride(options) {
  const { tsconfigRootDir, testTsconfig, files } = options;

  return {
    files,
    languageOptions: {
      parserOptions: {
        project: testTsconfig,
        tsconfigRootDir,
      },
    },
  };
}

// =============================================================================
// Astro Config
// =============================================================================

/** @returns {import('eslint').Linter.Config[]} */
export function createAstroConfig() {
  return [
    ...eslintPluginAstro.configs.recommended,
    {
      files: ['**/*.astro'],
      rules: {
        '@typescript-eslint/strict-boolean-expressions': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/prefer-nullish-coalescing': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
      },
    },
    {
      files: ['**/*.astro/*.ts', '**/*.astro/*.js'],
      ...tseslint.configs.disableTypeChecked,
      rules: {
        ...tseslint.configs.disableTypeChecked.rules,
        '@typescript-eslint/ban-ts-comment': 'off',
      },
    },
  ];
}

export { tseslint };
