import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

/**
 * 페이징 컴포넌트
 * 현재 페이지, 총 페이지 수를 표시하고 페이지 네비게이션을 제공합니다.
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage
}) => {
  // 페이지가 1개 이하면 페이징을 표시하지 않음
  if (totalPages <= 1) {
    return null;
  }

  // 현재 페이지 기준으로 표시할 페이지 번호들 계산
  const getVisiblePages = () => {
    const visibleCount = 5; // 표시할 페이지 번호 개수
    const half = Math.floor(visibleCount / 2);
    
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + visibleCount - 1);
    
    // 끝에서 시작점 조정
    if (end - start + 1 < visibleCount) {
      start = Math.max(1, end - visibleCount + 1);
    }
    
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  /**
   * 페이지 변경 핸들러
   */
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
      // 페이지 변경 시 상단으로 스크롤
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-8 mb-8">
      {/* 페이지 정보 */}
      <div className="text-sm text-slate-600">
        전체 <span className="font-semibold text-slate-900">{totalItems}</span>개 중{' '}
        <span className="font-semibold text-slate-900">{startItem}</span>-
        <span className="font-semibold text-slate-900">{endItem}</span>개 표시
      </div>

      {/* 페이지 네비게이션 */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        {/* 첫 페이지 버튼 */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="px-2 sm:px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-l-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          title="첫 페이지"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        {/* 이전 페이지 버튼 */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 sm:px-3 py-2 text-sm font-medium text-slate-700 bg-white border-t border-b border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          title="이전 페이지"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* 페이지 번호 버튼들 */}
        {visiblePages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 sm:px-4 py-2 text-sm font-medium border-t border-b border-slate-300 transition-colors duration-200 ${
              page === currentPage
                ? 'bg-sky-500 text-white border-sky-500 z-10'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {page}
          </button>
        ))}

        {/* 다음 페이지 버튼 */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 sm:px-3 py-2 text-sm font-medium text-slate-700 bg-white border-t border-b border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          title="다음 페이지"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* 마지막 페이지 버튼 */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-2 sm:px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-r-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          title="마지막 페이지"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 페이지 점프 (총 페이지가 10개 이상일 때만 표시) */}
      {totalPages >= 10 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">페이지로 이동:</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (!isNaN(page)) {
                handlePageChange(page);
              }
            }}
            className="w-16 px-2 py-1 text-center border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
          <span className="text-slate-600">/ {totalPages}</span>
        </div>
      )}
    </div>
  );
};

export default Pagination; 