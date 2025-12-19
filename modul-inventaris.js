import { ref, onValue, push, set, remove, update } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { db } from "./firebase-config.js";
import * as SetingInv from "./modul-pengaturan-inventaris.js";

let databaseBarang = {}, dataKategori = {}, dataSatuan = {};
let currentEditId = null, multiUnits = [], lastOrigin = 'view-list', pickerTargetIndex = null;
const desktopWidth = "max-w-4xl";

// ============================================================================
// UTILITY: SCROLL TO INPUT WITH KEYBOARD AWARE
// ============================================================================

window.scrollToInputWithKeyboard = (inputId) => {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    input.focus();
    
    // Untuk mobile, scroll ke input dengan offset untuk tombol
    if (window.innerWidth < 768) {
        setTimeout(() => {
            const inputRect = input.getBoundingClientRect();
            const offset = 100; // Offset untuk tombol simpan
            
            window.scrollTo({
                top: window.scrollY + inputRect.top - offset,
                behavior: 'smooth'
            });
        }, 100);
    }
};

// Fungsi untuk mendapatkan posisi elemen relatif terhadap viewport
function getElementPosition(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return { top: 0, bottom: 0 };
    const rect = el.getBoundingClientRect();
    return {
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height
    };
}

// Fungsi untuk menghitung batas koordinat berdasarkan konteks
function calculatePickerBounds(origin) {
    let minTop = 0;
    let maxTop = window.innerHeight * 0.6; // Default 60% dari layar
    
    if (origin === 'view-edit') {
        // Untuk panel tambah barang
        const headerPos = getElementPosition('header-edit');
        const firstInput = document.getElementById('edit-nama');
        
        if (headerPos.bottom > 0) {
            minTop = headerPos.bottom + 10; // 10px margin di bawah header
        }
        
        if (firstInput) {
            const inputRect = firstInput.getBoundingClientRect();
            maxTop = Math.max(minTop, inputRect.bottom + 10);
        }
    } else if (origin === 'view-pengaturan') {
        // Untuk panel pengaturan inventaris
        const pengaturanHeader = document.querySelector('#view-pengaturan .sticky.top-0');
        if (pengaturanHeader) {
            const headerRect = pengaturanHeader.getBoundingClientRect();
            minTop = headerRect.bottom + 10;
        }
    } else if (origin === 'view-multi-satuan') {
        // Untuk panel multi satuan
        const multiHeader = document.querySelector('#view-multi-satuan .border-b');
        if (multiHeader) {
            const headerRect = multiHeader.getBoundingClientRect();
            minTop = headerRect.bottom + 10;
        }
    }
    
    // Batasi nilai
    minTop = Math.max(50, minTop); // Minimum 50px dari atas
    maxTop = Math.min(window.innerHeight * 0.7, maxTop); // Maksimum 70% dari layar
    
    return { minTop, maxTop };
}

// ============================================================================
// MOBILE KEYBOARD HANDLER (SIMPLIFIED)
// ============================================================================

class MobileKeyboardHandler {
    constructor() {
        this.saveButtons = new Map();
        this.isKeyboardVisible = false;
        this.initialViewportHeight = window.innerHeight;
        this.activeInput = null;
        this.keyboardHeight = 0;
        this.isMobile = window.innerWidth < 768;
        
        this.init();
    }
    
    init() {
        // Deteksi mobile/desktop
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth < 768;
            if (!this.isMobile) this.resetAllButtons();
        });
        
        // Deteksi keyboard via viewport height
        window.addEventListener('resize', () => this.handleViewportChange());
        
        // Track input focus - TANPA MENGANGGU EVENT LAIN
        document.addEventListener('focusin', (e) => this.handleFocusIn(e));
        document.addEventListener('focusout', () => this.handleFocusOut());
    }
    
    registerSaveButton(buttonId, containerId = null) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        // JANGAN daftarkan tombol navigation
        if (button.closest('nav')) {
            console.log('❌ Skipping navigation button:', buttonId);
            return;
        }
        
        let wrapper = button.parentElement;
        if (containerId) {
            wrapper = document.getElementById(containerId);
        }
        
        if (wrapper && !wrapper.closest('nav')) {
            wrapper.classList.add('mobile-keyboard-aware');
            
            this.saveButtons.set(buttonId, {
                element: wrapper,
                button: button
            });
            
            this.applyDeviceStyle(wrapper);
        }
    }
    
applyDeviceStyle(wrapper) {
    if (this.isMobile) {
        // Untuk integrated layout, kita butuh parent yang mengatur posisi
        const parentModal = wrapper.closest('[class*="fixed inset-0"]');
        if (parentModal) {
            parentModal.style.display = 'flex';
            parentModal.style.flexDirection = 'column';
            wrapper.style.marginTop = 'auto'; // Push ke bawah
            wrapper.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            wrapper.style.transform = 'translateY(0)';
        }
    }
    // Desktop tetap normal
}
    
    handleViewportChange() {
        if (!this.isMobile) return;
        
        const newHeight = window.innerHeight;
        const heightDiff = this.initialViewportHeight - newHeight;
        
        // Keyboard muncul jika tinggi berkurang signifikan
        const isKeyboardOpen = heightDiff > 150;
        
        if (isKeyboardOpen && !this.isKeyboardVisible) {
            console.log('📱 Keyboard OPEN');
            this.keyboardHeight = heightDiff;
            this.isKeyboardVisible = true;
            this.raiseButtonsAboveKeyboard();
        } else if (!isKeyboardOpen && this.isKeyboardVisible) {
            console.log('📱 Keyboard CLOSED');
            this.isKeyboardVisible = false;
            this.lowerButtonsToBottom();
        }
        
        this.initialViewportHeight = newHeight;
    }
    
    handleFocusIn(event) {
        if (!this.isMobile) return;
        
        const target = event.target;
        // HANYA handle input/textarea, biarkan event lain normal
        if (target.matches('input, textarea, [contenteditable="true"]')) {
            this.activeInput = target;
            
            setTimeout(() => {
                if (this.isKeyboardVisible) {
                    this.positionButtonNearActiveInput();
                }
            }, 300);
        }
        // JANGAN stopPropagation atau preventDefault!
    }
    
    handleFocusOut() {
        this.activeInput = null;
    }
    
    positionButtonNearActiveInput() {
        if (!this.activeInput || !this.isKeyboardVisible) return;
        
        const inputRect = this.activeInput.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const targetBottom = viewportHeight - inputRect.bottom + 80;
        
        this.saveButtons.forEach((data, buttonId) => {
            const wrapper = data.element;
            wrapper.style.bottom = `${Math.max(this.keyboardHeight + 20, targetBottom)}px`;
        });
    }
    
raiseButtonsAboveKeyboard() {
    this.saveButtons.forEach((data, buttonId) => {
        const wrapper = data.element;
        const parentModal = wrapper.closest('[class*="fixed inset-0"]');
        
        if (parentModal && this.isMobile) {
            // Naikkan dengan transform
            wrapper.style.transform = `translateY(-${this.keyboardHeight + 20}px)`;
            wrapper.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        }
    });
}
    
lowerButtonsToBottom() {
    this.saveButtons.forEach((data, buttonId) => {
        const wrapper = data.element;
        if (this.isMobile) {
            wrapper.style.transform = 'translateY(0)';
        }
    });
}
    
    resetAllButtons() {
        this.saveButtons.forEach((data, buttonId) => {
            const wrapper = data.element;
            wrapper.style.position = 'relative';
            wrapper.style.bottom = 'auto';
            wrapper.style.left = 'auto';
            wrapper.style.right = 'auto';
        });
    }
}

// Global instance
window.mobileKeyboardHandler = new MobileKeyboardHandler();

// ============================================================================
// RENDER INVENTARIS
// ============================================================================

export function renderInventaris() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div id="view-list" class="flex flex-col gap-2 ${desktopWidth} mx-auto p-2 sm:p-4 animate-fadeIn">
            <div class="flex justify-between items-center px-1">
                <h2 class="text-xl font-bold text-gray-800 tracking-tight proper-case">Inventaris</h2>
                <button onclick="window.switchView('view-pengaturan')" class="p-2 text-emerald-600"><i class="fa-solid fa-gear text-lg"></i></button>
            </div>
            <div id="list-barang" class="grid grid-cols-1 md:grid-cols-2 gap-4 pb-32 px-1"></div>
            <button onclick="window.bukaHalamanEdit(null)" class="fixed bottom-24 right-4 md:right-[calc(50%-20rem)] bg-emerald-500 text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 font-bold z-40">
                <i class="fa-solid fa-box-open text-sm"></i> <span class="uppercase text-[11px]">Tambah Barang</span>
            </button>
        </div>

<div id="view-edit" class="hidden fixed inset-0 bg-white z-[70]">
    <div class="${desktopWidth} mx-auto h-full bg-white flex flex-col">
        <!-- HEADER - TINGGI TETAP -->
        <div class="flex items-center p-4 border-b border-gray-100 flex-shrink-0" id="header-edit">
            <button onclick="window.batalEdit()" class="mr-3 p-2 rounded-full hover:bg-gray-100">
                <i class="fa-solid fa-arrow-left text-xl text-gray-600"></i>
            </button>
            <h3 id="edit-title" class="font-bold text-lg text-gray-800 proper-case">Tambah Barang</h3>
        </div>
        
        <!-- CONTENT AREA - SCROLLABLE -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
            <div class="relative border border-gray-200 rounded-xl std-input">
                <label class="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 proper-case tracking-widest">Nama Barang</label>
                <input type="text" id="edit-nama" class="w-full h-full px-4 bg-transparent outline-none font-bold text-gray-700 proper-case text-sm">
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onclick="window.bukaPickerSelection('kategori', 'view-edit')" class="relative border border-gray-200 rounded-xl flex justify-between items-center cursor-pointer std-input px-4">
                    <label class="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 proper-case tracking-widest">Kategori</label>
                    <input type="text" id="edit-kategori" class="font-bold text-gray-700 pointer-events-none text-xs proper-case" readonly>
                    <i class="fa-solid fa-chevron-right text-gray-300 text-[10px]"></i>
                </div>
                <div onclick="window.bukaPilihSatuanPengukuran()" class="relative border border-gray-200 rounded-xl flex justify-between items-center cursor-pointer std-input px-4">
                    <label class="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 proper-case tracking-widest">Satuan</label>
                    <input type="text" id="edit-satuan-display" class="w-full font-bold text-gray-700 pointer-events-none text-xs uppercase truncate" readonly>
                    <i class="fa-solid fa-chevron-right text-gray-300 text-[10px] flex-shrink-0"></i>
                </div>
            </div>
            <div id="info-konversi" class="hidden flex items-start gap-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                <i class="fa-solid fa-link mt-0.5"></i><span id="text-konversi" class="uppercase"></span>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div class="relative border border-gray-200 rounded-xl std-input">
                    <label class="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 proper-case tracking-widest">Stok Awal</label>
                    <input type="number" id="edit-stok" class="w-full h-full px-4 bg-transparent outline-none font-bold text-gray-700 text-sm">
                </div>
                <div class="relative border border-gray-200 rounded-xl flex items-center px-4 std-input">
                    <label class="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 proper-case tracking-widest">Harga Jual</label>
                    <span class="text-gray-400 text-[10px] font-bold mr-1">RP</span>
                    <input type="number" id="edit-jual" class="w-full h-full bg-transparent outline-none font-bold text-gray-700 text-sm">
                </div>
            </div>
        </div>
        
        <!-- ACTION BUTTONS - INTEGRATED BAGIAN DARI LAYOUT -->
        <div class="p-4 bg-white border-t border-gray-100 flex-shrink-0">
            <button onclick="window.simpanBarang()" class="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold uppercase text-sm shadow-lg hover:bg-emerald-600 active:scale-95 transition-all duration-200">
                Simpan Barang
            </button>
        </div>
    </div>
</div>

        <div id="view-pengaturan" class="hidden fixed inset-0 bg-gray-50 z-[100] overflow-y-auto">
             <div class="${desktopWidth} mx-auto min-h-screen bg-gray-50 flex flex-col shadow-2xl border-x">
                <div class="flex items-center p-4 bg-white border-b sticky top-0 z-10">
                    <button onclick="window.switchView('view-list')" class="mr-4 p-2 rounded-full"><i class="fa-solid fa-arrow-left text-xl text-gray-600"></i></button>
                    <h3 class="font-bold text-lg text-gray-800 proper-case">Pengaturan Inventaris</h3>
                </div>
                <div class="p-3 space-y-2">
                    <div onclick="window.bukaPickerSelection('kategori', 'view-pengaturan')" class="bg-white p-4 rounded-xl flex justify-between items-center border border-gray-100 active:bg-gray-50 cursor-pointer">
                        <div class="flex items-center gap-4"><i class="fa-solid fa-boxes-stacked text-emerald-500"></i><span class="font-bold text-gray-700 proper-case text-sm">Kelola Kategori</span></div>
                        <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                    </div>
                    <div onclick="window.bukaPickerSelection('satuan', 'view-pengaturan')" class="bg-white p-4 rounded-xl flex justify-between items-center border border-gray-100 active:bg-gray-50 cursor-pointer">
                        <div class="flex items-center gap-4"><i class="fa-solid fa-scale-balanced text-emerald-500"></i><span class="font-bold text-gray-700 proper-case text-sm">Kelola Satuan Ukur</span></div>
                        <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                    </div>
                </div>
            </div>
        </div>

        <div id="view-multi-satuan" class="hidden fixed inset-0 bg-white z-[120] flex flex-col">
            <div class="${desktopWidth} mx-auto w-full h-full flex flex-col bg-white">
                <div class="flex items-center p-3 border-b">
                    <button onclick="window.tutupMultiSatuan()" class="mr-3 p-2 rounded-full"><i class="fa-solid fa-arrow-left text-xl text-gray-600"></i></button>
                    <h3 class="font-bold text-lg text-gray-800 proper-case tracking-tight">Satuan Pengukuran</h3>
                </div>
                <div class="p-4 space-y-6 flex-1 overflow-y-auto no-scrollbar">
                    <div onclick="window.bukaPickerSelection('satuan', 'view-multi-satuan', 'utama')" class="relative border border-gray-200 rounded-xl flex justify-between items-center cursor-pointer px-4 std-input">
                        <label class="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 proper-case tracking-widest">Satuan Utama</label>
                        <input type="text" id="val-satuan-utama" class="font-bold text-gray-700 outline-none pointer-events-none uppercase" readonly>
                        <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                    </div>
                    <div id="dynamic-secondary-units" class="space-y-6"></div>
                    <button onclick="window.tambahSatuanSekunder()" class="text-emerald-600 font-bold text-[10px] flex items-center gap-2 py-2 uppercase tracking-widest">
                        <i class="fa-solid fa-circle-plus text-base"></i> Tambah Satuan Lainnya
                    </button>
                </div>
<div class="p-4 bg-white border-t border-gray-100 flex-shrink-0">
    <div class="grid grid-cols-2 gap-3">
        <button onclick="window.tutupMultiSatuan()" class="w-full py-3.5 font-bold text-gray-500 uppercase text-sm bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-95 transition-all duration-200">
            Batal
        </button>
        <button onclick="window.konfirmasiSatuan()" class="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold uppercase text-sm shadow-lg hover:bg-emerald-600 active:scale-95 transition-all duration-200">
            Simpan
        </button>
    </div>
</div>
            </div>
        </div>

        <!-- PANEL PICKER - FULLSCREEN MODAL SEPERTI view-edit -->
<div id="view-picker" class="hidden fixed inset-0 bg-white z-[200]">
    <div class="${desktopWidth} mx-auto h-full bg-white flex flex-col">
        <!-- HEADER - TINGGI TETAP -->
        <div class="flex items-center p-4 border-b border-gray-100 flex-shrink-0">
            <button onclick="window.tutupPicker()" class="mr-3 p-2 rounded-full hover:bg-gray-100">
                <i class="fa-solid fa-arrow-left text-xl text-gray-600"></i>
            </button>
            <h3 id="picker-title" class="font-bold text-lg text-gray-800 proper-case">Pilih Kategori</h3>
        </div>
        
        <!-- SEARCH - TINGGI TETAP -->
        <div class="p-4 flex-shrink-0">
            <div class="relative border border-gray-100 bg-gray-50 rounded-xl std-input px-4 flex items-center gap-3">
                <i class="fa-solid fa-magnifying-glass text-gray-300 text-sm"></i>
                <input type="text" id="picker-search" oninput="window.filterPickerList(this.value)" 
                       class="w-full h-full bg-transparent outline-none font-medium text-gray-600 text-sm"
                       placeholder="Cari kategori atau satuan...">
            </div>
        </div>
        
        <!-- LIST AREA - SCROLLABLE -->
        <div id="picker-list" class="flex-1 overflow-y-auto px-4 space-y-1 no-scrollbar"></div>
        
        <!-- ACTION BUTTONS - INTEGRATED BAGIAN DARI LAYOUT -->
        <div class="p-4 bg-white border-t border-gray-100 flex-shrink-0">
            <button id="picker-btn-add" 
                    class="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold uppercase text-sm shadow-lg hover:bg-emerald-600 active:scale-95 transition-all duration-200">
                <i class="fa-solid fa-plus mr-2"></i> 
                <span id="picker-btn-text">Tambah Kategori Baru</span>
            </button>
        </div>
    </div>
</div>

        <div id="view-form-baru" class="hidden fixed inset-0 bg-black/60 z-[200] flex items-end justify-center overflow-hidden">
            <div class="bg-white w-full ${desktopWidth} rounded-t-[2rem] animate-slide-up relative flex flex-col max-h-[85vh]">
                <div class="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-4"></div>
                <div id="form-baru-content" class="flex flex-col p-6 pb-10"></div>
            </div>
        </div>
    `;
    
    loadFirebaseData();
    
    // ============================================================================
    // REGISTER ACTION BUTTONS FOR KEYBOARD HANDLING
    // ============================================================================
    setTimeout(() => {
        console.log('🔧 Registering ACTION buttons...');
        
        // 1. Tombol SIMPAN di view-edit
        const saveButton = document.querySelector('[onclick="window.simpanBarang()"]');
        if (saveButton && !saveButton.closest('nav')) {
            console.log('✅ Registering save-barang button');
            saveButton.id = 'save-barang-button';
            const wrapper = saveButton.parentElement;
            wrapper.id = 'save-barang-wrapper';
            wrapper.classList.add('mobile-keyboard-aware');
            window.mobileKeyboardHandler.registerSaveButton('save-barang-button', 'save-barang-wrapper');
        }
        
        // 2. Tombol di view-form-baru
        const formSaveButtons = document.querySelectorAll('[onclick*="window.prosesSimpanData"]');
        formSaveButtons.forEach((btn, idx) => {
            if (btn && !btn.closest('nav')) {
                console.log(`✅ Registering form-save-button-${idx}`);
                btn.id = `form-save-button-${idx}`;
                const wrapper = btn.parentElement;
                if (wrapper) {
                    wrapper.classList.add('mobile-keyboard-aware');
                    window.mobileKeyboardHandler.registerSaveButton(btn.id);
                }
            }
        });
        
        // 3. Tombol TAMBAH di view-picker (BARU!)
        const pickerAddButton = document.getElementById('picker-btn-add');
        if (pickerAddButton && !pickerAddButton.closest('nav')) {
            console.log('✅ Registering picker-add button for keyboard handling');
            const wrapper = pickerAddButton.parentElement;
            if (wrapper) {
                wrapper.classList.add('mobile-keyboard-aware');
                window.mobileKeyboardHandler.registerSaveButton('picker-btn-add');
            }
        }
        
        // 4. Tombol di view-multi-satuan (jika ada)
        const multiSatuanButtons = document.querySelectorAll('#view-multi-satuan button.bg-emerald-500');
        multiSatuanButtons.forEach((btn, idx) => {
            if (btn && !btn.closest('nav')) {
                console.log(`✅ Registering multi-satuan-button-${idx}`);
                btn.id = btn.id || `multi-satuan-btn-${idx}`;
                const wrapper = btn.parentElement;
                if (wrapper) {
                    wrapper.classList.add('mobile-keyboard-aware');
                    window.mobileKeyboardHandler.registerSaveButton(btn.id);
                }
            }
        });
        
        console.log('🔧 Total action buttons registered:', window.mobileKeyboardHandler.saveButtons.size);
    }, 500);
}

// ============================================================================
// PICKER LOGIC
// ============================================================================

window.bukaPickerSelection = (type, origin, mode = null, index = null) => {
    lastOrigin = origin;
    pickerTargetIndex = { mode, index };
    const picker = document.getElementById('view-picker');
    const isKategori = type === 'kategori';
    
    document.getElementById('picker-title').innerText = isKategori ? 'Pilih Kategori Barang' : 'Pilih Satuan Dasar';
    document.getElementById('picker-btn-text').innerText = isKategori ? 'Tambah Kategori Baru' : 'Tambah Satuan Baru';
    document.getElementById('picker-search').value = "";
    
    document.getElementById('picker-btn-add').onclick = () => window.renderFormTambahBaru(type, mode, index, '');
    
    renderPickerList(type);
    picker.classList.remove('hidden');
    
    // AUTOFOCUS KE SEARCH INPUT (TIDAK PERLU BATAS KOORDINAT LAGI)
    setTimeout(() => {
        const searchInput = document.getElementById('picker-search');
        if (searchInput) searchInput.focus();
    }, 100);
};

function renderPickerList(type, filter = "") {
    const list = document.getElementById('picker-list');
    const data = type === 'kategori' ? dataKategori : dataSatuan;
    const isManageMode = lastOrigin === 'view-pengaturan';
    
    list.innerHTML = Object.entries(data)
        .filter(([id, item]) => item.nama.toLowerCase().includes(filter.toLowerCase()))
        .map(([id, item]) => {
            const val = type === 'satuan' ? item.pendek : item.nama;
            return `
                <div class="py-4 flex justify-between items-center border-b border-gray-50 active:bg-gray-50 cursor-pointer">
                    <div class="flex-1" onclick="window.selectAndClose('${type}', '${val}')">
                        <span class="font-bold text-gray-700 text-sm proper-case">${item.nama} ${item.pendek ? `<span class="text-gray-300 ml-2 font-medium uppercase">${item.pendek}</span>` : ''}</span>
                    </div>
                    ${isManageMode ? `
                        <div class="flex gap-4">
                            <button onclick="window.renderFormTambahBaru('${type}', null, null, '${id}')" class="text-gray-300"><i class="fa-solid fa-pen text-sm"></i></button>
                            <button onclick="window.hapusSettingData('${type}', '${id}')" class="text-rose-200"><i class="fa-solid fa-trash-can text-sm"></i></button>
                        </div>
                    ` : `
                        <div class="radio-custom" onclick="window.selectAndClose('${type}', '${val}')"></div>
                    `}
                </div>
            `;
        }).join('');
}

window.renderFormTambahBaru = (type, mode, index, id = "") => {
    const view = document.getElementById('view-form-baru');
    const content = document.getElementById('form-baru-content');
    const safeId = (id === "null" || id === null || id === "") ? "" : id;
    const item = safeId ? (type === 'kategori' ? dataKategori[safeId] : dataSatuan[safeId]) : { nama: "", pendek: "" };
    
    content.innerHTML = `
        <h3 class="font-bold text-lg text-gray-800 proper-case mb-6">${safeId ? 'Ubah' : 'Buat'} ${type} Baru</h3>
        <div class="space-y-6">
            <div class="relative border-2 border-emerald-500 rounded-xl std-input">
                <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-emerald-500 proper-case">Nama ${type}</label>
                <input type="text" id="new-name" value="${item.nama}" class="w-full h-full px-4 bg-transparent outline-none font-bold text-gray-700 proper-case">
            </div>
            ${type === 'satuan' ? `
                <div class="relative border border-gray-200 rounded-xl bg-gray-50 std-input">
                    <label class="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 proper-case tracking-widest">Satuan Pendek</label>
                    <input type="text" id="new-short" value="${item.pendek}" maxlength="5" class="w-full h-full px-4 bg-transparent outline-none font-bold text-gray-700 uppercase">
                </div>
            ` : ''}
        </div>
<div class="p-4 bg-white border-t border-gray-100 flex-shrink-0">
    <div class="grid grid-cols-2 gap-3">
        <button onclick="document.getElementById('view-form-baru').classList.add('hidden')" class="w-full py-3.5 font-bold text-gray-500 uppercase text-sm bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-95 transition-all duration-200">
            Batal
        </button>
        <button onclick="window.prosesSimpanData('${type}', '${safeId}', '${mode}', ${index})" class="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold uppercase text-sm shadow-lg hover:bg-emerald-600 active:scale-95 transition-all duration-200">
            Simpan
        </button>
    </div>
</div>
    `;
    view.classList.remove('hidden');
};

window.prosesSimpanData = async (type, id, mode, index) => {
    const nama = document.getElementById('new-name').value.trim();
    if (!nama) return;
    const finalId = (id === "" || id === null) ? null : id;
    if (type === 'kategori') { 
        await SetingInv.simpanKategori(nama, finalId); 
    } else { 
        const pendek = document.getElementById('new-short').value; 
        await SetingInv.simpanSatuanDasar(nama, pendek, finalId); 
    }
    document.getElementById('view-form-baru').classList.add('hidden');
    renderPickerList(type);
};

window.filterPickerList = (val) => {
    const type = document.getElementById('picker-btn-text').innerText.includes('Kategori') ? 'kategori' : 'satuan';
    renderPickerList(type, val);
};

window.selectAndClose = (type, val) => {
    if (lastOrigin === 'view-edit') {
        if (type === 'kategori') document.getElementById('edit-kategori').value = val;
    } else if (lastOrigin === 'view-multi-satuan') {
        if (pickerTargetIndex.mode === 'utama') document.getElementById('val-satuan-utama').value = val.toUpperCase();
        else multiUnits[pickerTargetIndex.index].unit = val.toUpperCase();
        renderKonversiList();
    }
    window.tutupPicker();
};

window.tutupPicker = () => {
    const picker = document.getElementById('view-picker');
    picker.classList.add('hidden');
};

// ============================================================================
// NAVIGASI VIEW & UTILITY
// ============================================================================

window.switchView = (v) => { 
    document.querySelectorAll('[id^="view-"]').forEach(el => el.classList.add('hidden')); 
    document.getElementById(v).classList.remove('hidden'); 
};

window.bukaHalamanEdit = (id) => { 
    currentEditId = id; 
    multiUnits = []; 
    window.switchView('view-edit'); 
};

window.batalEdit = () => window.switchView('view-list');

window.bukaPilihSatuanPengukuran = () => { 
    window.switchView('view-multi-satuan'); 
    renderKonversiList(); 
};

window.tutupMultiSatuan = () => window.switchView('view-edit');

window.tambahSatuanSekunder = () => { 
    multiUnits.push({ unit: '', ratio: '' }); 
    renderKonversiList(); 
};

window.hapusRowKonversi = (idx) => { 
    multiUnits.splice(idx, 1); 
    renderKonversiList(); 
};

window.updateRatio = (idx, val) => multiUnits[idx].ratio = val;

window.hapusSettingData = async (type, id) => { 
    type === 'kategori' ? await SetingInv.hapusKategori(id) : await SetingInv.hapusSatuanDasar(id); 
    const currentType = document.getElementById('picker-btn-text').innerText.includes('Kategori') ? 'kategori' : 'satuan';
    renderPickerList(currentType); 
};

window.konfirmasiSatuan = () => {
    const utama = document.getElementById('val-satuan-utama').value;
    if (!utama) return alert("Pilih Satuan Utama!");
    let display = utama;
    let chainInfo = `1 ${utama}`;
    multiUnits.forEach(m => { 
        if (m.unit && m.ratio) { 
            display += ` & ${m.unit}`; 
            chainInfo += ` → ${m.ratio} ${m.unit}`; 
        } 
    });
    document.getElementById('edit-satuan-display').value = display;
    const infoDiv = document.getElementById('info-konversi');
    if (multiUnits.length > 0) { 
        infoDiv.classList.remove('hidden'); 
        document.getElementById('text-konversi').innerText = chainInfo; 
    } else { 
        infoDiv.classList.add('hidden'); 
    }
    window.switchView('view-edit');
};

function renderKonversiList() {
    const container = document.getElementById('dynamic-secondary-units');
    const utama = document.getElementById('val-satuan-utama').value || 'Utama';
    container.innerHTML = multiUnits.map((item, idx) => `
        <div class="space-y-4 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 relative animate-fadeIn">
            <button onclick="window.hapusRowKonversi(${idx})" class="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-md border-2 border-white"><i class="fa-solid fa-xmark"></i></button>
            <div onclick="window.bukaPickerSelection('satuan', 'view-multi-satuan', 'sekunder', ${idx})" class="relative border border-gray-200 rounded-xl flex justify-between items-center cursor-pointer bg-white px-4 std-input">
                <label class="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-bold text-gray-400 proper-case tracking-widest">Satuan Ke-${idx + 2}</label>
                <input type="text" value="${item.unit}" class="font-bold text-gray-700 outline-none pointer-events-none uppercase text-xs" readonly>
                <i class="fa-solid fa-chevron-right text-gray-300 text-[10px]"></i>
            </div>
            <div class="relative border border-gray-200 rounded-xl bg-white std-input">
                <label class="absolute -top-2 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 proper-case">1 ${utama} = Berapa?</label>
                <input type="number" oninput="window.updateRatio(${idx}, this.value)" value="${item.ratio}" class="w-full h-full px-4 outline-none font-bold text-gray-700 text-sm">
            </div>
        </div>
    `).join('');
}

// ============================================================================
// FIREBASE DATA
// ============================================================================

window.loadFirebaseData = () => { 
    onValue(ref(db, 'products'), s => { 
        databaseBarang = s.val() || {}; 
        window.filterInventaris(); 
    }); 
    onValue(ref(db, 'settings/categories'), s => { 
        dataKategori = s.val() || {}; 
    }); 
    onValue(ref(db, 'settings/units'), s => { 
        dataSatuan = s.val() || {}; 
    }); 
};

window.filterInventaris = () => {
    const list = document.getElementById('list-barang'); 
    if(!list) return; 
    list.innerHTML = "";
    Object.entries(databaseBarang).forEach(([id, item]) => {
        const inisial = item.nama.substring(0, 2).toUpperCase();
        list.innerHTML += `
            <div class="bg-white p-5 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm active:bg-gray-50 transition-all">
                <div class="w-12 h-12 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center font-bold text-xs uppercase">${inisial}</div>
                <div class="flex-1 overflow-hidden">
                    <h4 class="font-bold text-[16px] text-gray-700 truncate proper-case">${item.nama}</h4>
                    <p class="text-[11px] text-gray-400 font-bold tracking-tighter proper-case">${item.kategori}</p>
                </div>
                <div class="text-right">
                    <p class="text-sm font-black text-emerald-600">${item.stok} <span class="uppercase text-[10px]">${item.satuan}</span></p>
                </div>
            </div>
        `;
    });
};

// ============================================================================
// END OF FILE
// ============================================================================