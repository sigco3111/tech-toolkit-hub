import React, { useState } from 'react';
import { useAuth } from '../src/hooks/useAuth';
import { ToolInput } from '../types';
import { CATEGORIES } from '../constants';

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTool: (toolData: ToolInput) => Promise<void>;
  categories: string[];
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  isAdmin?: boolean; // 어드민 상태를 prop으로 받음
}



/**
 * 새로운 도구를 추가하는 모달 컴포넌트
 * 로그인한 사용자만 사용 가능하며, 폼 유효성 검사를 포함합니다.
 */
const AddToolModal: React.FC<AddToolModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddTool, 
  categories,
  onSuccess,
  onError,
  isAdmin = false // 기본값은 false로 설정
}) => {
  const { user } = useAuth();
  
  // 디버깅: 카테고리 목록 확인
  React.useEffect(() => {
    if (isOpen) {
      console.log('AddToolModal opened with categories:', categories);
    }
  }, [isOpen, categories]);
  
  // 폼 상태 관리
  const [formData, setFormData] = useState<ToolInput>({
    name: '',
    category: '',
    url: '',
    description: '',
    memo: '',
    plan: null
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  /**
   * 폼 입력값 변경 핸들러
   */
  const handleInputChange = (field: keyof ToolInput, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // 입력 시 에러 메시지 초기화
    if (error) setError(null);
  };

  /**
   * 카테고리 선택 변경 핸들러
   */
  const handleCategoryChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomCategory(true);
      setFormData(prev => ({ ...prev, category: '' }));
    } else {
      setIsCustomCategory(false);
      setFormData(prev => ({ ...prev, category: value }));
    }
  };

  /**
   * URL 유효성 검사
   */
  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  /**
   * 폼 유효성 검사
   */
  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return '도구 이름을 입력해주세요.';
    }
    
    if (!formData.category.trim()) {
      return '카테고리를 선택하거나 입력해주세요.';
    }
    
    if (!formData.url.trim()) {
      return 'URL을 입력해주세요.';
    }
    
    if (!isValidUrl(formData.url)) {
      return 'https://로 시작하는 올바른 URL을 입력해주세요.';
    }
    
    if (!formData.description.trim()) {
      return '도구 설명을 입력해주세요.';
    }
    
    if (formData.description.length > 200) {
      return '설명은 200자 이내로 입력해주세요.';
    }
    
    if (formData.memo.length > 100) {
      return '메모는 100자 이내로 입력해주세요.';
    }
    
    return null;
  };

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      const errorMsg = '로그인이 필요합니다.';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      onError?.(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onAddTool(formData);
      setSuccess(true);
      
      // 성공 메시지 표시
      const successMsg = `${formData.name} 도구가 성공적으로 추가되었습니다!`;
      onSuccess?.(successMsg);
      
      // 성공 후 모달 닫기
      setTimeout(() => {
        handleClose();
      }, 1500);
      
    } catch (err: any) {
      console.error('❌ 도구 추가 실패:', err);
      const errorMsg = err.message || '도구 추가 중 오류가 발생했습니다.';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 모달 닫기 핸들러
   */
  const handleClose = () => {
    onClose();
    // 상태 초기화 (애니메이션 완료 후)
    setTimeout(() => {
      setFormData({
        name: '',
        category: '',
        url: '',
        description: '',
        memo: '',
        plan: null
      });
      setError(null);
      setSuccess(false);
      setIsCustomCategory(false);
      setIsLoading(false);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-transform transform scale-95 duration-300 ease-out"
        style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <header className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">🛠️ 새 도구 추가</h2>
          <button 
            onClick={handleClose} 
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
            disabled={isLoading}
          >
            ×
          </button>
        </header>

        {/* 컨텐츠 */}
        <div className="p-6 overflow-y-auto flex-1">
          {success ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-green-600 mb-2">도구가 성공적으로 추가되었습니다!</h3>
              <p className="text-slate-600">잠시 후 자동으로 닫힙니다...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 도구 이름 */}
              <div>
                <label htmlFor="tool-name" className="block text-lg font-medium text-slate-700 mb-2">
                  도구 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  id="tool-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                  placeholder="예: ChatGPT, Figma, Docker..."
                  disabled={isLoading}
                  maxLength={50}
                />
              </div>

              {/* 카테고리 */}
              <div>
                <label htmlFor="tool-category" className="block text-lg font-medium text-slate-700 mb-2">
                  카테고리 <span className="text-red-500">*</span>
                </label>
                {!isCustomCategory ? (
                  <div className="space-y-2">
                    <select
                      id="tool-category"
                      value={formData.category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                      disabled={isLoading}
                    >
                      <option value="">카테고리를 선택하세요</option>
                      {(() => {
                        // 전달받은 카테고리가 있으면 사용, 없으면 기본 카테고리 사용
                        const availableCategories = (categories && categories.length > 0) 
                          ? categories 
                          : CATEGORIES;
                        
                        return availableCategories
                          .filter(cat => cat !== '전체')
                          .map(category => (
                            <option key={category} value={category}>{category}</option>
                          ));
                      })()}
                      {/* 어드민에게만 새 카테고리 입력 옵션 표시 */}
                      {isAdmin && <option value="custom">+ 새 카테고리 입력</option>}
                    </select>
                    {/* 디버깅 정보 */}
                    {process.env.NODE_ENV === 'development' && (
                      <p className="text-xs text-gray-500">
                        카테고리 수: {categories?.length || 0}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                      placeholder="새 카테고리 이름을 입력하세요"
                      disabled={isLoading}
                      maxLength={30}
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(false)}
                      className="text-sm text-sky-600 hover:text-sky-700"
                      disabled={isLoading}
                    >
                      ← 기존 카테고리에서 선택
                    </button>
                  </div>
                )}
              </div>

              {/* URL */}
              <div>
                <label htmlFor="tool-url" className="block text-lg font-medium text-slate-700 mb-2">
                  URL <span className="text-red-500">*</span>
                </label>
                <input
                  id="tool-url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                  placeholder="https://example.com"
                  disabled={isLoading}
                />
                <p className="text-sm text-slate-500 mt-1">https://로 시작하는 URL을 입력해주세요</p>
              </div>

              {/* 설명 */}
              <div>
                <label htmlFor="tool-description" className="block text-lg font-medium text-slate-700 mb-2">
                  설명 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="tool-description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition resize-none"
                  placeholder="이 도구가 무엇인지, 어떤 기능을 제공하는지 설명해주세요..."
                  disabled={isLoading}
                  maxLength={200}
                />
                <p className="text-sm text-slate-500 mt-1">
                  {formData.description.length}/200자
                </p>
              </div>

              {/* 메모 */}
              <div>
                <label htmlFor="tool-memo" className="block text-lg font-medium text-slate-700 mb-2">
                  메모 (선택사항)
                </label>
                <input
                  id="tool-memo"
                  type="text"
                  value={formData.memo}
                  onChange={(e) => handleInputChange('memo', e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                  placeholder="개인적인 의견이나 추가 정보..."
                  disabled={isLoading}
                  maxLength={100}
                />
                <p className="text-sm text-slate-500 mt-1">
                  {formData.memo.length}/100자
                </p>
              </div>

              {/* 요금제 */}
              <div>
                <label htmlFor="tool-plan" className="block text-lg font-medium text-slate-700 mb-2">
                  요금제 정보 (선택사항)
                </label>
                <select
                  id="tool-plan"
                  value={formData.plan || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value || null }))}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                  disabled={isLoading}
                >
                  <option value="">선택하지 않음</option>
                  <option value="무료">무료</option>
                  <option value="프리미엄">프리미엄</option>
                  <option value="유료">유료</option>
                </select>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-sky-500 text-white font-bold rounded-lg shadow-md hover:bg-sky-600 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    추가 중...
                  </>
                ) : (
                  "도구 추가하기"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddToolModal; 