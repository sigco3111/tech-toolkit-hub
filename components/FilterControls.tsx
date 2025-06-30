import React, { useState, useEffect } from 'react';
import { useDebounce } from '../src/utils/performance';

interface FilterControlsProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortOrder: string;
  onSortChange: (order: string) => void;
  freeOnly: boolean;
  onFreeOnlyChange: (freeOnly: boolean) => void;
  bookmarkedOnly?: boolean;
  onBookmarkedOnlyChange?: (bookmarked: boolean) => void;
  isAuthenticated?: boolean;
  onAddTool?: () => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
  sortOrder,
  onSortChange,
  freeOnly,
  onFreeOnlyChange,
  bookmarkedOnly = false,
  onBookmarkedOnlyChange,
  isAuthenticated = false,
  onAddTool,
}) => {
  // 로컬 검색어 상태 (즉시 UI 업데이트용)
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  
  // 카테고리 필터 토글 상태 (모바일에서 접었다 펼치기)
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);
  
  // 화면 크기 감지 상태
  const [isMobile, setIsMobile] = useState(false);
  
  // 화면 크기 변화 감지
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // 데스크톱으로 전환 시 카테고리 항상 펼침
      if (!mobile) {
        setIsCategoryExpanded(true);
      }
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  // 디바운스된 검색 함수 (500ms 지연)
  const debouncedSearch = useDebounce(onSearchChange, 500);
  
  // 검색어가 외부에서 변경될 때 로컬 상태 동기화
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);
  
  // 로컬 검색어 변경 시 디바운스된 검색 실행
  useEffect(() => {
    debouncedSearch(localSearchTerm);
  }, [localSearchTerm, debouncedSearch]);
  
  // 북마크 필터 변경 핸들러
  const handleBookmarkChange = (checked: boolean) => {
    if (onBookmarkedOnlyChange) {
      console.log('🔖 FilterControls - 북마크 필터 상태 변경:', checked);
      onBookmarkedOnlyChange(checked);
    }
  };
  
  /**
   * 카테고리 버튼 클릭 핸들러
   */
  const handleCategoryClick = (category: string) => {
    try {
      console.log('📂 카테고리 클릭:', category);
      
      // 부모 컴포넌트에 카테고리 변경 전달
      onCategoryChange(category);
      
      // 모바일에서 카테고리 선택 후 자동으로 접기
      if (isMobile) {
        setIsCategoryExpanded(false);
      }
    } catch (error) {
      console.error('❌ 카테고리 클릭 처리 중 오류:', error);
      // 에러 처리는 부모 컴포넌트에서 담당
    }
  };
  
  return (
    <div className="bg-white p-3 md:p-4 rounded-xl shadow-md mb-6 md:mb-8 sticky top-2 md:top-4 z-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="search-input" className="block text-sm font-medium text-slate-700 mb-1">이름으로 검색</label>
          <input
            type="text"
            id="search-input"
            placeholder="예: ChatGPT, Suno..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="sort-select" className="block text-sm font-medium text-slate-700 mb-1">정렬 기준</label>
          <select
            id="sort-select"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition bg-white"
            value={sortOrder}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="rating_desc">별점 높은 순</option>
            <option value="rating_asc">별점 낮은 순</option>
            <option value="name_asc">이름 오름차순</option>
            <option value="name_desc">이름 내림차순</option>
            <option value="created_desc">최신 등록 순</option>
            <option value="created_asc">오래된 등록 순</option>
            <option value="updated_desc">최근 업데이트 순</option>
            <option value="updated_asc">오래된 업데이트 순</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => onFreeOnlyChange(e.target.checked)}
              className="w-4 h-4 text-sky-600 bg-white border-slate-300 rounded focus:ring-sky-500 focus:ring-2"
            />
            무료 도구만 표시
          </label>
          
          {/* 북마크 필터 옵션 */}
          <label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${
            isAuthenticated ? 'text-slate-700' : 'text-slate-400'
          }`}>
            <input
              type="checkbox"
              checked={bookmarkedOnly}
              onChange={(e) => handleBookmarkChange(e.target.checked)}
              disabled={!isAuthenticated}
              className={`w-4 h-4 bg-white border-slate-300 rounded focus:ring-2 ${
                isAuthenticated 
                  ? 'text-amber-500 focus:ring-amber-500' 
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            />
            북마크만 표시
            {!isAuthenticated && (
              <span className="text-xs text-slate-400 ml-1">(로그인 필요)</span>
            )}
          </label>
        </div>
      </div>
      
      {/* 도구 추가 버튼과 카테고리 필터 헤더 */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">카테고리 필터</label>
          
          {/* 데스크톱에서 현재 선택된 카테고리 표시 */}
          <span className="hidden md:inline text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            {selectedCategory}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 모바일에서만 보이는 토글 버튼 */}
          <button
            onClick={() => setIsCategoryExpanded(!isCategoryExpanded)}
            className="md:hidden flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-slate-800 transition-colors duration-200"
            aria-label={isCategoryExpanded ? '카테고리 접기' : '카테고리 펼치기'}
          >
            <span>{isCategoryExpanded ? '접기' : '펼치기'}</span>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${isCategoryExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* 도구 추가 버튼 */}
          {isAuthenticated && onAddTool && (
            <button
              onClick={onAddTool}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>도구 추가</span>
            </button>
          )}
        </div>
      </div>
      
      {/* 카테고리 버튼들 */}
      <div className={`
        flex flex-wrap gap-2 transition-all duration-300 ease-in-out mt-2
        ${isCategoryExpanded ? 'md:flex' : 'hidden md:flex'}
        ${isCategoryExpanded ? 'max-h-96 opacity-100' : 'md:max-h-96 md:opacity-100 max-h-0 opacity-0 overflow-hidden'}
      `}>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={`px-4 py-2 text-sm font-medium rounded-full shadow-sm hover:bg-slate-100 transition-colors duration-200 border border-slate-200 ${
              selectedCategory === category
                ? 'bg-sky-500 text-white font-bold shadow-md'
                : 'text-slate-700 bg-white'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      
      {/* 모바일에서 카테고리가 접혀있을 때 현재 선택된 카테고리 표시 */}
      {!isCategoryExpanded && (
        <div className="md:hidden mt-2">
          <span className="inline-flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500">현재 선택:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              selectedCategory === '전체'
                ? 'bg-slate-200 text-slate-700'
                : 'bg-sky-100 text-sky-800'
            }`}>
              {selectedCategory}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

export default FilterControls;