import React, { useState, useMemo, useEffect } from 'react';
import { AiTool, SortOption, FirebaseTool, ToolInput } from './types';
import ToolCard from './components/ToolCard';
import FilterControls from './components/FilterControls';
import { SiteStatistics } from './components/SiteStatistics';
import UserAuth from './components/UserAuth';
import AddToolModal from './components/AddToolModal';
import { ToastContainer } from './src/components/Toast';
import Pagination from './components/Pagination';
import { ToolListSkeleton, ChartSkeleton, FilterSkeleton } from './src/components/LoadingSkeleton';
import { AuthProvider, useAuthContext } from './src/contexts/AuthContext';
import { useTools } from './src/hooks/useTools';
import { useToast } from './src/hooks/useToast';
import { isFirebaseConfigured } from './src/lib/firebase';
import { AI_TOOLS_DATA, CATEGORIES } from './constants';



/**
 * 에러 표시 컴포넌트
 */
const ErrorDisplay: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="text-center py-12">
    <div className="max-w-md mx-auto">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 className="text-lg font-medium text-red-800 mb-2">데이터 로딩 오류</h3>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
        >
          다시 시도
        </button>
      </div>
    </div>
  </div>
);

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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOption>('created_desc');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [freeOnly, setFreeOnly] = useState(false);
  const [isAddToolModalOpen, setIsAddToolModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // 페이징 설정
  const ITEMS_PER_PAGE = 40;
  
  // 토스트 메시지 관리
  const { toasts, removeToast, showSuccess, showError } = useToast();
  
  // Firebase 설정 확인
  const firebaseConfigured = isFirebaseConfigured();
  
  // Firebase에서 실시간 도구 데이터 가져오기 (Firebase 설정된 경우에만)
  const firebaseData = useTools();
  
  // 데이터 소스 결정 (Firebase 설정 여부에 따라)
  const { data: firebaseTools, isLoading, error, categories, addTool, updateTool, deleteTool } = firebaseConfigured 
    ? firebaseData 
    : { 
        data: [], 
        isLoading: false, 
        error: null, 
        categories: CATEGORIES,
        addTool: async () => { throw new Error('Firebase가 설정되지 않았습니다.'); },
        updateTool: async () => { throw new Error('Firebase가 설정되지 않았습니다.'); },
        deleteTool: async () => { throw new Error('Firebase가 설정되지 않았습니다.'); }
      };

  /**
   * Firebase 도구를 기존 AiTool 형식으로 변환하는 함수
   */
  const convertToAiTool = (firebaseTool: FirebaseTool): AiTool => ({
    category: firebaseTool.category,
    name: firebaseTool.name,
    url: firebaseTool.url,
    description: firebaseTool.description,
    memo: firebaseTool.memo,
    rating: firebaseTool.averageRating, // averageRating을 rating으로 매핑
    plan: firebaseTool.plan
  });

  // 데이터 소스 결정: Firebase 데이터 또는 정적 데이터
  const aiToolsData: (AiTool | FirebaseTool)[] = useMemo(() => {
    // 디버깅용 로그
    console.log('🔍 데이터 소스 결정:', {
      firebaseConfigured,
      firebaseToolsLength: firebaseTools.length,
      isLoading,
      error
    });
    
    if (firebaseConfigured && firebaseTools.length > 0) {
      console.log('✅ Firebase 데이터 사용:', firebaseTools.length + '개');
      // Firebase 도구를 변환하지 않고 그대로 사용 (편집 기능을 위해)
      return firebaseTools;
    }
    // Firebase가 설정되지 않았거나 데이터가 없는 경우 정적 데이터 사용
    console.log('📄 정적 데이터 사용:', AI_TOOLS_DATA.length + '개');
    return AI_TOOLS_DATA;
  }, [firebaseConfigured, firebaseTools, isLoading, error]);

  // 원본 Firebase 데이터 (ToolCard에서 날짜 정보 사용)
  const originalFirebaseTools = useMemo(() => {
    if (firebaseConfigured && firebaseTools.length > 0) {
      return firebaseTools;
    }
    return [];
  }, [firebaseConfigured, firebaseTools]);

  // 기존 필터링 및 정렬 로직 유지
  const filteredAndSortedTools = useMemo(() => {
    console.log('🚀 필터링 시작:', { freeOnly, selectedCategory, searchTerm });
    console.log('📊 원본 데이터:', aiToolsData.length, '개');
    
    let filteredTools = aiToolsData;

    if (selectedCategory !== '전체') {
      filteredTools = filteredTools.filter(tool => tool.category === selectedCategory);
      console.log('📂 카테고리 필터 후:', filteredTools.length, '개');
    }

    if (searchTerm) {
      filteredTools = filteredTools.filter(tool =>
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('🔍 검색 필터 후:', filteredTools.length, '개');
    }

    // 무료 필터 적용
    console.log('💰 무료 필터 체크 상태:', freeOnly);
    if (freeOnly) {
      console.log('🔍 무료 필터 적용 전:', filteredTools.length, '개');
      console.log('📋 전체 도구 plan 값들:', filteredTools.map(tool => ({ name: tool.name, plan: tool.plan })));
      
      filteredTools = filteredTools.filter(tool => {
        const isFree = tool.plan === '무료';
        console.log(`📋 ${tool.name}: plan="${tool.plan}", isFree=${isFree}`);
        return isFree;
      });
      
      console.log('✅ 무료 필터 적용 후:', filteredTools.length, '개');
      console.log('✅ 필터링된 도구들:', filteredTools.map(tool => ({ name: tool.name, plan: tool.plan })));
    }

    return [...filteredTools].sort((a, b) => {
      // 타입 가드 함수
      const isFirebaseTool = (tool: AiTool | FirebaseTool): tool is FirebaseTool => 'averageRating' in tool;
      const getToolRating = (tool: AiTool | FirebaseTool): number => 
        isFirebaseTool(tool) ? tool.averageRating : tool.rating;
      
      switch (sortOrder) {
        case 'rating_desc':
          return getToolRating(b) - getToolRating(a);
        case 'rating_asc':
          return getToolRating(a) - getToolRating(b);
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'created_desc':
        case 'created_asc':
        case 'updated_desc':
        case 'updated_asc':
          // 정적 데이터에는 날짜 정보가 없으므로 이름순으로 정렬
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [aiToolsData, searchTerm, sortOrder, selectedCategory, freeOnly]);

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
  }, [searchTerm, selectedCategory, sortOrder, freeOnly]);

  /**
   * 에러 발생 시 재시도 함수
   */
  const handleRetry = () => {
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

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      {/* Dev Canvas 카드 - 좌측 상단 고정 */}
      <div className="fixed top-4 left-4 z-50">
        <a
          href="https://dev-canvas-pi.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
        >
          <div className="px-3 py-2 flex items-center gap-2">
            <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="text-sm">
              <div className="font-semibold leading-tight">Dev Canvas</div>
              <div className="text-xs opacity-90">오픈소스 허브</div>
            </div>
          </div>
        </a>
      </div>

      <header className="text-center mb-12">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">Tech Toolkit Hub</h1>
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

        {/* 새 도구 추가 버튼 (로그인한 사용자만 표시) */}
        {isAuthenticated && (
          <div className="mb-8 flex justify-center">
            <button
              onClick={() => setIsAddToolModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 text-white font-bold rounded-lg shadow-md hover:bg-sky-600 transition-all duration-200 transform hover:scale-105"
              disabled={!firebaseConfigured}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              새 도구 추가하기
              {!firebaseConfigured && <span className="text-xs">(Firebase 필요)</span>}
            </button>
          </div>
        )}
      </header>

      {/* 에러 상태 처리 (Firebase 설정된 경우에만) */}
      {firebaseConfigured && error && (
        <ErrorDisplay error={error} onRetry={handleRetry} />
      )}

      {/* 로딩 및 정상 상태 처리 */}
      {(!firebaseConfigured || !error) && (
        <>
          <FilterControls
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortOrder={sortOrder}
            onSortChange={(value: string) => setSortOrder(value as SortOption)}
            freeOnly={freeOnly}
            onFreeOnlyChange={setFreeOnly}
          />

          {/* 사이트 주요 통계 정보 */}
          {(!firebaseConfigured || (!isLoading && aiToolsData.length > 0)) && (
            <section className="my-8">
              <SiteStatistics data={aiToolsData} />
            </section>
          )}

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
                      onUpdateTool={firebaseConfigured ? handleUpdateTool : undefined}
                      onDeleteTool={firebaseConfigured ? handleDeleteTool : undefined}
                      categories={categories}
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
        <p className="text-slate-500 text-sm">Tech Toolkit Hub | 정보는 주기적으로 업데이트될 수 있습니다.</p>
      </footer>

      {/* 도구 추가 모달 */}
      <AddToolModal
        isOpen={isAddToolModalOpen}
        onClose={() => setIsAddToolModalOpen(false)}
        onAddTool={handleAddTool}
        categories={categories}
        onSuccess={showSuccess}
        onError={showError}
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
    </AuthProvider>
  );
}

export default App;