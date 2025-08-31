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
const totalPriceEl = document.getElementById('totalPrice');
const messageBox = document.getElementById('messageBox');

const nextStep1Btn = document.getElementById('nextStep1Btn');
const prevStep2Btn = document.getElementById('prevStep2Btn');
const nextStep2Btn = document.getElementById('nextStep2Btn');
const prevStep3Btn = document.getElementById('prevStep3Btn');
const submitBtn = document.getElementById('submitBtn');
const confirmationSummary = document.getElementById('confirmationSummary');

const stepIndicators = document.querySelectorAll('.step-indicator');
const stepTexts = document.querySelectorAll('.step-text');

// --- STATE ---
let itemCounter = 0;

// --- FUNCTIONS ---
function showMessage(message, type) {
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
    itemBlock.className = 'item-block bg-white rounded-lg shadow-md mb-4 relative overflow-hidden';
    itemBlock.dataset.itemId = itemCounter;
    
    itemBlock.innerHTML = `
        <div class="accordion-header hover:bg-gray-200">
            <h3 class="text-lg font-semibold text-gray-800">
                <span class="item-number"></span>
                <span class="item-summary text-gray-500 text-sm ml-4"></span>
            </h3>
            <div class="flex items-center space-x-2">
                <button type="button" class="remove-item-block-btn text-red-400 hover:text-red-600 p-1 rounded-full btn-secondary"></button>
                <svg class="h-6 w-6 text-gray-500 transform transition-transform duration-200 accordion-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
        </div>
        <div class="accordion-content space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="certificate-types-container"></div>
                <div class="certificate-sizes-container"></div>
                <div class="item-types-container md:col-span-2"></div>
                <div class="md:col-span-2">
                    <textarea name="itemNotes" rows="2" class="block w-full px-4 py-2 border border-gray-300 rounded-md form-input" placeholder="ご要望・備考"></textarea>
                </div>
            </div>
            <div class="mt-4">
                <label class="block text-sm font-medium text-gray-600">オプション</label>
                <div class="mt-2 grid grid-cols-2 gap-3">
                    ${Object.keys(OPTION_PRICES).map(option => `
                        <label class="flex items-center">
                            <input type="checkbox" name="itemOptions" value="${option}" class="rounded-md text-blue-600 focus:ring-blue-500 w-5 h-5">
                            <span class="ml-2 text-sm text-gray-700">${option}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            <div class="mt-6 border-t pt-4">
                <label class="block text-sm font-medium text-gray-600">写真アップロード</label>
                <div class="drop-zone relative border-2 border-dashed border-gray-300 rounded-md p-6 text-center text-gray-500 hover:border-blue-500 transition-colors duration-200">
                    <p>ファイルをドラッグ＆ドロップ or クリックして選択</p>
                    <input type="file" name="itemImage" multiple accept="image/*" class="opacity-0 absolute inset-0 w-full h-full cursor-pointer"/>
                </div>
                <div class="mt-2 preview-container flex flex-wrap gap-2"></div>
            </div>
        </div>
    `;
    
    itemBlock.querySelector('.certificate-types-container').appendChild(createCertTypeToggle(itemCounter));
    itemBlock.querySelector('.item-types-container').appendChild(createSelectBlock(ITEM_TYPES, 'itemType', 'アイテム種別'));
    itemBlock.querySelector('.certificate-sizes-container').appendChild(createSelectBlock(CERTIFICATE_SIZES, 'certificateSize', '証書サイズ'));

    itemsContainer.appendChild(itemBlock);
    updateItemNumbers();
    
    if (isOpen) {
        itemBlock.classList.add('is-open');
        itemBlock.querySelector('.accordion-content').classList.add('open');
        itemBlock.querySelector('.accordion-icon').classList.add('rotate-180');
        updateSummary(itemBlock);
    }
}

function updateItemNumbers() {
    itemsContainer.querySelectorAll('.item-block').forEach((block, index) => {
        block.querySelector('.item-number').textContent = `商品 #${index + 1}`;
        const removeBtn = block.querySelector('.remove-item-block-btn');
        if (index === 0) {
            removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`;
        } else {
            removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>`;
        }
    });
}

function updateTotalPrice() {
    let total = 0;
    itemsContainer.querySelectorAll('.item-block').forEach(block => {
        const certType = block.querySelector(`input[name^="certificateType-"]:checked`)?.value;
        const certSize = block.querySelector(`select[name="certificateSize"]`)?.value;
        if (certType && certSize && CERTIFICATE_PRICES[certType]?.[certSize]) {
            total += CERTIFICATE_PRICES[certType][certSize];
        }
        block.querySelectorAll('[name="itemOptions"]:checked').forEach(opt => {
            total += OPTION_PRICES[opt.value] || 0;
        });
    });
    totalPriceEl.textContent = `¥${total.toLocaleString()}`;
}

function updateSummary(itemBlock) {
    const summaryEl = itemBlock.querySelector('.item-summary');
    const certType = itemBlock.querySelector(`input[name^="certificateType-"]:checked`)?.value;
    const certSize = itemBlock.querySelector(`select[name="certificateSize"]`)?.value;
    const itemType = itemBlock.querySelector(`select[name="itemType"]`)?.value;
    summaryEl.textContent = [certType, certSize, itemType].filter(Boolean).join(' / ');
}

function updateConfirmationSummary() {
    confirmationSummary.innerHTML = '';
    
    const customerInfoDiv = document.createElement('div');
    customerInfoDiv.className = 'border-b pb-4';
    customerInfoDiv.innerHTML = `<h3 class="font-bold text-lg mb-2">お客様情報</h3>
        <p><strong>会社名（お名前）:</strong> ${document.getElementById('customerName').value}</p>
        <p><strong>電話番号:</strong> ${document.getElementById('contactInfo').value}</p>
        <p><strong>希望納期:</strong> ${document.getElementById('desiredDeliveryDate').value}</p>`;
    confirmationSummary.appendChild(customerInfoDiv);

    itemsContainer.querySelectorAll('.item-block').forEach((block, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'mt-4 border-b pb-4';
        
        const certType = block.querySelector(`input[name^="certificateType-"]:checked`)?.value || 'N/A';
        const certSize = block.querySelector('select[name="certificateSize"]').value || 'N/A';
        const itemType = block.querySelector('select[name="itemType"]').value || 'N/A';
        const notes = block.querySelector('[name="itemNotes"]').value;
        const options = Array.from(block.querySelectorAll('input[name="itemOptions"]:checked')).map(cb => cb.value);

        itemDiv.innerHTML = `<h3 class="font-bold text-lg mb-2">商品 #${index + 1}</h3>
             <p><strong>鑑定・鑑別:</strong> ${certType}</p>
             <p><strong>証書サイズ:</strong> ${certSize}</p>
             <p><strong>アイテム種別:</strong> ${itemType}</p>
             <p><strong>ご要望・備考:</strong> ${notes || 'なし'}</p>
             <p><strong>オプション:</strong> ${options.join(', ') || 'なし'}</p>`;
        
        const previewContainer = block.querySelector('.preview-container');
        if (previewContainer.children.length > 0) {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'mt-2 flex flex-wrap gap-2';
            previewContainer.querySelectorAll('img').forEach(img => {
                imageContainer.innerHTML += `<img src="${img.src}" class="w-24 h-24 object-cover rounded-md shadow-md">`;
            });
            itemDiv.appendChild(imageContainer);
        }
        confirmationSummary.appendChild(itemDiv);
    });
}

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

function previewImages(fileInput) {
    const previewContainer = fileInput.closest('.accordion-content').querySelector('.preview-container');
    previewContainer.innerHTML = '';
    Array.from(fileInput.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
            previewContainer.innerHTML += `<img src="${e.target.result}" class="w-32 h-32 object-cover rounded-md shadow-md">`;
        };
        reader.readAsDataURL(file);
    });
}

// --- EVENT LISTENERS ---
nextStep1Btn.addEventListener('click', () => form.checkValidity() ? goToStep(2) : form.reportValidity());
prevStep2Btn.addEventListener('click', () => goToStep(1));
nextStep2Btn.addEventListener('click', () => {
    if (itemsContainer.children.length === 0) return showMessage('商品を1つ以上追加してください。', 'error');
    updateConfirmationSummary();
    goToStep(3);
});
prevStep3Btn.addEventListener('click', () => goToStep(2));
addItemBtnTop.addEventListener('click', () => addItemBlock(true));

itemsContainer.addEventListener('change', e => {
    updateTotalPrice();
    if (e.target.closest('.item-block')) updateSummary(e.target.closest('.item-block'));
    if (e.target.matches('input[type="file"]')) previewImages(e.target);
});

itemsContainer.addEventListener('click', e => {
    const itemBlock = e.target.closest('.item-block');
    if (!itemBlock) return;

    if (e.target.closest('.remove-item-block-btn')) {
        if (itemsContainer.children.length > 1) {
            itemBlock.remove();
            updateItemNumbers();
        } else {
            showMessage('少なくとも1つの商品が必要です。', 'error');
        }
    } else if (e.target.closest('.accordion-header')) {
        const isOpening = !itemBlock.classList.contains('is-open');
        itemsContainer.querySelectorAll('.item-block').forEach(block => {
            block.classList.remove('is-open');
            block.querySelector('.accordion-content').classList.remove('open');
            block.querySelector('.accordion-icon').classList.remove('rotate-180');
        });
        itemBlock.classList.toggle('is-open', isOpening);
        itemBlock.querySelector('.accordion-content').classList.toggle('open', isOpening);
        itemBlock.querySelector('.accordion-icon').classList.toggle('rotate-180', isOpening);
    }
    updateTotalPrice();
    updateSummary(itemBlock);
});

itemsContainer.addEventListener('dragover', e => {
    e.preventDefault();
    e.target.closest('.drop-zone')?.classList.add('drag-active');
});
itemsContainer.addEventListener('dragleave', e => e.target.closest('.drop-zone')?.classList.remove('drag-active'));
itemsContainer.addEventListener('drop', e => {
    e.preventDefault();
    const dropZone = e.target.closest('.drop-zone');
    if (dropZone) {
        dropZone.classList.remove('drag-active');
        const fileInput = dropZone.querySelector('input[type="file"]');
        fileInput.files = e.dataTransfer.files;
        previewImages(fileInput);
    }
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
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
        // 送信先を'baseA'に固定します。
        const baseSelection = 'baseA'; 

        const orderFields = {
            '顧客名': form.customerName.value,
            '連絡先': form.contactInfo.value,
            '受付日': new Date().toISOString().split('T')[0],
            '希望納期': form.desiredDeliveryDate.value,
            '合計金額': parseInt(totalPriceEl.textContent.replace(/[¥,]/g, ''), 10),
            'ステータス': '受付済み',
        };

        const itemsData = [];
        for (const block of itemsContainer.querySelectorAll('.item-block')) {
            const imageInput = block.querySelector('input[type="file"]');
            const attachmentUrls = await Promise.all(
                Array.from(imageInput.files).map(file => uploadFileAndGetUrl(file))
            );

            const itemDetails = {
                '商品種別': block.querySelector('[name="itemType"]').value,
                '備考': block.querySelector('[name="itemNotes"]').value,
                '写真': attachmentUrls.length > 0 ? attachmentUrls.map(url => ({ url })) : undefined
            };

            const certDetails = {
                '鑑定・鑑別': block.querySelector(`input[name^="certificateType-"]:checked`).value,
                '証書サイズ': block.querySelector(`select[name="certificateSize"]`).value,
                'オプション': Array.from(block.querySelectorAll('input[name="itemOptions"]:checked')).map(cb => cb.value).join(', '),
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

