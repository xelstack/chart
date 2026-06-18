# 고성능 차트 라이브러리

고성능, 실시간 업데이트, 대용량 데이터 처리를 지원하는 TypeScript 기반 차트 라이브러리입니다.

## 주요 기능

- 🚀 **고성능 렌더링**: Canvas API 기반으로 수만 개 이상의 데이터 포인트를 부드럽게 렌더링
- ⚡ **실시간 업데이트**: 배치 처리 및 디바운싱을 통한 효율적인 실시간 데이터 업데이트
- 📊 **다양한 차트 타입**: 선 그래프, 막대 그래프, 원형 그래프, 산점도 지원
- 📱 **모바일 최적화**: 저사양 모바일 기기에서도 60fps 유지
- 🎯 **자동 최적화**: 대용량 데이터 자동 샘플링, 가상화, 공간 인덱싱
- 🔧 **TypeScript 지원**: 완전한 타입 안정성 제공
- 📦 **트리 쉐이킹**: 모듈 단위로 분리되어 사용하지 않는 코드 자동 제거

## 설치

```bash
npm install @xelstack/chart-core
```

또는

```bash
yarn add @xelstack/chart-core
```

또는

```bash
pnpm add @xelstack/chart-core
```

## 빠른 시작

```javascript
import { createChart } from '@xelstack/chart-core';

// 컨테이너 요소 가져오기
const container = document.getElementById('chart-container');

// 데이터 준비
const dataset = {
  points: [
    { x: 0, y: 10 },
    { x: 1, y: 20 },
    { x: 2, y: 15 },
    { x: 3, y: 25 },
    { x: 4, y: 20 }
  ],
  name: 'Sales Data'
};

// 차트 설정
const config = {
  type: 'line',
  width: 800,
  height: 600,
  title: 'Monthly Sales',
  colors: ['#FF5733']
};

// 차트 생성
const chart = createChart(container, dataset, config);
```

## 사용 예제

### 기본 차트

```javascript
const chart = createChart(container, dataset, {
  type: 'line',
  title: 'Sales Chart',
  colors: ['#3366ff'],
  showGrid: true,
  showLegend: true
});
```

### 실시간 업데이트

```javascript
// 초기 차트 생성
const chart = createChart(container, initialDataset, config);

// 데이터 업데이트
chart.updateData({
  points: newDataPoints,
  name: 'Updated Data'
});
```

### 대용량 데이터

```javascript
// 10만 개 이상의 데이터 포인트도 자동으로 최적화
const largeDataset = {
  points: Array.from({ length: 100000 }, (_, i) => ({
    x: i,
    y: Math.random() * 100
  }))
};

const chart = createChart(container, largeDataset, {
  type: 'line'
});
// 내부적으로 자동 최적화가 수행됨
```

### 차트 크기 조정

```javascript
// 런타임 크기 변경
chart.resize(1200, 900);
```

### 뷰포트 제어

```javascript
// 뷰포트 리셋
chart.resetViewport();

// 뷰포트 정보 가져오기
const viewport = chart.getViewport();
console.log(`Zoom level: ${viewport.zoomLevel}`);
```

### 리소스 정리

```javascript
// 차트 제거 및 리소스 해제
chart.destroy();
```

## 차트 타입

- **line**: 선 그래프
- **bar**: 막대 그래프
- **pie**: 원형 그래프
- **scatter**: 산점도

## 성능 목표

- 초기 렌더링: 100만 개 포인트 기준 3초 이내
- 실시간 업데이트 지연: 100ms 이하
- 상호작용 응답: 데스크톱 및 저사양 모바일 기기에서 60fps 이상 유지
- 연속 업데이트: 초당 100회 이상 처리 가능

## 기술 스택

- **TypeScript**: 타입 안정성과 개발자 경험
- **Canvas API**: 고성능 렌더링
- **Turborepo**: 모노레포 관리
- **Rollup**: 번들링 및 트리 쉐이킹
- **Vitest**: 순수 함수 유닛 테스트
- **Playwright**: E2E 테스트

## 프로젝트 구조

```
chart/
├── packages/
│   └── chart-core/          # 핵심 라이브러리
│       ├── src/
│       │   ├── core/        # 핵심 로직
│       │   ├── charts/      # 차트 타입 구현
│       │   ├── utils/       # 유틸리티 함수
│       │   └── types/       # 타입 정의
│       └── tests/           # 유닛 테스트
├── apps/
│   ├── chart-demo/          # 데모 애플리케이션
│   └── e2e-tests/           # E2E 테스트
└── specs/
    └── 001-chart-library/   # 스펙 문서
```

## 개발

### 필수 요구사항

- Node.js 18+
- pnpm 8+

### 설치

```bash
pnpm install
```

### 개발 서버 실행

```bash
pnpm run dev
```

### 빌드

```bash
pnpm run build
```

### 테스트

```bash
# 모든 테스트 실행
pnpm run test

# 유닛 테스트만 실행
pnpm --filter @xelstack/chart-core test

# E2E 테스트만 실행
pnpm --filter @chart/e2e-tests test
```

## 문서

- [Quick Start Guide](./specs/001-chart-library/quickstart.md)
- [API Documentation](./packages/chart-core/README.md)
- [Implementation Plan](./specs/001-chart-library/plan.md)

## 라이선스

MIT

## 기여

이슈 및 풀 리퀘스트를 환영합니다!

