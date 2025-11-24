/**
 * DataEditor - 데이터셋 편집 컴포넌트
 * 데이터 포인트 추가/수정/삭제, CSV import 지원
 */

import { useState } from 'react';
import type { Dataset, DataPoint } from '@xelstack/chart-core';

interface DataEditorProps {
  /** 초기 데이터셋 */
  initialData: Dataset;
  /** 데이터 변경 콜백 */
  onChange?: (data: Dataset) => void;
}

export default function DataEditor({ initialData, onChange }: DataEditorProps) {
  const [points, setPoints] = useState<DataPoint[]>(initialData.points);
  const [newX, setNewX] = useState('');
  const [newY, setNewY] = useState('');

  // 포인트 추가
  const handleAdd = () => {
    if (!newX || !newY) return;

    const x = Number.isNaN(Number(newX)) ? newX : Number(newX);
    const y = Number(newY);

    if (Number.isNaN(y)) {
      alert('Y 값은 숫자여야 합니다');
      return;
    }

    const newPoints = [...points, { x, y }];
    setPoints(newPoints);
    onChange?.({ points: newPoints });

    // 입력 필드 초기화
    setNewX('');
    setNewY('');
  };

  // 포인트 삭제
  const handleDelete = (index: number) => {
    const newPoints = points.filter((_, i) => i !== index);
    setPoints(newPoints);
    onChange?.({ points: newPoints });
  };

  // 포인트 수정
  const handleEdit = (index: number, field: 'x' | 'y', value: string) => {
    const newPoints = [...points];
    if (field === 'x') {
      newPoints[index].x = Number.isNaN(Number(value)) ? value : Number(value);
    } else {
      newPoints[index].y = Number(value);
    }
    setPoints(newPoints);
    onChange?.({ points: newPoints });
  };

  // CSV import
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((line) => line.trim());

      const newPoints: DataPoint[] = [];

      lines.forEach((line, index) => {
        // 첫 줄이 헤더인지 확인
        if (index === 0 && (line.toLowerCase().includes('x') || line.toLowerCase().includes('y'))) {
          return; // 헤더 스킵
        }

        const [xStr, yStr] = line.split(',').map((s) => s.trim());
        if (!xStr || !yStr) return;

        const x = Number.isNaN(Number(xStr)) ? xStr : Number(xStr);
        const y = Number(yStr);

        if (!Number.isNaN(y)) {
          newPoints.push({ x, y });
        }
      });

      if (newPoints.length > 0) {
        setPoints(newPoints);
        onChange?.({ points: newPoints });
      }
    };

    reader.readAsText(file);
  };

  // 모든 데이터 삭제
  const handleClear = () => {
    if (confirm('모든 데이터를 삭제하시겠습니까?')) {
      setPoints([]);
      onChange?.({ points: [] });
    }
  };

  return (
    <div className="data-editor border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          데이터 편집 ({points.length}개 포인트)
        </span>
        <div className="flex items-center gap-2">
          {/* CSV Import */}
          <label className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer">
            CSV 가져오기
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
            />
          </label>
          {/* 전체 삭제 */}
          <button
            onClick={handleClear}
            className="px-2 py-1 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            전체 삭제
          </button>
        </div>
      </div>

      {/* 데이터 테이블 */}
      <div className="max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left">Index</th>
              <th className="px-4 py-2 text-left">X</th>
              <th className="px-4 py-2 text-left">Y</th>
              <th className="px-4 py-2 text-right">작업</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point, index) => (
              <tr
                key={index}
                className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                  {index}
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={String(point.x)}
                    onChange={(e) => handleEdit(index, 'x', e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={point.y}
                    onChange={(e) => handleEdit(index, 'y', e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm"
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => handleDelete(index)}
                    className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 새 포인트 추가 */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <input
          type="text"
          placeholder="X 값"
          value={newX}
          onChange={(e) => setNewX(e.target.value)}
          className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm"
        />
        <input
          type="number"
          placeholder="Y 값"
          value={newY}
          onChange={(e) => setNewY(e.target.value)}
          className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
        >
          추가
        </button>
      </div>
    </div>
  );
}
