// Firebase 컬렉션 초기화 스크립트
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp,
  doc,
  setDoc,
  getDocs,
  query,
  limit
} from 'firebase/firestore';

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
 * 컬렉션 존재 여부 확인 함수
 */
async function checkCollectionExists(collectionName: string): Promise<boolean> {
  try {
    const q = query(collection(db, collectionName), limit(1));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.log(`컬렉션 '${collectionName}' 확인 중 오류:`, error);
    return false;
  }
}

/**
 * users 컬렉션 초기화
 * 실제 사용자 데이터는 인증 시 자동 생성되므로 더미 데이터 생성
 */
async function initUsersCollection() {
  console.log('👤 users 컬렉션 초기화 중...');
  
  try {
    const exists = await checkCollectionExists('users');
    if (exists) {
      console.log('✅ users 컬렉션이 이미 존재합니다.');
      return;
    }

    // 더미 사용자 데이터 생성 (실제로는 인증 시 자동 생성됨)
    const dummyUser = {
      uid: 'system',
      displayName: 'System User',
      email: 'system@tech-toolkit-hub.com',
      photoURL: null,
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', 'system'), dummyUser);
    console.log('✅ users 컬렉션 초기화 완료');
    
  } catch (error) {
    console.error('❌ users 컬렉션 초기화 실패:', error);
  }
}

/**
 * ratings 컬렉션 초기화
 * 더미 평점 데이터 생성
 */
async function initRatingsCollection() {
  console.log('⭐ ratings 컬렉션 초기화 중...');
  
  try {
    const exists = await checkCollectionExists('ratings');
    if (exists) {
      console.log('✅ ratings 컬렉션이 이미 존재합니다.');
      return;
    }

    // tools 컬렉션에서 첫 번째 도구 ID 가져오기
    const toolsSnapshot = await getDocs(query(collection(db, 'tools'), limit(1)));
    if (toolsSnapshot.empty) {
      console.log('⚠️  tools 컬렉션이 비어있어 ratings 초기화를 건너뜁니다.');
      return;
    }

    const firstTool = toolsSnapshot.docs[0];
    const dummyRating = {
      toolId: firstTool.id,
      userId: 'system',
      rating: 4.5,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await addDoc(collection(db, 'ratings'), dummyRating);
    console.log('✅ ratings 컬렉션 초기화 완료');
    
  } catch (error) {
    console.error('❌ ratings 컬렉션 초기화 실패:', error);
  }
}

/**
 * comments 컬렉션 초기화
 * 더미 댓글 데이터 생성
 */
async function initCommentsCollection() {
  console.log('💬 comments 컬렉션 초기화 중...');
  
  try {
    const exists = await checkCollectionExists('comments');
    if (exists) {
      console.log('✅ comments 컬렉션이 이미 존재합니다.');
      return;
    }

    // tools 컬렉션에서 첫 번째 도구 ID 가져오기
    const toolsSnapshot = await getDocs(query(collection(db, 'tools'), limit(1)));
    if (toolsSnapshot.empty) {
      console.log('⚠️  tools 컬렉션이 비어있어 comments 초기화를 건너뜁니다.');
      return;
    }

    const firstTool = toolsSnapshot.docs[0];
    const dummyComment = {
      toolId: firstTool.id,
      userId: 'system',
      userName: 'System User',
      userPhotoURL: null,
      content: '이 도구는 매우 유용합니다!',
      parentId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await addDoc(collection(db, 'comments'), dummyComment);
    console.log('✅ comments 컬렉션 초기화 완료');
    
  } catch (error) {
    console.error('❌ comments 컬렉션 초기화 실패:', error);
  }
}

/**
 * 모든 컬렉션 상태 확인
 */
async function checkAllCollections() {
  console.log('\n📊 컬렉션 상태 확인 중...');
  
  const collections = ['tools', 'users', 'ratings', 'comments'];
  
  for (const collectionName of collections) {
    try {
      const q = query(collection(db, collectionName), limit(1));
      const snapshot = await getDocs(q);
      const count = snapshot.size;
      const status = count > 0 ? '✅ 존재' : '❌ 비어있음';
      console.log(`${collectionName}: ${status} (${count}개 문서)`);
    } catch (error) {
      console.log(`${collectionName}: ❌ 접근 불가`);
    }
  }
}

/**
 * 전체 컬렉션 초기화 실행
 */
async function initializeCollections() {
  console.log('🚀 Firebase 컬렉션 초기화를 시작합니다...\n');
  
  // 환경 변수 확인
  console.log('🔧 Firebase 설정 확인 중...');
  console.log('Project ID:', firebaseConfig.projectId);
  console.log('Auth Domain:', firebaseConfig.authDomain);
  
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
    console.error('❌ Firebase 환경 변수가 설정되지 않았습니다.');
    console.log('다음 환경 변수를 확인해주세요:');
    console.log('- VITE_FIREBASE_PROJECT_ID');
    console.log('- VITE_FIREBASE_API_KEY');
    console.log('- VITE_FIREBASE_AUTH_DOMAIN');
    return;
  }
  
  try {
    await checkAllCollections();
    console.log('\n🔧 누락된 컬렉션 초기화 중...\n');
    
    await initUsersCollection();
    await initRatingsCollection();
    await initCommentsCollection();
    
    console.log('\n📊 초기화 후 컬렉션 상태:');
    await checkAllCollections();
    
    console.log('\n🎉 컬렉션 초기화가 완료되었습니다!');
    console.log('Firebase Console에서 결과를 확인해보세요.');
    
  } catch (error) {
    console.error('💥 컬렉션 초기화 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
initializeCollections();

export { initializeCollections, checkAllCollections }; 