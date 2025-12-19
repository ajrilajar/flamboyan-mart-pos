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
                    <div onclick="window.bukaPickerSelection('kategori', 'view-edit')" class="relative border border-gray-200 rounded-xl flex justify-between items-center cursor-pointer std-input px-4">
                        <label class="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 proper-case tracking-widest">Kategori</label>
                        <input type="text" id="edit-kategori" class="font-bold text-gray-700 pointer-events-none text-xs proper-case" readonly>
                        <i class="fa-solid fa-chevron-right text-gray-300 text-[10px]"></i>
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
                        <div class="flex items-center gap-4"><i class="fa-solid fa-scale-balanced text-emerald-500"></i><span class="font-bold text-gray-700 proper-case text-sm">Kelola Satuan</span></div>
                        <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                    </div>
                </div>
            </div>
        </div>

        <div id="view-picker" class="hidden picker-container ${desktopWidth} mx-auto border-x shadow-2xl">
            <div class="w-full h-full flex flex-col bg-white">
                <div id="picker-drag-handle" class="w-full py-4 cursor-grab flex-shrink-0 touch-none"><div class="w-12 h-1.5 bg-gray-200 rounded-full mx-auto"></div></div>
                <div class="px-6 mb-4 flex justify-between items-center"><h3 id="picker-title" class="font-bold text-lg text-gray-800 proper-case">Pilih Kategori</h3></div>
                <div class="px-6 mb-4 flex-shrink-0"><div class="relative border border-gray-100 bg-gray-50 rounded-xl std-input px-4 flex items-center gap-3"><i class="fa-solid fa-magnifying-glass text-gray-300 text-sm"></i><input type="text" id="picker-search" oninput="window.filterPickerList(this.value)" class="w-full h-full bg-transparent outline-none font-medium text-gray-600 text-sm"></div></div>
                <div id="picker-list" class="flex-1 overflow-y-auto px-6 space-y-2 pb-24 no-scrollbar"></div>
                <div class="p-4 bg-white border-t sticky bottom-0 z-20 mt-auto flex-shrink-0"><button id="picker-btn-add" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><i class="fa-solid fa-plus"></i> <span id="picker-btn-text">Tambah Kategori Baru</span></button></div>
            </div>
        </div>

        <div id="view-form-baru" class="hidden fixed inset-0 bg-black/60 z-[200] flex items-end justify-center overflow-hidden">
            <div class="bg-white w-full ${desktopWidth} rounded-t-[2rem] animate-slide-up relative flex flex-col max-h-[85vh]">
                <div class="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-4"></div>
                <div id="form-baru-content" class="flex flex-col p-6 pb-10"></div>
            </div>
        </div>
    `;
    initPickerDrag();
    loadFirebaseData();
}

window.bukaPickerSelection = (type, origin, mode = null, index = null) => {
    lastOrigin = origin;
    pickerTargetIndex = { mode, index };
    const p = document.getElementById('view-picker');
    document.getElementById('picker-title').innerText = type === 'kategori' ? 'Pilih Kategori Barang' : 'Pilih Satuan Dasar';
    document.getElementById('picker-btn-text').innerText = type === 'kategori' ? 'Tambah Kategori Baru' : 'Tambah Satuan Baru';
    document.getElementById('picker-btn-add').onclick = () => window.renderFormTambahBaru(type, mode, index, '');
    renderPickerList(type);
    p.classList.remove('hidden');
    p.style.transform = 'translateY(100%)';
    setTimeout(() => p.style.transform = 'translateY(0)', 10);
};

function renderPickerList(type, filter = "") {
    const list = document.getElementById('picker-list'), data = type === 'kategori' ? dataKategori : dataSatuan, isManage = lastOrigin === 'view-pengaturan';
    list.innerHTML = Object.entries(data).filter(([id, item]) => item.nama.toLowerCase().includes(filter.toLowerCase())).map(([id, item]) => {
        const val = type === 'satuan' ? item.pendek : item.nama;
        return `<div class="py-4 flex justify-between items-center border-b border-gray-50 active:bg-gray-50 cursor-pointer"><div class="flex-1" onclick="window.selectAndClose('${type}', '${val}')"><span class="font-bold text-gray-700 text-sm proper-case">${item.nama} ${item.pendek ? `<span class="text-gray-300 ml-2 font-medium uppercase">${item.pendek}</span>` : ''}</span></div>${isManage ? `<div class="flex gap-4"><button onclick="window.renderFormTambahBaru('${type}', null, null, '${id}')" class="text-gray-300"><i class="fa-solid fa-pen text-sm"></i></button><button onclick="window.hapusSettingData('${type}', '${id}')" class="text-rose-200"><i class="fa-solid fa-trash-can text-sm"></i></button></div>` : `<div class="radio-custom" onclick="window.selectAndClose('${type}', '${val}')"></div>`}</div>`;
    }).join('');
}

window.renderFormTambahBaru = (type, mode, index, id = "") => {
    const v = document.getElementById('view-form-baru'), c = document.getElementById('form-baru-content'), safeId = (id === "null" || id === "") ? "" : id, item = safeId ? (type === 'kategori' ? dataKategori[safeId] : dataSatuan[safeId]) : { nama: "", pendek: "" };
    c.innerHTML = `<h3 class="font-bold text-lg text-gray-800 proper-case mb-6">${safeId ? 'Ubah' : 'Buat'} ${type} Baru</h3><div class="space-y-6"><div class="relative border-2 border-emerald-500 rounded-xl std-input"><label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-emerald-500 proper-case">Nama ${type}</label><input type="text" id="new-name" value="${item.nama}" class="w-full h-full px-4 bg-transparent outline-none font-bold text-gray-700 proper-case"></div>${type === 'satuan' ? `<div class="relative border border-gray-200 rounded-xl bg-gray-50 std-input"><label class="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 proper-case tracking-widest">Satuan Pendek</label><input type="text" id="new-short" value="${item.pendek}" maxlength="5" class="w-full h-full px-4 bg-transparent outline-none font-bold text-gray-700 uppercase"></div>` : ''}</div><div class="grid grid-cols-2 gap-3 mt-8"><button onclick="document.getElementById('view-form-baru').classList.add('hidden')" class="py-4 font-bold text-gray-400 uppercase text-xs tracking-widest bg-gray-50 rounded-xl">Batal</button><button onclick="window.prosesSimpanData('${type}', '${safeId}', '${mode}', ${index})" class="py-4 bg-emerald-500 text-white rounded-xl font-bold shadow-lg uppercase text-xs tracking-widest">Simpan</button></div>`;
    v.classList.remove('hidden');
};

window.prosesSimpanData = async (type, id, mode, index) => {
    const nama = document.getElementById('new-name').value.trim(); if (!nama) return;
    if (type === 'kategori') await SetingInv.simpanKategori(nama, id || null);
    else await SetingInv.simpanSatuanDasar(nama, document.getElementById('new-short').value, id || null);
    document.getElementById('view-form-baru').classList.add('hidden'); renderPickerList(type);
};

function initPickerDrag() {
    const p = document.getElementById('view-picker'), h = document.getElementById('picker-drag-handle'), c = document.getElementById('picker-list');
    let sY = 0, cY = 0;
    const start = (e) => { if (c.scrollTop > 0) return; sY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY; p.style.transition = 'none'; };
    const move = (e) => { if (!sY) return; cY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY; const dY = cY - sY; if (dY > 0) { e.preventDefault(); p.style.transform = `translateY(${dY}px)`; } else { sY = 0; p.style.transform = `translateY(0)`; } };
    const end = () => { if (!sY) return; const dY = cY - sY; p.style.transition = 'transform 0.2s ease-out'; if (dY > 150) window.tutupPicker(); else p.style.transform = `translateY(0)`; sY = 0; };
    h.addEventListener('touchstart', start, { passive: false });
    h.addEventListener('touchmove', move, { passive: false });
    h.addEventListener('touchend', end);
}

window.tutupPicker = () => { const p = document.getElementById('view-picker'); p.style.transform = 'translateY(100%)'; setTimeout(() => p.classList.add('hidden'), 250); };
window.selectAndClose = (type, val) => { if (lastOrigin === 'view-edit' && type === 'kategori') document.getElementById('edit-kategori').value = val; window.tutupPicker(); };
window.switchView = (v) => { document.querySelectorAll('[id^="view-"]').forEach(el => el.classList.add('hidden')); document.getElementById(v).classList.remove('hidden'); };
window.bukaHalamanEdit = (id) => { currentEditId = id; window.switchView('view-edit'); };
window.batalEdit = () => window.switchView('view-list');
window.loadFirebaseData = () => { onValue(ref(db, 'products'), s => { databaseBarang = s.val() || {}; window.filterInventaris(); }); onValue(ref(db, 'settings/categories'), s => { dataKategori = s.val() || {}; }); onValue(ref(db, 'settings/units'), s => { dataSatuan = s.val() || {}; }); };
window.filterInventaris = () => {
    const list = document.getElementById('list-barang'); if(!list) return; list.innerHTML = "";
    Object.entries(databaseBarang).forEach(([id, item]) => {
        const inisial = item.nama.substring(0, 2).toUpperCase();
        list.innerHTML += `<div class="bg-white p-5 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm active:bg-gray-50 transition-all"><div class="w-12 h-12 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center font-bold text-xs uppercase">${inisial}</div><div class="flex-1 overflow-hidden"><h4 class="font-bold text-[16px] text-gray-700 truncate proper-case">${item.nama}</h4><p class="text-[11px] text-gray-400 font-bold tracking-tighter proper-case">${item.kategori}</p></div><div class="text-right"><p class="text-sm font-black text-emerald-600">${item.stok} <span class="uppercase text-[10px]">${item.satuan}</span></p></div></div>`;
    });
};
window.hapusSettingData = async (type, id) => { type === 'kategori' ? await SetingInv.hapusKategori(id) : await SetingInv.hapusSatuanDasar(id); renderPickerList(type); };