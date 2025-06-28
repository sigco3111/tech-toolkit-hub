// 도구 관리 스크립트 - 특정 도구 name으로 조회, 수정, 삭제
import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';

// 환경변수 로드
config();
import { 
  getFirestore, 
  collection, 
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { createInterface } from 'readline';
import { FirebaseTool, ToolInput } from '../types';

// Firebase 설정 (환경변수 사용)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * 도구 이름으로 검색하여 도구 정보를 조회
 * @param toolName 검색할 도구 이름
 * @returns 검색된 도구 목록
 */
async function findToolByName(toolName: string): Promise<{ id: string; data: FirebaseTool }[]> {
  try {
    console.log(`🔍 도구 검색 중: "${toolName}"`);
    
    // 정확한 이름 매치
    const exactQuery = query(
      collection(db, 'tools'),
      where('name', '==', toolName)
    );
    const exactSnapshot = await getDocs(exactQuery);
    
    if (!exactSnapshot.empty) {
      const results = exactSnapshot.docs.map(doc => ({
        id: doc.id,
        data: { id: doc.id, ...doc.data() } as FirebaseTool
      }));
      
      console.log(`✅ ${results.length}개의 도구를 찾았습니다 (정확한 매치):`);
      results.forEach((tool: any, index: number) => {
        console.log(`${index + 1}. ID: ${tool.id}`);
        console.log(`   이름: ${tool.data.name}`);
        console.log(`   카테고리: ${tool.data.category}`);
        console.log(`   URL: ${tool.data.url}`);
        console.log(`   설명: ${tool.data.description.substring(0, 50)}...`);
        console.log(`   작성자: ${tool.data.createdBy}`);
        console.log(`   평점: ${tool.data.averageRating} (${tool.data.ratingCount}명)`);
        console.log('');
      });
      
      return results;
    }
    
    // 부분 매치 시도
    console.log('📝 정확한 매치가 없어 유사한 이름을 검색합니다...');
    const allToolsSnapshot = await getDocs(collection(db, 'tools'));
    const similarResults = allToolsSnapshot.docs
      .filter(doc => {
        const data = doc.data();
        return data.name.toLowerCase().includes(toolName.toLowerCase());
      })
      .map(doc => ({
        id: doc.id,
        data: { id: doc.id, ...doc.data() } as FirebaseTool
      }));
    
    if (similarResults.length > 0) {
      console.log(`✅ ${similarResults.length}개의 유사한 도구를 찾았습니다:`);
      similarResults.forEach((tool: any, index: number) => {
        console.log(`${index + 1}. ID: ${tool.id}`);
        console.log(`   이름: ${tool.data.name}`);
        console.log(`   카테고리: ${tool.data.category}`);
        console.log('');
      });
    } else {
      console.log('❌ 해당 이름의 도구를 찾을 수 없습니다.');
    }
    
    return similarResults;
    
  } catch (error) {
    console.error('❌ 도구 검색 중 오류:', error);
    return [];
  }
}

/**
 * 도구 정보 수정
 * @param toolId 수정할 도구 ID
 * @param updateData 수정할 데이터
 */
async function updateTool(toolId: string, updateData: Partial<ToolInput>): Promise<boolean> {
  try {
    console.log(`🔧 도구 수정 중 (ID: ${toolId})...`);
    
    const updatePayload = {
      ...updateData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(db, 'tools', toolId), updatePayload);
    console.log('✅ 도구 수정 완료');
    return true;
    
  } catch (error) {
    console.error('❌ 도구 수정 중 오류:', error);
    return false;
  }
}

/**
 * 도구와 관련된 모든 데이터를 삭제
 * @param toolId 삭제할 도구 ID
 * @param deleteRelatedData 관련 데이터(평점, 댓글)도 함께 삭제할지 여부
 */
async function deleteTool(toolId: string, deleteRelatedData: boolean = true): Promise<boolean> {
  try {
    console.log(`🗑️  도구 삭제 중 (ID: ${toolId})...`);
    
    if (deleteRelatedData) {
      console.log('📝 관련 데이터도 함께 삭제합니다...');
      
      // 관련 평점 삭제
      const ratingsQuery = query(
        collection(db, 'ratings'),
        where('toolId', '==', toolId)
      );
      const ratingsSnapshot = await getDocs(ratingsQuery);
      const ratingDeletePromises = ratingsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(ratingDeletePromises);
      console.log(`   ✅ ${ratingsSnapshot.size}개의 평점 삭제 완료`);
      
      // 관련 댓글 삭제
      const commentsQuery = query(
        collection(db, 'comments'),
        where('toolId', '==', toolId)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      const commentDeletePromises = commentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(commentDeletePromises);
      console.log(`   ✅ ${commentsSnapshot.size}개의 댓글 삭제 완료`);
    }
    
    // 도구 삭제
    await deleteDoc(doc(db, 'tools', toolId));
    console.log('✅ 도구 삭제 완료');
    return true;
    
  } catch (error) {
    console.error('❌ 도구 삭제 중 오류:', error);
    return false;
  }
}

/**
 * 사용자 입력을 받아 작업을 수행하는 대화형 함수
 */
async function interactiveMode() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };
  
  try {
    console.log('🛠️  도구 관리 스크립트 (대화형 모드)');
    console.log('='.repeat(50));
    
    const toolName = await question('검색할 도구 이름을 입력하세요: ');
    if (!toolName.trim()) {
      console.log('❌ 도구 이름을 입력해주세요.');
      return;
    }
    
    const tools = await findToolByName(toolName.trim());
    if (tools.length === 0) {
      return;
    }
    
    let selectedTool;
    if (tools.length === 1) {
      selectedTool = tools[0];
      console.log(`📌 선택된 도구: ${selectedTool.data.name}`);
    } else {
      const indexStr = await question(`여러 도구가 검색되었습니다. 선택할 번호 (1-${tools.length}): `);
      const index = parseInt(indexStr) - 1;
      if (index < 0 || index >= tools.length) {
        console.log('❌ 잘못된 번호입니다.');
        return;
      }
      selectedTool = tools[index];
    }
    
    console.log('\n📋 수행할 작업을 선택하세요:');
    console.log('1. 정보 조회만 하기');
    console.log('2. 도구 정보 수정');
    console.log('3. 도구 삭제 (관련 데이터 포함)');
    console.log('4. 도구 삭제 (도구만)');
    
    const action = await question('선택 (1-4): ');
    
    switch (action) {
      case '1':
        console.log('✅ 정보 조회 완료');
        break;
        
      case '2':
        console.log('\n🔧 수정할 정보를 입력하세요 (엔터로 건너뛰기):');
        const newName = await question(`새 이름 (현재: ${selectedTool.data.name}): `);
        const newCategory = await question(`새 카테고리 (현재: ${selectedTool.data.category}): `);
        const newUrl = await question(`새 URL (현재: ${selectedTool.data.url}): `);
        const newDescription = await question(`새 설명 (현재: ${selectedTool.data.description.substring(0, 50)}...): `);
        const newMemo = await question(`새 메모 (현재: ${selectedTool.data.memo}): `);
        const newPlan = await question(`새 플랜 (현재: ${selectedTool.data.plan || '없음'}): `);
        
        const updateData: Partial<ToolInput> = {};
        if (newName.trim()) updateData.name = newName.trim();
        if (newCategory.trim()) updateData.category = newCategory.trim();
        if (newUrl.trim()) updateData.url = newUrl.trim();
        if (newDescription.trim()) updateData.description = newDescription.trim();
        if (newMemo.trim()) updateData.memo = newMemo.trim();
        if (newPlan.trim()) updateData.plan = newPlan.trim() === '없음' ? null : newPlan.trim();
        
        if (Object.keys(updateData).length === 0) {
          console.log('📝 수정할 내용이 없습니다.');
        } else {
          const confirmUpdate = await question('정말 수정하시겠습니까? (y/N): ');
          if (confirmUpdate.toLowerCase() === 'y') {
            await updateTool(selectedTool.id, updateData);
          } else {
            console.log('❌ 수정이 취소되었습니다.');
          }
        }
        break;
        
      case '3':
        const confirmDeleteWithData = await question(`정말 "${selectedTool.data.name}" 도구와 관련 데이터를 모두 삭제하시겠습니까? (y/N): `);
        if (confirmDeleteWithData.toLowerCase() === 'y') {
          await deleteTool(selectedTool.id, true);
        } else {
          console.log('❌ 삭제가 취소되었습니다.');
        }
        break;
        
      case '4':
        const confirmDeleteOnly = await question(`정말 "${selectedTool.data.name}" 도구만 삭제하시겠습니까? (평점, 댓글은 유지) (y/N): `);
        if (confirmDeleteOnly.toLowerCase() === 'y') {
          await deleteTool(selectedTool.id, false);
        } else {
          console.log('❌ 삭제가 취소되었습니다.');
        }
        break;
        
      default:
        console.log('❌ 잘못된 선택입니다.');
        break;
    }
    
  } finally {
    rl.close();
  }
}

/**
 * 명령행 인수 처리
 */
async function processCommandLineArgs() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    await interactiveMode();
    return;
  }
  
  const command = args[0];
  const toolName = args[1];
  
  if (!toolName) {
    console.log('❌ 도구 이름을 제공해주세요.');
    console.log('사용법: npm run manage-tool <command> <tool-name>');
    console.log('명령어: search, delete, delete-all');
    return;
  }
  
  switch (command) {
    case 'search':
      await findToolByName(toolName);
      break;
      
    case 'delete':
      console.log('🔍 도구 검색 중...');
      const toolsToDelete = await findToolByName(toolName);
      if (toolsToDelete.length === 1) {
        console.log(`⚠️  "${toolsToDelete[0].data.name}" 도구를 삭제합니다 (관련 데이터 제외)...`);
        await deleteTool(toolsToDelete[0].id, false);
      } else if (toolsToDelete.length > 1) {
        console.log('❌ 여러 도구가 검색되었습니다. 대화형 모드를 사용하세요.');
      }
      break;
      
    case 'delete-all':
      console.log('🔍 도구 검색 중...');
      const toolsToDeleteAll = await findToolByName(toolName);
      if (toolsToDeleteAll.length === 1) {
        console.log(`⚠️  "${toolsToDeleteAll[0].data.name}" 도구와 모든 관련 데이터를 삭제합니다...`);
        await deleteTool(toolsToDeleteAll[0].id, true);
      } else if (toolsToDeleteAll.length > 1) {
        console.log('❌ 여러 도구가 검색되었습니다. 대화형 모드를 사용하세요.');
      }
      break;
      
    default:
      console.log('❌ 알 수 없는 명령어입니다.');
      console.log('사용 가능한 명령어: search, delete, delete-all');
      break;
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 도구 관리 스크립트를 시작합니다...\n');
  
  // 환경 변수 디버깅
  console.log('🔧 환경 변수 상태:');
  console.log('- VITE_FIREBASE_PROJECT_ID:', process.env.VITE_FIREBASE_PROJECT_ID || '(없음)');
  console.log('- VITE_FIREBASE_API_KEY:', process.env.VITE_FIREBASE_API_KEY ? '설정됨' : '(없음)');
  console.log('- VITE_FIREBASE_AUTH_DOMAIN:', process.env.VITE_FIREBASE_AUTH_DOMAIN || '(없음)');
  console.log('');
  
  // Firebase 설정 확인
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
    console.error('❌ Firebase 환경 변수가 설정되지 않았습니다.');
    console.log('다음 환경 변수를 확인해주세요:');
    console.log('- VITE_FIREBASE_PROJECT_ID');
    console.log('- VITE_FIREBASE_API_KEY');
    console.log('- VITE_FIREBASE_AUTH_DOMAIN');
    console.log('');
    console.log('💡 .env 파일을 생성하거나 환경 변수를 설정해주세요.');
    return;
  }
  
  console.log('✅ Firebase 설정 확인됨 (보안 규칙 임시 완화됨)');
  console.log('Project ID:', firebaseConfig.projectId);
  console.log('');
  
  try {
    await processCommandLineArgs();
  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류:', error);
  }
  
  console.log('\n✅ 스크립트 실행 완료');
}

// 스크립트 실행 (조건 없이 바로 실행)
main().catch(console.error); 