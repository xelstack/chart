// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://chart.xelstack.com', // 실제 배포 URL로 변경 필요
  integrations: [
    mdx(),
    sitemap(),
    react(),
    tailwind({
      applyBaseStyles: false, // 커스텀 스타일 사용
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
  // 빌드 최적화
  build: {
    inlineStylesheets: 'auto', // 작은 CSS 파일은 인라인으로
  },
  // Vite 최적화
  vite: {
    build: {
      cssCodeSplit: true, // CSS 코드 스플리팅
      rollupOptions: {
        output: {
          manualChunks: {
            // React와 관련 라이브러리를 별도 청크로 분리
            'react-vendor': ['react', 'react-dom'],
            'monaco': ['@monaco-editor/react'],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', '@monaco-editor/react'],
      force: false, // 캐시 강제 재생성 방지 (개발 속도 향상)
    },
    ssr: {
      noExternal: ['@monaco-editor/react'], // Monaco를 SSR에서 제외하지 않음
    },
    server: {
      fs: {
        // 루트 디렉토리 외부 파일 접근 허용 (monorepo + pnpm)
        allow: [
          '..',
          // pnpm의 .pnpm 스토어 접근 허용
          '../../node_modules',
        ],
      },
    },
  },
  // 압축 설정
  compressHTML: true,
  // Prefetch 설정
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport', // 뷰포트에 보이면 prefetch
  },
});
