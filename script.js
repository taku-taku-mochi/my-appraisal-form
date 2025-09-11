console.log("--- SCRIPT VERSION debug-0902 LOADED ---"); // このメッセージが表示されるか確認するための目印です。

// --- Firebase SDKs ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCno4IpUnBn9XeD0HKoyMxxXZAW-4imNg", // This is the correct key
  authDomain: "my-appraisal-form.firebaseapp.com",
  projectId: "my-appraisal-form",
  storageBucket: "my-appraisal-form.firebasestorage.app",
  messagingSenderId: "758251737789",
  appId: "1:758251737789:web:25d4cc6298fcb5e5525dd4",
  measurementId: "G-8WC19S8L83"
};

// ★★★ 診断用の目印 ★★★
console.log("Attempting to initialize Firebase with key:", firebaseConfig.apiKey);

// --- GLOBAL STATE & UTILITY FUNCTIONS ---
// ... (The rest of the script is the same as the complete version) ...
