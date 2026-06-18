/**
 * 차트 라이브러리 핵심 타입 정의
 * @module types
 */

// 증분 렌더링 타입 re-export (T040)
export type {
  IncrementalRenderOptions,
  IncrementalAddPointsOptions,
  IncrementalRenderState,
  IncrementalChartHandle,
} from './incremental';

/**
 * 차트 타입
 */
export type ChartType = 'line' | 'bar' | 'pie' | 'scatter';

/**
 * 데이터 포인트
 * 차트에 표시되는 개별 데이터 항목입니다.
 */
export interface DataPoint {
  /** X축 값 (숫자, 문자열, 날짜) */
  x: number | string | Date;
  /** Y축 값 (숫자) */
  y: number;
  /** 시리즈 이름 (선택, multi-series 차트용) */
  series?: string;
  /** 데이터 포인트 레이블 (선택) */
  label?: string;
  /** 추가 메타데이터 (선택) */
  metadata?: Record<string, unknown>;
}

/**
 * 차트 데이터셋
 * 차트에 표시될 데이터의 집합입니다.
 */
export interface Dataset {
  /** 데이터 포인트 배열 */
  points: DataPoint[];
  /** 데이터셋 식별자 (선택, 다중 데이터셋 시 사용) */
  id?: string;
  /** 데이터셋 이름 (선택, 범례 표시용) */
  name?: string;
}

/**
 * 축 설정
 */
export interface AxisConfig {
  /** 축 레이블 (선택) */
  label?: string;
  /** 최소값 (선택, 자동 계산 시 생략) */
  min?: number;
  /** 최대값 (선택, 자동 계산 시 생략) */
  max?: number;
  /** 값 포맷팅 함수 (선택) */
  format?: (value: number) => string;
}

/**
 * 축 설정 그룹
 */
export interface AxesConfig {
  /** X축 설정 (선택) */
  x?: AxisConfig;
  /** Y축 설정 (선택) */
  y?: AxisConfig;
}

/**
 * 상호작용 설정
 */
export interface InteractionConfig {
  /** 확대/축소 활성화 (기본값: true) */
  zoom?: boolean;
  /** 이동 활성화 (기본값: true) */
  pan?: boolean;
  /** 호버 효과 활성화 (기본값: true) */
  hover?: boolean;
  /** 툴팁 표시 (기본값: true) */
  tooltip?: boolean;
}

/**
 * 실시간 차트 스크롤 방향
 */
export type ScrollDirection = 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top';

/**
 * 실시간 차트 설정
 * 실시간 데이터 업데이트 시 차트의 스크롤 동작을 제어합니다.
 */
export interface RealtimeConfig {
  /** 최대 포인트 수 (기본값: 100) */
  maxPoints?: number;
  /** 스크롤 방향 (기본값: 'left-to-right') */
  scrollDirection?: ScrollDirection;
  /** 실시간 모드 활성화 여부 (기본값: false) */
  enabled?: boolean;
}

/**
 * 실시간 데이터 추가 옵션
 */
export interface AddPointsOptions {
  /** 포인트 추가 후 자동으로 렌더링할지 여부 (기본값: false) */
  autoRender?: boolean;
  /** 포인트 추가 후 뷰포트를 자동으로 스크롤할지 여부 (기본값: false) */
  autoScroll?: boolean;
}

/**
 * 차트 설정
 * 차트의 시각적 표현과 동작을 제어하는 옵션들입니다.
 */
export interface ChartConfig {
  /** 차트 타입 */
  type: ChartType;
  /** 차트 너비 (픽셀, 기본값: 컨테이너 너비) */
  width?: number;
  /** 차트 높이 (픽셀, 기본값: 컨테이너 높이) */
  height?: number;
  /** 색상 팔레트 (기본값: 기본 색상 팔레트) */
  colors?: string[];
  /** 차트 제목 (선택) */
  title?: string;
  /** 범례 표시 여부 (기본값: true) */
  showLegend?: boolean;
  /** 그리드 표시 여부 (기본값: true) */
  showGrid?: boolean;
  /** 축 설정 (선택) */
  axes?: AxesConfig;
  /** 상호작용 설정 (선택) */
  interaction?: InteractionConfig;
  /** 실시간 차트 설정 (선택) */
  realtime?: RealtimeConfig;
  /** 컨테이너 크기에 자동 반응(ResizeObserver) 여부 (기본값: true) */
  responsive?: boolean;
}

/**
 * 뷰포트
 * 차트의 현재 보이는 영역과 확대/이동 상태를 관리합니다.
 */
export interface Viewport {
  /** X축 최소값 (뷰포트) */
  xMin: number;
  /** X축 최대값 (뷰포트) */
  xMax: number;
  /** Y축 최소값 (뷰포트) */
  yMin: number;
  /** Y축 최대값 (뷰포트) */
  yMax: number;
  /** 확대 레벨 (1.0 = 기본) */
  zoomLevel: number;
}

/**
 * 차트 상태
 */
export type ChartStatus = 'initializing' | 'ready' | 'rendering' | 'updating' | 'error';

/**
 * 차트 상태 객체
 */
export interface ChartState {
  /** 차트 상태 */
  status: ChartStatus;
  /** 에러 메시지 (에러 상태일 때만) */
  error?: string;
  /** 데이터 포인트 개수 */
  pointCount: number;
  /** 마지막 렌더링 시간 (밀리초) */
  lastRenderTime?: number;
  /** 현재 데이터셋 (선택) */
  dataset?: Dataset;
  /** 현재 뷰포트 (선택) */
  viewport?: Viewport;
  /** 현재 차트 설정 (선택) */
  config?: ChartConfig;
}

/**
 * 차트 인스턴스 인터페이스
 * 렌더링된 차트의 실행 중인 상태를 관리합니다.
 */
export interface ChartInstance {
  /** 차트 데이터를 업데이트합니다. */
  updateData(dataset: Dataset): void;

  /** 차트 설정을 업데이트합니다. */
  updateConfig(config: Partial<ChartConfig>): void;

  /** 차트 크기를 변경합니다. */
  resize(width: number, height: number): void;

  /** 차트 뷰포트를 리셋합니다 (확대/이동 초기화). */
  resetViewport(): void;

  /** 차트 인스턴스를 제거하고 모든 리소스를 해제합니다. */
  destroy(): void;

  /** 차트의 현재 상태를 반환합니다. */
  getState(): ChartState;

  /** 차트의 현재 뷰포트 정보를 반환합니다. */
  getViewport(): Viewport;
}

/**
 * 위젯 설정
 * 대시보드 환경에서 위젯을 생성하기 위한 설정입니다.
 */
export interface WidgetConfig {
  /** 위젯이 렌더링될 컨테이너 요소 */
  container: HTMLElement;
  /** 차트 데이터셋 */
  dataset: Dataset;
  /** 차트 설정 */
  chartConfig: Partial<ChartConfig>;
  /** 위젯 고유 식별자 (선택) */
  id?: string;
  /** 위젯 제목 (선택, 대시보드에서 표시) */
  title?: string;
  /** 위젯 크기 자동 조정 여부 (기본값: true) */
  autoResize?: boolean;
}

/**
 * 위젯 인스턴스 인터페이스 (함수형)
 * 대시보드 환경에서 차트를 위젯으로 사용하기 위한 래퍼입니다.
 */
export interface WidgetInstance {
  /** 위젯 ID */
  readonly id: string;

  /** 위젯 데이터를 업데이트합니다. */
  updateData(dataset: Dataset): void;

  /** 위젯 설정을 업데이트합니다. */
  updateConfig(config: Partial<ChartConfig>): void;

  /** 위젯 크기를 변경합니다. */
  resize(width: number, height: number): void;

  /** 위젯을 제거하고 모든 리소스를 해제합니다. */
  destroy(): void;

  /** 위젯의 현재 상태를 반환합니다. */
  getState(): ChartState;

  /** 위젯의 현재 뷰포트 정보를 반환합니다. */
  getViewport(): Viewport;
}
