import { useEffect, useState } from 'react';

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    // Keyboard shortcut: Cmd/Ctrl + K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }

      // ESC to close
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Simple client-side search (can be replaced with Algolia/Pagefind later)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Placeholder for actual search implementation
      console.log('Searching for:', query);
      alert(`Search functionality will be implemented with Algolia DocSearch or Pagefind.\nQuery: "${query}"`);
    }
  };

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Search...</span>
        <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">
          ⌘K
        </kbd>
      </button>

      {/* Search modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearch}>
              <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
                <svg className="w-5 h-5 ml-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search documentation..."
                  className="flex-1 px-4 py-4 text-gray-900 dark:text-gray-100 bg-transparent outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ESC
                </button>
              </div>
            </form>

            {/* Search results placeholder */}
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">
                {query ? `Searching for "${query}"...` : 'Start typing to search'}
              </p>
              <p className="text-xs mt-2 text-gray-400">
                Full search will be implemented with Algolia DocSearch
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
