/**
 * Playground - 통합 플레이그라운드
 * 에디터와 미리보기를 결합한 완전한 인터랙티브 환경
 */

import { useState, useEffect } from 'react';
import LiveCodeEditor from './LiveCodeEditor';
import LivePreview from './LivePreview';

interface PlaygroundProps {
  /** 초기 코드 */
  initialCode: string;
  /** 플레이그라운드 제목 */
  title?: string;
  /** 에디터 높이 */
  editorHeight?: string;
}

export default function Playground({
  initialCode,
  title = '플레이그라운드',
  editorHeight = '400px',
}: PlaygroundProps) {
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<Error | null>(null);
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal');

  // 템플릿 로드 이벤트 리스너
  useEffect(() => {
    const handleLoadTemplate = (event: Event) => {
      const customEvent = event as CustomEvent<{ code: string }>;
      if (customEvent.detail?.code) {
        setCode(customEvent.detail.code);
        setError(null);
      }
    };

    window.addEventListener('loadTemplate', handleLoadTemplate);
    return () => {
      window.removeEventListener('loadTemplate', handleLoadTemplate);
    };
  }, []);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setError(null);
  };

  const handleError = (err: Error) => {
    setError(err);
  };

  const handleReset = () => {
    setCode(initialCode);
    setError(null);
  };

  const handleShare = () => {
    void (async () => {
      try {
        // Base64로 코드 인코딩
        const encodedCode = btoa(encodeURIComponent(code));
        const shareUrl = `${window.location.origin}${window.location.pathname}?code=${encodedCode}`;

        // 클립보드에 복사
        await navigator.clipboard.writeText(shareUrl);
        alert('공유 URL이 클립보드에 복사되었습니다!');
      } catch (err) {
        console.error('Failed to copy URL:', err);
        alert('URL 복사에 실패했습니다.');
      }
    })();
  };

  return (
    <div className="playground border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {/* 레이아웃 전환 버튼 */}
          <button
            onClick={() =>
              setLayout(layout === 'horizontal' ? 'vertical' : 'horizontal')
            }
            className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
            title="레이아웃 전환"
          >
            {layout === 'horizontal' ? '세로 분할' : '가로 분할'}
          </button>

          {/* 초기화 버튼 */}
          <button
            onClick={handleReset}
            className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
            title="초기 코드로 되돌리기"
          >
            초기화
          </button>

          {/* 공유 버튼 */}
          <button
            onClick={handleShare}
            className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
            title="코드 공유 URL 생성"
          >
            공유
          </button>
        </div>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2">
            <span className="text-red-600 dark:text-red-400">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                에러 발생
              </p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                {error.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 에디터 + 미리보기 */}
      <div
        className={`flex ${
          layout === 'horizontal' ? 'flex-row' : 'flex-col'
        }`}
      >
        {/* 에디터 */}
        <div
          className={`${
            layout === 'horizontal' ? 'w-1/2 border-r' : 'border-b'
          } border-gray-200 dark:border-gray-700`}
        >
          <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            코드 편집기
          </div>
          <LiveCodeEditor
            initialCode={code}
            onChange={handleCodeChange}
            height={editorHeight}
          />
        </div>

        {/* 미리보기 */}
        <div className={layout === 'horizontal' ? 'w-1/2' : ''}>
          <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            미리보기
          </div>
          <LivePreview code={code} onError={handleError} />
        </div>
      </div>
    </div>
  );
}
