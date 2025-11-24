/**
 * ChartExample - 재사용 가능한 차트 예제 컴포넌트
 * 미리 정의된 차트 예제와 소스 코드 토글 기능 제공
 */

import { useState, useEffect, useRef } from 'react';
import type { ChartConfig, Dataset } from '@xelstack/chart-core';

interface ChartExampleProps {
  /** 차트 타입 */
  chartType: 'line' | 'bar' | 'pie' | 'scatter';
  /** 차트 설정 */
  config: ChartConfig;
  /** 데이터셋 */
  data: Dataset;
  /** 예제 코드 */
  code: string;
  /** 예제 제목 */
  title?: string;
  /** 예제 설명 */
  description?: string;
}

export default function ChartExample({
  chartType,
  config,
  data,
  code,
  title,
  description,
}: ChartExampleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const loadChart = async () => {
      const { createChart } = await import('@xelstack/chart-core');

      // 컨테이너 초기화
      if (containerRef.current) {
        containerRef.current.innerHTML = '';

        // 차트 생성
        createChart(containerRef.current, data, {
          ...config,
          type: chartType,
        });
      }
    };

    void loadChart();
  }, [chartType, config, data]);

  const handleCopy = () => {
    void (async () => {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
    })();
  };

  return (
    <div className="chart-example border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* 헤더 */}
      {((title !== undefined && title !== '') ||
        (description !== undefined && description !== '')) && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {title !== undefined && title !== '' && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
          )}
          {description !== undefined && description !== '' && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          )}
        </div>
      )}

      {/* 차트 컨테이너 */}
      <div className="p-4 bg-white dark:bg-gray-900">
        <div ref={containerRef} className="min-h-[400px]" />
      </div>

      {/* 코드 토글 */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setShowCode(!showCode)}
          className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
        >
          <span>{showCode ? '코드 숨기기' : '코드 보기'}</span>
          <span className="text-xs">{showCode ? '▲' : '▼'}</span>
        </button>

        {showCode && (
          <div className="relative bg-gray-900 dark:bg-gray-950">
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              {copied ? '복사됨!' : '복사'}
            </button>
            <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
              <code>{code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
