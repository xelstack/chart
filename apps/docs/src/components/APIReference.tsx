/**
 * APIReference - API 레퍼런스 컴포넌트
 * 자동 생성된 API 문서, 타입 정보, 예제 표시
 */

interface APIMethod {
  name: string;
  description: string;
  signature: string;
  parameters?: {
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }[];
  returns?: {
    type: string;
    description: string;
  };
  example?: string;
}

interface APIReferenceProps {
  /** API 메서드 목록 */
  methods: APIMethod[];
  /** 섹션 제목 */
  title?: string;
}

export default function APIReference({
  methods,
  title = 'API Reference',
}: APIReferenceProps) {
  return (
    <div className="api-reference">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        {title}
      </h2>

      <div className="space-y-8">
        {methods.map((method) => (
          <div
            key={method.name}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            {/* 메서드 헤더 */}
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {method.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {method.description}
              </p>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* 시그니처 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Signature
                </h4>
                <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <code>{method.signature}</code>
                </pre>
              </div>

              {/* 파라미터 */}
              {method.parameters && method.parameters.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Parameters
                  </h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2">Name</th>
                        <th className="text-left py-2">Type</th>
                        <th className="text-left py-2">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {method.parameters.map((param) => (
                        <tr
                          key={param.name}
                          className="border-b border-gray-100 dark:border-gray-800"
                        >
                          <td className="py-2">
                            <code className="text-primary-600 dark:text-primary-400">
                              {param.name}
                            </code>
                            {param.required === true && (
                              <span className="ml-1 text-xs text-red-500">*</span>
                            )}
                          </td>
                          <td className="py-2">
                            <code className="text-sm text-gray-600 dark:text-gray-400">
                              {param.type}
                            </code>
                          </td>
                          <td className="py-2 text-gray-600 dark:text-gray-400">
                            {param.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 반환값 */}
              {method.returns && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Returns
                  </h4>
                  <p className="text-sm">
                    <code className="text-primary-600 dark:text-primary-400">
                      {method.returns.type}
                    </code>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {method.returns.description}
                    </span>
                  </p>
                </div>
              )}

              {/* 예제 */}
              {method.example !== undefined && method.example !== '' && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Example
                  </h4>
                  <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <code>{method.example}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
