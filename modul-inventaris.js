import { ref, onValue, push, set, remove, update } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { db } from "./firebase-config.js";
import * as SetingInv from "./modul-pengaturan-inventaris.js";

let databaseBarang = {}, dataKategori = {}, dataSatuan = {};
let currentEditId = null, multiUnits = [], lastOrigin = 'view-list', pickerTargetIndex = null;
const desktopWidth = "max-w-4xl";

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
                <div class="flex items-center p-2 border-b sticky top-0 bg-white z-10">
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
                    <div onclick="window.bukaKelolaSetting('kategori')" class="bg-white p-4 rounded-xl flex justify-between items-center border border-gray-100">
                        <div class="flex items-center gap-4"><i class="fa-solid fa-boxes-stacked text-emerald-500"></i><span class="font-bold text-gray-700 proper-case text-sm">Kelola Kategori</span></div>
                        <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                    </div>
                    <div onclick="window.bukaKelolaSetting('satuan')" class="bg-white p-4 rounded-xl flex justify-between items-center border border-gray-100">
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

        <div id="view-picker" class="hidden picker-container">
            <div class="${desktopWidth} mx-auto h-full flex flex-col bg-white">
                <div id="picker-drag-handle" class="w-full py-4 cursor-grab flex-shrink-0 touch-none">
                    <div class="w-12 h-1.5 bg-gray-200 rounded-full mx-auto"></div>
                </div>
                <div class="px-6 mb-4"><h3 id="picker-title" class="font-bold text-lg text-gray-800 proper-case">Pilih Kategori</h3></div>
                <div class="px-6 mb-4 flex-shrink-0">
                    <div class="relative border border-gray-100 bg-gray-50 rounded-xl std-input px-4 flex items-center gap-3">
                        <i class="fa-solid fa-magnifying-glass text-gray-300 text-sm"></i>
                        <input type="text" id="picker-search" oninput="window.filterPickerList(this.value)" class="w-full h-full bg-transparent outline-none font-medium text-gray-600 text-sm">
                    </div>
                </div>
                <div id="picker-list" class="flex-1 overflow-y-auto px-6 space-y-2 pb-24 no-scrollbar"></div>
                <div class="p-4 bg-white border-t sticky bottom-0 z-20 mt-auto flex-shrink-0">
                    <button id="picker-btn-add" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg">
                        <i class="fa-solid fa-plus"></i> <span id="picker-btn-text">Tambah Kategori Baru</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    initPickerDrag();
    loadFirebaseData();
}

// LOGIKA NAVIGASI PICKER & KONVERSI
window.bukaPickerSelection = (type, origin, mode = null, index = null) => {
    lastOrigin = origin;
    pickerTargetIndex = { mode, index };
    const picker = document.getElementById('view-picker');
    document.getElementById('picker-title').innerText = type === 'kategori' ? 'Pilih Kategori Barang' : 'Pilih Satuan Dasar';
    document.getElementById('picker-btn-text').innerText = type === 'kategori' ? 'Tambah Kategori Baru' : 'Tambah Satuan Baru';
    document.getElementById('picker-search').value = "";
    
    renderPickerList(type);
    picker.classList.remove('hidden');
    picker.style.transform = 'translateY(100%)';
    setTimeout(() => picker.style.transform = 'translateY(0)', 10);
};

function renderPickerList(type, filter = "") {
    const list = document.getElementById('picker-list');
    const data = type === 'kategori' ? dataKategori : dataSatuan;
    list.innerHTML = Object.entries(data)
        .filter(([id, item]) => item.nama.toLowerCase().includes(filter.toLowerCase()))
        .map(([id, item]) => {
            const val = type === 'satuan' ? item.pendek : item.nama;
            return `
                <div onclick="window.selectAndClose('${type}', '${val}')" class="py-4 flex justify-between items-center cursor-pointer border-b border-gray-50">
                    <span class="font-bold text-gray-700 text-sm proper-case">${item.nama} ${item.pendek ? `<span class="text-gray-300 ml-2 font-medium uppercase">${item.pendek}</span>` : ''}</span>
                    <div class="radio-custom"></div>
                </div>
            `;
        }).join('');
}

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

window.konfirmasiSatuan = () => {
    const utama = document.getElementById('val-satuan-utama').value;
    if (!utama) return alert("Pilih Satuan Utama!");
    let display = utama;
    let chainInfo = `1 ${utama}`;
    multiUnits.forEach(m => { if (m.unit && m.ratio) { display += ` & ${m.unit}`; chainInfo += ` → ${m.ratio} ${m.unit}`; } });
    document.getElementById('edit-satuan-display').value = display;
    const infoDiv = document.getElementById('info-konversi');
    if (multiUnits.length > 0) { infoDiv.classList.remove('hidden'); document.getElementById('text-konversi').innerText = chainInfo; } 
    else { infoDiv.classList.add('hidden'); }
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

// FUNGSI NAVIGASI & DRAG
window.tutupPicker = () => { const p = document.getElementById('view-picker'); p.style.transform = 'translateY(100%)'; setTimeout(() => p.classList.add('hidden'), 250); };
window.switchView = (v) => { document.querySelectorAll('[id^="view-"]').forEach(el => el.classList.add('hidden')); document.getElementById(v).classList.remove('hidden'); };
window.bukaPilihSatuanPengukuran = () => { window.switchView('view-multi-satuan'); renderKonversiList(); };
window.tutupMultiSatuan = () => window.switchView('view-edit');
window.batalEdit = () => window.switchView('view-list');
window.bukaHalamanEdit = (id) => { currentEditId = id; multiUnits = []; window.switchView('view-edit'); };
window.tambahSatuanSekunder = () => { multiUnits.push({ unit: '', ratio: '' }); renderKonversiList(); };
window.hapusRowKonversi = (idx) => { multiUnits.splice(idx, 1); renderKonversiList(); };
window.updateRatio = (idx, val) => multiUnits[idx].ratio = val;

function initPickerDrag() {
    const panel = document.getElementById('view-picker'), handle = document.getElementById('picker-drag-handle'), content = document.getElementById('picker-list');
    let sY = 0, cY = 0;
    const start = (e) => { if (content.scrollTop > 0) { sY = 0; return; } sY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY; panel.style.transition = 'none'; };
    const move = (e) => { if (!sY) return; cY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY; const dY = cY - sY; if (dY > 0 && content.scrollTop <= 0) { e.preventDefault(); panel.style.transform = `translateY(${dY}px)`; } else { sY = 0; panel.style.transform = `translateY(0)`; } };
    const end = () => { if (!sY) return; const dY = cY - sY; panel.style.transition = 'transform 0.25s ease-out'; if (dY > 180) window.tutupPicker(); else panel.style.transform = `translateY(0)`; sY = 0; };
    handle.addEventListener('touchstart', start, { passive: false });
    handle.addEventListener('touchmove', move, { passive: false });
    handle.addEventListener('touchend', end);
}

// FIREBASE & LIST (TETAP)
window.loadFirebaseData = () => { 
    onValue(ref(db, 'products'), s => { databaseBarang = s.val() || {}; window.filterInventaris(); }); 
    onValue(ref(db, 'settings/categories'), s => { dataKategori = s.val() || {}; }); 
    onValue(ref(db, 'settings/units'), s => { dataSatuan = s.val() || {}; }); 
};
window.filterInventaris = () => {
    const list = document.getElementById('list-barang'); if(!list) return; list.innerHTML = "";
    Object.entries(databaseBarang).forEach(([id, item]) => {
        const inisial = item.nama.substring(0, 2).toUpperCase();
        list.innerHTML += `<div class="bg-white p-5 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm active:bg-gray-50 transition-all"><div class="w-12 h-12 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center font-bold text-xs uppercase">${inisial}</div><div class="flex-1 overflow-hidden"><h4 class="font-bold text-[16px] text-gray-700 truncate proper-case">${item.nama}</h4><p class="text-[11px] text-gray-400 font-bold tracking-tighter proper-case">${item.kategori}</p></div><div class="text-right"><p class="text-sm font-black text-emerald-600">${item.stok} <span class="uppercase text-[10px]">${item.satuan}</span></p></div></div>`;
    });
};