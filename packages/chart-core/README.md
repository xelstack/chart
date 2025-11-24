# @xelstack/chart-core API 문서

고성능 차트 라이브러리의 완전한 API 참조 문서입니다.

## 설치

```bash
npm install @xelstack/chart-core
```

## 기본 사용법

```typescript
import { createChart } from '@xelstack/chart-core';

const chart = createChart(container, dataset, config);
```

## 주요 함수

### `createChart`

차트 인스턴스를 생성합니다.

```typescript
function createChart(
  container: HTMLElement,
  dataset: Dataset,
  config?: Partial<ChartConfig>
): ChartInstance
```

**매개변수:**

- `container` (HTMLElement): 차트가 렌더링될 DOM 요소
- `dataset` (Dataset): 차트 데이터셋
- `config` (Partial<ChartConfig>, 선택): 차트 설정

**반환값:**

- `ChartInstance`: 생성된 차트 인스턴스

**예제:**

```typescript
const chart = createChart(
  document.getElementById('chart-container'),
  {
    points: [
      { x: 0, y: 10 },
      { x: 1, y: 20 }
    ],
    name: 'Sales Data'
  },
  {
    type: 'line',
    width: 800,
    height: 600,
    title: 'Monthly Sales'
  }
);
```

### `createWidget`

대시보드 환경에서 사용할 위젯을 생성합니다.

```typescript
function createWidget(config: WidgetConfig): WidgetInstance
```

**매개변수:**

- `config` (WidgetConfig): 위젯 설정

**반환값:**

- `WidgetInstance`: 생성된 위젯 인스턴스

**예제:**

```typescript
const widget = createWidget({
  container: document.getElementById('widget-container'),
  dataset: { points: [...] },
  chartConfig: { type: 'line' },
  id: 'sales-widget',
  title: 'Sales Widget',
  autoResize: true
});
```

## 타입 정의

### `DataPoint`

데이터 포인트 인터페이스

```typescript
interface DataPoint {
  x: number | string | Date;
  y: number;
  label?: string;
  metadata?: Record<string, unknown>;
}
```

### `Dataset`

차트 데이터셋 인터페이스

```typescript
interface Dataset {
  points: DataPoint[];
  id?: string;
  name?: string;
}
```

### `ChartConfig`

차트 설정 인터페이스

```typescript
interface ChartConfig {
  type: ChartType;
  width?: number;
  height?: number;
  colors?: string[];
  title?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  axes?: AxesConfig;
  animation?: AnimationConfig;
  interaction?: InteractionConfig;
}
```

**속성:**

- `type` (ChartType): 차트 타입 ('line' | 'bar' | 'pie' | 'scatter')
- `width` (number, 선택): 차트 너비 (픽셀, 기본값: 컨테이너 너비)
- `height` (number, 선택): 차트 높이 (픽셀, 기본값: 컨테이너 높이)
- `colors` (string[], 선택): 색상 팔레트
- `title` (string, 선택): 차트 제목
- `showLegend` (boolean, 선택): 범례 표시 여부 (기본값: true)
- `showGrid` (boolean, 선택): 그리드 표시 여부 (기본값: true)
- `axes` (AxesConfig, 선택): 축 설정
- `animation` (AnimationConfig, 선택): 애니메이션 설정
- `interaction` (InteractionConfig, 선택): 상호작용 설정

### `ChartType`

차트 타입

```typescript
type ChartType = 'line' | 'bar' | 'pie' | 'scatter';
```

### `AxesConfig`

축 설정 인터페이스

```typescript
interface AxesConfig {
  x?: AxisConfig;
  y?: AxisConfig;
}
```

### `AxisConfig`

개별 축 설정 인터페이스

```typescript
interface AxisConfig {
  label?: string;
  min?: number;
  max?: number;
  format?: (value: number) => string;
}
```

### `AnimationConfig`

애니메이션 설정 인터페이스

```typescript
interface AnimationConfig {
  enabled?: boolean;
  duration?: number;
  easing?: EasingFunction;
}
```

**속성:**

- `enabled` (boolean, 선택): 애니메이션 활성화 여부 (기본값: true)
- `duration` (number, 선택): 애니메이션 지속 시간 (밀리초, 기본값: 300)
- `easing` (EasingFunction, 선택): 이징 함수 (기본값: "ease-in-out")

### `EasingFunction`

이징 함수 타입

```typescript
type EasingFunction = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
```

### `InteractionConfig`

상호작용 설정 인터페이스

```typescript
interface InteractionConfig {
  zoom?: boolean;
  pan?: boolean;
  hover?: boolean;
  tooltip?: boolean;
}
```

**속성:**

- `zoom` (boolean, 선택): 확대/축소 활성화 (기본값: true)
- `pan` (boolean, 선택): 이동 활성화 (기본값: true)
- `hover` (boolean, 선택): 호버 효과 활성화 (기본값: true)
- `tooltip` (boolean, 선택): 툴팁 표시 (기본값: true)

### `Viewport`

뷰포트 인터페이스

```typescript
interface Viewport {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  zoomLevel: number;
}
```

### `ChartState`

차트 상태 인터페이스

```typescript
interface ChartState {
  status: ChartStatus;
  pointCount: number;
  lastRenderTime?: number;
}
```

### `ChartStatus`

차트 상태 타입

```typescript
type ChartStatus = 'initializing' | 'ready' | 'rendering' | 'updating';
```

## ChartInstance 인터페이스

차트 인스턴스는 다음 메서드를 제공합니다:

### `updateData`

차트 데이터를 업데이트합니다.

```typescript
updateData(dataset: Dataset): void
```

**예제:**

```typescript
chart.updateData({
  points: [
    { x: 0, y: 10 },
    { x: 1, y: 20 },
    { x: 2, y: 15 }
  ],
  name: 'Updated Data'
});
```

### `updateConfig`

차트 설정을 업데이트합니다.

```typescript
updateConfig(config: Partial<ChartConfig>): void
```

**예제:**

```typescript
chart.updateConfig({
  title: 'New Title',
  colors: ['#FF0000', '#00FF00']
});
```

### `resize`

차트 크기를 변경합니다.

```typescript
resize(width: number, height: number): void
```

**예제:**

```typescript
chart.resize(1200, 900);
```

### `resetViewport`

차트 뷰포트를 리셋합니다 (확대/이동 초기화).

```typescript
resetViewport(): void
```

**예제:**

```typescript
chart.resetViewport();
```

### `destroy`

차트 인스턴스를 제거하고 모든 리소스를 해제합니다.

```typescript
destroy(): void
```

**예제:**

```typescript
chart.destroy();
```

### `getState`

차트의 현재 상태를 반환합니다.

```typescript
getState(): ChartState
```

**반환값:**

- `ChartState`: 차트의 현재 상태

**예제:**

```typescript
const state = chart.getState();
console.log(`Status: ${state.status}`);
console.log(`Point count: ${state.pointCount}`);
```

### `getViewport`

차트의 현재 뷰포트 정보를 반환합니다.

```typescript
getViewport(): Viewport
```

**반환값:**

- `Viewport`: 현재 뷰포트 정보

**예제:**

```typescript
const viewport = chart.getViewport();
console.log(`Zoom level: ${viewport.zoomLevel}`);
console.log(`X range: ${viewport.xMin} - ${viewport.xMax}`);
```

## WidgetInstance 인터페이스

위젯 인스턴스는 다음 메서드를 제공합니다:

### `updateData`

위젯 데이터를 업데이트합니다.

```typescript
updateData(dataset: Dataset): void
```

### `updateConfig`

위젯 설정을 업데이트합니다.

```typescript
updateConfig(config: Partial<ChartConfig>): void
```

### `resize`

위젯 크기를 변경합니다.

```typescript
resize(width: number, height: number): void
```

### `destroy`

위젯 인스턴스를 제거하고 모든 리소스를 해제합니다.

```typescript
destroy(): void
```

### `getState`

위젯의 현재 상태를 반환합니다.

```typescript
getState(): ChartState
```

### `getViewport`

위젯의 현재 뷰포트 정보를 반환합니다.

```typescript
getViewport(): Viewport
```

### `getChartInstance`

내부 차트 인스턴스를 반환합니다.

```typescript
getChartInstance(): ChartInstance
```

## 에러 클래스

### `ValidationError`

데이터 검증 오류

```typescript
class ValidationError extends Error {
  field: string;
}
```

### `TypeError`

타입 오류

```typescript
class TypeError extends Error {
  param: string;
}
```

## 유틸리티 함수

### `uniformSample`

균일 샘플링 함수

```typescript
function uniformSample<T>(data: T[], count: number): T[]
```

### `adaptiveSample`

적응형 샘플링 함수

```typescript
function adaptiveSample<T>(
  data: T[],
  minPoints: number,
  maxPoints: number,
  getX: (item: T) => number,
  getY: (item: T) => number
): T[]
```

### `filterByViewport`

뷰포트 기반 필터링 함수

```typescript
function filterByViewport<T>(
  data: T[],
  viewport: Viewport,
  getX: (item: T) => number,
  getY: (item: T) => number
): T[]
```

## 예제

### 기본 선 그래프

```typescript
import { createChart } from '@xelstack/chart-core';

const chart = createChart(
  document.getElementById('chart'),
  {
    points: [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: 15 }
    ]
  },
  {
    type: 'line',
    title: 'Sales Chart'
  }
);
```

### 실시간 업데이트

```typescript
const chart = createChart(container, initialData, config);

setInterval(() => {
  chart.updateData({
    points: generateNewData(),
    name: 'Real-time Data'
  });
}, 1000);
```

### 대용량 데이터

```typescript
const largeDataset = {
  points: Array.from({ length: 100000 }, (_, i) => ({
    x: i,
    y: Math.random() * 100
  }))
};

const chart = createChart(container, largeDataset, {
  type: 'line'
});
```

### 커스텀 설정

```typescript
const chart = createChart(container, dataset, {
  type: 'line',
  width: 1000,
  height: 800,
  title: 'Custom Chart',
  colors: ['#FF0000', '#00FF00', '#0000FF'],
  showLegend: true,
  showGrid: true,
  axes: {
    x: { label: 'Month' },
    y: { label: 'Sales ($)' }
  },
  animation: {
    enabled: true,
    duration: 500,
    easing: 'ease-in-out'
  },
  interaction: {
    zoom: true,
    pan: true,
    hover: true,
    tooltip: true
  }
});
```

## 성능 고려사항

- 대용량 데이터(10만 개 이상)는 자동으로 샘플링 및 가상화가 적용됩니다
- 실시간 업데이트는 배치 처리 및 디바운싱을 통해 최적화됩니다
- 모바일 기기에서는 자동으로 해상도 조정 및 프레임 레이트 조정이 적용됩니다

## 브라우저 지원

- Chrome (최신)
- Firefox (최신)
- Safari (최신)
- Edge (최신)

## 라이선스

MIT

