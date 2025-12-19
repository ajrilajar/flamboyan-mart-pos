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
// MOBILE KEYBOARD HANDLER (VERSI REVISI - TOMBOL NAIK SAAT KEYBOARD)
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
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth < 768;
            if (!this.isMobile) this.resetAllButtons();
        });
        
        window.addEventListener('resize', () => this.handleViewportChange());
        document.addEventListener('focusin', (e) => this.handleFocusIn(e));
        document.addEventListener('focusout', () => this.handleFocusOut());
        
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => this.handleVisualViewportChange());
        }
    }
    
    registerSaveButton(buttonId, containerId = null) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        let wrapper = button.parentElement;
        if (containerId) {
            wrapper = document.getElementById(containerId);
        }
        
        // PASTIKAN INI BUKAN NAVIGATION
        if (wrapper.closest('nav')) {
            console.log('Skipping navigation button:', buttonId);
            return; // JANGAN daftarkan tombol navigation!
        }
        
        wrapper.classList.add('mobile-keyboard-aware');
        
        const originalStyle = {
            position: wrapper.style.position || 'relative',
            bottom: wrapper.style.bottom || 'auto'
        };
        
        this.saveButtons.set(buttonId, {
            element: wrapper,
            originalStyle: originalStyle
        });
        
        this.applyDeviceStyle(wrapper);
    }
    
    applyDeviceStyle(wrapper) {
        if (this.isMobile) {
            wrapper.style.position = 'fixed';
            wrapper.style.bottom = '1rem';
            wrapper.style.left = '1rem';
            wrapper.style.right = '1rem';
            wrapper.style.zIndex = '1000';
            wrapper.style.transition = 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        } else {
            wrapper.style.position = 'relative';
            wrapper.style.bottom = 'auto';
            wrapper.style.left = 'auto';
            wrapper.style.right = 'auto';
            wrapper.style.zIndex = 'auto';
        }
    }
    
    handleViewportChange() {
        if (!this.isMobile) return;
        
        const newHeight = window.innerHeight;
        const heightDiff = this.initialViewportHeight - newHeight;
        
        // Keyboard muncul jika tinggi berkurang > 150px
        const isKeyboardOpen = heightDiff > 150;
        
        if (isKeyboardOpen && !this.isKeyboardVisible) {
            console.log('📱 Keyboard OPEN - Tombol aksi naik');
            this.keyboardHeight = heightDiff;
            this.isKeyboardVisible = true;
            this.raiseButtonsAboveKeyboard();
        } else if (!isKeyboardOpen && this.isKeyboardVisible) {
            console.log('📱 Keyboard CLOSED - Tombol aksi turun');
            this.isKeyboardVisible = false;
            this.lowerButtonsToBottom();
        }
        
        this.initialViewportHeight = newHeight;
    }
    
    handleVisualViewportChange() {
        if (!window.visualViewport || !this.isMobile) return;
        
        const viewport = window.visualViewport;
        const offsetTop = viewport.offsetTop;
        
        if (offsetTop > 0) {
            this.isKeyboardVisible = true;
            this.keyboardHeight = window.innerHeight - viewport.height;
            
            this.saveButtons.forEach((data, buttonId) => {
                const wrapper = data.element;
                wrapper.style.bottom = `${this.keyboardHeight + 20}px`;
            });
        } else if (this.isKeyboardVisible) {
            this.isKeyboardVisible = false;
            this.lowerButtonsToBottom();
        }
    }
    
handleFocusIn(event) {
    if (!this.isMobile) return;
    
    const target = event.target;
    
    // HANYA tangani input/textarea, biarkan event klik lain tetap bekerja
    if (target.matches('input, textarea, [contenteditable="true"]')) {
        this.activeInput = target;
        
        setTimeout(() => {
            if (this.isKeyboardVisible) {
                this.positionButtonNearActiveInput();
            }
        }, 300);
    }
    
    // JANGAN stop propagation atau prevent default!
    // Biarkan event klik pada navigation tetap bekerja normal
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
            wrapper.style.bottom = `${this.keyboardHeight + 20}px`;
        });
    }
    
    lowerButtonsToBottom() {
        this.saveButtons.forEach((data, buttonId) => {
            const wrapper = data.element;
            wrapper.style.bottom = '1rem';
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

window.mobileKeyboardHandler = new MobileKeyboardHandler();

// Inisialisasi drag dengan batasan
function initPickerDrag() {
    const picker = document.getElementById('view-picker');
    const dragHandle = document.getElementById('picker-drag-handle');
    const pickerContent = picker.querySelector('.picker-content-container');
    
    if (!picker || !dragHandle || !pickerContent) return;
    
    let startY = 0;
    let startTop = 0;
    let isDragging = false;
    const bounds = calculatePickerBounds(lastOrigin);
    
    const startDrag = (e) => {
        e.preventDefault();
        isDragging = true;
        startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        startTop = parseFloat(pickerContent.style.top) || bounds.minTop;
        pickerContent.style.transition = 'none';
        dragHandle.classList.add('cursor-grabbing');
    };
    
    const doDrag = (e) => {
        if (!isDragging) return;
        
        const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        const deltaY = currentY - startY;
        let newTop = startTop + deltaY;
        
        // Batasi pergerakan
        newTop = Math.max(bounds.minTop, Math.min(bounds.maxTop, newTop));
        
        // Update posisi
        pickerContent.style.top = `${newTop}px`;
        pickerContent.style.height = `calc(100% - ${newTop}px)`;
        
        // Adjust opacity backdrop berdasarkan posisi
        const progress = (newTop - bounds.minTop) / (bounds.maxTop - bounds.minTop);
        const backdrop = picker.querySelector('.absolute.inset-0');
        if (backdrop) {
            backdrop.style.backgroundColor = `rgba(0, 0, 0, ${0.6 - (progress * 0.3)})`;
        }
    };
    
    const endDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        pickerContent.style.transition = 'top 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
        dragHandle.classList.remove('cursor-grabbing');
        
        const currentTop = parseFloat(pickerContent.style.top);
        const threshold = (bounds.minTop + bounds.maxTop) / 2;
        
        // Snap to nearest bound
        const snapTop = currentTop > threshold ? bounds.maxTop : bounds.minTop;
        pickerContent.style.top = `${snapTop}px`;
        pickerContent.style.height = `calc(100% - ${snapTop}px)`;
        
        // Reset backdrop opacity
        const backdrop = picker.querySelector('.absolute.inset-0');
        if (backdrop) {
            backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            backdrop.style.transition = 'background-color 0.25s';
        }
    };
    
    // Event listeners
    dragHandle.addEventListener('touchstart', startDrag, { passive: false });
    dragHandle.addEventListener('mousedown', startDrag);
    
    document.addEventListener('touchmove', doDrag, { passive: false });
    document.addEventListener('mousemove', doDrag);
    
    document.addEventListener('touchend', endDrag);
    document.addEventListener('mouseup', endDrag);
    
    // Hentikan drag jika klik di backdrop
    const backdrop = picker.querySelector('.absolute.inset-0');
    backdrop.addEventListener('touchstart', (e) => {
        if (e.target === backdrop) {
            endDrag();
            window.tutupPicker();
        }
    });
    backdrop.addEventListener('mousedown', (e) => {
        if (e.target === backdrop) {
            endDrag();
            window.tutupPicker();
        }
    });
}

// Update bounds saat window resize
window.addEventListener('resize', () => {
    const picker = document.getElementById('view-picker');
    if (picker && !picker.classList.contains('hidden')) {
        const bounds = calculatePickerBounds(lastOrigin);
        const pickerContent = picker.querySelector('.picker-content-container');
        
        if (pickerContent) {
            const currentTop = parseFloat(pickerContent.style.top) || bounds.minTop;
            const clampedTop = Math.max(bounds.minTop, Math.min(bounds.maxTop, currentTop));
            
            pickerContent.style.top = `${clampedTop}px`;
            pickerContent.style.height = `calc(100% - ${clampedTop}px)`;
        }
    }
});

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

        <div id="view-edit" class="hidden fixed inset-0 bg-white z-[70] overflow-y-auto">
            <div class="${desktopWidth} mx-auto min-h-screen bg-white flex flex-col">
                <div class="flex items-center p-2 border-b sticky top-0 bg-white z-10" id="header-edit">
                    <button onclick="window.batalEdit()" class="p-2 text-gray-600 mr-1"><i class="fa-solid fa-arrow-left text-xl"></i></button>
                    <h3 id="edit-title" class="font-bold text-base text-gray-800 proper-case">Tambah Barang</h3>
                </div>
                <div class="p-3 space-y-4 flex-1">
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
                <div class="p-3 bg-white border-t sticky bottom-0 z-20">
                    <button onclick="window.simpanBarang()" class="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold uppercase text-sm">Simpan</button>
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
                <div class="p-3 border-t grid grid-cols-2 gap-2 bg-gray-50">
                    <button onclick="window.tutupMultiSatuan()" class="py-3 font-bold text-gray-400 text-[10px] uppercase tracking-widest bg-white border rounded-xl">Batal</button>
                    <button onclick="window.konfirmasiSatuan()" class="py-3 bg-emerald-500 text-white font-bold rounded-xl active:scale-95 uppercase text-sm">Simpan</button>
                </div>
            </div>
        </div>

        <!-- Panel Picker dengan sistem batas koordinat & tombol sticky -->
        <div id="view-picker" class="hidden fixed inset-0 z-[200] overflow-hidden">
            <div class="absolute inset-0 bg-black/60" onclick="window.tutupPicker()"></div>
            <div class="picker-content-container absolute left-0 right-0 bg-white ${desktopWidth} mx-auto rounded-t-[2rem] animate-slide-up"
                 style="will-change: transform;">
                <div class="w-full flex flex-col" style="height: 70vh; max-height: 70vh;">
                    <div class="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-4 cursor-grab active:cursor-grabbing touch-none"
                         id="picker-drag-handle"></div>
                    <div class="px-6 mb-4 flex justify-between items-center flex-shrink-0">
                        <h3 id="picker-title" class="font-bold text-lg text-gray-800 proper-case">Pilih Kategori</h3>
                        <button onclick="window.tutupPicker()" class="text-gray-400 p-2">
                            <i class="fa-solid fa-xmark text-xl"></i>
                        </button>
                    </div>
                    <div class="px-6 mb-4 flex-shrink-0">
                        <div class="relative border border-gray-100 bg-gray-50 rounded-xl std-input px-4 flex items-center gap-3">
                            <i class="fa-solid fa-magnifying-glass text-gray-300 text-sm"></i>
                            <input type="text" id="picker-search" oninput="window.filterPickerList(this.value)" 
                                   class="w-full h-full bg-transparent outline-none font-medium text-gray-600 text-sm"
                                   placeholder="Cari...">
                        </div>
                    </div>
                    <!-- SCROLL AREA yang mencakup tombol -->
                    <div class="flex-1 min-h-0 overflow-hidden flex flex-col">
                        <div id="picker-list" class="flex-1 overflow-y-auto px-6 space-y-2 no-scrollbar"></div>
                        <!-- TOMBOL STICKY DI DALAM SCROLL AREA -->
                        <div class="sticky bottom-0 bg-white border-t p-4 mt-auto flex-shrink-0">
                            <button id="picker-btn-add" 
                                    class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                                <i class="fa-solid fa-plus"></i> 
                                <span id="picker-btn-text">Tambah Kategori Baru</span>
                            </button>
                        </div>
                    </div>
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
    
    // Inisialisasi drag setelah DOM selesai render
    setTimeout(() => initPickerDrag(), 100);
    
// ============================================================================
// REGISTER SAVE BUTTONS FOR KEYBOARD HANDLING
// ============================================================================
setTimeout(() => {
    console.log('🔧 Registering ACTION buttons (excluding navigation)...');
    
    // DEBUG: Cek apakah ada navigation yang terpilih
    const allButtons = document.querySelectorAll('button');
    console.log('Total buttons found:', allButtons.length);
    console.log('Navigation buttons:', document.querySelectorAll('nav button').length);
    
    // 1. Tombol SIMPAN di view-edit - PASTIKAN BUKAN NAVIGATION
    const saveButton = document.querySelector('button[onclick="window.simpanBarang()"]');
    if (saveButton) {
        const isNavButton = saveButton.closest('nav') !== null;
        console.log('Save button found, is navigation?', isNavButton);
        
        if (!isNavButton) {
            console.log('✅ Registering save-barang button');
            saveButton.id = 'save-barang-button';
            const wrapper = saveButton.parentElement;
            wrapper.id = 'save-barang-wrapper';
            wrapper.classList.add('mobile-keyboard-aware');
            window.mobileKeyboardHandler.registerSaveButton('save-barang-button', 'save-barang-wrapper');
        } else {
            console.log('❌ Skipping navigation save button');
        }
    }
    
    // 2. Tombol di form-baru - PASTIKAN BUKAN NAVIGATION
    const formSaveButtons = document.querySelectorAll('[onclick*="window.prosesSimpanData"]');
    formSaveButtons.forEach((btn, idx) => {
        const isNavButton = btn.closest('nav') !== null;
        if (!isNavButton) {
            console.log(`✅ Registering form-save-button-${idx}`);
            btn.id = `form-save-button-${idx}`;
            const wrapper = btn.parentElement;
            if (wrapper) {
                wrapper.classList.add('mobile-keyboard-aware');
                window.mobileKeyboardHandler.registerSaveButton(btn.id);
            }
        }
    });
    
    // 3. Tombol TAMBAH di view-picker - PASTIKAN BUKAN NAVIGATION
    const pickerAddButton = document.getElementById('picker-btn-add');
    if (pickerAddButton) {
        const isNavButton = pickerAddButton.closest('nav') !== null;
        if (!isNavButton) {
            console.log('✅ Registering picker-add button');
            const wrapper = pickerAddButton.parentElement;
            if (wrapper) {
                wrapper.classList.add('mobile-keyboard-aware');
                window.mobileKeyboardHandler.registerSaveButton('picker-btn-add');
            }
        }
    }
    
    console.log('🔧 Total action buttons registered:', window.mobileKeyboardHandler?.saveButtons?.size || 0);
}, 500);

// LOGIKA PICKER CERDAS
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
    
    // HITUNG DAN TERAPKAN BATAS KOORDINAT
    setTimeout(() => {
        const bounds = calculatePickerBounds(origin);
        const pickerContent = picker.querySelector('.picker-content-container');
        
        if (pickerContent) {
            // Set posisi awal berdasarkan batas minimal
            pickerContent.style.top = `${bounds.minTop}px`;
            pickerContent.style.height = `calc(100% - ${bounds.minTop}px)`;
            pickerContent.style.transition = 'top 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
        }
    }, 10);
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
        <div class="grid grid-cols-2 gap-3 mt-8">
            <button onclick="document.getElementById('view-form-baru').classList.add('hidden')" class="py-4 font-bold text-gray-400 uppercase text-xs tracking-widest bg-gray-50 rounded-xl">Batal</button>
            <button onclick="window.prosesSimpanData('${type}', '${safeId}', '${mode}', ${index})" class="py-4 bg-emerald-500 text-white rounded-xl font-bold shadow-lg uppercase text-xs tracking-widest">Simpan</button>
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
    const pickerContent = picker.querySelector('.picker-content-container');
    
    if (pickerContent) {
        pickerContent.style.transition = 'top 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
        
        // Animate out
        const bounds = calculatePickerBounds(lastOrigin);
        pickerContent.style.top = `${bounds.maxTop + 100}px`;
        pickerContent.style.height = `calc(100% - ${bounds.maxTop + 100}px)`;
        
        setTimeout(() => {
            picker.classList.add('hidden');
            // Reset untuk next time
            pickerContent.style.top = '';
            pickerContent.style.height = '';
            pickerContent.style.transition = '';
        }, 250);
    } else {
        picker.classList.add('hidden');
    }
};

// NAVIGASI VIEW & UTILITY
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
// NAVIGATION FIX - Pastikan navigation bisa diklik
// ============================================================================

window.fixNavigationClicks = () => {
    const navButtons = document.querySelectorAll('nav button');
    console.log('Navigation buttons found:', navButtons.length);
    
    navButtons.forEach(btn => {
        btn.style.pointerEvents = 'auto';
        btn.style.touchAction = 'auto';
        btn.style.zIndex = '9999';
    });
};

// Fix navigation setelah DOM siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(window.fixNavigationClicks, 500);
    });
} else {
    setTimeout(window.fixNavigationClicks, 500);
}

// ============================================================================
// END OF FILE - PASTIKAN TIDAK ADA KARAKTER TAMBAHAN
// ============================================================================
// File harus berakhir di sini tanpa karakter tambahan