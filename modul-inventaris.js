import { ref, onValue, push, set, remove, update } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { db } from "./firebase-config.js";
import * as SetingInv from "./modul-pengaturan-inventaris.js";

let databaseBarang = {}, dataKategori = {}, dataSatuan = {};
let currentEditId = null;
let multiUnits = []; 

const desktopWidth = "max-w-4xl";
const toProperCase = (str) => str ? str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) : "";

export function renderInventaris() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
        <style>
            .drag-handle { touch-action: none; -webkit-user-select: none; }
            .animate-slide-up { animation: slideUp 0.3s ease-out; }
            @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        </style>

        <div id="view-list" class="flex flex-col gap-2 ${desktopWidth} mx-auto p-3 sm:p-4 animate-fadeIn">
            <div class="flex justify-between items-center px-1 mb-2">
                <h2 class="text-2xl font-bold text-gray-800 uppercase tracking-tight">Inventaris</h2>
                <button onclick="window.switchView('view-pengaturan')" class="p-2 text-emerald-600 active:scale-90 transition-all">
                    <i class="fa-solid fa-gear text-xl"></i>
                </button>
            </div>
            <div id="list-barang" class="grid grid-cols-1 md:grid-cols-2 gap-3 pb-32"></div>
            
            <button onclick="window.bukaHalamanEdit(null)" class="fixed bottom-24 right-6 bg-emerald-500 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center font-bold z-40 border-none outline-none active:scale-95 transition-all">
                <i class="fa-solid fa-plus text-2xl"></i>
            </button>
        </div>

        <div id="view-edit" class="hidden fixed inset-0 bg-white z-[70] overflow-y-auto">
            <div class="${desktopWidth} mx-auto min-h-screen bg-white flex flex-col">
                <div class="flex items-center p-3 border-b sticky top-0 bg-white z-10">
                    <button onclick="window.batalEdit()" class="p-2 text-gray-600 mr-2"><i class="fa-solid fa-arrow-left text-xl"></i></button>
                    <h3 id="edit-title" class="font-bold text-lg text-gray-800 uppercase">Tambah Barang</h3>
                </div>
                
                <div class="p-4 space-y-5 flex-1">
                    <div class="relative border-2 border-gray-100 rounded-xl focus-within:border-emerald-500 transition-all">
                        <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Barang</label>
                        <input type="text" id="edit-nama" placeholder="Nama Barang" class="w-full p-3 bg-transparent outline-none font-bold text-gray-700">
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div onclick="window.bukaPickerKategori()" class="relative border-2 border-gray-100 rounded-xl p-3 flex justify-between items-center cursor-pointer">
                            <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kategori</label>
                            <input type="text" id="edit-kategori" placeholder="Pilih Kategori" class="font-bold text-gray-700 outline-none pointer-events-none uppercase text-sm" readonly>
                            <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                        </div>
                        <div onclick="window.bukaPilihSatuanPengukuran()" class="relative border-2 border-gray-100 rounded-xl p-3 flex justify-between items-center cursor-pointer">
                            <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Satuan</label>
                            <input type="text" id="edit-satuan-display" placeholder="Pilih Satuan" class="w-full font-bold text-gray-700 outline-none pointer-events-none uppercase text-sm truncate" readonly>
                            <i class="fa-solid fa-chevron-right text-gray-300 text-xs flex-shrink-0"></i>
                        </div>
                    </div>

                    <div id="info-konversi" class="hidden flex items-start gap-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                        <i class="fa-solid fa-link mt-0.5"></i><span id="text-konversi" class="uppercase"></span>
                    </div>

                    <div class="grid grid-cols-2 gap-5">
                        <div class="relative border-2 border-gray-100 rounded-xl">
                            <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stok Awal</label>
                            <input type="number" id="edit-stok" placeholder="0" class="w-full p-3 bg-transparent outline-none font-bold text-gray-700">
                        </div>
                        <div class="relative border-2 border-gray-100 rounded-xl flex items-center px-3">
                            <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Harga Jual</label>
                            <span class="text-gray-400 text-sm font-bold mr-1">Rp</span>
                            <input type="number" id="edit-jual" placeholder="0" class="w-full py-3 bg-transparent outline-none font-bold text-gray-700">
                        </div>
                    </div>
                </div>

                <div class="p-4 bg-white border-t sticky bottom-0 z-20">
                    <button onclick="window.simpanBarang()" class="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all">SIMPAN</button>
                </div>
            </div>
        </div>

        <div id="view-pengaturan" class="hidden fixed inset-0 bg-gray-50 z-[100] overflow-y-auto">
             <div class="${desktopWidth} mx-auto min-h-screen bg-gray-50 flex flex-col shadow-2xl border-x">
                <div class="flex items-center p-4 bg-white border-b sticky top-0 z-10">
                    <button onclick="window.switchView('view-list')" class="mr-4 p-2 active:bg-gray-100 rounded-full"><i class="fa-solid fa-arrow-left text-xl text-gray-600"></i></button>
                    <h3 class="font-bold text-lg text-gray-800 uppercase">Pengaturan Inventaris</h3>
                </div>
                <div class="p-4 space-y-3">
                    <div onclick="window.bukaKelolaSetting('kategori')" class="bg-white p-5 rounded-2xl flex justify-between items-center shadow-sm cursor-pointer border border-gray-100 active:bg-gray-50">
                        <div class="flex items-center gap-4"><i class="fa-solid fa-boxes-stacked text-emerald-500 text-xl"></i><span class="font-bold text-gray-700 uppercase text-sm">Kelola Kategori</span></div>
                        <i class="fa-solid fa-chevron-right text-gray-300"></i>
                    </div>
                    <div onclick="window.bukaKelolaSetting('satuan')" class="bg-white p-5 rounded-2xl flex justify-between items-center shadow-sm cursor-pointer border border-gray-100 active:bg-gray-50">
                        <div class="flex items-center gap-4"><i class="fa-solid fa-scale-balanced text-emerald-500 text-xl"></i><span class="font-bold text-gray-700 uppercase text-sm">Kelola Satuan</span></div>
                        <i class="fa-solid fa-chevron-right text-gray-300"></i>
                    </div>
                </div>
            </div>
        </div>

        <div id="view-multi-satuan" class="hidden fixed inset-0 bg-white z-[120] flex flex-col">
            <div class="${desktopWidth} mx-auto w-full h-full flex flex-col bg-white">
                <div class="flex items-center p-3 border-b">
                    <button onclick="window.tutupMultiSatuan()" class="mr-3 p-2 active:bg-gray-100 rounded-full"><i class="fa-solid fa-arrow-left text-xl text-gray-600"></i></button>
                    <h3 class="font-bold text-lg text-gray-800 uppercase">Satuan Pengukuran</h3>
                </div>
                <div class="p-4 space-y-6 flex-1 overflow-y-auto">
                    <div onclick="window.bukaPickerDasar('utama')" class="relative border-2 border-gray-200 rounded-2xl p-4 flex justify-between items-center cursor-pointer">
                        <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Satuan Utama</label>
                        <input type="text" id="val-satuan-utama" placeholder="PILIH SATUAN" class="font-bold text-gray-700 outline-none pointer-events-none uppercase" readonly>
                        <i class="fa-solid fa-chevron-right text-gray-300"></i>
                    </div>
                    <div id="dynamic-secondary-units" class="space-y-6"></div>
                    <button onclick="window.tambahSatuanSekunder()" class="text-emerald-600 font-bold text-xs flex items-center gap-2 py-2 uppercase tracking-widest">
                        <i class="fa-solid fa-circle-plus text-xl"></i> Tambah Satuan Lainnya
                    </button>
                </div>
                <div class="p-4 border-t grid grid-cols-2 gap-3 bg-gray-50">
                    <button onclick="window.tutupMultiSatuan()" class="py-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest bg-white border-2 rounded-2xl">Batal</button>
                    <button onclick="window.konfirmasiSatuan()" class="py-4 bg-emerald-500 text-white font-bold rounded-2xl active:scale-95 uppercase">Simpan</button>
                </div>
            </div>
        </div>

        <div id="modal-container" onclick="window.overlayClose(event)" class="hidden fixed inset-0 bg-black/60 z-[200] flex items-end justify-center transition-all overflow-hidden">
            <div id="modal-panel" class="bg-white w-full ${desktopWidth} rounded-t-[2.5rem] flex flex-col h-[85vh] animate-slide-up shadow-2xl">
                <div class="drag-handle w-full py-4 cursor-pointer" onclick="window.tutupModal()">
                    <div class="w-12 h-1.5 bg-gray-200 rounded-full mx-auto"></div>
                </div>
                <div id="modal-content" class="px-6 pb-12 overflow-y-auto flex-1"></div>
            </div>
        </div>
    `;

    loadFirebaseData();
}

// LOGIKA NAVIGASI
window.switchView = (v) => {
    ['view-list','view-edit','view-pengaturan','view-multi-satuan'].forEach(id => {
        const el = document.getElementById(id); if(el) el.classList.add('hidden');
    });
    document.getElementById(v).classList.remove('hidden');
    window.scrollTo(0,0);
};

// LOGIKA DATABASE & PICKER
function loadFirebaseData() {
    onValue(ref(db, 'products'), s => { databaseBarang = s.val() || {}; window.filterInventaris(); });
    onValue(ref(db, 'settings/categories'), s => { dataKategori = s.val() || {}; });
    onValue(ref(db, 'settings/units'), s => { dataSatuan = s.val() || {}; });
}

window.bukaPickerKategori = () => {
    document.getElementById('modal-container').classList.remove('hidden');
    renderListPicker('kategori');
};

function renderListPicker(type, mode = null, index = null) {
    const content = document.getElementById('modal-content');
    const data = type === 'kategori' ? dataKategori : dataSatuan;
    const title = type === 'kategori' ? 'Pilih Kategori' : 'Pilih Satuan Dasar';

    content.innerHTML = `
        <h3 class="font-bold text-xl text-gray-800 mb-6 uppercase tracking-tight">${title}</h3>
        <div class="space-y-1 mb-8 divide-y divide-gray-50">
            ${Object.entries(data).map(([id, item]) => `
                <div onclick="window.selectAndClose('${type}', '${type === 'satuan' ? item.pendek : item.nama}', '${mode}', ${index})" class="py-4.5 flex justify-between items-center cursor-pointer active:bg-gray-50 transition-all">
                    <span class="font-bold text-gray-700 uppercase text-sm">${item.nama} ${item.pendek && type !== 'satuan' ? `<span class="text-gray-300 ml-2 font-medium">${item.pendek}</span>` : ''}</span>
                    <i class="fa-solid fa-chevron-right text-gray-200 text-xs"></i>
                </div>
            `).join('')}
        </div>
        <button onclick="window.renderFormTambahBaru('${type}', '${mode}', ${index})" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest">+ Tambah Baru</button>
    `;
}

window.selectAndClose = (type, val, mode, index) => {
    if (type === 'kategori') {
        document.getElementById('edit-kategori').value = toProperCase(val);
    } else {
        if (mode === 'utama') document.getElementById('val-satuan-utama').value = val.toUpperCase();
        else multiUnits[index].unit = val.toUpperCase();
        renderKonversiList();
    }
    window.tutupModal();
};

// MULTI SATUAN LOGIC
window.konfirmasiSatuan = () => {
    const utama = document.getElementById('val-satuan-utama').value;
    if (!utama) return alert("PILIH SATUAN UTAMA!");
    
    let display = utama;
    let chainInfo = `1 ${utama}`;
    multiUnits.forEach(m => {
        if (m.unit && m.ratio) {
            display += ` & ${m.unit}`; 
            chainInfo += ` → ${m.ratio} ${m.unit}`; //
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

// FIX PENGATURAN
window.bukaKelolaSetting = (type) => {
    document.getElementById('modal-container').classList.remove('hidden');
    const content = document.getElementById('modal-content');
    const data = type === 'kategori' ? dataKategori : dataSatuan;
    
    content.innerHTML = `
        <h3 class="font-bold text-xl text-gray-800 mb-6 uppercase tracking-tight">Kelola ${type}</h3>
        <div class="space-y-1 mb-8 divide-y divide-gray-50">
            ${Object.entries(data).map(([id, item]) => `
                <div class="flex justify-between items-center py-4.5">
                    <span class="font-bold text-gray-700 uppercase text-sm">${item.nama} ${item.pendek ? `<span class="text-gray-300 ml-2 font-medium">${item.pendek}</span>` : ''}</span>
                    <div class="flex gap-5">
                        <button onclick="window.renderFormTambahBaru('${type}', null, null, '${id}')" class="text-gray-300 active:text-emerald-500"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="window.hapusSettingData('${type}', '${id}')" class="text-rose-200 active:text-rose-500"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
            `).join('')}
        </div>
        <button onclick="window.renderFormTambahBaru('${type}')" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest">+ Tambah Baru</button>
    `;
};

// FORM TAMBAH BARU (MODAL)
window.renderFormTambahBaru = (type, mode, index, id = null) => {
    const content = document.getElementById('modal-content');
    const item = id ? (type === 'kategori' ? dataKategori[id] : dataSatuan[id]) : { nama: "", pendek: "" };
    
    content.innerHTML = `
        <div class="flex items-center mb-8">
            <button onclick="window.tutupModal()" class="mr-4 text-gray-400 p-2"><i class="fa-solid fa-arrow-left text-lg"></i></button>
            <h3 class="font-bold text-lg text-gray-800 uppercase">${id ? 'Ubah' : 'Buat'} ${type} Baru</h3>
        </div>
        <div class="space-y-6">
            <div class="relative border-2 border-emerald-500 rounded-xl p-1">
                <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Nama ${type}</label>
                <input type="text" id="new-name" value="${item.nama}" class="w-full p-3 bg-transparent outline-none font-bold text-gray-700 uppercase" placeholder="Masukkan Nama">
            </div>
            ${type === 'satuan' ? `
                <div class="relative border border-gray-200 rounded-xl p-1 bg-gray-50">
                    <label class="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 uppercase">Satuan Pendek (Max 5)</label>
                    <input type="text" id="new-short" value="${item.pendek}" maxlength="5" class="w-full p-3 bg-transparent outline-none font-bold text-gray-700 uppercase">
                </div>
            ` : ''}
        </div>
        <button onclick="window.prosesSimpanData('${type}', '${id}', '${mode}', ${index})" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold mt-8 shadow-lg uppercase text-xs">Simpan & Pilih</button>
    `;
};

window.prosesSimpanData = async (type, id, mode, index) => {
    const nama = document.getElementById('new-name').value.trim();
    if (!nama) return;
    const pndk = document.getElementById('new-short')?.value;

    if (type === 'kategori') {
        await SetingInv.simpanKategori(nama, id);
        if(!id) window.selectAndClose('kategori', nama);
    } else {
        await SetingInv.simpanSatuanDasar(nama, pndk, id);
        if(!id) window.selectAndClose('satuan', pndk, mode, index);
    }
    if(id) window.bukaKelolaSetting(type);
};

// UTILITY
window.filterInventaris = () => {
    const list = document.getElementById('list-barang');
    if(!list) return; list.innerHTML = "";
    Object.entries(databaseBarang).forEach(([id, item]) => {
        const inisial = item.nama.substring(0, 2).toUpperCase();
        list.innerHTML += `<div class="bg-white p-3.5 rounded-2xl border border-gray-100 flex items-center gap-4 active:scale-95 transition-all cursor-pointer shadow-sm"><div class="w-12 h-12 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center font-bold text-sm">${inisial}</div><div class="flex-1 overflow-hidden"><h4 class="font-bold text-gray-800 truncate uppercase text-sm">${item.nama}</h4><p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">${item.kategori}</p></div><div class="text-right"><p class="text-xs font-black text-emerald-600">${item.stok} <span class="text-[9px] uppercase">${item.satuan}</span></p></div></div>`;
    });
};

function renderKonversiList() {
    const container = document.getElementById('dynamic-secondary-units');
    const utama = document.getElementById('val-satuan-utama').value || 'UTAMA';
    container.innerHTML = multiUnits.map((item, idx) => `
        <div class="space-y-4 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 relative">
            <button onclick="window.hapusRowKonversi(${idx})" class="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg border-2 border-white"><i class="fa-solid fa-xmark"></i></button>
            <div onclick="window.bukaPickerDasar('sekunder', ${idx})" class="relative border-2 border-gray-200 rounded-xl p-3 flex justify-between items-center cursor-pointer bg-white">
                <label class="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-bold text-gray-400 uppercase tracking-widest">Satuan Ke-${idx + 2}</label>
                <input type="text" value="${item.unit}" placeholder="PILIH SATUAN" class="font-bold text-gray-700 outline-none pointer-events-none uppercase text-xs" readonly>
                <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
            </div>
            <div class="relative border-2 border-gray-200 rounded-xl p-0.5 bg-white">
                <label class="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-bold text-gray-400 uppercase tracking-widest">1 ${utama} = ...</label>
                <input type="number" oninput="window.updateRatio(${idx}, this.value)" value="${item.ratio}" class="w-full p-2.5 outline-none font-bold text-gray-700 text-sm" placeholder="ANGKA">
            </div>
        </div>
    `).join('');
}

window.bukaHalamanEdit = (id) => { currentEditId = id; multiUnits = []; window.switchView('view-edit'); };
window.batalEdit = () => window.switchView('view-list');
window.tutupModal = () => document.getElementById('modal-container').classList.add('hidden');
window.overlayClose = (e) => { if (e.target.id === 'modal-container') window.tutupModal(); };
window.tutupMultiSatuan = () => window.switchView('view-edit');
window.bukaPilihSatuanPengukuran = () => window.switchView('view-multi-satuan');
window.tambahSatuanSekunder = () => { multiUnits.push({ unit: '', ratio: '' }); renderKonversiList(); };
window.hapusRowKonversi = (idx) => { multiUnits.splice(idx, 1); renderKonversiList(); };
window.updateRatio = (idx, val) => multiUnits[idx].ratio = val;
window.hapusSettingData = async (type, id) => { if(confirm('HAPUS DATA INI?')) { const path = `settings/${type === 'kategori' ? 'categories' : 'units'}`; await remove(ref(db, `${path}/${id}`)); window.bukaKelolaSetting(type); } };