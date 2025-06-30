import React, { useState, useEffect } from 'react';
import { AiTool, FirebaseTool } from '../types';
import StarRating from './StarRating';
import ReviewModal from './ReviewModal';
import EditToolModal from './EditToolModal';
import { useRatings } from '../src/hooks/useRatings';
import { useRecentComments } from '../src/hooks/useComments';
import { useToast } from '../src/hooks/useToast';
import { isFirebaseConfigured } from '../src/lib/firebase';
import { useAuthContext } from '../src/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { useBookmarks } from '../src/hooks/useBookmarks';

interface ToolCardProps {
  tool: AiTool | FirebaseTool;
  onUpdateTool?: (toolId: string, toolData: any) => Promise<void>;
  onDeleteTool?: (toolId: string) => Promise<void>;
  categories?: string[];
  onBookmarkChange?: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, onUpdateTool, onDeleteTool, categories = [], onBookmarkChange }) => {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [firebaseToolData, setFirebaseToolData] = useState<FirebaseTool | null>(null);
  
  // 북마크 관련 상태
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkProcessing, setIsBookmarkProcessing] = useState(false);
  
  // 토스트 메시지 관리
  const { showSuccess, showError } = useToast();
  
  // 인증 정보
  const { user, isAuthenticated } = useAuthContext();
  
  // Firebase 설정 확인
  const firebaseConfigured = isFirebaseConfigured();
  
  // 북마크 관련 훅
  const { 
    addBookmark, 
    removeBookmark, 
    bookmarkedToolIds, 
    isLoading: isBookmarksLoading
  } = useBookmarks();
  
  // Firebase 도구인지 확인하는 타입 가드
  const isFirebaseTool = (tool: AiTool | FirebaseTool): tool is FirebaseTool => {
    return 'id' in tool && 'averageRating' in tool;
  };
  
  // 도구 ID 결정: Firebase 도구면 실제 ID, 정적 도구면 name을 ID로 사용
  const toolId = isFirebaseTool(tool) ? tool.id : tool.name;
  
  // 북마크 상태 초기화 및 업데이트
  useEffect(() => {
    if (isAuthenticated && bookmarkedToolIds) {
      const bookmarked = bookmarkedToolIds.includes(toolId);
      console.log(`🔖 ToolCard - 도구 "${tool.name}" (ID: ${toolId}) 북마크 상태:`, bookmarked);
      setIsBookmarked(bookmarked);
    } else {
      setIsBookmarked(false);
    }
  }, [isAuthenticated, bookmarkedToolIds, toolId, tool.name]);
  
  // 북마크 토글 함수
  const handleBookmarkToggle = async () => {
    if (!isAuthenticated) {
      showError('북마크 기능을 사용하려면 로그인이 필요합니다.');
      return;
    }
    
    if (isBookmarkProcessing) {
      console.log('🔖 북마크 처리 중입니다. 잠시 기다려주세요.');
      return;
    }
    
    try {
      setIsBookmarkProcessing(true);
      console.log(`🔖 북마크 토글 시작 - 현재 상태: ${isBookmarked ? '북마크됨' : '북마크되지 않음'}`);
      
      if (isBookmarked) {
        console.log(`🔖 북마크 제거 시도 - 도구: "${tool.name}" (ID: ${toolId})`);
        await removeBookmark(toolId);
        showSuccess('북마크가 제거되었습니다.');
        console.log(`✅ 북마크 제거 성공 - 도구: "${tool.name}" (ID: ${toolId})`);
      } else {
        console.log(`🔖 북마크 추가 시도 - 도구: "${tool.name}" (ID: ${toolId})`);
        await addBookmark(toolId);
        showSuccess('북마크가 추가되었습니다.');
        console.log(`✅ 북마크 추가 성공 - 도구: "${tool.name}" (ID: ${toolId})`);
      }
      
      // 북마크 상태 즉시 업데이트 (UI 반응성 향상)
      setIsBookmarked(!isBookmarked);
      
      // 북마크 상태 변경 후 콜백 호출 (App.tsx에서 북마크 목록 새로고침)
      if (onBookmarkChange) {
        console.log(`🔖 ToolCard - 도구 ID ${toolId}의 북마크 상태 변경 후 콜백 호출`);
        onBookmarkChange();
      }
    } catch (error) {
      console.error('🔴 북마크 토글 실패:', error);
      showError(`북마크 ${isBookmarked ? '제거' : '추가'} 중 오류가 발생했습니다.`);
    } finally {
      setIsBookmarkProcessing(false);
    }
  };
  
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
  

  
  // 최신 댓글 데이터 (Firebase 설정된 경우에만)
  const { data: recentComments } = useRecentComments(firebaseConfigured ? toolId : '', 3);
  
  // 관리자 계정 목록 (필요시 환경변수로 관리 가능)
  const ADMIN_UIDS = ['lyGcWH33rYTlRnaBaIz6kQJI03']; // 현재 사용자를 관리자로 추가
  
  // 현재 사용자가 도구 작성자인지 확인
  // Firebase 도구의 경우: 실제 작성자 또는 관리자
  // 정적 도구의 경우: 로그인한 사용자는 모두 편집 가능 (개발 환경용)
  const isOwner = user && (
    (isFirebaseTool(tool) && (tool.createdBy === user.uid || ADMIN_UIDS.includes(user.uid))) ||
    (!isFirebaseTool(tool) && !firebaseConfigured)
  );


  
  // 편집 핸들러
  const handleEdit = () => {
    if (isOwner && onUpdateTool) {
      setIsEditModalOpen(true);
    }
  };
  
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
          <div className="flex items-start justify-between gap-3 mt-1">
            <a 
              href={tool.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xl leading-tight font-bold text-slate-900 hover:text-sky-600 transition-colors duration-200 break-words"
              style={{ maxWidth: 'calc(100% - 100px)' }}
            >
              {tool.name}
            </a>
            
            <div className="flex gap-2">
              {/* 북마크 버튼 */}
              {isAuthenticated && (
                <button
                  onClick={handleBookmarkToggle}
                  disabled={isBookmarkProcessing || isBookmarksLoading}
                  className={`p-1.5 rounded-full transition-colors duration-200 ${
                    isBookmarked 
                      ? 'bg-amber-50 text-amber-500 hover:bg-amber-100' 
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                  aria-label={isBookmarked ? '북마크 제거' : '북마크 추가'}
                >
                  <svg 
                    className={`w-5 h-5 ${isBookmarkProcessing ? 'animate-pulse' : ''}`}
                    fill={isBookmarked ? 'currentColor' : 'none'} 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={isBookmarked ? "0" : "2"} 
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
                    />
                  </svg>
                </button>
              )}
              
              {/* 편집 버튼 - 소유자에게만 표시 */}
              {isOwner && onUpdateTool && (
                <button
                  onClick={handleEdit}
                  className="flex-shrink-0 px-2 py-1 bg-slate-600 text-white hover:bg-slate-700 transition-colors duration-200 rounded text-xs"
                  title="편집"
                >
                  ✏️ 편집
                </button>
              )}
            </div>
          </div>
          

          
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
            }
            return null;
          })()}
          
          {/* 최신 댓글 표시 */}
          {firebaseConfigured && recentComments && recentComments.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-slate-700 mb-2">최근 댓글</h4>
              <div className="space-y-2">
                {recentComments.map(comment => (
                  <div key={comment.id} className="bg-slate-50 p-2 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1.5">
                        {comment.userPhotoURL ? (
                          <img 
                            src={comment.userPhotoURL} 
                            alt={`${comment.userName} 프로필`} 
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-[8px] text-gray-600">
                            {comment.userName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-medium text-slate-700">{comment.userName}</span>
                      </div>
                      <span className="text-xs text-slate-400">{comment.createdAt.toLocaleDateString('ko-KR')}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 버튼 영역 */}
          <div className="mt-4 flex flex-col gap-2">
            <a 
              href={tool.url}
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full py-2 text-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200"
            >
              웹사이트 방문
            </a>
            {firebaseConfigured && user && (
              <button 
                onClick={() => setIsReviewModalOpen(true)}
                className="w-full py-2 text-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md transition-colors duration-200"
              >
                리뷰 작성
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* 리뷰 모달 */}
      {isReviewModalOpen && (
        <ReviewModal 
          isOpen={isReviewModalOpen} 
          onClose={() => setIsReviewModalOpen(false)} 
          tool={tool} 
          onSuccess={(message) => showSuccess(message)}
          onError={(message) => showError(message)}
        />
      )}
      
      {/* 편집 모달 */}
      {isEditModalOpen && onUpdateTool && onDeleteTool && (
        <EditToolModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          tool={isFirebaseTool(tool) ? tool : { ...tool, id: tool.name }}
          onUpdateTool={onUpdateTool}
          onDeleteTool={onDeleteTool}
          categories={categories}
          onSuccess={(message) => showSuccess(message)}
          onError={(message) => showError(message)}
        />
      )}
    </>
  );
};

export default ToolCard;
