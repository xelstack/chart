/**
 * ConfigEditor - JSON 기반 차트 설정 에디터
 * 실시간 검증 및 스키마 지원
 */

import { useState, useEffect } from 'react';
import type { ChartConfig } from '@xelstack/chart-core';

interface ConfigEditorProps {
  /** 초기 설정 */
  initialConfig: ChartConfig;
  /** 설정 변경 콜백 */
  onChange?: (config: ChartConfig) => void;
  /** 높이 */
  height?: string;
}

export default function ConfigEditor({
  initialConfig,
  onChange,
  height = '300px',
}: ConfigEditorProps) {
  const [configText, setConfigText] = useState(
    JSON.stringify(initialConfig, null, 2)
  );
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  // 설정 텍스트 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setConfigText(newText);

    try {
      // JSON 파싱 시도
      const parsed: unknown = JSON.parse(newText);

      // 기본 검증
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('설정은 객체여야 합니다');
      }

      // 타입 가드
      const hasTypeField = (obj: object): obj is { type: unknown } => 'type' in obj;

      if (!hasTypeField(parsed)) {
        throw new Error('type 필드가 필요합니다');
      }

      // 필수 필드 검증
      if (typeof parsed.type !== 'string' || !(['line', 'bar', 'pie', 'scatter'] as const).includes(parsed.type as 'line' | 'bar' | 'pie' | 'scatter')) {
        throw new Error(
          "type 필드가 필요하며 'line', 'bar', 'pie', 'scatter' 중 하나여야 합니다"
        );
      }

      // 유효한 설정
      setError(null);
      setIsValid(true);
      onChange?.(parsed as ChartConfig);
    } catch (err) {
      // 파싱 에러 또는 검증 실패
      const message = err instanceof Error ? err.message : '알 수 없는 에러';
      setError(message);
      setIsValid(false);
    }
  };

  // 초기 설정 변경 시 업데이트
  useEffect(() => {
    setConfigText(JSON.stringify(initialConfig, null, 2));
    setError(null);
    setIsValid(true);
  }, [initialConfig]);

  // 포맷팅 버튼
  const handleFormat = () => {
    try {
      const parsed: unknown = JSON.parse(configText);
      setConfigText(JSON.stringify(parsed, null, 2));
    } catch {
      // 이미 에러 상태일 것임
    }
  };

  return (
    <div className="config-editor border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          차트 설정
        </span>
        <div className="flex items-center gap-2">
          {/* 상태 표시 */}
          {isValid ? (
            <span className="text-xs text-green-600 dark:text-green-400">
              ✓ 유효
            </span>
          ) : (
            <span className="text-xs text-red-600 dark:text-red-400">
              ✗ 오류
            </span>
          )}
          {/* 포맷 버튼 */}
          <button
            onClick={handleFormat}
            className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            포맷
          </button>
        </div>
      </div>

      {/* 에러 표시 */}
      {error !== null && error !== '' && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* JSON 에디터 */}
      <textarea
        value={configText}
        onChange={handleChange}
        className={`w-full p-4 font-mono text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none focus:outline-none ${
          !isValid ? 'border-l-4 border-red-500' : ''
        }`}
        style={{ height }}
        spellCheck={false}
      />

      {/* 도움말 */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <details className="text-xs text-gray-600 dark:text-gray-400">
          <summary className="cursor-pointer hover:text-gray-900 dark:hover:text-gray-200">
            사용 가능한 설정 보기
          </summary>
          <div className="mt-2 space-y-1">
            <p>
              <code className="text-primary-600 dark:text-primary-400">type</code>
              : 'line' | 'bar' | 'pie' | 'scatter' (필수)
            </p>
            <p>
              <code className="text-primary-600 dark:text-primary-400">width</code>
              : number (선택, 기본값: 800)
            </p>
            <p>
              <code className="text-primary-600 dark:text-primary-400">height</code>
              : number (선택, 기본값: 600)
            </p>
            <p>
              <code className="text-primary-600 dark:text-primary-400">title</code>
              : string (선택)
            </p>
            <p>
              <code className="text-primary-600 dark:text-primary-400">colors</code>
              : string[] (선택)
            </p>
            <p>
              <code className="text-primary-600 dark:text-primary-400">showGrid</code>
              : boolean (선택, 기본값: false)
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
