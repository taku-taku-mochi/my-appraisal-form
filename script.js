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
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_API_KEY")) {
        throw new Error("Firebase設定が無効です。");
    }
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

    // --- STATIC DOM ELEMENTS ---
    const form = document.getElementById('receptionForm');
    const step2Container = document.getElementById('step2');
    const step3Container = document.getElementById('step3');
    const nextStep1Btn = document.getElementById('nextStep1Btn');
    const identityMenu = document.getElementById('identity-menu');
    const stepIndicators = document.querySelectorAll('.step-indicator');
    const stepTexts = document.querySelectorAll('.step-text');
    
    // --- DYNAMICALLY CREATE STEP 2 & 3 CONTENT ---
    step2Container.innerHTML = `
        <div class="bg-gray-50 p-6 rounded-lg shadow-inner space-y-4">
            <h2 class="text-2xl font-semibold text-gray-700">商品情報</h2>
            <div id="itemsContainer" class="space-y-4"></div>
            <div class="flex justify-center mt-4">
                <button type="button" id="addItemBtnTop" class="bg-blue-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-600 btn-primary flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    商品を追加する
                </button>
            </div>
        </div>
        <div class="flex justify-between mt-6">
            <button type="button" id="prevStep2Btn" class="bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-400">戻る</button>
            <button type="button" id="nextStep2Btn" class="bg-blue-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-600 btn-primary">次へ</button>
        </div>`;
    step3Container.innerHTML = `
        <div class="bg-gray-50 p-6 rounded-lg shadow-inner">
            <h2 class="text-2xl font-semibold text-gray-700 mb-4">内容確認</h2>
            <div id="confirmationSummary" class="space-y-4 text-gray-700"></div>
        </div>
        <div class="mt-8 flex justify-between items-center bg-gray-200 p-4 rounded-lg">
            <span class="text-xl font-bold text-gray-700">概算見積金額:</span>
            <span id="totalPrice" class="text-2xl font-extrabold text-green-600">¥0</span>
        </div>
        <div class="flex justify-between mt-6">
            <button type="button" id="prevStep3Btn" class="bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-400">戻る</button>
            <button type="submit" id="submitBtn" class="w-full md:w-auto bg-green-500 text-white font-bold py-4 px-4 rounded-lg shadow-lg hover:bg-green-600 btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                <span class="submit-text">受付を完了する</span>
                <span class="spinner hidden animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></span>
            </button>
        </div>`;
    
    // --- DYNAMIC DOM ELEMENTS (get them *after* innerHTML is set) ---
    const itemsContainer = document.getElementById('itemsContainer');
    const addItemBtnTop = document.getElementById('addItemBtnTop');
    const totalPriceEl = document.getElementById('totalPrice');
    const confirmationSummary = document.getElementById('confirmationSummary');
    const prevStep2Btn = document.getElementById('prevStep2Btn');
    const nextStep2Btn = document.getElementById('nextStep2Btn');
    const prevStep3Btn = document.getElementById('prevStep3Btn');
    const submitBtn = document.getElementById('submitBtn');

    // --- FUNCTIONS ---
    function goToStep(step) {
        document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
        document.getElementById(`step${step}`).classList.add('active');
        stepIndicators.forEach((el, index) => {
            const isCompleted = index < step;
            el.classList.toggle('bg-blue-500', isCompleted);
            el.classList.toggle('bg-gray-300', !isCompleted);
            stepTexts[index].classList.toggle('text-blue-600', isCompleted);
            stepTexts[index].classList.toggle('font-medium', isCompleted);
            stepTexts[index].classList.toggle('text-gray-500', !isCompleted);
        });
    }
    
    function createSelectBlock(options, name, placeholder) { /* ... */ }
    function createCertTypeToggle(uniqueId) { /* ... */ }
    function addItemBlock(isOpen = false) { /* ... */ }
    function updateItemNumbers() { /* ... */ }
    function updateTotalPrice() { /* ... */ }
    function updateSummary(itemBlock) { /* ... */ }
    function updateConfirmationSummary() { /* ... */ }
    function previewImages(fileInput) { /* ... */ }
    // NOTE: For brevity, the full implementation of the helper functions is omitted here,
    // but they are the same as the previous correct version.
    
    // --- Netlify Identity Logic ---
    if (window.netlifyIdentity) {
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

    // --- EVENT LISTENERS (now safe to attach to all elements) ---
    nextStep1Btn.addEventListener('click', () => {
        if (form.elements.customerName.checkValidity() && form.elements.email.checkValidity() && form.elements.contactInfo.checkValidity() && form.elements.desiredDeliveryDate.checkValidity()) {
            goToStep(2);
        } else {
            form.reportValidity();
        }
    });
    prevStep2Btn.addEventListener('click', () => goToStep(1));
    nextStep2Btn.addEventListener('click', () => {
        if (itemsContainer.children.length === 0) return showMessage('商品を1つ以上追加してください。', 'error');
        updateConfirmationSummary();
        goToStep(3);
    });
    prevStep3Btn.addEventListener('click', () => goToStep(2));
    addItemBtnTop.addEventListener('click', () => addItemBlock(true));
    itemsContainer.addEventListener('change', e => { /* ... */ });
    itemsContainer.addEventListener('click', e => { /* ... */ });
    itemsContainer.addEventListener('dragover', e => { /* ... */ });
    itemsContainer.addEventListener('dragleave', e => { /* ... */ });
    itemsContainer.addEventListener('drop', e => { /* ... */ });
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        // ... submit logic is the same
    });

    // --- INITIALIZATION ---
    addItemBlock(true);
});

