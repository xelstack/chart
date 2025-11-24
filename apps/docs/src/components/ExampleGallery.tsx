/**
 * ExampleGallery - 예제 갤러리 컴포넌트
 * 그리드 레이아웃, 카테고리 필터, 검색 기능
 */

import { useState } from 'react';

export interface Example {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  code: string;
  tags: string[];
}

interface ExampleGalleryProps {
  /** 예제 목록 */
  examples: Example[];
  /** 예제 클릭 핸들러 */
  onExampleClick?: (example: Example) => void;
}

export default function ExampleGallery({
  examples,
  onExampleClick,
}: ExampleGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 카테고리 추출
  const categories = ['all', ...new Set(examples.map((ex) => ex.category))];

  // 필터링
  const filteredExamples = examples.filter((example) => {
    const matchesSearch =
      searchQuery === '' ||
      example.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      example.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      example.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === 'all' || example.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="example-gallery">
      {/* 필터 및 검색 */}
      <div className="mb-6 space-y-4">
        {/* 검색 */}
        <div>
          <input
            type="text"
            placeholder="예제 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg"
          />
        </div>

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {category === 'all' ? '전체' : category}
            </button>
          ))}
        </div>
      </div>

      {/* 결과 카운트 */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {filteredExamples.length}개의 예제
      </p>

      {/* 예제 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExamples.map((example) => (
          <div
            key={example.id}
            onClick={() => onExampleClick?.(example)}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
          >
            {/* 썸네일 */}
            {example.thumbnail !== undefined && example.thumbnail !== '' && (
              <div className="aspect-video bg-gray-100 dark:bg-gray-800">
                <img
                  src={example.thumbnail}
                  alt={example.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* 내용 */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {example.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {example.description}
              </p>

              {/* 태그 */}
              <div className="flex flex-wrap gap-1">
                {example.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 결과 없음 */}
      {filteredExamples.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            검색 결과가 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}
