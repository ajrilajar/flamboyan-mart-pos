import { ref, onValue, push, set, remove, update } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { db } from "./firebase-config.js";
import * as SetingInv from "./modul-pengaturan-inventaris.js";

let databaseBarang = {}, dataKategori = {}, dataSatuan = {};
let currentEditId = null, multiUnits = [], lastOrigin = 'view-list';
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
            <button onclick="window.bukaHalamanEdit(null)" class="fixed bottom-24 right-4 md:right-[calc(50%-20rem)] bg-emerald-500 text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 font-bold z-40 active:scale-95 transition-all">
                <i class="fa-solid fa-box-open text-sm"></i> <span class="uppercase text-[11px]">Tambah Barang</span>
            </button>
        </div>

        <div id="view-edit" class="hidden fixed inset-0 bg-white z-[70] overflow-y-auto">
            <div class="${desktopWidth} mx-auto min-h-screen bg-white flex flex-col">
                <div class="flex items-center p-2 border-b sticky top-0 bg-white z-10">
                    <button onclick="window.batalEdit()" class="p-2 text-gray-600 mr-1"><i class="fa-solid fa-arrow-left text-xl"></i></button>
                    <h3 id="edit-title" class="font-bold text-base text-gray-800 proper-case tracking-tight">Tambah Barang</h3>
                </div>
                <div class="p-3 space-y-4 flex-1">
                    <div class="relative border border-gray-200 rounded-xl std-input">
                        <label class="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 proper-case tracking-widest">Nama Barang</label>
                        <input type="text" id="edit-nama" class="w-full h-full px-4 bg-transparent outline-none font-bold text-gray-700 proper-case text-sm">
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div onclick="window.bukaPickerSelection('kategori', 'view-edit')" class="relative border border-gray-200 rounded-xl flex justify-between items-center cursor-pointer std-input px-4">
                            <label class="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 proper-case tracking-widest">Kategori</label>
                            <input type="text" id="edit-kategori" class="font-bold text-gray-700 outline-none pointer-events-none text-xs proper-case" readonly>
                            <i class="fa-solid fa-chevron-right text-gray-300 text-[10px]"></i>
                        </div>
                        <div onclick="window.bukaPilihSatuanPengukuran()" class="relative border border-gray-200 rounded-xl flex justify-between items-center cursor-pointer std-input px-4">
                            <label class="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 proper-case tracking-widest">Satuan</label>
                            <input type="text" id="edit-satuan-display" class="w-full font-bold text-gray-700 outline-none pointer-events-none text-xs uppercase truncate" readonly>
                            <i class="fa-solid fa-chevron-right text-gray-300 text-[10px] flex-shrink-0"></i>
                        </div>
                    </div>
                </div>
                <div class="p-3 bg-white border-t sticky bottom-0 z-20">
                    <button onclick="window.simpanBarang()" class="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-lg uppercase text-sm">Simpan</button>
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
                    <div onclick="window.bukaPickerSelection('kategori', 'view-pengaturan')" class="bg-white p-4 rounded-xl flex justify-between items-center shadow-sm cursor-pointer border border-gray-100 active:bg-gray-50">
                        <div class="flex items-center gap-4"><i class="fa-solid fa-boxes-stacked text-emerald-500"></i><span class="font-bold text-gray-700 proper-case text-sm">Kelola Kategori</span></div>
                        <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                    </div>
                </div>
            </div>
        </div>

        <div id="view-picker" class="hidden">
            <div class="${desktopWidth} mx-auto h-full flex flex-col bg-white">
                <div id="picker-drag-handle" class="w-full py-4 cursor-grab flex-shrink-0">
                    <div class="w-12 h-1.5 bg-gray-200 rounded-full mx-auto"></div>
                </div>
                <div class="px-6 mb-4">
                    <h3 id="picker-title" class="font-bold text-lg text-gray-800 proper-case tracking-tight">Pilih Kategori Barang</h3>
                </div>
                <div class="px-6 mb-4 flex-shrink-0">
                    <div class="relative border border-gray-100 bg-gray-50 rounded-xl std-input px-4 flex items-center gap-3">
                        <i class="fa-solid fa-magnifying-glass text-gray-300 text-sm"></i>
                        <input type="text" id="picker-search" oninput="window.filterPickerList(this.value)" class="w-full h-full bg-transparent outline-none font-medium text-gray-600 text-sm">
                    </div>
                </div>
                <div id="picker-list" class="flex-1 overflow-y-auto px-6 space-y-2 pb-24 no-scrollbar"></div>
                <div class="p-4 bg-white border-t sticky bottom-0 z-20 mt-auto flex-shrink-0">
                    <button id="picker-btn-add" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg flex items-center justify-center gap-2">
                        <i class="fa-solid fa-plus"></i> <span id="picker-btn-text">Tambah Kategori Baru</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    initPickerDrag();
    loadFirebaseData();
}

// LOGIKA NAVIGASI CERDAS (Origin Flagging)
window.bukaPickerSelection = (type, origin) => {
    lastOrigin = origin;
    const picker = document.getElementById('view-picker');
    const title = type === 'kategori' ? 'Pilih Kategori Barang' : 'Pilih Satuan Dasar';
    const btnText = type === 'kategori' ? 'Tambah Kategori Baru' : 'Tambah Satuan Baru';
    
    document.getElementById('picker-title').innerText = title;
    document.getElementById('picker-btn-text').innerText = btnText;
    document.getElementById('picker-search').value = "";
    document.getElementById('picker-btn-add').onclick = () => window.renderFormTambahBaru(type, null, null, '');
    
    renderPickerList(type);
    picker.classList.remove('hidden');
    picker.style.transform = 'translateY(100%)';
    setTimeout(() => picker.style.transform = 'translateY(0)', 10);
};

function renderPickerList(type, filter = "") {
    const list = document.getElementById('picker-list');
    const data = type === 'kategori' ? dataKategori : dataSatuan;
    const currentVal = type === 'kategori' ? document.getElementById('edit-kategori').value : "";

    list.innerHTML = Object.entries(data)
        .filter(([id, item]) => item.nama.toLowerCase().includes(filter.toLowerCase()))
        .map(([id, item]) => {
            const name = type === 'satuan' ? item.pendek : item.nama;
            const isActive = currentVal.toLowerCase() === name.toLowerCase();
            return `
                <div onclick="window.selectAndClose('${type}', '${name}')" class="py-4 flex justify-between items-center cursor-pointer border-b border-gray-50">
                    <span class="font-bold text-gray-700 text-sm proper-case">${item.nama} ${item.pendek ? `<span class="text-gray-300 ml-2 font-medium uppercase">${item.pendek}</span>` : ''}</span>
                    <div class="radio-custom ${isActive ? 'radio-active' : ''}"></div>
                </div>
            `;
        }).join('');
}

window.filterPickerList = (val) => {
    const type = document.getElementById('picker-btn-text').innerText.includes('Kategori') ? 'kategori' : 'satuan';
    renderPickerList(type, val);
};

window.selectAndClose = (type, val) => {
    if (lastOrigin === 'view-edit') {
        if (type === 'kategori') document.getElementById('edit-kategori').value = val;
        // Penanganan Satuan Utama bisa ditambahkan di sini
    }
    window.tutupPicker();
};

window.tutupPicker = () => {
    const picker = document.getElementById('view-picker');
    picker.style.transform = 'translateY(100%)';
    setTimeout(() => picker.classList.add('hidden'), 250);
};

// LOGIKA DRAG TO CLOSE (Reference Match)
function initPickerDrag() {
    const panel = document.getElementById('view-picker');
    const handle = document.getElementById('picker-drag-handle');
    const content = document.getElementById('picker-list');
    let startY = 0, currentY = 0;

    const onStart = (e) => {
        if (content.scrollTop > 0) { startY = 0; return; }
        startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        panel.style.transition = 'none';
    };

    const onMove = (e) => {
        if (!startY) return;
        currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        const deltaY = currentY - startY;
        if (deltaY > 0 && content.scrollTop <= 0) {
            e.preventDefault();
            panel.style.transform = `translateY(${deltaY}px)`;
        } else { startY = 0; panel.style.transform = `translateY(0)`; }
    };

    const onEnd = () => {
        if (!startY) return;
        const deltaY = currentY - startY;
        panel.style.transition = 'transform 0.25s ease-out';
        if (deltaY > 180) window.tutupPicker();
        else panel.style.transform = `translateY(0)`;
        startY = 0;
    };

    handle.addEventListener('touchstart', onStart, { passive: false });
    handle.addEventListener('touchmove', onMove, { passive: false });
    handle.addEventListener('touchend', onEnd);
}

// FUNGSI LAINNYA TETAP (State Preservation Ready)
window.switchView = (v) => { 
    document.querySelectorAll('[id^="view-"]').forEach(el => el.classList.add('hidden')); 
    document.getElementById(v).classList.remove('hidden'); 
};
window.bukaHalamanEdit = (id) => { currentEditId = id; multiUnits = []; window.switchView('view-edit'); };
window.batalEdit = () => window.switchView('view-list');
window.loadFirebaseData = () => { 
    onValue(ref(db, 'products'), s => { databaseBarang = s.val() || {}; window.filterInventaris(); }); 
    onValue(ref(db, 'settings/categories'), s => { dataKategori = s.val() || {}; }); 
    onValue(ref(db, 'settings/units'), s => { dataSatuan = s.val() || {}; }); 
};

window.filterInventaris = () => {
    const list = document.getElementById('list-barang');
    if(!list) return; list.innerHTML = "";
    Object.entries(databaseBarang).forEach(([id, item]) => {
        const inisial = item.nama.substring(0, 2).toUpperCase();
        list.innerHTML += `
            <div class="bg-white p-5 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm active:bg-gray-50 transition-all">
                <div class="w-12 h-12 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center font-bold text-xs uppercase">${inisial}</div>
                <div class="flex-1 overflow-hidden">
                    <h4 class="font-bold text-[16px] text-gray-700 truncate proper-case">${item.nama}</h4>
                    <p class="text-[11px] text-gray-400 font-bold tracking-tighter proper-case">${item.kategori}</p>
                </div>
                <div class="text-right"><p class="text-sm font-black text-emerald-600">${item.stok} <span class="uppercase text-[10px]">${item.satuan}</span></p></div>
            </div>`;
    });
};