import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        HTMLElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        CanvasRenderingContext2D: 'readonly',
        OffscreenCanvas: 'readonly',
        OffscreenCanvasRenderingContext2D: 'readonly',
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // 타입 추론 우선 원칙 (헌법 준수)
      '@typescript-eslint/explicit-function-return-type': 'off', // 함수 반환 타입 추론 사용
      '@typescript-eslint/explicit-module-boundary-types': 'off', // 모듈 경계 타입 추론 사용
      '@typescript-eslint/no-inferrable-types': 'error', // 추론 가능한 타입의 명시적 선언 금지 (예: const x: number = 5 → const x = 5)
      '@typescript-eslint/prefer-as-const': 'error', // 타입 단언 대신 'as const' 사용 권장
      '@typescript-eslint/no-unnecessary-type-arguments': 'error', // 불필요한 제네릭 타입 인자 금지
      // 타입 안전성 강화
      '@typescript-eslint/no-explicit-any': 'error', // any 타입 사용 금지
      '@typescript-eslint/strict-boolean-expressions': 'error', // null/undefined 체크 강화
      '@typescript-eslint/no-unnecessary-type-assertion': 'error', // 불필요한 타입 단언 금지
      '@typescript-eslint/no-non-null-assertion': 'error', // non-null assertion (!) 금지
      '@typescript-eslint/prefer-nullish-coalescing': 'error', // ?? 연산자 사용 권장
      '@typescript-eslint/prefer-optional-chain': 'error', // 옵셔널 체이닝 사용 권장
    },
  },
  // Playwright 설정 파일에 대해서는 타입 체크 규칙 완화 (Playwright 타입 정의의 복잡성으로 인해)
  {
    files: ['apps/e2e-tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
  // 테스트 파일에 대해서는 tsconfig.test.json 사용
  {
    files: ['packages/chart-core/tests/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './packages/chart-core/tsconfig.test.json',
        tsconfigRootDir: __dirname,
      },
    },
  },
  // 설정 파일들에 대해서는 타입 체크 비활성화
  {
    files: ['**/*.config.ts', '**/vite.config.ts'],
    languageOptions: {
      parserOptions: {
        project: false,
      },
    },
  },
  {
    ignores: ['dist/', 'build/', 'node_modules/', '*.js', '*.config.js', 'eslint.config.js'],
  }
);
