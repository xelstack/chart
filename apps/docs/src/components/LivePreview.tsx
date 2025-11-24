/**
 * LivePreview - 실시간 차트 렌더링 미리보기
 * 에러 바운더리와 함께 코드 실행 결과를 표시
 */

import React, { useEffect, useRef, useState, type ReactNode } from 'react';

interface LivePreviewProps {
  /** 실행할 코드 */
  code: string;
  /** 에러 발생 시 표시할 메시지 */
  onError?: (error: Error) => void;
}

// 에러 바운더리 컴포넌트
class ErrorBoundary extends React.Component<
  { children: ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">렌더링 에러</h3>
          <pre className="text-sm text-red-600 dark:text-red-300 whitespace-pre-wrap">
            {this.state.error?.message}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function LivePreview({ code, onError }: LivePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !code) return;

    const executeCode = async () => {
      setIsExecuting(true);
      setError(null);

      try {
        // 컨테이너 초기화
        const container = containerRef.current;
        if (!container) return;

        container.innerHTML = '';

        // 차트 컨테이너 생성
        const chartContainer = document.createElement('div');
        chartContainer.style.width = '100%';
        chartContainer.style.height = '400px';
        container.appendChild(chartContainer);

        // 동적 import로 chart-core 로드
        const chartModule = await import('@xelstack/chart-core');
        const { createChart } = chartModule;

        // Playground: 사용자 코드를 동적으로 실행
        // Function constructor를 사용하여 사용자가 입력한 코드를 실행합니다.
        // 보안 참고: 이는 코드 플레이그라운드의 의도된 동작입니다.
        type CreateChartFn = typeof chartModule.createChart;
        type UserCodeFn = (container: HTMLDivElement, createChart: CreateChartFn) => void;

        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const executeUserCode = Function('container', 'createChart', code) as UserCodeFn;
        executeUserCode(chartContainer, createChart);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      } finally {
        setIsExecuting(false);
      }
    };

    void executeCode();

    // 클린업: 컴포넌트 언마운트 시 컨테이너 정리
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [code, onError]);

  return (
    <div className="live-preview bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <ErrorBoundary onError={onError}>
        {isExecuting && (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 dark:text-gray-400">코드 실행 중...</div>
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">실행 에러</h3>
            <pre className="text-sm text-red-600 dark:text-red-300 whitespace-pre-wrap">
              {error.message}
            </pre>
          </div>
        )}
        <div ref={containerRef} className="min-h-[400px]" />
      </ErrorBoundary>
    </div>
  );
}
