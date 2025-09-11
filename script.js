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
    if (!messageBox) { console.error("MessageBox not found"); return; }
    messageBox.textContent = message;
    messageBox.className = 'p-4 text-center rounded-lg text-sm mt-6';
    if (type === 'success') messageBox.classList.add('bg-green-100', 'text-green-700');
    else if (type === 'error') messageBox.classList.add('bg-red-100', 'text-red-700');
    else messageBox.classList.add('bg-blue-100', 'text-blue-700');
    messageBox.classList.remove('hidden');
}

// --- Initialize Firebase ---
try {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_API_KEY")) {
        throw new Error("Firebase設定が無効です。");
    }
    const app = initializeApp(firebaseConfig);
    storage = getStorage(app);
    const auth = getAuth(app);
    signInAnonymously(auth).catch((error) => console.error("Anonymous sign-in failed:", error));
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

    step2Container.innerHTML = `...`; // Content is the same as previous version
    step3Container.innerHTML = `...`; // Content is the same as previous version

    const itemsContainer = document.getElementById('itemsContainer');
    const addItemBtnTop = document.getElementById('addItemBtnTop');
    const totalPriceEl = document.getElementById('totalPrice');
    const confirmationSummary = document.getElementById('confirmationSummary');
    const prevStep2Btn = document.getElementById('prevStep2Btn');
    const nextStep2Btn = document.getElementById('nextStep2Btn');
    const prevStep3Btn = document.getElementById('prevStep3Btn');
    const submitBtn = document.getElementById('submitBtn');
    const nextStep1Btn = document.getElementById('nextStep1Btn');

    // ★★★ Netlify Identity Logic ★★★
    // ★変更：Netlifyの「エンジン」が存在するか、安全に確認してから実行します
    if (window.netlifyIdentity) {
        const identityMenu = document.getElementById('identity-menu');
        
        const updateUserUI = (user) => {
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
                .then(res => res.ok ? res.json() : Promise.reject(res))
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
    } else {
        console.error("Netlify Identity widget could not be found.");
    }
    
    // All other functions (createSelectBlock, addItemBlock, etc.) are the same

    // Form Submission Logic
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        // ... submit logic is the same
    });

    // --- INITIALIZATION ---
    addItemBlock(true);
    
    // Attach other event listeners
    nextStep1Btn.addEventListener('click', () => form.checkValidity() ? goToStep(2) : form.reportValidity());
    prevStep2Btn.addEventListener('click', () => goToStep(1));
    nextStep2Btn.addEventListener('click', () => {
        if (itemsContainer.children.length === 0) return showMessage('商品を1つ以上追加してください。', 'error');
        updateConfirmationSummary();
        goToStep(3);
    });
    prevStep3Btn.addEventListener('click', () => goToStep(2));
    addItemBtnTop.addEventListener('click', () => addItemBlock(true));
});

