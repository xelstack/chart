import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

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

