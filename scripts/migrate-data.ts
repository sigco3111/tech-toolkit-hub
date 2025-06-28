// Firebase 데이터 마이그레이션 스크립트
import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';

// 환경변수 로드
config();
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AI_TOOLS_DATA } from '../constants';

// Firebase 설정 (환경 변수 사용)
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
 * AI_TOOLS_DATA를 Firestore로 마이그레이션하는 메인 함수
 * 기존 데이터에 Firebase 필드들을 추가하여 저장
 */
async function migrateTools() {
  console.log('🚀 데이터 마이그레이션을 시작합니다...');
  
  try {
    const toolsCollection = collection(db, 'tools');
    let successCount = 0;
    let errorCount = 0;

    for (const tool of AI_TOOLS_DATA) {
      try {
        // 기존 AiTool 데이터를 FirebaseTool 형식으로 변환
        const firebaseTool = {
          name: tool.name,
          category: tool.category,
          url: tool.url,
          description: tool.description,
          memo: tool.memo,
          plan: tool.plan,
          averageRating: tool.rating, // 기존 rating을 averageRating으로 변환
          ratingCount: 0, // 초기 평점 개수는 0
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: 'system' // 시스템에 의한 초기 데이터
        };

        await addDoc(toolsCollection, firebaseTool);
        successCount++;
        console.log(`✅ ${tool.name} 마이그레이션 완료`);
        
      } catch (error) {
        console.error(`❌ ${tool.name} 마이그레이션 실패:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 마이그레이션 완료 요약:');
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${errorCount}개`);
    console.log(`📋 전체: ${AI_TOOLS_DATA.length}개`);
    
    if (errorCount === 0) {
      console.log('\n🎉 모든 데이터가 성공적으로 마이그레이션되었습니다!');
    }
    
  } catch (error) {
    console.error('💥 마이그레이션 중 오류 발생:', error);
  }
}

/**
 * 카테고리 목록을 별도 컬렉션으로 저장 (선택사항)
 */
async function migrateCategories() {
  console.log('\n🏷️  카테고리 데이터 마이그레이션 시작...');
  
  try {
    const categories = [...new Set(AI_TOOLS_DATA.map(tool => tool.category))];
    const categoriesCollection = collection(db, 'categories');

    for (const category of categories) {
      const categoryDoc = {
        name: category,
        toolCount: AI_TOOLS_DATA.filter(tool => tool.category === category).length,
        createdAt: serverTimestamp()
      };

      await addDoc(categoriesCollection, categoryDoc);
      console.log(`✅ 카테고리 '${category}' 마이그레이션 완료`);
    }

    console.log(`\n✅ ${categories.length}개 카테고리 마이그레이션 완료`);
    
  } catch (error) {
    console.error('❌ 카테고리 마이그레이션 실패:', error);
  }
}

/**
 * 마이그레이션 실행 함수
 */
async function runMigration() {
  try {
    await migrateTools();
    await migrateCategories();
    
    console.log('\n🎊 전체 마이그레이션이 완료되었습니다!');
    console.log('Firebase Console에서 데이터를 확인해보세요.');
    
  } catch (error) {
    console.error('💥 마이그레이션 실패:', error);
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
runMigration();

export { migrateTools, migrateCategories }; 