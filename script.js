// --- Firebase SDKs ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCno4IpUnBn9XeD0HKoyMxxXZAW-4imNg",
  authDomain: "my-appraisal-form.firebaseapp.com",
  projectId: "my-appraisal-form",
  storageBucket: "my-appraisal-form.firebasestorage.app",
  messagingSenderId: "758251737789",
  appId: "1:758251737789:web:25d4cc6298fcb5e5525dd4",
  measurementId: "G-8WC19S8L83"
};

// --- GLOBAL STATE & UTILITY FUNCTIONS ---
let storage;
let itemCounter = 0;

function showMessage(message, type) {
    const messageBox = document.getElementById('messageBox');
    if (!messageBox) return;
    messageBox.textContent = message;
    messageBox.className = 'p-4 text-center rounded-lg text-sm mt-6';
    if (type === 'success') messageBox.classList.add('bg-green-100', 'text-green-700');
    else if (type === 'error') messageBox.classList.add('bg-red-100', 'text-red-700');
    else messageBox.classList.add('bg-blue-100', 'text-blue-700');
    messageBox.classList.remove('hidden');
}

// --- Initialize Firebase ---
try {
    const app = initializeApp(firebaseConfig);
    storage = getStorage(app);
    const auth = getAuth(app);
    signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
        showMessage('画像アップロードの認証に失敗しました。', 'error');
    });
} catch (error) {
    console.error("Firebase Initialization Error:", error.message);
    storage = null;
    document.addEventListener('DOMContentLoaded', () => showMessage(`Firebaseの初期化に失敗しました: ${error.message}`, 'error'));
}

// --- DATA & PRICES ---
const CERTIFICATE_PRICES = { 鑑定書: { 'S': 15000, 'M': 20000, 'L': 25000, 'メモ（ソーティング）': 30000, 'D': 35000 }, 鑑別書: { 'S': 10000, 'M': 15000, 'L': 20000, 'メモ（ソーティング）': 25000, 'D': 30000 } };
const OPTION_PRICES = { 'オプションA': 1000, 'オプションB': 2000, 'オプションC': 1500, 'オプションD': 2500, 'オプションE': 3000, 'オプションF': 500, 'オプションG': 1800 };
const ITEM_TYPES = ['リング', 'ペンダント', 'ピアス', 'イヤリング', 'ネックレス', 'ブレスレット', 'カフス', 'ブローチ', 'ルース'];
const CERTIFICATE_TYPES = ['鑑定書', '鑑別書'];
const CERTIFICATE_SIZES = ['S', 'M', 'L', 'メモ（ソーティング）', 'D'];

// --- DOMContentLoaded: Main application logic starts here ---
document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('receptionForm');
    const step2Container = document.getElementById('step2');
    const step3Container = document.getElementById('step3');
    
    // Dynamically create Step 2 & 3 content
    step2Container.innerHTML = `...`; // Content is the same as previous version
    step3Container.innerHTML = `...`; // Content is the same as previous version

    // Get all DOM Elements
    const itemsContainer = document.getElementById('itemsContainer');
    // ... and all other elements

    // --- Netlify Identity Logic ---
    const updateUserUI = (user) => {
        const identityMenu = document.getElementById('identity-menu');
        identityMenu.innerHTML = '';
        const button = document.createElement('button');
        button.className = 'bg-white text-blue-600 font-semibold py-2 px-4 border border-blue-500 rounded-lg shadow-md hover:bg-blue-50';
        
        if (user) {
            button.textContent = 'ログアウト';
            button.onclick = () => netlifyIdentity.logout();
            
            fetch('/.netlify/functions/get-customer-data', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token.access_token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (data.customer) {
                    form.customerName.value = data.customer.customer_name || '';
                    form.email.value = data.customer.email || '';
                    form.contactInfo.value = data.customer.contact_info || '';
                }
            })
            .catch(err => console.error("Failed to fetch customer data:", err));

        } else {
            button.textContent = 'ログイン / 新規登録';
            button.onclick = () => netlifyIdentity.open();
        }
        identityMenu.appendChild(button);
    };

    netlifyIdentity.on('init', user => updateUserUI(user));
    netlifyIdentity.on('login', user => {
        updateUserUI(user);
        netlifyIdentity.close();
    });
    netlifyIdentity.on('logout', () => {
        updateUserUI(null);
        form.reset();
    });
    
    // All other functions (createSelectBlock, addItemBlock, etc.) are the same

    // Form Submission Logic
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        // ... submit logic is the same, sending data to submit-form function
    });

    // --- INITIALIZATION ---
    addItemBlock(true);
});
