import React, { useState } from 'react';

interface RatingSystemProps {
  currentRating?: number; // 현재 사용자의 평점 (수정 모드)
  onRatingChange: (rating: number) => void;
  onRatingSubmit: (rating: number) => Promise<void>;
  onRatingDelete?: () => Promise<void>;
  disabled?: boolean;
  showDeleteButton?: boolean;
}

/**
 * 인터랙티브 평점 입력 컴포넌트
 * 0.5 단위로 별점을 입력할 수 있으며, hover 효과와 클릭 이벤트를 지원합니다.
 */
const RatingSystem: React.FC<RatingSystemProps> = ({
  currentRating = 0,
  onRatingChange,
  onRatingSubmit,
  onRatingDelete,
  disabled = false,
  showDeleteButton = false
}) => {
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedRating, setSelectedRating] = useState<number>(currentRating);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 별 클릭 핸들러
   * @param rating 선택된 평점
   */
  const handleStarClick = (rating: number) => {
    if (disabled) return;
    
    setSelectedRating(rating);
    onRatingChange(rating);
  };

  /**
   * 평점 제출 핸들러
   */
  const handleSubmit = async () => {
    if (disabled || selectedRating === 0) return;
    
    setIsSubmitting(true);
    try {
      await onRatingSubmit(selectedRating);
    } catch (error) {
      console.error('평점 제출 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 평점 삭제 핸들러
   */
  const handleDelete = async () => {
    if (disabled || !onRatingDelete) return;
    
    setIsSubmitting(true);
    try {
      await onRatingDelete();
      setSelectedRating(0);
      onRatingChange(0);
    } catch (error) {
      console.error('평점 삭제 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 별 하나를 렌더링하는 함수
   * @param starIndex 별의 인덱스 (1-5)
   */
  const renderStar = (starIndex: number) => {
    const displayRating = hoverRating || selectedRating;
    
    return (
      <div key={starIndex} className="relative inline-block">
        {/* 배경 별 (회색) */}
        <div className="text-2xl text-slate-300">★</div>
        
        {/* 채워진 별 (노란색) - 오버레이 */}
        <div 
          className="absolute top-0 left-0 text-2xl text-amber-500 overflow-hidden transition-all duration-150"
          style={{
            width: displayRating >= starIndex 
              ? '100%' 
              : displayRating > starIndex - 1 
                ? '50%' 
                : '0%'
          }}
        >
          ★
        </div>
        
        {/* 클릭 영역 - 반별 (왼쪽 50%) */}
        <button
          type="button"
          className={`absolute top-0 left-0 w-1/2 h-full focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-opacity-50 rounded-l ${
            disabled 
              ? 'cursor-not-allowed opacity-50' 
              : 'cursor-pointer hover:bg-amber-100 hover:bg-opacity-30'
          }`}
          onClick={() => handleStarClick(starIndex - 0.5)}
          onMouseEnter={() => !disabled && setHoverRating(starIndex - 0.5)}
          onMouseLeave={() => !disabled && setHoverRating(0)}
          disabled={disabled}
          aria-label={`${starIndex - 0.5}점 평점 주기`}
        />
        
        {/* 클릭 영역 - 전별 (오른쪽 50%) */}
        <button
          type="button"
          className={`absolute top-0 right-0 w-1/2 h-full focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-opacity-50 rounded-r ${
            disabled 
              ? 'cursor-not-allowed opacity-50' 
              : 'cursor-pointer hover:bg-amber-100 hover:bg-opacity-30'
          }`}
          onClick={() => handleStarClick(starIndex)}
          onMouseEnter={() => !disabled && setHoverRating(starIndex)}
          onMouseLeave={() => !disabled && setHoverRating(0)}
          disabled={disabled}
          aria-label={`${starIndex}점 평점 주기`}
        />
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* 별점 입력 영역 */}
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-slate-700 mr-2">내 평점:</span>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map(starIndex => renderStar(starIndex))}
        </div>
        {(hoverRating || selectedRating) > 0 && (
          <span className="text-sm text-slate-600 ml-2 font-semibold">
            {(hoverRating || selectedRating).toFixed(1)}점
          </span>
        )}
      </div>

      {/* 액션 버튼 영역 */}
      {selectedRating > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleSubmit}
            disabled={disabled || isSubmitting || selectedRating === currentRating}
            className="px-3 py-1.5 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors duration-200 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-1">
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                처리중...
              </div>
            ) : currentRating > 0 ? (
              '평점 수정'
            ) : (
              '평점 등록'
            )}
          </button>
          
          {showDeleteButton && currentRating > 0 && onRatingDelete && (
            <button
              onClick={handleDelete}
              disabled={disabled || isSubmitting}
              className="px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors duration-200 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              평점 삭제
            </button>
          )}
        </div>
      )}

      {/* 도움말 텍스트 */}
      {selectedRating === 0 && !disabled && (
        <p className="text-xs text-slate-500">
          별을 클릭하여 0.5 ~ 5.0점 사이의 평점을 남겨보세요
        </p>
      )}
    </div>
  );
};

export default RatingSystem; 