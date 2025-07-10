import React, { useMemo } from 'react';
import { AiTool, FirebaseTool } from '../types';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: (AiTool | FirebaseTool)[];
}

/**
 * 사이트 통계를 보여주는 모달 컴포넌트
 * 사이트의 다양한 통계 정보를 시각적으로 표현
 */
const StatisticsModal: React.FC<StatisticsModalProps> = ({ isOpen, onClose, data }) => {
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

    // 등급별 도구 수 집계 (무료/유료/프리미엄)
    const planStats = data.reduce((acc, tool) => {
      acc[tool.plan] = (acc[tool.plan] || 0) + 1;
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

    // 최근 30일 내 추가된 도구 수 (Firebase 도구만)
    const monthlyAdded = data.filter(tool => {
      if (isFirebaseTool(tool) && tool.createdAt) {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        // Firebase Timestamp 처리
        const createdDate = tool.createdAt instanceof Date 
          ? tool.createdAt 
          : (tool.createdAt as any).toDate ? (tool.createdAt as any).toDate() : new Date(tool.createdAt);
        return createdDate >= monthAgo;
      }
      return false;
    }).length;

    // 평점 분포 (Firebase 도구만)
    const ratingDistribution = {
      '0-1': 0,
      '1-2': 0,
      '2-3': 0,
      '3-4': 0,
      '4-5': 0,
    };

    data.forEach(tool => {
      if (isFirebaseTool(tool) && typeof tool.averageRating === 'number') {
        if (tool.averageRating < 1) ratingDistribution['0-1']++;
        else if (tool.averageRating < 2) ratingDistribution['1-2']++;
        else if (tool.averageRating < 3) ratingDistribution['2-3']++;
        else if (tool.averageRating < 4) ratingDistribution['3-4']++;
        else ratingDistribution['4-5']++;
      }
    });

    // 상위 평점 도구
    const topRatedTools = [...data]
      .filter(tool => isFirebaseTool(tool) && typeof tool.averageRating === 'number' && tool.averageRating > 0)
      .sort((a, b) => {
        const aRating = isFirebaseTool(a) ? a.averageRating : 0;
        const bRating = isFirebaseTool(b) ? b.averageRating : 0;
        return bRating - aRating;
      })
      .slice(0, 5);

    // 무료 도구 수
    const freeToolsCount = data.filter(tool => tool.plan === '무료').length;
    // 유료 도구 수
    const paidToolsCount = data.filter(tool => tool.plan === '유료').length;
    // 프리미엄 도구 수
    const premiumToolsCount = data.filter(tool => tool.plan === '프리미엄').length;

    return {
      totalTools: data.length,
      categoryStats,
      planStats,
      recentlyAdded,
      recentlyUpdated,
      monthlyAdded,
      ratingDistribution,
      topRatedTools,
      freeToolsCount,
      paidToolsCount,
      premiumToolsCount,
    };
  }, [data]);

  // 상위 카테고리
  const topCategories = Object.entries(statistics.categoryStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto transition-transform transform scale-95 duration-300 ease-out"
        style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 bg-white p-6 border-b border-slate-200 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            사이트 통계 대시보드
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 왼쪽 섹션 */}
            <div className="space-y-6">
              {/* 주요 통계 카드들 */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700 mb-3">주요 통계</h3>
                <div className="grid grid-cols-2 gap-4">
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

                  {/* 최근 7일 추가 */}
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <svg className="w-4 h-4 text-orange-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">{statistics.recentlyAdded}</div>
                    <div className="text-xs text-slate-600">최근 7일 추가</div>
                  </div>

                  {/* 최근 7일 수정 */}
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
              </div>

              {/* 도구 가격 유형 분포 */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="text-md font-semibold text-slate-700 mb-3 flex items-center gap-1">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  가격 유형별 분포
                </h3>

                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-green-200 text-green-800">
                        무료 {statistics.freeToolsCount}개
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-green-600">
                        {Math.round((statistics.freeToolsCount / statistics.totalTools) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                    <div style={{ width: `${(statistics.freeToolsCount / statistics.totalTools) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                  </div>

                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-blue-200 text-blue-800">
                        유료 {statistics.paidToolsCount}개
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        {Math.round((statistics.paidToolsCount / statistics.totalTools) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                    <div style={{ width: `${(statistics.paidToolsCount / statistics.totalTools) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                  </div>

                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-purple-200 text-purple-800">
                        프리미엄 {statistics.premiumToolsCount}개
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-purple-600">
                        {Math.round((statistics.premiumToolsCount / statistics.totalTools) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200">
                    <div style={{ width: `${(statistics.premiumToolsCount / statistics.totalTools) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"></div>
                  </div>
                </div>
              </div>

              {/* 평점 분포 */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="text-md font-semibold text-slate-700 mb-3 flex items-center gap-1">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  평점 분포
                </h3>

                <div className="space-y-3">
                  {Object.entries(statistics.ratingDistribution).map(([range, count], index) => {
                    const percentage = statistics.totalTools > 0 ? (count / statistics.totalTools) * 100 : 0;
                    const colors = [
                      { bg: 'bg-red-200', fill: 'bg-red-500', text: 'text-red-800' },
                      { bg: 'bg-orange-200', fill: 'bg-orange-500', text: 'text-orange-800' },
                      { bg: 'bg-yellow-200', fill: 'bg-yellow-500', text: 'text-yellow-800' },
                      { bg: 'bg-lime-200', fill: 'bg-lime-500', text: 'text-lime-800' },
                      { bg: 'bg-green-200', fill: 'bg-green-500', text: 'text-green-800' },
                    ];
                    const color = colors[index];
                    const stars = index + 1;
                    
                    return (
                      <div key={range} className="flex items-center gap-2">
                        <div className="w-16 flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-3 h-3 ${i < stars ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <div className="flex-1">
                          <div className={`overflow-hidden h-2 text-xs flex rounded ${color.bg}`}>
                            <div 
                              style={{ width: `${percentage}%` }}
                              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${color.fill}`}
                            ></div>
                          </div>
                        </div>
                        <div className="w-16 text-right text-xs font-medium">
                          <span className={color.text}>{count}개</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* 오른쪽 섹션 */}
            <div className="space-y-6">
              {/* 상위 카테고리 */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="text-md font-semibold text-slate-700 mb-3 flex items-center gap-1">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  카테고리 분포 (상위 5개)
                </h3>
                
                <div className="space-y-3">
                  {topCategories.map(([category, count], index) => {
                    const percentage = Math.round((count / statistics.totalTools) * 100);
                    const colors = [
                      { bg: 'bg-sky-200', fill: 'bg-sky-500', text: 'text-sky-800' },
                      { bg: 'bg-green-200', fill: 'bg-green-500', text: 'text-green-800' },
                      { bg: 'bg-orange-200', fill: 'bg-orange-500', text: 'text-orange-800' },
                      { bg: 'bg-purple-200', fill: 'bg-purple-500', text: 'text-purple-800' },
                      { bg: 'bg-pink-200', fill: 'bg-pink-500', text: 'text-pink-800' },
                    ];
                    const color = colors[index % colors.length];
                    
                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700 truncate max-w-[250px]" title={category}>
                            {category}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">{count}개 ({percentage}%)</span>
                        </div>
                        <div className={`overflow-hidden h-2 text-xs flex rounded ${color.bg}`}>
                          <div
                            style={{ width: `${percentage}%` }}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${color.fill}`}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 월별 추가 트렌드 (임시 데이터) */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="text-md font-semibold text-slate-700 mb-3 flex items-center gap-1">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  도구 추가 트렌드
                </h3>
                
                <div className="flex items-center justify-center h-40">
                  <div className="text-center text-slate-500">
                    <p>최근 30일 추가된 도구 수</p>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">{statistics.monthlyAdded}</p>
                    {statistics.monthlyAdded > 0 && (
                      <p className="text-sm text-green-600 mt-1">
                        월 평균 {Math.round(statistics.monthlyAdded / 30 * 7)} 도구 추가
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 상위 평점 도구 */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="text-md font-semibold text-slate-700 mb-3 flex items-center gap-1">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  최고 평점 도구 (Top 5)
                </h3>
                
                <div className="space-y-3">
                  {statistics.topRatedTools.length > 0 ? (
                    statistics.topRatedTools.map((tool, index) => {
                      const isFirebase = 'averageRating' in tool;
                      const rating = isFirebase ? tool.averageRating : 0;
                      
                      return (
                        <div key={index} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 text-xs flex items-center justify-center font-bold">
                              {index + 1}
                            </span>
                            <span className="text-slate-800 font-medium">{tool.name}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-amber-500 font-bold mr-1">{rating.toFixed(1)}</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <svg 
                                  key={i} 
                                  className={`w-3 h-3 ${i < Math.round(rating) ? 'text-amber-400' : 'text-gray-300'}`} 
                                  fill="currentColor" 
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-slate-500">평점이 등록된 도구가 없습니다.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mt-8">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsModal; 