import React from 'react';

/**
 * 기본 스켈레톤 요소 컴포넌트
 * 애니메이션 효과가 포함된 로딩 플레이스홀더를 제공합니다.
 */
interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', width, height }) => {
  const style = {
    width,
    height,
  };

  return (
    <div
      className={`bg-slate-200 rounded animate-pulse ${className}`}
      style={style}
    />
  );
};

/**
 * 도구 카드 스켈레톤 컴포넌트
 * ToolCard와 동일한 레이아웃 구조로 로딩 상태를 표시합니다.
 */
export const ToolCardSkeleton: React.FC = () => {
  return (
    <div className="card bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full">
      <div className="p-6 flex-grow flex flex-col">
        {/* 카테고리 및 평점 영역 */}
        <div className="flex justify-between items-start mb-2 flex-wrap gap-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
          <div className="flex flex-col items-end">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-12 mt-1" />
          </div>
        </div>

        {/* 제목 */}
        <Skeleton className="h-6 w-3/4 mt-1" />

        {/* 설명 */}
        <div className="mt-2 space-y-2 flex-grow">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        {/* 메모 영역 (선택적) */}
        <div className="mt-3">
          <Skeleton className="h-8 w-full" />
        </div>

        {/* 최신 댓글 영역 (선택적) */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <Skeleton className="h-3 w-16 mb-2" />
          <div className="space-y-2">
            <div className="bg-slate-50 rounded-md p-2">
              <div className="flex items-center gap-1 mb-1">
                <Skeleton className="w-4 h-4 rounded-full" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        </div>

        {/* 리뷰 작성 버튼 */}
        <div className="mt-4 pt-3 border-t border-slate-200">
          <Skeleton className="h-8 w-full" />
        </div>
      </div>

      {/* 사이트 방문 버튼 */}
      <div className="px-6 pb-6 pt-2">
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
};

/**
 * 도구 목록 스켈레톤 컴포넌트
 * 여러 개의 ToolCardSkeleton을 그리드로 배치합니다.
 */
interface ToolListSkeletonProps {
  count?: number;
}

export const ToolListSkeleton: React.FC<ToolListSkeletonProps> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }, (_, index) => (
        <ToolCardSkeleton key={index} />
      ))}
    </div>
  );
};

/**
 * 차트 스켈레톤 컴포넌트
 * CategoryChart 로딩 상태를 표시합니다.
 */
export const ChartSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="h-64 flex items-end justify-between gap-2">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <Skeleton 
              className="w-full mb-2" 
              height={`${Math.random() * 150 + 50}px`}
            />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 검색 및 필터 스켈레톤 컴포넌트
 * FilterControls 로딩 상태를 표시합니다.
 */
export const FilterSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
};

export default Skeleton; 