import React, { useState, useMemo } from 'react';
import { AiTool, SortOption, FirebaseTool, ToolInput } from './types';
import ToolCard from './components/ToolCard';
import FilterControls from './components/FilterControls';
import { CategoryChart } from './components/CategoryChart';
import UserAuth from './components/UserAuth';
import AddToolModal from './components/AddToolModal';
import { AuthProvider, useAuthContext } from './src/contexts/AuthContext';
import { useTools } from './src/hooks/useTools';
import { isFirebaseConfigured } from './src/lib/firebase';
import { AI_TOOLS_DATA, CATEGORIES } from './constants';

/**
 * 로딩 스켈레톤 컴포넌트
 */
const LoadingSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <div className="h-4 bg-slate-200 rounded w-20"></div>
            <div className="h-4 bg-slate-200 rounded w-16"></div>
          </div>
          <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3 mb-4"></div>
          <div className="h-10 bg-slate-200 rounded w-full"></div>
        </div>
      </div>
    ))}
  </div>
);

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
  const [sortOrder, setSortOrder] = useState<SortOption>('rating_desc');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [isAddToolModalOpen, setIsAddToolModalOpen] = useState(false);
  
  // Firebase 설정 확인
  const firebaseConfigured = isFirebaseConfigured();
  
  // Firebase에서 실시간 도구 데이터 가져오기 (Firebase 설정된 경우에만)
  const firebaseData = useTools();
  
  // 데이터 소스 결정 (Firebase 설정 여부에 따라)
  const { data: firebaseTools, isLoading, error, categories, addTool } = firebaseConfigured 
    ? firebaseData 
    : { 
        data: [], 
        isLoading: false, 
        error: null, 
        categories: CATEGORIES,
        addTool: async () => { throw new Error('Firebase가 설정되지 않았습니다.'); }
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
  const aiToolsData = useMemo(() => {
    // 디버깅용 로그
    console.log('🔍 데이터 소스 결정:', {
      firebaseConfigured,
      firebaseToolsLength: firebaseTools.length,
      isLoading,
      error
    });
    
    if (firebaseConfigured && firebaseTools.length > 0) {
      console.log('✅ Firebase 데이터 사용:', firebaseTools.length + '개');
      return firebaseTools.map(convertToAiTool);
    }
    // Firebase가 설정되지 않았거나 데이터가 없는 경우 정적 데이터 사용
    console.log('📄 정적 데이터 사용:', AI_TOOLS_DATA.length + '개');
    return AI_TOOLS_DATA;
  }, [firebaseConfigured, firebaseTools, isLoading, error]);

  // 기존 필터링 및 정렬 로직 유지
  const filteredAndSortedTools = useMemo(() => {
    let filteredTools = aiToolsData;

    if (selectedCategory !== '전체') {
      filteredTools = filteredTools.filter(tool => tool.category === selectedCategory);
    }

    if (searchTerm) {
      filteredTools = filteredTools.filter(tool =>
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return [...filteredTools].sort((a, b) => {
      switch (sortOrder) {
        case 'rating_desc':
          return b.rating - a.rating;
        case 'rating_asc':
          return a.rating - b.rating;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
  }, [aiToolsData, searchTerm, sortOrder, selectedCategory]);

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

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
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
          />

          {/* 카테고리별 평균 별점 차트 */}
          {(!firebaseConfigured || (!isLoading && aiToolsData.length > 0)) && (
            <section className="my-12 p-6 bg-white rounded-xl shadow-md">
              <h2 className="text-2xl font-bold text-center text-slate-800 mb-4">카테고리별 평균 별점</h2>
              <div className="relative w-full h-[400px] max-h-[50vh]">
                <CategoryChart data={aiToolsData} />
              </div>
            </section>
          )}

          <main>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-800">도구 목록</h2>
              {(!firebaseConfigured || !isLoading) && (
                <span className="text-slate-500 font-medium">{filteredAndSortedTools.length}개 항목</span>
              )}
            </div>

            {/* 로딩 상태 (Firebase 설정된 경우에만) */}
            {firebaseConfigured && isLoading && <LoadingSkeleton />}

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedTools.map((tool, index) => (
                  <ToolCard key={`${tool.name}-${index}`} tool={tool} />
                ))}
              </div>
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
      />
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