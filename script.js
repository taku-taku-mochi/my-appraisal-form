// --- Firebase SDKs ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// --- Firebase Configuration ---
// ↓↓↓ ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★ ↓↓↓
// TODO: Firebaseプロジェクトを作成し、実際の設定に置き換えてください
// https://firebase.google.com/
const firebaseConfig = {
  apiKey: "AIzaSy...YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
// ↑↑↑ ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★ ↑↑↑

// Initialize Firebase
let storage;
try {
    const app = initializeApp(firebaseConfig);
    storage = getStorage(app);
    const auth = getAuth(app);
    signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed, uploads might be restricted.", error);
        showMessage('画像アップロードの認証に失敗しました。', 'error');
    });
} catch (error) {
    console.error("Firebaseの初期化に失敗しました。firebaseConfigの設定が正しいか確認してください。", error);
    storage = null;
}

// --- DATA & PRICES ---
const CERTIFICATE_PRICES = {
    鑑定書: { 'S': 15000, 'M': 20000, 'L': 25000, 'メモ（ソーティング）': 30000, 'D': 35000 },
    鑑別書: { 'S': 10000, 'M': 15000, 'L': 20000, 'メモ（ソーティング）': 25000, 'D': 30000 }
};
const OPTION_PRICES = {
    'オプションA': 1000, 'オプションB': 2000, 'オプションC': 1500, 'オプションD': 2500,
    'オプションE': 3000, 'オプションF': 500, 'オプションG': 1800
};
const ITEM_TYPES = ['リング', 'ペンダント', 'ピアス', 'イヤリング', 'ネックレス', 'ブレスレット', 'カフス', 'ブローチ', 'ルース'];
const CERTIFICATE_TYPES = ['鑑定書', '鑑別書'];
const CERTIFICATE_SIZES = ['S', 'M', 'L', 'メモ（ソーティング）', 'D'];

// --- DOM ELEMENTS ---
const form = document.getElementById('receptionForm');
const itemsContainer = document.getElementById('itemsContainer');
const addItemBtnTop = document.getElementById('addItemBtnTop');
// ... (rest of DOM elements are the same)

// --- STATE ---
let itemCounter = 0;

// --- FUNCTIONS ---
// ... (UI functions like showMessage, createSelectBlock, etc. are the same) ...
function showMessage(message, type) {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
    messageBox.className = 'p-4 text-center rounded-lg text-sm mt-6';
    if (type === 'success') messageBox.classList.add('bg-green-100', 'text-green-700');
    else if (type === 'error') messageBox.classList.add('bg-red-100', 'text-red-700');
    else messageBox.classList.add('bg-blue-100', 'text-blue-700');
    messageBox.classList.remove('hidden');
}

function createSelectBlock(options, name, placeholder) {
    const selectEl = document.createElement('select');
    selectEl.name = name;
    selectEl.className = 'block w-full px-4 py-2 border border-gray-300 rounded-md form-input';
    selectEl.innerHTML = `<option value="" disabled selected>${placeholder}</option>` +
                        options.map(o => `<option value="${o}">${o}</option>`).join('');
    return selectEl;
}

function createCertTypeToggle(uniqueId) {
    const container = document.createElement('div');
    container.className = 'flex items-center space-x-2 flex-1';
    CERTIFICATE_TYPES.forEach((type, index) => {
        const label = document.createElement('label');
        label.className = 'toggle-label flex-1';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = `certificateType-${uniqueId}`;
        input.value = type;
        input.className = 'hidden';
        if (index === 0) input.checked = true;
        label.innerHTML += `<span>${type}</span>`;
        label.prepend(input);
        container.appendChild(label);
    });
    return container;
}

function addItemBlock(isOpen = false) {
    itemCounter++;
    const itemBlock = document.createElement('div');
    // ... (innerHTML for itemBlock is the same)
    
    // Populate dynamic parts
    // ... (This part is the same)
}

// ... (updateItemNumbers, updateTotalPrice, updateSummary, updateConfirmationSummary, goToStep, previewImages are the same)

// --- EVENT LISTENERS ---
// ... (UI event listeners are the same)

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.querySelector('.submit-text').classList.add('hidden');
    submitBtn.querySelector('.spinner').classList.remove('hidden');
    showMessage('送信中...', 'info');

    async function uploadFileAndGetUrl(file) {
        if (!storage) throw new Error("Firebase Storageが初期化されていません。");
        const filePath = `uploads/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, filePath);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    }

    try {
        // ★変更：送信先を'baseA'に固定
        const baseSelection = 'baseA'; 

        // ★変更：'orders'テーブルの英語フィールド名に合わせてデータを整形
        const orderFields = {
            'customer_name': form.customerName.value,
            'contact_info': form.contactInfo.value,
            'reception_date': new Date().toISOString().split('T')[0],
            'delivery_date': form.desiredDeliveryDate.value,
            'total_price': parseInt(document.getElementById('totalPrice').textContent.replace(/[¥,]/g, ''), 10)
        };

        const itemsData = [];
        for (const block of itemsContainer.querySelectorAll('.item-block')) {
            const imageInput = block.querySelector('input[type="file"]');
            const attachmentUrls = await Promise.all(
                Array.from(imageInput.files).map(file => uploadFileAndGetUrl(file))
            );

            // ★変更：'items'テーブルの英語フィールド名に合わせてデータを整形
            const itemDetails = {
                'item_type': block.querySelector('[name="itemType"]').value,
                'notes': block.querySelector('[name="itemNotes"]').value,
                'photos': attachmentUrls.length > 0 ? attachmentUrls.map(url => ({ url })) : undefined
            };

            const certType = block.querySelector(`input[name^="certificateType-"]:checked`).value;
            const certSize = block.querySelector(`select[name="certificateSize"]`).value;
            const options = Array.from(block.querySelectorAll('input[name="itemOptions"]:checked')).map(cb => cb.value);
            
            // ★変更：'certificate_table'の英語フィールド名に合わせてデータを整形
            const certDetails = {
                'cert_type': certType,
                'cert_size': certSize,
                'options': options,
                'price': (CERTIFICATE_PRICES[certType]?.[certSize] || 0) + options.reduce((sum, opt) => sum + (OPTION_PRICES[opt] || 0), 0)
            };
            
            itemsData.push({ itemDetails, certDetails });
        }

        const response = await fetch('/.netlify/functions/submit-form', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                baseSelection: baseSelection,
                order: orderFields, 
                items: itemsData 
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.error || `サーバーでエラーが発生しました。`);
        }
        
        showMessage('受付が完了しました！', 'success');
        form.reset();
        itemsContainer.innerHTML = '';
        itemCounter = 0;
        addItemBlock(true);
        goToStep(1);

    } catch (error) {
        console.error('Submission Error:', error);
        showMessage(`エラーが発生しました: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('.submit-text').classList.remove('hidden');
        submitBtn.querySelector('.spinner').classList.add('hidden');
    }
});

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    addItemBlock(true);
});

