import React, { useState, useEffect } from 'react';
import { AiTool, FirebaseTool, FirebaseComment } from '../types';
import RatingSystem from '../src/components/RatingSystem';
import { useRatings } from '../src/hooks/useRatings';
import { useComments } from '../src/hooks/useComments';
import { useAuthContext } from '../src/contexts/AuthContext';
import { isFirebaseConfigured } from '../src/lib/firebase';

interface ReviewModalProps {
  tool: AiTool | FirebaseTool;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

/**
 * 별점과 댓글을 함께 관리할 수 있는 통합 리뷰 모달
 * Firebase 도구에 대해서만 활성화되며, 로그인한 사용자만 사용 가능합니다.
 */
const ReviewModal: React.FC<ReviewModalProps> = ({ tool, isOpen, onClose, onSuccess, onError }) => {
  const { isAuthenticated, user } = useAuthContext();
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Firebase 설정 확인
  const firebaseConfigured = isFirebaseConfigured();
  
  // Firebase 도구인지 확인하는 타입 가드
  const isFirebaseTool = (tool: AiTool | FirebaseTool): tool is FirebaseTool => {
    return 'id' in tool && 'averageRating' in tool;
  };

  // Firebase 도구가 아니거나 Firebase가 설정되지 않은 경우에도 모달 표시
  const isFirebaseToolInstance = isFirebaseTool(tool);
  
  // Firebase가 설정되어 있으면 모든 도구에 대해 Firebase 기능 사용 가능
  const canUseFirebaseFeatures = firebaseConfigured;
  
  // 도구 ID 결정: Firebase 도구면 실제 ID, 정적 도구면 name을 ID로 사용
  const toolId = isFirebaseToolInstance ? (tool as FirebaseTool).id : tool.name;

  // Firebase 평점 및 댓글 데이터 (Firebase 도구인 경우에만)
  const ratingsData = useRatings(canUseFirebaseFeatures ? toolId : '');
  const commentsData = useComments(canUseFirebaseFeatures ? toolId : '');
  
  const { 
    addRating, 
    updateRating, 
    deleteRating, 
    getUserRating,
    error: ratingsError 
  } = ratingsData;

  const {
    parentComments,
    getReplies,
    addComment,
    updateComment,
    deleteComment,
    commentCount,
    isLoading: commentsLoading,
    error: commentsError
  } = commentsData;

  // 현재 사용자의 평점
  const userRating = user && canUseFirebaseFeatures ? getUserRating(user.uid) : null;

  /**
   * 평점 변경 핸들러
   */
  const handleRatingChange = () => {
    // 평점 변경 시 필요한 로직이 있다면 여기에 추가
  };

  /**
   * 평점 제출 핸들러
   */
  const handleRatingSubmit = async (rating: number): Promise<void> => {
    if (!user) {
      const errorMsg = '로그인이 필요합니다.';
      onError?.(errorMsg);
      throw new Error(errorMsg);
    }

    if (!canUseFirebaseFeatures) {
      const errorMsg = 'Firebase 설정이 필요합니다.';
      onError?.(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      if (userRating) {
        await updateRating(userRating.id, rating);
        onSuccess?.('평점이 성공적으로 수정되었습니다.');
      } else {
        await addRating(user.uid, rating);
        onSuccess?.('평점이 성공적으로 등록되었습니다.');
      }
    } catch (error: any) {
      const errorMsg = error.message || '평점 처리 중 오류가 발생했습니다.';
      onError?.(errorMsg);
      throw new Error(errorMsg);
    }
  };

  /**
   * 평점 삭제 핸들러
   */
  const handleRatingDelete = async (): Promise<void> => {
    if (!userRating) {
      const errorMsg = '삭제할 평점이 없습니다.';
      onError?.(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      await deleteRating(userRating.id);
      onSuccess?.('평점이 성공적으로 삭제되었습니다.');
    } catch (error: any) {
      const errorMsg = error.message || '평점 삭제 중 오류가 발생했습니다.';
      onError?.(errorMsg);
      throw new Error(errorMsg);
    }
  };

  /**
   * 댓글 제출 핸들러
   */
  const handleCommentSubmit = async () => {
    if (!user || !commentText.trim()) return;

    if (!canUseFirebaseFeatures) {
      const errorMsg = 'Firebase 설정이 필요합니다.';
      onError?.(errorMsg);
      return;
    }

    setIsSubmittingComment(true);
    try {
      await addComment(
        { toolId: toolId, content: commentText.trim() },
        user.uid,
        user.displayName || '익명',
        user.photoURL
      );
      setCommentText('');
      onSuccess?.('댓글이 성공적으로 작성되었습니다.');
    } catch (error: any) {
      console.error('댓글 작성 실패:', error);
      const errorMsg = error.message || '댓글 작성 중 오류가 발생했습니다.';
      onError?.(errorMsg);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  /**
   * 답글 제출 핸들러
   */
  const handleReplySubmit = async (parentId: string) => {
    if (!user || !replyText.trim()) return;

    if (!canUseFirebaseFeatures) {
      const errorMsg = 'Firebase 설정이 필요합니다.';
      onError?.(errorMsg);
      return;
    }

    setIsSubmittingComment(true);
    try {
      await addComment(
        { toolId: toolId, content: replyText.trim(), parentId },
        user.uid,
        user.displayName || '익명',
        user.photoURL
      );
      setReplyText('');
      setReplyingTo(null);
      onSuccess?.('답글이 성공적으로 작성되었습니다.');
    } catch (error: any) {
      console.error('답글 작성 실패:', error);
      const errorMsg = error.message || '답글 작성 중 오류가 발생했습니다.';
      onError?.(errorMsg);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  /**
   * 댓글 수정 핸들러
   */
  const handleCommentEdit = async (commentId: string) => {
    if (!editText.trim()) return;

    if (!canUseFirebaseFeatures) {
      const errorMsg = 'Firebase 설정이 필요합니다.';
      onError?.(errorMsg);
      return;
    }

    setIsSubmittingComment(true);
    try {
      await updateComment(commentId, editText.trim());
      setEditingComment(null);
      setEditText('');
      onSuccess?.('댓글이 성공적으로 수정되었습니다.');
    } catch (error: any) {
      console.error('댓글 수정 실패:', error);
      const errorMsg = error.message || '댓글 수정 중 오류가 발생했습니다.';
      onError?.(errorMsg);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  /**
   * 댓글 삭제 핸들러
   */
  const handleCommentDelete = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    if (!canUseFirebaseFeatures) {
      const errorMsg = 'Firebase 설정이 필요합니다.';
      onError?.(errorMsg);
      return;
    }

    setIsSubmittingComment(true);
    try {
      await deleteComment(commentId);
      onSuccess?.('댓글이 성공적으로 삭제되었습니다.');
    } catch (error: any) {
      console.error('댓글 삭제 실패:', error);
      const errorMsg = error.message || '댓글 삭제 중 오류가 발생했습니다.';
      onError?.(errorMsg);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  /**
   * 댓글 수정 시작
   */
  const startEditComment = (comment: FirebaseComment) => {
    setEditingComment(comment.id);
    setEditText(comment.content);
  };

  /**
   * 댓글 수정 취소
   */
  const cancelEditComment = () => {
    setEditingComment(null);
    setEditText('');
  };

  /**
   * 댓글 컴포넌트
   */
  const CommentItem: React.FC<{ comment: FirebaseComment; isReply?: boolean }> = ({ comment, isReply = false }) => {
    const replies = getReplies(comment.id);

    return (
      <div className={`${isReply ? 'ml-8 border-l-2 border-slate-200 pl-4' : ''}`}>
        <div className="bg-slate-50 rounded-lg p-3 mb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {comment.userPhotoURL && (
                <img 
                  src={comment.userPhotoURL} 
                  alt={comment.userName}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="font-medium text-sm text-slate-700">{comment.userName}</span>
              <span className="text-xs text-slate-500">
                {comment.createdAt.toLocaleDateString()}
              </span>
            </div>
            {/* 작성자 본인만 수정/삭제 가능 */}
            {user && user.uid === comment.userId && (
              <div className="flex gap-1">
                <button
                  onClick={() => startEditComment(comment)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  수정
                </button>
                <button
                  onClick={() => handleCommentDelete(comment.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
          
          {/* 댓글 내용 또는 수정 폼 */}
          {editingComment === comment.id ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-2 text-sm border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                rows={2}
                maxLength={1000}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{editText.length}/1000</span>
                <div className="flex gap-2">
                  <button
                    onClick={cancelEditComment}
                    className="px-2 py-1 text-xs text-slate-600 hover:text-slate-800"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => handleCommentEdit(comment.id)}
                    disabled={!editText.trim() || isSubmittingComment}
                    className="px-3 py-1 bg-sky-500 text-white text-xs rounded-md hover:bg-sky-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    수정 완료
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-800 mb-2">{comment.content}</p>
              {!isReply && (
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="text-xs text-sky-600 hover:text-sky-800"
                >
                  답글
                </button>
              )}
            </>
          )}
        </div>

        {/* 답글 입력 */}
        {replyingTo === comment.id && (
          <div className="ml-4 mb-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="답글을 작성해주세요..."
              className="w-full p-2 text-sm border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              rows={2}
              maxLength={1000}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-500">{replyText.length}/1000</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText('');
                  }}
                  className="px-2 py-1 text-xs text-slate-600 hover:text-slate-800"
                >
                  취소
                </button>
                <button
                  onClick={() => handleReplySubmit(comment.id)}
                  disabled={!replyText.trim() || isSubmittingComment}
                  className="px-3 py-1 bg-sky-500 text-white text-xs rounded-md hover:bg-sky-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  답글 작성
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 답글 목록 */}
        {replies.length > 0 && (
          <div className="space-y-2">
            {replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setCommentText('');
      setReplyText('');
      setReplyingTo(null);
      setEditingComment(null);
      setEditText('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{tool.name}</h2>
            <p className="text-sm text-slate-600 mt-1">리뷰 작성</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl font-light"
          >
            ×
          </button>
        </div>

        {/* 내용 */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Firebase 미설정 안내 */}
            {!canUseFirebaseFeatures && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">💡 개발 모드</h3>
                <p className="text-blue-800 text-sm mb-2">
                  현재 정적 데이터를 사용 중입니다. 실제 리뷰 기능을 사용하려면 Firebase 설정이 필요합니다.
                </p>
                <div className="text-xs text-blue-600">
                  <p>• 별점 평가 및 댓글 작성 기능</p>
                  <p>• 실시간 사용자 간 리뷰 공유</p>
                  <p>• 개인화된 리뷰 관리</p>
                </div>
              </div>
            )}

            {/* 로그인 확인 */}
            {!isAuthenticated && canUseFirebaseFeatures && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  리뷰를 작성하려면 로그인이 필요합니다.
                </p>
              </div>
            )}

            {/* 평점 시스템 */}
            {isAuthenticated && canUseFirebaseFeatures && (
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-3">별점 평가</h3>
                <RatingSystem
                  currentRating={userRating?.rating || 0}
                  onRatingChange={handleRatingChange}
                  onRatingSubmit={handleRatingSubmit}
                  onRatingDelete={userRating ? handleRatingDelete : undefined}
                  showDeleteButton={!!userRating}
                />
                {ratingsError && (
                  <p className="text-red-500 text-sm mt-2">{ratingsError}</p>
                )}
              </div>
            )}

            {/* 댓글 작성 */}
            {isAuthenticated && canUseFirebaseFeatures && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">댓글 작성</h3>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="이 도구에 대한 의견을 남겨주세요..."
                  className="w-full p-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  rows={3}
                  maxLength={1000}
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{commentText.length}/1000</span>
                  <button
                    onClick={handleCommentSubmit}
                    disabled={!commentText.trim() || isSubmittingComment}
                    className="px-4 py-2 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    {isSubmittingComment ? '작성 중...' : '댓글 작성'}
                  </button>
                </div>
                {commentsError && (
                  <p className="text-red-500 text-sm">{commentsError}</p>
                )}
              </div>
            )}

            {/* 댓글 목록 */}
            {canUseFirebaseFeatures && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">
                    댓글 ({commentCount})
                  </h3>
                  <button
                    onClick={() => setShowComments(!showComments)}
                    className="text-sm text-sky-600 hover:text-sky-800"
                  >
                    {showComments ? '접기' : '펼치기'}
                  </button>
                </div>

                {showComments && (
                  <div className="space-y-3">
                    {commentsLoading ? (
                      <div className="text-center py-4">
                        <p className="text-slate-500">댓글을 불러오는 중...</p>
                      </div>
                    ) : parentComments.length > 0 ? (
                      parentComments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-slate-500">아직 댓글이 없습니다.</p>
                        {isAuthenticated && (
                          <p className="text-sm text-slate-400 mt-1">
                            첫 번째 댓글을 작성해보세요!
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 정적 도구에 대한 안내 */}
            {!canUseFirebaseFeatures && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">⭐</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {tool.name}
                </h3>
                <p className="text-slate-600 mb-4">
                  현재 평점: <span className="font-semibold text-amber-600">★ {isFirebaseTool(tool) ? tool.averageRating.toFixed(1) : tool.rating.toFixed(1)}</span>
                </p>
                <p className="text-sm text-slate-500">
                  Firebase 설정 후 실제 리뷰 기능을 사용할 수 있습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal; 