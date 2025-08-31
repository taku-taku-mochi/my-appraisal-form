// --- Firebase SDKs ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// --- Firebase Configuration ---
// ↓↓↓ ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★ ↓↓↓
// TODO: Firebaseプロジェクトを作成し、実際の設定に置き換えてください
// https://firebase.google.com/
const firebaseConfig = {
  apiKey: "AIzaSyCno4rIpUnBn9XeD0HKoyMxxXZAw-4imNg",
  authDomain: "my-appraisal-form.firebaseapp.com",
  projectId: "my-appraisal-form",
  storageBucket: "my-appraisal-form.firebasestorage.app",
  messagingSenderId: "758251737789",
  appId: "1:758251737789:web:25d4cc6298fcb5e5525dd4",
  measurementId: "G-8WC19S8L83"
};
// ↑↑↑ ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★ ↑↑↑

// Initialize Firebase
let storage;
try {
    // apiKeyがプレースホルダーのままなら、初期化せずにエラーを投げる
    if (firebaseConfig.apiKey.includes("YOUR_API_KEY")) {
        throw new Error("Firebase設定が無効です。`firebaseConfig`オブジェクトを、ご自身のFirebaseプロジェクトの正しい設定に置き換えてください。");
    }
    const app = initializeApp(firebaseConfig);
    storage = getStorage(app);
    const auth = getAuth(app);
    signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed, uploads might be restricted.", error);
        showMessage('画像アップロードの認証に失敗しました。', 'error');
    });
} catch (error) {
    console.error(error.message);
    storage = null;
    // DOMが読み込まれた後でエラーメッセージを表示する
    document.addEventListener('DOMContentLoaded', () => {
        showMessage(error.message, 'error');
    });
}

// --- DATA & PRICES ---
// ... (rest of the code is the same)

