import React, { useState, useMemo, useEffect } from 'react';
import { AiTool, SortOption, FirebaseTool, ToolInput } from './types';
import ToolCard from './components/ToolCard';
import FilterControls from './components/FilterControls';
import { SiteStatistics } from './components/SiteStatistics';
import UserAuth from './components/UserAuth';
import AddToolModal from './components/AddToolModal';
import ReviewModal from './components/ReviewModal';
import { ToastContainer } from './src/components/Toast';
import Pagination from './components/Pagination';
import { ToolListSkeleton, ChartSkeleton, FilterSkeleton } from './src/components/LoadingSkeleton';
import { AuthProvider, useAuthContext } from './src/contexts/AuthContext';
import { useTools } from './src/hooks/useTools';
import { useToast } from './src/hooks/useToast';
import { useBookmarks } from './src/hooks/useBookmarks';
import { isFirebaseConfigured } from './src/lib/firebase';
import { Analytics } from "@vercel/analytics/react"
import StatisticsModal from './components/StatisticsModal';
// 내보내기 관련 import 제거
// import { exportToolsToJson, downloadJsonFile } from './src/utils/exportImport';
 
/**
 * 에러 표시 컴포넌트
 */
const ErrorDisplay: React.FC<{ error: string | null; onRetry: () => void }> = ({ error, onRetry }) => {
  // Firestore 인덱스 오류 확인 및 링크 추출
  const isIndexError = error?.includes('The query requires an index');
  const indexLink = isIndexError 
    ? error?.match(/https:\/\/console\.firebase\.google\.com[^\s)]+/)?.[0] 
    : null;
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 my-8 text-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-red-100 p-3">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-red-800">데이터 로딩 오류</h3>
        
        {isIndexError ? (
          <div className="text-sm text-red-700 mb-4 max-w-2xl">
            <p className="mb-2">Firestore 인덱스가 필요한 쿼리입니다. 다음 단계를 따라 해결해주세요:</p>
            <ol className="list-decimal text-left pl-5 mb-4">
              <li className="mb-1">아래 링크를 클릭하여 Firebase 콘솔로 이동합니다.</li>
              <li className="mb-1">콘솔에서 '인덱스 생성' 버튼을 클릭합니다.</li>
              <li className="mb-1">인덱스 생성이 완료될 때까지 기다립니다 (약 1-5분 소요).</li>
              <li>완료 후 아래 '다시 시도' 버튼을 클릭합니다.</li>
            </ol>
            {indexLink && (
              <a 
                href={indexLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 mb-4"
              >
                Firebase 콘솔에서 인덱스 생성
              </a>
            )}
            <p className="text-xs text-red-600 mt-2">
              또는 카테고리를 '전체'로 변경하여 계속 사용할 수 있습니다.
            </p>
          </div>
        ) : (
          <p className="text-sm text-red-700 mb-4">{error}</p>
        )}
        
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>다시 시도</span>
        </button>
      </div>
    </div>
  );
};

/**
 * 빈 데이터 표시 컴포넌트
 */
const EmptyState: React.FC = () => (
  <div className="text-center py-12">
    <div className="max-w-md mx-auto">
      <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <h3 className="text-lg font-medium text-slate-700 mb-2">등록된 도구가 없습니다</h3>
      <p className="text-sm text-slate-500">
        로그인하시면 새로운 도구를 추가할 수 있습니다.
      </p>
    </div>
  </div>
);

/**
 * 메인 앱 컨텐츠 컴포넌트 (AuthContext 사용)
 */
const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuthContext();
  
  // 필터 상태를 하나의 객체로 관리
  const [filters, setFilters] = useState({
    freeOnly: false,
    bookmarkedOnly: false,
    selectedCategory: '전체',
    searchTerm: '',
    isAuthenticated: false,
  });
  
  // 정렬 상태는 별도로 관리 (기존 코드와의 호환성)
  const [sortOrder, setSortOrder] = useState<SortOption>('updated_desc');
  const [isAddToolModalOpen, setIsAddToolModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // 리뷰 모달 상태 관리
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<AiTool | FirebaseTool | null>(null);
  
  // 통계 모달 상태 관리
  const [isStatisticsModalOpen, setIsStatisticsModalOpen] = useState(false);
  
  // 내보내기 상태 관리 제거
  // const [isExporting, setIsExporting] = useState(false);
  
  // 인증 상태가 변경될 때 필터 상태 업데이트
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      isAuthenticated,
      // 로그인하지 않은 상태에서는 북마크 필터 비활성화
      bookmarkedOnly: isAuthenticated ? prev.bookmarkedOnly : false
    }));
  }, [isAuthenticated]);
  
  // 페이징 설정
  const ITEMS_PER_PAGE = 40;
  
  // 토스트 메시지 관리
  const { toasts, removeToast, showSuccess, showError } = useToast();
  
  // Firebase 설정 확인
  const firebaseConfigured = isFirebaseConfigured();
  
  // 사용자 북마크 데이터 가져오기
  const { bookmarkedToolIds, isLoading: isBookmarksLoading, error: bookmarksError, refreshBookmarks } = useBookmarks();
  
  // 북마크 ID 목록 디버깅
  useEffect(() => {
    console.log('🔖 App - 북마크된 도구 ID 목록:', bookmarkedToolIds);
    console.log('🔖 App - 북마크 로딩 상태:', isBookmarksLoading);
    console.log('🔖 App - 북마크 에러:', bookmarksError);
  }, [bookmarkedToolIds, isBookmarksLoading, bookmarksError]);
  
  // Firebase에서 실시간 도구 데이터 가져오기
  const { data: firebaseTools, isLoading, error, categories, addTool, updateTool, deleteTool } = useTools(filters.selectedCategory, sortOrder);
  
  // 디버깅용 로그
  console.log('🔍 Firebase 데이터 조회 결과:', {
    firebaseConfigured,
    firebaseToolsLength: firebaseTools.length,
    isLoading,
    error
  });

  // 데이터 소스 (Firebase 데이터만 사용)
  const aiToolsData: FirebaseTool[] = firebaseTools;

  // 기존 필터링 및 정렬 로직에 북마크 필터링 추가
  const filteredAndSortedTools = useMemo(() => {
    console.log('🚀 필터링 시작:', { 
      freeOnly: filters.freeOnly, 
      bookmarkedOnly: filters.bookmarkedOnly, 
      selectedCategory: filters.selectedCategory, 
      searchTerm: filters.searchTerm,
      isAuthenticated,
      isBookmarksLoading,
      bookmarkedToolIds: bookmarkedToolIds.length
    });
    console.log('📊 원본 데이터:', aiToolsData.length, '개');
    
    let filteredTools = aiToolsData;

    // 카테고리 필터링
    if (filters.selectedCategory !== '전체') {
      filteredTools = filteredTools.filter(tool => tool.category === filters.selectedCategory);
      console.log('📂 카테고리 필터 후:', filteredTools.length, '개');
    }

    // 검색어 필터링
    if (filters.searchTerm) {
      filteredTools = filteredTools.filter(tool =>
        tool.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
      console.log('🔍 검색 필터 후:', filteredTools.length, '개');
    }

    // 무료 필터 적용
    if (filters.freeOnly) {
      filteredTools = filteredTools.filter(tool => tool.plan === '무료');
      console.log('💰 무료 필터 적용 후:', filteredTools.length, '개');
    }
    
    // 북마크 필터 적용
    if (filters.bookmarkedOnly && isAuthenticated && firebaseConfigured) {
      console.log('🔖 북마크 필터 적용 전:', filteredTools.length, '개');
      console.log('🔖 북마크된 도구 ID 목록:', bookmarkedToolIds);
      
      // 북마크된 도구 ID 목록이 비어있는지 확인
      if (bookmarkedToolIds.length === 0) {
        console.log('⚠️ 북마크된 도구가 없습니다.');
        return []; // 북마크가 없으면 빈 배열 반환
      }
      
      // 북마크 필터링 적용
      filteredTools = filteredTools.filter(tool => {
        const toolId = tool.id;
        const isBookmarked = bookmarkedToolIds.includes(toolId);
        
        console.log(`🔖 도구 "${tool.name}" (ID: ${toolId}) 북마크 여부:`, isBookmarked);
        return isBookmarked;
      });
      
      console.log('✅ 북마크 필터 적용 후:', filteredTools.length, '개');
      console.log('✅ 북마크 필터링된 도구들:', filteredTools.map(tool => tool.name));
    }

    // 정렬 로직
    return [...filteredTools].sort((a, b) => {
      switch (sortOrder) {
        case 'rating_desc':
          return b.averageRating - a.averageRating;
        case 'rating_asc':
          return a.averageRating - b.averageRating;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'created_desc':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'created_asc':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'updated_desc':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case 'updated_asc':
          return a.updatedAt.getTime() - b.updatedAt.getTime();
        default:
          return b.updatedAt.getTime() - a.updatedAt.getTime();
      }
    });
  }, [
    filters.selectedCategory,
    filters.searchTerm,
    filters.freeOnly,
    filters.bookmarkedOnly,
    sortOrder,
    aiToolsData,
    bookmarkedToolIds,
    isAuthenticated,
    firebaseConfigured,
    isBookmarksLoading
  ]);

  // 페이징 처리된 데이터
  const paginatedTools = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedTools.slice(startIndex, endIndex);
  }, [filteredAndSortedTools, currentPage, ITEMS_PER_PAGE]);

  // 총 페이지 수 계산
  const totalPages = Math.ceil(filteredAndSortedTools.length / ITEMS_PER_PAGE);

  // 필터나 검색이 변경될 때 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.searchTerm, filters.selectedCategory, sortOrder, filters.freeOnly, filters.bookmarkedOnly]);

  /**
   * 에러 발생 시 재시도 함수
   */
  const handleRetry = () => {
    console.log('🔄 데이터 로딩 재시도');
    window.location.reload();
  };

  /**
   * 새 도구 추가 핸들러
   */
  const handleAddTool = async (toolData: ToolInput): Promise<void> => {
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }
    
    if (!firebaseConfigured) {
      throw new Error('Firebase가 설정되지 않았습니다.');
    }

    await addTool(toolData, user.uid);
  };

  /**
   * 도구 수정 핸들러
   */
  const handleUpdateTool = async (toolId: string, toolData: ToolInput): Promise<void> => {
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }
    
    if (!firebaseConfigured) {
      throw new Error('Firebase가 설정되지 않았습니다.');
    }

    await updateTool(toolId, toolData, user.uid);
  };

  /**
   * 도구 삭제 핸들러
   */
  const handleDeleteTool = async (toolId: string): Promise<void> => {
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }
    
    if (!firebaseConfigured) {
      throw new Error('Firebase가 설정되지 않았습니다.');
    }

    await deleteTool(toolId, user.uid);
  };

  /**
   * 북마크 필터 상태 변경 핸들러
   */
  const handleBookmarkedOnlyChange = (value: boolean) => {
    if (value && !isAuthenticated) {
      showError('북마크 필터를 사용하려면 로그인이 필요합니다.');
      return;
    }
    
    // 북마크 필터 활성화 시 북마크가 없는 경우 알림
    if (value && bookmarkedToolIds.length === 0) {
      showError('북마크된 도구가 없습니다. 먼저 도구를 북마크에 추가해주세요.');
    }
    
    console.log('🔖 북마크 필터 상태 변경:', value);
    setFilters(prev => ({ ...prev, bookmarkedOnly: value }));
  };

  /**
   * 도구 리뷰 모달 열기 함수
   */
  const handleReviewTool = (tool: AiTool | FirebaseTool) => {
    if (!isAuthenticated) {
      showError('리뷰를 작성하려면 로그인이 필요합니다.');
      return;
    }
    
    // 선택된 도구 설정 및 리뷰 모달 열기
    setSelectedTool(tool);
    setIsReviewModalOpen(true);
  };

  /**
   * 북마크 상태 변경 핸들러 (ToolCard에서 호출)
   */
  const handleBookmarkChange = () => {
    console.log('🔖 북마크 상태 변경 감지, 북마크 목록 새로고침');
    refreshBookmarks();
  };

  /**
   * 카테고리 변경 핸들러
   */
  const handleCategoryChange = (category: string) => {
    console.log('📂 카테고리 변경:', category);
    
    try {
      // 카테고리 필터 변경
      setFilters(prev => ({ ...prev, selectedCategory: category }));
      
      // 인덱스 오류가 발생할 경우를 대비한 안내 메시지
      if (category !== '전체' && firebaseConfigured) {
        showSuccess(`'${category}' 카테고리를 적용합니다. 데이터를 불러오는 중...`);
      }
    } catch (error) {
      console.error('❌ 카테고리 필터 변경 중 오류:', error);
      showError('카테고리 필터 적용 중 오류가 발생했습니다.');
    }
  };

  /**
   * 사이트 통계 모달 열기 함수
   */
  const handleOpenStatisticsModal = () => {
    setIsStatisticsModalOpen(true);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <header className="text-center mb-12">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">AI 테크 허브</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">AI와 개발에 필요한 도구를 한 곳에서 탐색해 보세요.</p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <UserAuth />
          </div>
        </div>

        {/* Firebase 설정 안내 (Firebase 미설정 시) */}
        {!firebaseConfigured && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-amber-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm font-medium">
                <strong>개발 모드</strong>: Firebase가 설정되지 않아 정적 데이터를 표시하고 있습니다. 
                실시간 기능을 사용하려면 Firebase를 설정해주세요.
              </p>
            </div>
          </div>
        )}

        {/* 로그인 상태 안내 배너 */}
        {!isAuthenticated && (
          <div className="mb-8 p-4 bg-sky-50 border border-sky-200 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sky-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">
                현재 <strong>읽기 전용 모드</strong>입니다. 로그인하시면 도구 추가, 평점, 댓글 기능을 이용하실 수 있습니다.
              </p>
            </div>
          </div>
        )}

        {/* 새 도구 추가 버튼 제거됨 */}
      </header>

      {/* 에러 상태 처리 (Firebase 설정된 경우에만) */}
      {firebaseConfigured && error && (
        <ErrorDisplay error={error} onRetry={handleRetry} />
      )}

      {/* 로딩 및 정상 상태 처리 */}
      {(!firebaseConfigured || !error) && (
        <>
          {/* 필터 컨트롤 */}
          <div className="mb-6">
            {isLoading ? (
              <FilterSkeleton />
            ) : (
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex-grow">
                    <FilterControls 
                      categories={categories}
                      selectedCategory={filters.selectedCategory}
                      onCategoryChange={handleCategoryChange}
                      searchTerm={filters.searchTerm}
                      onSearchChange={(term) => setFilters(prev => ({ ...prev, searchTerm: term }))}
                      sortOrder={sortOrder}
                      onSortChange={(value: string) => setSortOrder(value as SortOption)}
                      freeOnly={filters.freeOnly}
                      onFreeOnlyChange={(value) => setFilters(prev => ({ ...prev, freeOnly: value }))}
                      bookmarkedOnly={filters.bookmarkedOnly}
                      onBookmarkedOnlyChange={handleBookmarkedOnlyChange}
                      isAuthenticated={isAuthenticated}
                    >
                      {/* 버튼 영역 */}
                      <div className="flex items-center gap-2">
                        {isAuthenticated && (
                          <button
                            onClick={() => setIsAddToolModalOpen(true)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>도구 추가</span>
                          </button>
                        )}
                        <button
                          onClick={handleOpenStatisticsModal}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span>사이트 현황</span>
                        </button>
                      </div>
                    </FilterControls>
                  </div>
                  <div className="text-sm text-gray-600">
                    총 {filteredAndSortedTools.length}개의 도구
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 사이트 주요 통계 정보 - 모달로 대체되어 제거 */}
          {/* {(!firebaseConfigured || (!isLoading && aiToolsData.length > 0)) && (
            <section className="my-8">
              <SiteStatistics data={aiToolsData} />
            </section>
          )} */}

          <main>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-800">도구 목록</h2>
              {(!firebaseConfigured || !isLoading) && (
                <div className="text-slate-500 font-medium">
                  {totalPages > 1 ? (
                    <span>
                      전체 {filteredAndSortedTools.length}개 중 {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedTools.length)}개 표시
                    </span>
                  ) : (
                    <span>{filteredAndSortedTools.length}개 항목</span>
                  )}
                </div>
              )}
            </div>

            {/* 로딩 상태 (Firebase 설정된 경우에만) */}
            {firebaseConfigured && isLoading && <ToolListSkeleton />}

            {/* 빈 데이터 상태 (Firebase 설정된 경우에만) */}
            {firebaseConfigured && !isLoading && aiToolsData.length === 0 && <EmptyState />}

            {/* 검색 결과 없음 */}
            {(!firebaseConfigured || !isLoading) && aiToolsData.length > 0 && filteredAndSortedTools.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-medium text-slate-700 mb-2">검색 결과가 없습니다</h3>
                <p className="text-sm text-slate-500">
                  다른 키워드로 검색하거나 필터를 조정해 보세요.
                </p>
              </div>
            )}

            {/* 도구 목록 */}
            {(!firebaseConfigured || !isLoading) && filteredAndSortedTools.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedTools.map((tool, index) => (
                    <ToolCard 
                      key={`${tool.name}-${index}`} 
                      tool={tool} 
                      onUpdateTool={handleUpdateTool}
                      onDeleteTool={handleDeleteTool}
                      categories={categories}
                      onBookmarkChange={handleBookmarkChange}
                    />
                  ))}
                </div>
                
                {/* 페이징 컴포넌트 */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredAndSortedTools.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
              </>
            )}
          </main>
        </>
      )}

      <footer className="text-center p-6 mt-12 border-t border-slate-200">
        <p className="text-slate-500 text-sm">AI 테크 허브 | 정보는 주기적으로 업데이트될 수 있습니다.</p>
      </footer>

      {/* 도구 추가 모달 */}
      <AddToolModal
        isOpen={isAddToolModalOpen}
        onClose={() => setIsAddToolModalOpen(false)}
        onAddTool={handleAddTool}
        categories={categories}
        onSuccess={showSuccess}
        onError={showError}
        isAdmin={false} // 메인 페이지에서는 어드민이 아님
      />

      {/* 리뷰 모달 */}
      {isReviewModalOpen && selectedTool && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          tool={selectedTool}
          onSuccess={(message) => showSuccess(message)}
          onError={(message) => showError(message)}
        />
      )}

      {/* 통계 모달 */}
      <StatisticsModal
        isOpen={isStatisticsModalOpen}
        onClose={() => setIsStatisticsModalOpen(false)}
        data={aiToolsData}
      />

      {/* 토스트 메시지 컨테이너 */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

/**
 * 메인 App 컴포넌트 (AuthProvider로 래핑)
 */
function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Analytics />
    </AuthProvider>
  );
}

export default App;