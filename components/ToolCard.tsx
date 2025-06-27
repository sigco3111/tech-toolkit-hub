import React, { useState, useEffect } from 'react';
import { AiTool, FirebaseTool } from '../types';
import StarRating from './StarRating';
import ReviewModal from './ReviewModal';
import { useRatings } from '../src/hooks/useRatings';
import { useRecentComments } from '../src/hooks/useComments';
import { useToast } from '../src/hooks/useToast';
import { isFirebaseConfigured } from '../src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../src/lib/firebase';

interface ToolCardProps {
  tool: AiTool | FirebaseTool;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [firebaseToolData, setFirebaseToolData] = useState<FirebaseTool | null>(null);
  
  // 토스트 메시지 관리
  const { showSuccess, showError } = useToast();
  
  // Firebase 설정 확인
  const firebaseConfigured = isFirebaseConfigured();
  
  // Firebase 도구인지 확인하는 타입 가드
  const isFirebaseTool = (tool: AiTool | FirebaseTool): tool is FirebaseTool => {
    return 'id' in tool && 'averageRating' in tool;
  };
  
  // 도구 ID 결정: Firebase 도구면 실제 ID, 정적 도구면 name을 ID로 사용
  const toolId = isFirebaseTool(tool) ? tool.id : tool.name;
  
  // Firebase에서 실제 도구 데이터 조회 (날짜 정보 포함)
  useEffect(() => {
    if (!firebaseConfigured || isFirebaseTool(tool)) {
      return;
    }
    
    const fetchFirebaseToolData = async () => {
      try {
        // 도구 이름으로 Firebase에서 검색 (간단한 구현을 위해 도구 이름을 ID로 가정)
        const toolRef = doc(db, 'tools', tool.name);
        const toolSnap = await getDoc(toolRef);
        
        if (toolSnap.exists()) {
          const data = toolSnap.data();
          setFirebaseToolData({
            id: toolSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as FirebaseTool);
        }
      } catch (error) {
        console.error('Firebase 도구 데이터 조회 실패:', error);
      }
    };
    
    fetchFirebaseToolData();
  }, [firebaseConfigured, tool.name, isFirebaseTool(tool)]);
  
  // Firebase 평점 데이터 (Firebase 설정된 경우에만)
  const ratingsData = useRatings(firebaseConfigured ? toolId : '');
  const { averageRating: firebaseAverageRating, ratingCount } = ratingsData;
  
  // 도구 평점 정보 추출 - Firebase 설정된 경우 실시간 평균 평점 사용
  const displayRating = firebaseConfigured 
    ? firebaseAverageRating  // 실시간으로 계산된 평균 평점 사용
    : (isFirebaseTool(tool) ? tool.averageRating : tool.rating); // Firebase 미설정 시 기존 로직
  
  // 디버깅용 로그 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 [${tool.name}] 도구 정보:`, {
      firebaseConfigured,
      isFirebaseTool: isFirebaseTool(tool),
      hasCreatedAt: isFirebaseTool(tool) ? !!tool.createdAt : false,
      hasUpdatedAt: isFirebaseTool(tool) ? !!tool.updatedAt : false,
      toolType: isFirebaseTool(tool) ? 'Firebase' : 'Static',
      firebaseAverageRating,
      displayRating,
      ratingCount
    });
  }
  
  // 최신 댓글 데이터 (Firebase 설정된 경우에만)
  const { data: recentComments } = useRecentComments(firebaseConfigured ? toolId : '', 3);
  
  const PlanBadge: React.FC<{ plan: string | null }> = ({ plan }) => {
    if (!plan) return null;
    const baseClasses = "inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full";
    if (plan === '무료') {
      return <span className={`${baseClasses} bg-green-100 text-green-800`}>무료</span>;
    }
    if (plan === '기업플랜') {
      return <span className={`${baseClasses} bg-purple-100 text-purple-800`}>기업플랜</span>;
    }
    return null;
  };

  return (
    <>
      <div className="card bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full transition-transform transition-shadow duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
        <div className="p-6 flex-grow flex flex-col">
          <div className="flex justify-between items-start mb-2 flex-wrap gap-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block bg-sky-100 text-sky-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {tool.category}
              </span>
              <PlanBadge plan={tool.plan} />
            </div>
            <div className="flex flex-col items-end">
              <StarRating rating={displayRating} />
              {firebaseConfigured && ratingCount > 0 && (
                <span className="text-xs text-slate-400 mt-0.5">
                  {ratingCount}명 평가
                </span>
              )}
            </div>
          </div>
          <a href={tool.url} target="_blank" rel="noopener noreferrer" className="block text-xl leading-tight font-bold text-slate-900 hover:text-sky-600 transition-colors duration-200 mt-1">
            {tool.name}
          </a>
          <p className="mt-2 text-slate-600 text-sm flex-grow">{tool.description}</p>
          {tool.memo && (
            <p className="mt-3 text-xs text-slate-500 bg-slate-100 p-2 rounded-md">
              📝 {tool.memo}
            </p>
          )}
          
          {/* 날짜 정보 표시 */}
          {(() => {
            // Firebase 도구이거나 Firebase에서 조회된 데이터가 있는 경우 실제 날짜 표시
            if (isFirebaseTool(tool)) {
              return (
                <div className="mt-3 text-xs text-slate-400 space-y-1">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>등록: {tool.createdAt.toLocaleDateString('ko-KR')}</span>
                  </div>
                  {tool.updatedAt.getTime() !== tool.createdAt.getTime() && (
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>업데이트: {tool.updatedAt.toLocaleDateString('ko-KR')}</span>
                    </div>
                  )}
                </div>
              );
            } else if (firebaseToolData) {
              // 정적 도구이지만 Firebase에서 실제 데이터를 찾은 경우
              return (
                <div className="mt-3 text-xs text-slate-400 space-y-1">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>등록: {firebaseToolData.createdAt.toLocaleDateString('ko-KR')}</span>
                  </div>
                  {firebaseToolData.updatedAt.getTime() !== firebaseToolData.createdAt.getTime() && (
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>업데이트: {firebaseToolData.updatedAt.toLocaleDateString('ko-KR')}</span>
                    </div>
                  )}
                </div>
              );
            } else {
              // 정적 데이터이고 Firebase에서 찾지 못한 경우 고정된 날짜 표시
              return (
                <div className="mt-3 text-xs text-slate-400 space-y-1">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>등록: 2024.1.1</span>
                  </div>
                </div>
              );
            }
          })()}
          
          {/* 최신 댓글 표시 (Firebase 설정된 경우에만) */}
          {firebaseConfigured && recentComments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-700 mb-2">최근 댓글</h4>
              <div className="space-y-2">
                {recentComments.slice(0, 2).map((comment) => (
                  <div key={comment.id} className="bg-slate-50 rounded-md p-2">
                    <div className="flex items-center gap-1 mb-1">
                      {comment.userPhotoURL && (
                        <img 
                          src={comment.userPhotoURL} 
                          alt={comment.userName}
                          className="w-4 h-4 rounded-full"
                        />
                      )}
                      <span className="text-xs font-medium text-slate-600">{comment.userName}</span>
                      <span className="text-xs text-slate-400">
                        {comment.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {comment.content}
                    </p>
                  </div>
                ))}
                {recentComments.length > 2 && (
                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="text-xs text-sky-600 hover:text-sky-800 font-medium"
                  >
                    댓글 {recentComments.length - 2}개 더보기
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* 리뷰 작성 버튼 - 항상 표시 */}
          <div className="mt-4 pt-3 border-t border-slate-200">
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors duration-200 text-sm font-medium"
            >
              <span>⭐</span>
              <span>리뷰 작성</span>
            </button>
          </div>
        </div>
        <div className="px-6 pb-6 pt-2">
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center block bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
          >
            사이트 방문하기
          </a>
        </div>
      </div>

      {/* 리뷰 모달 */}
      <ReviewModal
        tool={tool}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSuccess={showSuccess}
        onError={showError}
      />
    </>
  );
};

export default ToolCard;
