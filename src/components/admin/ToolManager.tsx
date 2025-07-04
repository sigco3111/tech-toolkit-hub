// 도구 관리 컴포넌트
import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, getDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FirebaseTool, ToolInput } from '../../../types';
import { useToast } from '../../hooks/useToast';
import { useTools } from '../../hooks/useTools';
import EditToolModal from '../../../components/EditToolModal';
import { exportToolsToJson, downloadJsonFile, parseToolsFromJson, importToolsToFirebase } from '../../utils/exportImport';

/**
 * 도구 관리 페이지 컴포넌트
 */
const ToolManager: React.FC = () => {
  const [tools, setTools] = useState<FirebaseTool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedTool, setSelectedTool] = useState<FirebaseTool | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useToast();

  // useTools 훅을 사용하여 도구 데이터 및 카테고리 가져오기
  const { 
    data: toolsData, 
    isLoading: toolsLoading, 
    error: toolsError, 
    categories, 
    deleteTool: originalDeleteTool,
    updateTool: originalUpdateTool
  } = useTools(selectedCategory);

  // 모달 컴포넌트와 호환되는 함수 시그니처로 변환
  const updateTool = async (toolId: string, toolData: ToolInput): Promise<void> => {
    return originalUpdateTool(toolId, toolData, 'admin');
  };

  const deleteTool = async (toolId: string): Promise<void> => {
    return originalDeleteTool(toolId, 'admin');
  };

  // 페이지 크기
  const ITEMS_PER_PAGE = 10;

  // 도구 데이터 로딩 시 업데이트
  useEffect(() => {
    if (!toolsLoading && !toolsError) {
      setTools(toolsData);
      setLoading(false);
    }
  }, [toolsData, toolsLoading, toolsError]);

  /**
   * 도구 삭제 핸들러
   */
  const handleDeleteTool = async (tool: FirebaseTool) => {
    const confirmed = window.confirm(`"${tool.name}" 도구를 정말 삭제하시겠습니까?`);
    if (!confirmed) return;
    
    try {
      setLoading(true);
      await deleteTool(tool.id);
      showSuccess(`"${tool.name}" 도구가 성공적으로 삭제되었습니다.`);
    } catch (error) {
      console.error('도구 삭제 오류:', error);
      showError(`도구 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 도구 편집 모달 열기
   */
  const handleEditTool = (tool: FirebaseTool) => {
    setSelectedTool(tool);
    setIsEditModalOpen(true);
  };

  /**
   * 카테고리 변경 핸들러
   */
  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(event.target.value);
    setCurrentPage(1); // 카테고리 변경 시 첫 페이지로 이동
  };

  /**
   * 도구 데이터 내보내기 핸들러
   */
  const handleExportTools = async () => {
    try {
      setLoading(true);
      const jsonData = await exportToolsToJson();
      downloadJsonFile(jsonData, `tech-toolkit-${new Date().toISOString().slice(0, 10)}.json`);
      showSuccess('도구 데이터가 성공적으로 내보내졌습니다.');
    } catch (error) {
      console.error('데이터 내보내기 오류:', error);
      showError(`데이터 내보내기 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 파일 선택 핸들러
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonString = e.target?.result as string;
        const { validTools, invalidEntries } = parseToolsFromJson(jsonString);
        
        if (validTools.length === 0) {
          showError('유효한 도구 데이터가 없습니다.');
          return;
        }
        
        if (invalidEntries.length > 0) {
          console.warn('유효하지 않은 항목이 있습니다:', invalidEntries);
        }
        
        const importConfirmed = window.confirm(
          `${validTools.length}개의 도구를 가져오시겠습니까?` +
          (invalidEntries.length > 0 ? `\n(유효하지 않은 항목 ${invalidEntries.length}개는 건너뜁니다)` : '') +
          `\n\n가져오기 모드: ${importMode === 'append' ? '추가' : '교체'}`
        );
        
        if (importConfirmed) {
          setIsImporting(true);
          const result = await importToolsToFirebase(validTools, 'admin', importMode);
          showSuccess(
            `도구 가져오기가 완료되었습니다. ` +
            `성공: ${result.success}개, 실패: ${result.failed}개`
          );
          setIsImporting(false);
          // 파일 입력 초기화
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      } catch (error) {
        console.error('파일 처리 오류:', error);
        showError(`파일 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        setIsImporting(false);
      }
    };
    
    reader.readAsText(file);
  };

  // 검색 필터링
  const filteredTools = tools.filter(tool => {
    // 검색어 필터링
    const searchMatch = !searchTerm || 
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return searchMatch;
  });

  // 현재 페이지의 도구만 표시
  const indexOfLastTool = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstTool = indexOfLastTool - ITEMS_PER_PAGE;
  const currentTools = filteredTools.slice(indexOfFirstTool, indexOfLastTool);

  // 총 페이지 수 계산
  const totalPages = Math.ceil(filteredTools.length / ITEMS_PER_PAGE);

  /**
   * 페이지 변경 핸들러
   */
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">도구 관리</h2>
        
        {/* 데이터 내보내기/가져오기 컨트롤 */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={handleExportTools}
            disabled={loading || isImporting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
            </svg>
            JSON 내보내기
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="file"
                accept=".json"
                id="fileInput"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                disabled={loading || isImporting}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || isImporting}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 17H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-3m-1-4l-3 3m0 0l-3-3m3 3V7"></path>
                </svg>
                JSON 가져오기
                {isImporting && (
                  <svg className="ml-2 animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </button>
            </div>
            
            <select
              value={importMode}
              onChange={(e) => setImportMode(e.target.value as 'append' | 'replace')}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
              disabled={loading || isImporting}
            >
              <option value="append">추가 모드</option>
              <option value="replace">교체 모드</option>
            </select>
          </div>
        </div>
        
        {/* 검색 및 필터 컨트롤 */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              검색
            </label>
            <input
              type="text"
              id="search"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="도구 이름 또는 설명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full sm:w-auto">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              카테고리
            </label>
            <select
              id="category"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={selectedCategory}
              onChange={handleCategoryChange}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* 도구 목록 */}
        <div className="overflow-hidden rounded-md border border-gray-200 mt-4">
          {loading ? (
            <div className="py-12 text-center">
              <svg className="mx-auto animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-sm text-gray-500">도구를 불러오는 중입니다...</p>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="py-12 text-center border-b">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">도구 없음</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? '검색 결과가 없습니다.' : '도구를 추가해주세요.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이름
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      카테고리
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      평점
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      URL
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentTools.map((tool) => (
                    <tr key={tool.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {tool.name}
                            </div>
                            <div className="text-xs text-gray-500 line-clamp-2">
                              {tool.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{tool.category}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {tool.averageRating.toFixed(1)}
                          <span className="text-gray-500 text-xs ml-1">
                            ({tool.ratingCount} 개)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 truncate max-w-[180px]">
                          <a href={tool.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                            {tool.url}
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditTool(tool)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteTool(tool)}
                            className="text-red-600 hover:text-red-900"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                이전
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                다음
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{indexOfFirstTool + 1}</span>
                  -
                  <span className="font-medium">
                    {Math.min(indexOfLastTool, filteredTools.length)}
                  </span>
                  {' '}/ 총{' '}
                  <span className="font-medium">{filteredTools.length}</span>개
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  {/* 이전 페이지 버튼 */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">이전</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* 페이지 번호 */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border ${
                        currentPage === page
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-600 z-10'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      } text-sm font-medium`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  {/* 다음 페이지 버튼 */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">다음</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 도구 편집 모달 */}
      {selectedTool && (
        <EditToolModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          tool={selectedTool}
          onUpdateTool={updateTool}
          onDeleteTool={deleteTool}
          categories={categories}
          onSuccess={showSuccess}
          onError={showError}
        />
      )}
    </div>
  );
};

export default ToolManager; 