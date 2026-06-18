import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Path alias 설정
 * tsconfig.json의 paths와 동일한 매핑
 */
const aliasEntries = [
  { find: '@chart/api', replacement: path.resolve(__dirname, 'src/api') },
  { find: '@chart/charts', replacement: path.resolve(__dirname, 'src/charts') },
  { find: '@chart/effects', replacement: path.resolve(__dirname, 'src/effects') },
  { find: '@chart/state', replacement: path.resolve(__dirname, 'src/state') },
  { find: '@chart/streaming', replacement: path.resolve(__dirname, 'src/streaming') },
  { find: '@chart/types', replacement: path.resolve(__dirname, 'src/types') },
  { find: '@chart/utils', replacement: path.resolve(__dirname, 'src/utils') },
  { find: '@chart/widget', replacement: path.resolve(__dirname, 'src/widget') },
];

/**
 * Rollup 빌드 설정
 * ESM과 CJS 듀얼 빌드를 지원하여 트리 쉐이킹 최적화
 * tests 폴더는 빌드에서 제외됨
 */
export default [
  // ESM 빌드
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/esm/index.js',
      format: 'es',
      sourcemap: true,
    },
    plugins: [
      alias({ entries: aliasEntries }),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationDir: undefined,
        declarationMap: false,
        exclude: ['tests/**/*', '**/*.test.ts', '**/*.spec.ts'],
      }),
      nodeResolve({
        preferBuiltins: false,
      }),
      commonjs(),
    ],
    external: [],
  },
  // CJS 빌드
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/cjs/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [
      alias({ entries: aliasEntries }),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationDir: undefined,
        declarationMap: false,
        exclude: ['tests/**/*', '**/*.test.ts', '**/*.spec.ts'],
      }),
      nodeResolve({
        preferBuiltins: false,
      }),
      commonjs(),
    ],
    external: [],
  },
];
