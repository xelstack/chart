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
      lib: ['ES2020', 'DOM'],
      allowNonTsExtensions: true,
      strict: true,
      esModuleInterop: true,
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
          getData: () => Dataset;
          getConfig: () => ChartConfig;
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

      // createChart를 전역으로 사용 가능하도록 선언
      declare function createChart(
        container: HTMLElement,
        dataset: {
          points: Array<{
            x: number | Date | string;
            y: number;
            series?: string;
          }>;
        },
        config: {
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
        }
      ): {
        updateData: (dataset: any) => void;
        updateConfig: (config: any) => void;
        render: () => void;
        destroy: () => void;
        getData: () => any;
        getConfig: () => any;
      };
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
