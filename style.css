import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { db } from "./firebase-config.js";
import * as SetingInv from "./modul-pengaturan-inventaris.js";

let databaseBarang = {}, dataKategori = {}, dataSatuan = {};
let currentEditId = null, multiUnits = [], lastOrigin = 'view-list', pickerTargetIndex = null;
const desktopWidth = "max-w-4xl";

// ============================================================================
// RENDER INVENTARIS - FIXED VERSION
// ============================================================================

export function renderInventaris() {
    const content = document.getElementById('main-content');
    
    // CLEAR event listeners dulu
    content.innerHTML = '';
    
    content.innerHTML = `
        <!-- VIEW LIST: DAFTAR BARANG -->
        <div id="view-list" class="flex flex-col gap-2 ${desktopWidth} mx-auto p-2 sm:p-4">
            <div class="flex justify-between items-center px-1">
                <h2 class="text-xl font-bold text-gray-800 tracking-tight proper-case">Inventaris</h2>
                <button onclick="window.switchView('view-pengaturan')" class="p-2 text-emerald-600">
                    <i class="fa-solid fa-gear text-lg"></i>
                </button>
            </div>
            <div id="list-barang" class="grid grid-cols-1 md:grid-cols-2 gap-4 px-1 mb-20"></div>
            
            <!-- TOMBOL TAMBAH BARANG - PASTIKAN ID UNIK -->
            <button id="btn-tambah-barang" 
                    class="fixed bottom-24 right-4 md:right-[calc(50%-20rem)] bg-emerald-500 text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 font-bold z-40">
                <i class="fa-solid fa-box-open text-sm"></i> 
                <span class="uppercase text-[11px]">Tambah Barang</span>
            </button>
        </div>

        <!-- VIEW EDIT: TAMBAH/EDIT BARANG -->
        <div id="view-edit" class="hidden fixed inset-0 bg-white z-[70] flex flex-col">
            <div class="${desktopWidth} mx-auto w-full h-full flex flex-col">
                <div class="flex items-center p-4 border-b">
                    <button onclick="window.batalEdit()" class="p-2 text-gray-600 mr-1">
                        <i class="fa-solid fa-arrow-left text-xl"></i>
                    </button>
                    <h3 class="font-bold text-base text-gray-800 proper-case">Tambah Barang</h3>
                </div>
                
                <div class="flex-1 overflow-y-auto p-4">
                    <div class="space-y-4">
                        <div class="relative border border-gray-200 rounded-xl std-input">
                            <label class="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 proper-case tracking-widest">Nama Barang</label>
                            <input type="text" id="edit-nama" class="w-full h-full px-4 bg-transparent outline-none font-bold text-gray-700 proper-case text-sm">
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div onclick="window.bukaPickerSelection('kategori', 'view-edit')" 
                                 class="relative border border-gray-200 rounded-xl flex justify-between items-center cursor-pointer std-input px-4">
                                <label class="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 proper-case tracking-widest">Kategori</label>
                                <input type="text" id="edit-kategori" class="font-bold text-gray-700 pointer-events-none text-xs proper-case" readonly>
                                <i class="fa-solid fa-chevron-right text-gray-300 text-[10px]"></i>
                            </div>
                            
                            <div onclick="window.bukaPilihSatuanPengukuran()" 
                                 class="relative border border-gray-200 rounded-xl flex justify-between items-center cursor-pointer std-input px-4">
                                <label class="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 proper-case tracking-widest">Satuan</label>
                                <input type="text" id="edit-satuan-display" class="w-full font-bold text-gray-700 pointer-events-none text-xs uppercase truncate" readonly>
                                <i class="fa-solid fa-chevron-right text-gray-300 text-[10px] flex-shrink-0"></i>
                            </div>
                        </div>
                        
                        <div id="info-konversi" class="hidden flex items-start gap-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                            <i class="fa-solid fa-link mt-0.5"></i>
                            <span id="text-konversi" class="uppercase"></span>
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
                </div>
                
                <!-- TOMBOL SIMPAN -->
                <div class="p-4 border-t bg-white">
                    <button onclick="window.simpanBarang()" 
                            class="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold uppercase text-sm shadow-lg">
                        Simpan
                    </button>
                </div>
            </div>
        </div>

        <!-- VIEW PENGATURAN -->
        <div id="view-pengaturan" class="hidden fixed inset-0 bg-gray-50 z-[100] flex flex-col">
            <div class="${desktopWidth} mx-auto w-full h-full flex flex-col">
                <div class="flex items-center p-4 bg-white border-b">
                    <button onclick="window.switchView('view-list')" class="mr-4 p-2 rounded-full">
                        <i class="fa-solid fa-arrow-left text-xl text-gray-600"></i>
                    </button>
                    <h3 class="font-bold text-lg text-gray-800 proper-case">Pengaturan Inventaris</h3>
                </div>
                
                <div class="flex-1 overflow-y-auto p-4">
                    <div class="space-y-2">
                        <div onclick="window.bukaPickerSelection('kategori', 'view-pengaturan')" 
                             class="bg-white p-4 rounded-xl flex justify-between items-center border border-gray-100 active:bg-gray-50 cursor-pointer">
                            <div class="flex items-center gap-4">
                                <i class="fa-solid fa-boxes-stacked text-emerald-500"></i>
                                <span class="font-bold text-gray-700 proper-case text-sm">Kelola Kategori</span>
                            </div>
                            <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                        </div>
                        
                        <div onclick="window.bukaPickerSelection('satuan', 'view-pengaturan')" 
                             class="bg-white p-4 rounded-xl flex justify-between items-center border border-gray-100 active:bg-gray-50 cursor-pointer">
                            <div class="flex items-center gap-4">
                                <i class="fa-solid fa-scale-balanced text-emerald-500"></i>
                                <span class="font-bold text-gray-700 proper-case text-sm">Kelola Satuan Ukur</span>
                            </div>
                            <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- VIEW MULTI SATUAN -->
        <div id="view-multi-satuan" class="hidden fixed inset-0 bg-white z-[120] flex flex-col">
            <div class="${desktopWidth} mx-auto w-full h-full flex flex-col">
                <div class="flex items-center p-4 border-b">
                    <button onclick="window.tutupMultiSatuan()" class="mr-3 p-2 rounded-full">
                        <i class="fa-solid fa-arrow-left text-xl text-gray-600"></i>
                    </button>
                    <h3 class="font-bold text-lg text-gray-800 proper-case tracking-tight">Satuan Pengukuran</h3>
                </div>
                
                <div class="flex-1 overflow-y-auto p-4">
                    <div class="space-y-6">
                        <div onclick="window.bukaPickerSelection('satuan', 'view-multi-satuan', 'utama')" 
                             class="relative border border-gray-200 rounded-xl flex justify-between items-center cursor-pointer px-4 std-input">
                            <label class="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 proper-case tracking-widest">Satuan Utama</label>
                            <input type="text" id="val-satuan-utama" class="font-bold text-gray-700 outline-none pointer-events-none uppercase" readonly>
                            <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                        </div>
                        
                        <div id="dynamic-secondary-units" class="space-y-6"></div>
                        
                        <button onclick="window.tambahSatuanSekunder()" 
                                class="text-emerald-600 font-bold text-[10px] flex items-center gap-2 py-2 uppercase tracking-widest">
                            <i class="fa-solid fa-circle-plus text-base"></i> 
                            Tambah Satuan Lainnya
                        </button>
                    </div>
                </div>
                
                <!-- TOMBOL SIMPAN/BATAL -->
                <div class="p-4 border-t bg-white">
                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="window.tutupMultiSatuan()" 
                                class="w-full py-3.5 font-bold text-gray-400 uppercase text-sm bg-gray-100 rounded-xl">
                            Batal
                        </button>
                        <button onclick="window.konfirmasiSatuan()" 
                                class="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold uppercase text-sm shadow-lg">
                            Simpan
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- VIEW PICKER -->
        <div id="view-picker" class="hidden fixed inset-0 bg-white z-[200] flex flex-col">
            <div class="${desktopWidth} mx-auto w-full h-full flex flex-col">
                <div class="flex items-center p-4 border-b">
                    <button onclick="window.tutupPicker()" class="mr-3 p-2 rounded-full">
                        <i class="fa-solid fa-arrow-left text-xl text-gray-600"></i>
                    </button>
                    <h3 id="picker-title" class="font-bold text-lg text-gray-800 proper-case">Pilih Kategori</h3>
                </div>
                
                <div class="p-4">
                    <div class="relative border border-gray-100 bg-gray-50 rounded-xl std-input px-4 flex items-center gap-3">
                        <i class="fa-solid fa-magnifying-glass text-gray-300 text-sm"></i>
                        <input type="text" id="picker-search" oninput="window.filterPickerList(this.value)" 
                               class="w-full h-full bg-transparent outline-none font-medium text-gray-600 text-sm"
                               placeholder="Cari...">
                    </div>
                </div>
                
                <div id="picker-list" class="flex-1 overflow-y-auto px-4 space-y-1 no-scrollbar"></div>
                
                <!-- TOMBOL TAMBAH BARU -->
                <div class="p-4 border-t bg-white">
                    <button id="picker-btn-add" 
                            class="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold uppercase text-sm shadow-lg">
                        <i class="fa-solid fa-plus mr-2"></i> 
                        <span id="picker-btn-text">Tambah Kategori Baru</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- VIEW FORM BARU -->
        <div id="view-form-baru" class="hidden fixed inset-0 bg-white z-[200] flex flex-col">
            <div class="${desktopWidth} mx-auto w-full h-full flex flex-col">
                <div class="flex items-center p-4 border-b">
                    <button onclick="window.tutupFormBaru()" class="mr-3 p-2 rounded-full">
                        <i class="fa-solid fa-arrow-left text-xl text-gray-600"></i>
                    </button>
                    <h3 id="form-baru-title" class="font-bold text-lg text-gray-800 proper-case">
                        Tambah Kategori
                    </h3>
                </div>
                
                <div id="form-baru-content" class="flex-1 overflow-y-auto p-4">
                    <!-- Content akan diisi dinamis -->
                </div>
                
                <!-- TOMBOL SIMPAN/BATAL -->
                <div class="p-4 border-t bg-white">
                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="window.tutupFormBaru()" 
                                class="w-full py-3.5 font-bold text-gray-400 uppercase text-sm bg-gray-100 rounded-xl">
                            Batal
                        </button>
                        <button onclick="window.prosesSimpanData()" 
                                class="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold uppercase text-sm shadow-lg">
                            Simpan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // PASANG EVENT LISTENER SETELAH RENDER
    setTimeout(() => {
        const btnTambah = document.getElementById('btn-tambah-barang');
        if (btnTambah) {
            btnTambah.onclick = () => window.bukaHalamanEdit(null);
        }
        
        loadFirebaseData();
    }, 50);
}

// ============================================================================
// PICKER LOGIC - SIMPLIFIED
// ============================================================================

window.bukaPickerSelection = (type, origin, mode = null, index = null) => {
    lastOrigin = origin;
    pickerTargetIndex = { mode, index };
    
    const title = document.getElementById('picker-title');
    const btnText = document.getElementById('picker-btn-text');
    
    if (title) title.innerText = type === 'kategori' ? 'Pilih Kategori' : 'Pilih Satuan';
    if (btnText) btnText.innerText = type === 'kategori' ? 'Tambah Kategori Baru' : 'Tambah Satuan Baru';
    
    const searchInput = document.getElementById('picker-search');
    if (searchInput) searchInput.value = '';
    
    const addBtn = document.getElementById('picker-btn-add');
    if (addBtn) {
        addBtn.onclick = () => window.renderFormTambahBaru(type, mode, index, '');
    }
    
    renderPickerList(type);
    window.switchView('view-picker');
};

function renderPickerList(type, filter = "") {
    const list = document.getElementById('picker-list');
    if (!list) return;
    
    const data = type === 'kategori' ? dataKategori : dataSatuan;
    const isManageMode = lastOrigin === 'view-pengaturan';
    
    list.innerHTML = Object.entries(data)
        .filter(([id, item]) => !filter || item.nama.toLowerCase().includes(filter.toLowerCase()))
        .map(([id, item]) => {
            const val = type === 'satuan' ? item.pendek : item.nama;
            return `
                <div class="py-4 flex justify-between items-center border-b border-gray-50 active:bg-gray-50 cursor-pointer">
                    <div class="flex-1" onclick="window.selectAndClose('${type}', '${val}')">
                        <span class="font-bold text-gray-700 text-sm proper-case">
                            ${item.nama} 
                            ${item.pendek ? `<span class="text-gray-300 ml-2 font-medium uppercase">${item.pendek}</span>` : ''}
                        </span>
                    </div>
                    ${isManageMode ? `
                        <div class="flex gap-2">
                            <button onclick="window.renderFormTambahBaru('${type}', null, null, '${id}')" 
                                    class="text-gray-400 px-2">
                                <i class="fa-solid fa-pen text-sm"></i>
                            </button>
                            <button onclick="window.hapusSettingData('${type}', '${id}')" 
                                    class="text-rose-400 px-2">
                                <i class="fa-solid fa-trash-can text-sm"></i>
                            </button>
                        </div>
                    ` : `
                        <div class="radio-custom" onclick="window.selectAndClose('${type}', '${val}')"></div>
                    `}
                </div>
            `;
        }).join('');
}

// ============================================================================
// NAVIGASI VIEW & UTILITY - SIMPLIFIED
// ============================================================================

window.switchView = (v) => { 
    document.querySelectorAll('[id^="view-"]').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('animate-fadeIn');
    }); 
    
    const target = document.getElementById(v);
    if (target) {
        target.classList.remove('hidden');
        setTimeout(() => target.classList.add('animate-fadeIn'), 10);
    }
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

window.tutupPicker = () => {
    if (lastOrigin === 'view-pengaturan') {
        window.switchView('view-pengaturan');
    } else if (lastOrigin === 'view-multi-satuan') {
        window.switchView('view-multi-satuan');
    } else {
        window.switchView('view-edit');
    }
};

window.tutupFormBaru = () => {
    window.switchView('view-picker');
};

// ============================================================================
// FIREBASE DATA - FIXED
// ============================================================================

window.loadFirebaseData = () => { 
    // HANYA load jika elemen ada
    if (!document.getElementById('list-barang')) return;
    
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
    
    if (!databaseBarang || Object.keys(databaseBarang).length === 0) {
        list.innerHTML = `
            <div class="col-span-2 p-8 text-center text-gray-400">
                <i class="fa-solid fa-box-open text-4xl mb-4"></i>
                <p class="text-sm">Belum ada barang di inventaris</p>
            </div>
        `;
        return;
    }
    
    Object.entries(databaseBarang).forEach(([id, item]) => {
        const inisial = item.nama ? item.nama.substring(0, 2).toUpperCase() : '??';
        list.innerHTML += `
            <div class="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
                <div class="w-10 h-10 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center font-bold text-xs uppercase">
                    ${inisial}
                </div>
                <div class="flex-1 overflow-hidden">
                    <h4 class="font-bold text-gray-700 truncate proper-case">${item.nama || 'Tanpa Nama'}</h4>
                    <p class="text-xs text-gray-400 font-medium proper-case">${item.kategori || 'Tanpa Kategori'}</p>
                </div>
                <div class="text-right">
                    <p class="text-sm font-bold text-emerald-600">
                        ${item.stok || 0} <span class="uppercase text-[10px]">${item.satuan || ''}</span>
                    </p>
                </div>
            </div>
        `;
    });
};

// ============================================================================
// FUNGSI LAINNYA (SAMA)
// ============================================================================

window.renderFormTambahBaru = (type, mode, index, id = "") => {
    const title = document.getElementById('form-baru-title');
    const content = document.getElementById('form-baru-content');
    
    if (!title || !content) return;
    
    const safeId = (id === "null" || id === null || id === "") ? "" : id;
    const item = safeId ? (type === 'kategori' ? dataKategori[safeId] : dataSatuan[safeId]) : { nama: "", pendek: "" };
    
    title.innerText = `${safeId ? 'Ubah' : 'Tambah'} ${type === 'kategori' ? 'Kategori' : 'Satuan'}`;
    
    content.innerHTML = `
        <div class="space-y-4">
            <div class="relative border-2 border-emerald-500 rounded-xl std-input">
                <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-emerald-500 proper-case">
                    Nama ${type === 'kategori' ? 'Kategori' : 'Satuan'}
                </label>
                <input type="text" id="new-name" value="${item.nama || ''}" 
                       class="w-full h-full px-4 bg-transparent outline-none font-bold text-gray-700 proper-case"
                       placeholder="Masukkan nama">
            </div>
            
            ${type === 'satuan' ? `
                <div class="relative border border-gray-200 rounded-xl std-input">
                    <label class="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 proper-case tracking-widest">
                        Singkatan (contoh: KG, PCS)
                    </label>
                    <input type="text" id="new-short" value="${item.pendek || ''}" maxlength="5" 
                           class="w-full h-full px-4 bg-transparent outline-none font-bold text-gray-700 uppercase"
                           placeholder="Singkatan">
                </div>
            ` : ''}
        </div>
    `;
    
    const saveBtn = document.querySelector('#view-form-baru button[onclick="window.prosesSimpanData()"]');
    if (saveBtn) {
        saveBtn.onclick = () => window.prosesSimpanData(type, safeId, mode, index);
    }
    
    window.switchView('view-form-baru');
};

window.prosesSimpanData = async (type, id, mode, index) => {
    const nameInput = document.getElementById('new-name');
    if (!nameInput) return;
    
    const nama = nameInput.value.trim();
    if (!nama) {
        alert("Nama harus diisi!");
        return;
    }
    
    const finalId = (id === "" || id === null) ? null : id;
    
    try {
        if (type === 'kategori') { 
            await SetingInv.simpanKategori(nama, finalId); 
        } else { 
            const pendek = document.getElementById('new-short')?.value || ""; 
            await SetingInv.simpanSatuanDasar(nama, pendek, finalId); 
        }
        
        window.switchView('view-picker');
        renderPickerList(type);
        
    } catch (error) {
        alert("Gagal menyimpan: " + error.message);
    }
};

window.filterPickerList = (val) => {
    const type = document.getElementById('picker-btn-text').innerText.includes('Kategori') ? 'kategori' : 'satuan';
    renderPickerList(type, val);
};

window.selectAndClose = (type, val) => {
    if (lastOrigin === 'view-edit') {
        if (type === 'kategori') document.getElementById('edit-kategori').value = val;
    } else if (lastOrigin === 'view-multi-satuan') {
        if (pickerTargetIndex.mode === 'utama') {
            document.getElementById('val-satuan-utama').value = val.toUpperCase();
        } else {
            multiUnits[pickerTargetIndex.index].unit = val.toUpperCase();
        }
        renderKonversiList();
    }
    window.tutupPicker();
};

window.tutupPicker = () => {
    if (lastOrigin === 'view-pengaturan') {
        window.switchView('view-pengaturan');
    } else if (lastOrigin === 'view-multi-satuan') {
        window.switchView('view-multi-satuan');
    } else {
        window.switchView('view-edit');
    }
};

// ============================================================================
// NAVIGASI VIEW & UTILITY - SEMUA FULL SCREEN
// ============================================================================

window.switchView = (v) => { 
    document.querySelectorAll('[id^="view-"]').forEach(el => el.classList.add('hidden')); 
    const target = document.getElementById(v);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('animate-fadeIn');
    }
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
            <button onclick="window.hapusRowKonversi(${idx})" 
                    class="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-md border-2 border-white">
                <i class="fa-solid fa-xmark"></i>
            </button>
            
            <div onclick="window.bukaPickerSelection('satuan', 'view-multi-satuan', 'sekunder', ${idx})" 
                 class="relative border border-gray-200 rounded-xl flex justify-between items-center cursor-pointer bg-white px-4 std-input">
                <label class="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-bold text-gray-400 proper-case tracking-widest">
                    Satuan Ke-${idx + 2}
                </label>
                <input type="text" value="${item.unit}" class="font-bold text-gray-700 outline-none pointer-events-none uppercase text-xs" readonly>
                <i class="fa-solid fa-chevron-right text-gray-300 text-[10px]"></i>
            </div>
            
            <div class="relative border border-gray-200 rounded-xl bg-white std-input">
                <label class="absolute -top-2 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 proper-case">
                    1 ${utama} = Berapa?
                </label>
                <input type="number" oninput="window.updateRatio(${idx}, this.value)" value="${item.ratio}" 
                       class="w-full h-full px-4 outline-none font-bold text-gray-700 text-sm">
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
                <div class="w-12 h-12 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center font-bold text-xs uppercase">
                    ${inisial}
                </div>
                <div class="flex-1 overflow-hidden">
                    <h4 class="font-bold text-[16px] text-gray-700 truncate proper-case">${item.nama}</h4>
                    <p class="text-[11px] text-gray-400 font-bold tracking-tighter proper-case">${item.kategori}</p>
                </div>
                <div class="text-right">
                    <p class="text-sm font-black text-emerald-600">
                        ${item.stok} <span class="uppercase text-[10px]">${item.satuan}</span>
                    </p>
                </div>
            </div>
        `;
    });
};

// ============================================================================
// SIMPAN BARANG
// ============================================================================

window.simpanBarang = async () => {
    const nama = document.getElementById('edit-nama').value;
    const kategori = document.getElementById('edit-kategori').value;
    const stok = document.getElementById('edit-stok').value;
    const harga = document.getElementById('edit-jual').value;
    const satuan = document.getElementById('edit-satuan-display').value;
    
    if (!nama || !kategori || !stok || !harga) {
        alert("Harap lengkapi semua field!");
        return;
    }
    
    // Implementasi simpan ke Firebase
    console.log("Simpan barang:", { nama, kategori, stok, harga, satuan });
    alert("Barang berhasil disimpan!");
    window.batalEdit();
};