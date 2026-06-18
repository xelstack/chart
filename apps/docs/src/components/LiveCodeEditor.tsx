/**
 * LiveCodeEditor - Monaco 기반 라이브 코드 에디터
 * TypeScript 지원, 자동완성, 에러 표시 기능 제공
 */

import { Editor, type Monaco } from '@monaco-editor/react';
import { useState, useRef, useEffect } from 'react';
import type { editor } from 'monaco-editor';

interface LiveCodeEditorProps {
  /** 초기 코드 */
  initialCode: string;
  /** 코드 변경 콜백 */
  onChange?: (code: string) => void;
  /** 언어 (기본: typescript) */
  language?: string;
  /** 높이 (기본: 400px) */
  height?: string;
  /** 읽기 전용 모드 */
  readOnly?: boolean;
  /** 테마 (기본: vs-dark) */
  theme?: 'vs-dark' | 'light';
}

export default function LiveCodeEditor({
  initialCode,
  onChange,
  language = 'typescript',
  height = '400px',
  readOnly = false,
  theme = 'vs-dark',
}: LiveCodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Monaco 에디터 마운트 핸들러
  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editor;

    // TypeScript 컴파일러 옵션 설정
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      allowNonTsExtensions: true,
      strict: false, // 플레이그라운드에서는 strict 모드 비활성화
      esModuleInterop: true,
      noEmit: true,
      allowJs: true,
      checkJs: false,
    });

    // 진단 옵션 설정 - 일부 오류 무시
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      // lib 관련 오류 무시
      diagnosticCodesToIgnore: [
        2304, // Cannot find name 'X' (Math, Array, Date 등)
        2318, // Cannot find global type 'X'
        2552, // Cannot find name 'X'. Did you mean 'Y'?
        2580, // Cannot find name 'require'
        2584, // Cannot find name 'console'
        2339, // Property 'X' does not exist on type 'Y' (동적 속성)
      ],
    });

    // @xelstack/chart-core 타입 정의 추가
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `
      declare module '@xelstack/chart-core' {
        export interface DataPoint {
          x: number | Date | string;
          y: number;
          series?: string;
        }

        export interface Dataset {
          points: DataPoint[];
        }

        export interface ChartConfig {
          type: 'line' | 'bar' | 'pie' | 'scatter';
          width?: number;
          height?: number;
          title?: string;
          colors?: string[];
          showGrid?: boolean;
          lineWidth?: number;
          pointRadius?: number;
          barWidth?: number;
          barGap?: number;
          innerRadius?: number;
          showLabels?: boolean;
          showPercentage?: boolean;
          realtime?: {
            enabled?: boolean;
            maxPoints?: number;
          };
        }

        export interface AddPointsOptions {
          autoRender?: boolean;
          autoScroll?: boolean;
        }

        export interface IncrementalRenderOptions {
          enabled?: boolean;
          frameBuffering?: boolean;
          maxPoints?: number;
        }

        export interface IncrementalAddPointsOptions {
          autoRender?: boolean;
          autoScroll?: boolean;
        }

        export interface IncrementalRenderState {
          totalPoints: number;
          pendingPoints: number;
          frameCount: number;
          averageFrameTime: number;
          isPaused: boolean;
          isActive: boolean;
          isOffscreenValid: boolean;
        }

        export interface ChartState {
          status: string;
          pointCount: number;
          dataset: Dataset;
          viewport: Viewport;
          config: ChartConfig;
        }

        export interface Viewport {
          xMin: number;
          xMax: number;
          yMin: number;
          yMax: number;
          zoomLevel: number;
        }

        export interface ChartHandle {
          updateData: (dataset: Dataset) => void;
          updateConfig: (config: Partial<ChartConfig>) => void;
          render: () => void;
          destroy: () => void;
          resize: (width: number, height: number) => void;
          resetViewport: () => void;
          setViewport: (viewport: Viewport) => void;
          zoom: (factor: number, centerX?: number, centerY?: number) => void;
          pan: (deltaX: number, deltaY: number) => void;
          getViewport: () => Viewport;
          getState: () => ChartState;
          addPoints: (points: DataPoint[], options?: AddPointsOptions) => void;
          addPointsIncremental: (points: DataPoint[], options?: IncrementalAddPointsOptions) => void;
          updateDataIncremental: (nextData: DataPoint[]) => void;
          getIncrementalState: () => IncrementalRenderState;
          pauseIncremental: () => void;
          resumeIncremental: () => void;
          setIncrementalOptions: (options: Partial<IncrementalRenderOptions>) => void;
        }

        export function createChart(
          container: HTMLElement,
          dataset: Dataset,
          config: ChartConfig
        ): ChartHandle;
      }
      `,
      'ts:@xelstack/chart-core.d.ts'
    );

    // 플레이그라운드 전역 타입 정의 추가
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `
      // 플레이그라운드 전역 변수
      declare const container: HTMLElement;

      // 타입 정의
      interface DataPoint {
        x: number | Date | string;
        y: number;
        series?: string;
      }

      interface Dataset {
        points: DataPoint[];
      }

      interface Viewport {
        xMin: number;
        xMax: number;
        yMin: number;
        yMax: number;
        zoomLevel: number;
      }

      interface ChartConfig {
        type: 'line' | 'bar' | 'pie' | 'scatter';
        width?: number;
        height?: number;
        title?: string;
        colors?: string[];
        showGrid?: boolean;
        lineWidth?: number;
        pointRadius?: number;
        barWidth?: number;
        barGap?: number;
        innerRadius?: number;
        showLabels?: boolean;
        showPercentage?: boolean;
        realtime?: {
          enabled?: boolean;
          maxPoints?: number;
        };
      }

      interface AddPointsOptions {
        autoRender?: boolean;
        autoScroll?: boolean;
      }

      interface IncrementalRenderOptions {
        enabled?: boolean;
        frameBuffering?: boolean;
        maxPoints?: number;
      }

      interface IncrementalAddPointsOptions {
        autoRender?: boolean;
        autoScroll?: boolean;
      }

      interface IncrementalRenderState {
        totalPoints: number;
        pendingPoints: number;
        frameCount: number;
        averageFrameTime: number;
        isPaused: boolean;
        isActive: boolean;
        isOffscreenValid: boolean;
      }

      interface ChartState {
        status: string;
        pointCount: number;
        dataset: Dataset;
        viewport: Viewport;
        config: ChartConfig;
      }

      interface ChartHandle {
        updateData: (dataset: Dataset) => void;
        updateConfig: (config: Partial<ChartConfig>) => void;
        render: () => void;
        destroy: () => void;
        resize: (width: number, height: number) => void;
        resetViewport: () => void;
        setViewport: (viewport: Viewport) => void;
        zoom: (factor: number, centerX?: number, centerY?: number) => void;
        pan: (deltaX: number, deltaY: number) => void;
        getViewport: () => Viewport;
        getState: () => ChartState;
        addPoints: (points: DataPoint[], options?: AddPointsOptions) => void;
        addPointsIncremental: (points: DataPoint[], options?: IncrementalAddPointsOptions) => void;
        updateDataIncremental: (nextData: DataPoint[]) => void;
        getIncrementalState: () => IncrementalRenderState;
        pauseIncremental: () => void;
        resumeIncremental: () => void;
        setIncrementalOptions: (options: Partial<IncrementalRenderOptions>) => void;
      }

      // createChart를 전역으로 사용 가능하도록 선언
      declare function createChart(
        container: HTMLElement,
        dataset: Dataset,
        config: ChartConfig
      ): ChartHandle;
      `,
      'ts:playground-globals.d.ts'
    );

    // 에디터 포커스
    editor.focus();
  };

  // 코드 변경 핸들러
  const handleChange = (value: string | undefined) => {
    const newCode = value ?? '';
    setCode(newCode);
    onChange?.(newCode);
  };

  // 초기 코드가 변경되면 에디터 업데이트
  useEffect(() => {
    if (editorRef.current && initialCode !== code) {
      setCode(initialCode);
    }
  }, [initialCode]);

  return (
    <div className="live-code-editor border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <Editor
        height={height}
        language={language}
        value={code}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme={theme}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          padding: { top: 10, bottom: 10 },
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
        }}
      />
    </div>
  );
}
