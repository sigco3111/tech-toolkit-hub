import React, { useState, useEffect } from 'react';
import { ToolInput, FirebaseTool, AiTool } from '../types';

interface EditToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool: AiTool | FirebaseTool;
  onUpdateTool: (toolId: string, toolData: ToolInput) => Promise<void>;
  onDeleteTool?: (toolId: string) => Promise<void>;
  categories: string[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * 도구 편집 모달 컴포넌트
 * 기존 도구 정보를 수정할 수 있는 폼을 제공합니다.
 */
const EditToolModal: React.FC<EditToolModalProps> = ({
  isOpen,
  onClose,
  tool,
  onUpdateTool,
  onDeleteTool,
  categories,
  onSuccess,
  onError
}) => {
  // 폼 상태 관리
  const [formData, setFormData] = useState<ToolInput>({
    name: '',
    category: '',
    url: '',
    description: '',
    memo: '',
    plan: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<ToolInput>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // 카테고리 목록 필터링 - '전체' 카테고리 제외
  const filteredCategories = categories.filter(cat => cat !== '전체');

  // Firebase 도구인지 확인하는 타입 가드
  const isFirebaseTool = (tool: AiTool | FirebaseTool): tool is FirebaseTool => {
    return 'id' in tool && 'averageRating' in tool;
  };

  // 도구 ID 결정: Firebase 도구면 실제 ID, 정적 도구면 name을 ID로 사용
  const getToolId = (tool: AiTool | FirebaseTool): string => {
    return isFirebaseTool(tool) ? tool.id : tool.name;
  };

  // 도구 정보가 변경될 때 폼 데이터 초기화
  useEffect(() => {
    if (tool) {
      setFormData({
        name: tool.name,
        category: tool.category,
        url: tool.url,
        description: tool.description,
        memo: tool.memo,
        plan: tool.plan
      });
    }
  }, [tool]);

  // 모달이 열릴 때마다 에러 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  /**
   * 입력 필드 변경 핸들러
   */
  const handleInputChange = (field: keyof ToolInput, value: string | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 해당 필드의 에러 제거
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  /**
   * 폼 유효성 검사
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<ToolInput> = {};

    // 필수 필드 검증
    if (!formData.name.trim()) {
      newErrors.name = '도구 이름을 입력해주세요.';
    } else if (formData.name.length > 50) {
      newErrors.name = '도구 이름은 50자 이내로 입력해주세요.';
    }

    if (!formData.category.trim()) {
      newErrors.category = '카테고리를 선택해주세요.';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL을 입력해주세요.';
    } else {
      // URL 형식 검증
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = '올바른 URL 형식을 입력해주세요.';
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = '설명을 입력해주세요.';
    } else if (formData.description.length > 200) {
      newErrors.description = '설명은 200자 이내로 입력해주세요.';
    }

    if (formData.memo && formData.memo.length > 100) {
      newErrors.memo = '메모는 100자 이내로 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onUpdateTool(getToolId(tool), formData);
      onSuccess('도구가 성공적으로 수정되었습니다.');
      onClose();
    } catch (error: any) {
      onError(error.message || '도구 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 모달 닫기 핸들러
   */
  const handleClose = () => {
    if (!isSubmitting) {
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  /**
   * 삭제 확인 핸들러
   */
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  /**
   * 삭제 실행 핸들러
   */
  const handleDeleteConfirm = async () => {
    if (!onDeleteTool) return;

    setIsSubmitting(true);

    try {
      await onDeleteTool(getToolId(tool));
      onSuccess('도구가 성공적으로 삭제되었습니다.');
      onClose();
    } catch (error: any) {
      onError(error.message || '도구 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  /**
   * 삭제 취소 핸들러
   */
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">도구 편집</h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-slate-600 transition-colors duration-200 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 도구 이름 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                도구 이름 *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors duration-200 ${
                  errors.name ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="예: ChatGPT"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* 카테고리 */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
                카테고리 *
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors duration-200 ${
                  errors.category ? 'border-red-300' : 'border-slate-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="">카테고리 선택</option>
                {filteredCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            {/* URL */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-slate-700 mb-1">
                URL *
              </label>
              <input
                type="url"
                id="url"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors duration-200 ${
                  errors.url ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="https://example.com"
                disabled={isSubmitting}
              />
              {errors.url && (
                <p className="mt-1 text-sm text-red-600">{errors.url}</p>
              )}
            </div>

            {/* 설명 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                설명 * <span className="text-xs text-slate-500">({formData.description.length}/200자)</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors duration-200 resize-none ${
                  errors.description ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="도구에 대한 간단한 설명을 입력하세요"
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* 메모 */}
            <div>
              <label htmlFor="memo" className="block text-sm font-medium text-slate-700 mb-1">
                메모 <span className="text-xs text-slate-500">({formData.memo.length}/100자)</span>
              </label>
              <textarea
                id="memo"
                value={formData.memo}
                onChange={(e) => handleInputChange('memo', e.target.value)}
                rows={2}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors duration-200 resize-none ${
                  errors.memo ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="추가 메모 (선택사항)"
                disabled={isSubmitting}
              />
              {errors.memo && (
                <p className="mt-1 text-sm text-red-600">{errors.memo}</p>
              )}
            </div>

            {/* 요금제 */}
            <div>
              <label htmlFor="plan" className="block text-sm font-medium text-slate-700 mb-1">
                요금제
              </label>
              <select
                id="plan"
                value={formData.plan || ''}
                onChange={(e) => handleInputChange('plan', e.target.value || null)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors duration-200"
                disabled={isSubmitting}
              >
                <option value="">선택하지 않음</option>
                <option value="무료">무료</option>
                <option value="기업플랜">기업플랜</option>
              </select>
            </div>

            {/* 버튼 영역 */}
            <div className="space-y-3 pt-4">
              {/* 삭제 버튼 (별도 줄) */}
              {onDeleteTool && (
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    도구 삭제
                  </button>
                </div>
              )}
              
              {/* 취소/수정 버튼 */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors duration-200 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      수정 중...
                    </>
                  ) : (
                    '도구 수정'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">도구 삭제 확인</h3>
                  <p className="text-sm text-slate-600">이 작업은 되돌릴 수 없습니다.</p>
                </div>
              </div>
              
              <p className="text-slate-700 mb-6">
                <strong>"{tool.name}"</strong> 도구를 정말 삭제하시겠습니까?<br />
                연결된 모든 평점과 댓글도 함께 삭제됩니다.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors duration-200 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      삭제 중...
                    </>
                  ) : (
                    '삭제'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditToolModal; 