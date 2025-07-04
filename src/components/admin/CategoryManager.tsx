// 카테고리 관리 컴포넌트
import React, { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, serverTimestamp, DocumentReference, DocumentData } from 'firebase/firestore';
import { db } from '../../lib/firebase';

/**
 * 카테고리 인터페이스
 */
interface Category {
  id: string;
  name: string;
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 어드민 카테고리 관리 컴포넌트
 */
const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { showSuccess, showError } = useToast();

  // 카테고리 목록 로드
  useEffect(() => {
    fetchCategories();
  }, []);

  /**
   * 카테고리 목록 조회
   */
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const categoriesCollection = collection(db, 'categories');
      const categoriesSnapshot = await getDocs(categoriesCollection);
      
      // 도구 컬렉션에서 카테고리별 개수를 계산
      const toolsCollection = collection(db, 'tools');
      const toolsSnapshot = await getDocs(toolsCollection);
      
      const categoryCount: Record<string, number> = {};
      toolsSnapshot.forEach(doc => {
        const tool = doc.data();
        if (tool.category) {
          categoryCount[tool.category] = (categoryCount[tool.category] || 0) + 1;
        }
      });
      
      // 카테고리 데이터 변환
      const categoriesData: Category[] = [];
      
      categoriesSnapshot.forEach(doc => {
        const data = doc.data();
        categoriesData.push({
          id: doc.id,
          name: data.name,
          count: categoryCount[data.name] || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });
      
      // 카테고리 이름 오름차순으로 정렬
      categoriesData.sort((a, b) => a.name.localeCompare(b.name));
      
      setCategories(categoriesData);
      setLoading(false);
    } catch (error) {
      console.error('카테고리 로드 오류:', error);
      showError('카테고리를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  /**
   * 새 카테고리 추가
   */
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      showError('카테고리 이름을 입력해주세요.');
      return;
    }
    
    try {
      setLoading(true);
      
      // 중복 검사
      const isDuplicate = categories.some(category => 
        category.name.toLowerCase() === newCategoryName.trim().toLowerCase()
      );
      
      if (isDuplicate) {
        showError('이미 존재하는 카테고리 이름입니다.');
        setLoading(false);
        return;
      }
      
      // 새 카테고리 ID 생성
      const categoryId = `category_${Date.now()}`;
      const categoryRef = doc(db, 'categories', categoryId);
      
      // 카테고리 문서 생성
      await setDoc(categoryRef, {
        name: newCategoryName.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // 화면 갱신
      setNewCategoryName('');
      showSuccess('새 카테고리가 추가되었습니다.');
      fetchCategories();
    } catch (error) {
      console.error('카테고리 추가 오류:', error);
      showError('카테고리 추가 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  /**
   * 카테고리 수정 시작
   */
  const handleEditStart = (category: Category) => {
    setEditingCategory({ ...category });
  };

  /**
   * 카테고리 수정 취소
   */
  const handleEditCancel = () => {
    setEditingCategory(null);
  };

  /**
   * 카테고리 이름 수정 적용
   */
  const handleEditSave = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      showError('카테고리 이름을 입력해주세요.');
      return;
    }
    
    try {
      setLoading(true);
      
      // 다른 카테고리와 중복 검사
      const isDuplicate = categories.some(category => 
        category.id !== editingCategory.id && 
        category.name.toLowerCase() === editingCategory.name.trim().toLowerCase()
      );
      
      if (isDuplicate) {
        showError('이미 존재하는 카테고리 이름입니다.');
        setLoading(false);
        return;
      }
      
      // 기존 카테고리명 가져오기
      const categoryRef = doc(db, 'categories', editingCategory.id);
      const categorySnapshot = await getDoc(categoryRef);
      const oldCategoryName = categorySnapshot.data()?.name;
      
      // 카테고리 문서 수정
      await setDoc(categoryRef, {
        name: editingCategory.name.trim(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // 해당 카테고리를 사용하는 모든 도구 업데이트
      if (oldCategoryName && oldCategoryName !== editingCategory.name.trim()) {
        const toolsRef = collection(db, 'tools');
        const toolsSnapshot = await getDocs(toolsRef);
        
        const batch: Promise<void>[] = [];
        toolsSnapshot.forEach(toolDoc => {
          const toolData = toolDoc.data();
          if (toolData.category === oldCategoryName) {
            batch.push(setDoc(doc(db, 'tools', toolDoc.id), {
              category: editingCategory.name.trim(),
              updatedAt: serverTimestamp()
            }, { merge: true }));
          }
        });
        
        // 일괄 업데이트 실행
        if (batch.length > 0) {
          await Promise.all(batch);
        }
      }
      
      // 화면 갱신
      setEditingCategory(null);
      showSuccess('카테고리가 수정되었습니다.');
      fetchCategories();
    } catch (error) {
      console.error('카테고리 수정 오류:', error);
      showError('카테고리 수정 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  /**
   * 카테고리 삭제
   */
  const handleDeleteCategory = async (category: Category) => {
    // 해당 카테고리에 속한 도구가 있는지 확인
    if (category.count > 0) {
      const confirmed = window.confirm(
        `이 카테고리에는 ${category.count}개의 도구가 포함되어 있습니다. 정말 삭제하시겠습니까?`
      );
      if (!confirmed) return;
    } else {
      const confirmed = window.confirm('이 카테고리를 정말 삭제하시겠습니까?');
      if (!confirmed) return;
    }
    
    try {
      setLoading(true);
      
      // 카테고리 문서 삭제
      await deleteDoc(doc(db, 'categories', category.id));
      
      showSuccess('카테고리가 삭제되었습니다.');
      fetchCategories();
    } catch (error) {
      console.error('카테고리 삭제 오류:', error);
      showError('카테고리 삭제 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  // 필터링된 카테고리 목록
  const filteredCategories = searchTerm
    ? categories.filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : categories;

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">카테고리 관리</h2>
        
        {/* 카테고리 추가 폼 */}
        <form onSubmit={handleAddCategory} className="mb-6 flex items-end space-x-4">
          <div className="flex-1">
            <label htmlFor="newCategory" className="block text-sm font-medium text-gray-700 mb-1">
              새 카테고리 이름
            </label>
            <input
              type="text"
              id="newCategory"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="새 카테고리 이름을 입력하세요"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={loading || !newCategoryName.trim()}
          >
            추가
          </button>
        </form>
        
        {/* 검색 */}
        <div className="mb-4">
          <label htmlFor="search" className="sr-only">
            카테고리 검색
          </label>
          <input
            type="text"
            id="search"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="카테고리 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* 카테고리 목록 */}
        <div className="overflow-hidden rounded-md border border-gray-200 mt-4">
          {loading ? (
            <div className="py-12 text-center">
              <svg className="mx-auto animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-sm text-gray-500">카테고리를 불러오는 중입니다...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="py-12 text-center border-b">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">카테고리 없음</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? '검색 결과가 없습니다.' : '카테고리를 추가해주세요.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      카테고리 이름
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      도구 수
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      생성일
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCategories.map((category) => (
                    <tr key={category.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingCategory?.id === category.id ? (
                          <input
                            type="text"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{category.count}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(category.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingCategory?.id === category.id ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={handleEditSave}
                              className="text-indigo-600 hover:text-indigo-900"
                              disabled={loading}
                            >
                              저장
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditStart(category)}
                              className="text-indigo-600 hover:text-indigo-900"
                              disabled={loading}
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category)}
                              className="text-red-600 hover:text-red-900"
                              disabled={loading}
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManager; 