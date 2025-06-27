import React, { useMemo } from 'react';
import { AiTool, FirebaseTool } from '../types';

interface SiteStatisticsProps {
  data: (AiTool | FirebaseTool)[];
}

/**
 * 사이트 주요 통계 정보를 컴팩트하게 표시하는 컴포넌트
 * 전체 도구 수, 카테고리별 도구 수, 최근 추가된 도구 수를 시각화
 */
export const SiteStatistics: React.FC<SiteStatisticsProps> = ({ data }) => {
  // 통계 데이터 계산
  const statistics = useMemo(() => {
    // 타입 가드 함수
    const isFirebaseTool = (tool: AiTool | FirebaseTool): tool is FirebaseTool => 
      'averageRating' in tool && 'createdAt' in tool;

    // 카테고리별 도구 수 집계
    const categoryStats = data.reduce((acc, tool) => {
      acc[tool.category] = (acc[tool.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 최근 7일 내 추가된 도구 수 (Firebase 도구만)
    const recentlyAdded = data.filter(tool => {
      if (isFirebaseTool(tool) && tool.createdAt) {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        // Firebase Timestamp 처리
        const createdDate = tool.createdAt instanceof Date 
          ? tool.createdAt 
          : (tool.createdAt as any).toDate ? (tool.createdAt as any).toDate() : new Date(tool.createdAt);
        return createdDate >= weekAgo;
      }
      return false;
    }).length;

    // 최근 7일 내 수정된 도구 수 (Firebase 도구만)
    const recentlyUpdated = data.filter(tool => {
      if (isFirebaseTool(tool) && tool.updatedAt) {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        // Firebase Timestamp 처리
        const updatedDate = tool.updatedAt instanceof Date 
          ? tool.updatedAt 
          : (tool.updatedAt as any).toDate ? (tool.updatedAt as any).toDate() : new Date(tool.updatedAt);
        return updatedDate >= weekAgo;
      }
      return false;
    }).length;

    // 무료 도구 수
    const freeToolsCount = data.filter(tool => tool.plan === '무료').length;

    return {
      totalTools: data.length,
      categoryStats,
      recentlyAdded,
      recentlyUpdated,
      freeToolsCount,
      paidToolsCount: data.length - freeToolsCount
    };
  }, [data]);

  // 상위 3개 카테고리 추출
  const topCategories = Object.entries(statistics.categoryStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-800 mb-3 text-center flex items-center justify-center gap-2">
        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        사이트 현황
      </h2>
      
      {/* 주요 통계 카드들 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* 전체 도구 수 */}
        <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 text-center">
          <div className="flex items-center justify-center mb-1">
            <svg className="w-4 h-4 text-sky-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-sky-600">{statistics.totalTools}</div>
          <div className="text-xs text-slate-600">전체 도구</div>
        </div>

        {/* 무료 도구 수 */}
        <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 text-center">
          <div className="flex items-center justify-center mb-1">
            <svg className="w-4 h-4 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-green-600">{statistics.freeToolsCount}</div>
          <div className="text-xs text-slate-600">무료 도구</div>
        </div>

        {/* 최근 추가 */}
        <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 text-center">
          <div className="flex items-center justify-center mb-1">
            <svg className="w-4 h-4 text-orange-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-orange-600">{statistics.recentlyAdded}</div>
          <div className="text-xs text-slate-600">최근 7일 추가</div>
        </div>

        {/* 최근 수정 */}
        <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 text-center">
          <div className="flex items-center justify-center mb-1">
            <svg className="w-4 h-4 text-purple-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-purple-600">{statistics.recentlyUpdated}</div>
          <div className="text-xs text-slate-600">최근 7일 수정</div>
        </div>
      </div>

      {/* 상위 카테고리 */}
      <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          인기 카테고리
        </h3>
        <div className="space-y-1">
          {topCategories.map(([category, count], index) => {
            const percentage = Math.round((count / statistics.totalTools) * 100);
            const colors = ['bg-sky-500', 'bg-green-500', 'bg-orange-500'];
            
            return (
              <div key={category} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${colors[index] || 'bg-slate-400'}`}></div>
                  <span className="text-slate-700 truncate max-w-[100px]" title={category}>{category}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-600">
                  <span className="font-medium">{count}</span>
                  <span className="text-xs">({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 