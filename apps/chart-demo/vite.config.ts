import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import tsconfigPaths from 'vite-tsconfig-paths';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: './src',
  server: {
    port: 3000,
    open: '/demo.html', // 데모 페이지를 기본으로 열기 (E2E 테스트는 fixtures/index.html 사용)
    strictPort: true, // 포트가 사용 중이면 실패
  },
  plugins: [
    // chart-core 소스가 쓰는 @chart/* 경로 별칭을 tsconfig의 paths에서 그대로 해석
    tsconfigPaths({
      projects: [
        path.resolve(__dirname, '../../packages/chart-core/tsconfig.json'),
      ],
    }),
    // E2E 테스트용 index.html을 루트 경로에서 제공
    {
      name: 'e2e-test-index',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // 루트 경로(/) 요청 시 E2E 테스트용 index.html 제공
          if (req.url === '/' || req.url === '/index.html') {
            const e2eIndexPath = path.resolve(
              __dirname,
              '../e2e-tests/fixtures/index.html'
            );
            if (fs.existsSync(e2eIndexPath)) {
              const content = fs.readFileSync(e2eIndexPath, 'utf-8');
              res.setHeader('Content-Type', 'text/html');
              res.end(content);
              return;
            }
          }
          next();
        });
      },
    },
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, './src/demo.html'),
      },
    },
  },
  resolve: {
    alias: {
      // 워크스페이스 패키지를 빌드된 dist 대신 소스로 직접 해석 (HMR용)
      '@xelstack/chart-core': path.resolve(__dirname, '../../packages/chart-core/src'),
    },
  },
});

