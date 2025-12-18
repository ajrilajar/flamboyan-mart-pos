import { ref, onValue, push, set, update } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { db } from "./firebase-config.js";
import * as SetingInv from "./modul-pengaturan-inventaris.js";

let databaseBarang = {}, dataKategori = {}, dataSatuan = {};
let currentEditId = null, currentSetId = null;
const desktopWidth = "max-w-4xl";

export function renderInventaris() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div id="view-list" class="flex flex-col gap-3 ${desktopWidth} mx-auto p-3 animate-fadeIn">
            <div class="flex justify-between items-center px-1">
                <h2 class="text-xl font-bold text-gray-800">Inventaris</h2>
                <button onclick="window.switchView('view-pengaturan')" class="p-2 text-emerald-600"><i class="fa-solid fa-gear text-lg"></i></button>
            </div>
            <div id="list-barang" class="grid grid-cols-1 md:grid-cols-2 gap-2 pb-32"></div>
            <button onclick="window.bukaHalamanEdit(null)" class="fixed bottom-24 right-4 md:right-[calc(50%-20rem)] bg-emerald-500 text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-3 font-bold z-40 border-none outline-none active:scale-95 transition-all">
                <i class="fa-solid fa-box-open"></i> <span>Tambah Barang</span>
            </button>
        </div>

        <div id="view-edit" class="hidden fixed inset-0 bg-white z-[70] overflow-y-auto">
            <div class="${desktopWidth} mx-auto min-h-screen bg-white flex flex-col">
                <div class="flex items-center p-4 border-b sticky top-0 bg-white z-10">
                    <button onclick="window.batalEdit()" class="p-2 text-gray-600 mr-4"><i class="fa-solid fa-arrow-left text-xl"></i></button>
                    <h3 id="edit-title" class="font-bold text-lg text-gray-800">Tambah Barang</h3>
                </div>
                <div class="p-4 space-y-6 flex-1">
                    <div class="relative border-2 border-gray-100 rounded-xl focus-within:border-emerald-500 transition-all">
                        <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Barang</label>
                        <input type="text" id="edit-nama" placeholder="Nama Barang" class="w-full p-4 bg-transparent outline-none font-bold text-gray-700">
                    </div>

                    <div onclick="window.bukaPicker('kategori', false)" class="relative border-2 border-gray-100 rounded-xl p-4 flex justify-between items-center cursor-pointer">
                        <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kategori</label>
                        <input type="text" id="edit-kategori" placeholder="Kategori" class="font-bold text-gray-700 outline-none pointer-events-none" readonly>
                        <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="relative border-2 border-gray-100 rounded-xl">
                            <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stok Awal</label>
                            <input type="number" id="edit-stok" placeholder="Stok Awal" class="w-full p-4 bg-transparent outline-none font-bold text-gray-700 text-sm">
                        </div>
                        <div onclick="window.bukaPicker('satuan', false)" class="relative border-2 border-gray-100 rounded-xl p-4 flex justify-between items-center cursor-pointer">
                            <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Satuan</label>
                            <input type="text" id="edit-satuan" placeholder="Satuan" class="font-bold text-gray-700 outline-none pointer-events-none text-sm uppercase" readonly>
                            <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="relative border-2 border-gray-100 rounded-xl flex items-center px-3">
                            <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Harga Jual</label>
                            <span class="text-gray-400 font-bold mr-1">Rp</span>
                            <input type="number" id="edit-jual" placeholder="Harga Jual" class="w-full py-4 bg-transparent outline-none font-bold text-gray-700 text-sm">
                        </div>
                        <div class="relative border-2 border-gray-100 rounded-xl flex items-center px-3">
                            <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Harga Beli</label>
                            <span class="text-gray-400 font-bold mr-1">Rp</span>
                            <input type="number" id="edit-beli" placeholder="Harga Beli" class="w-full py-4 bg-transparent outline-none font-bold text-gray-700 text-sm">
                        </div>
                    </div>
                </div>
                <div class="p-4 bg-white border-t sticky bottom-0 z-20">
                    <button onclick="window.simpanBarang()" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all">Simpan</button>
                </div>
            </div>
        </div>

        <div id="modal-container" onclick="window.overlayClose(event)" class="hidden fixed inset-0 bg-black/60 z-[200] flex items-end justify-center transition-all overflow-hidden">
            <div class="bg-white w-full ${desktopWidth} rounded-t-[2.5rem] flex flex-col max-h-[85vh] animate-slide-up">
                <div onclick="window.tutupModal()" class="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-4 cursor-pointer"></div>
                <div id="modal-content" class="px-7 pb-8 pt-2 overflow-y-auto"></div>
            </div>
        </div>

        <div id="view-pengaturan" class="hidden fixed inset-0 bg-gray-50 z-[100] overflow-y-auto">
             <div class="${desktopWidth} mx-auto min-h-screen bg-gray-50 flex flex-col shadow-2xl border-x">
                <div class="flex items-center p-4 bg-white border-b sticky top-0 z-10">
                    <button onclick="window.switchView('view-list')" class="mr-4 p-2"><i class="fa-solid fa-arrow-left text-xl text-gray-600"></i></button>
                    <h3 class="font-bold text-lg text-gray-800">Pengaturan Inventaris</h3>
                </div>
                <div class="p-4 space-y-4">
                    <div onclick="window.bukaPicker('kategori', true)" class="bg-white p-5 rounded-2xl flex justify-between items-center shadow-sm cursor-pointer active:bg-gray-50 transition-all">
                        <div class="flex items-center gap-4"><i class="fa-solid fa-boxes-stacked text-emerald-500 text-xl"></i><span class="font-bold text-gray-700">Kelola Kategori</span></div>
                        <i class="fa-solid fa-chevron-right text-gray-300 text-sm"></i>
                    </div>
                    <div onclick="window.bukaPicker('satuan', true)" class="bg-white p-5 rounded-2xl flex justify-between items-center shadow-sm cursor-pointer active:bg-gray-50 transition-all">
                        <div class="flex items-center gap-4"><i class="fa-solid fa-scale-balanced text-emerald-500 text-xl"></i><span class="font-bold text-gray-700">Kelola Satuan Ukur</span></div>
                        <i class="fa-solid fa-chevron-right text-gray-300 text-sm"></i>
                    </div>
                </div>
            </div>
        </div>
    `;

    onValue(ref(db, 'products'), s => { databaseBarang = s.val() || {}; window.filterInventaris(); });
    onValue(ref(db, 'settings/categories'), s => { dataKategori = s.val() || {}; });
    onValue(ref(db, 'settings/units'), s => { dataSatuan = s.val() || {}; });
}

// LOGIKA UI COMPACT & PICKER
window.bukaPicker = (type, isSettingMode) => {
    document.getElementById('modal-container').classList.remove('hidden');
    const content = document.getElementById('modal-content');
    const data = type === 'kategori' ? dataKategori : dataSatuan;
    
    content.innerHTML = `
        <h3 class="font-bold text-xl text-gray-800 mb-5 tracking-tight">${isSettingMode ? 'Kelola' : 'Pilih'} ${type === 'kategori' ? 'Kategori' : 'Satuan'}</h3>
        <div class="space-y-1 mb-6">
            ${Object.entries(data).map(([id, item]) => `
                <div class="flex justify-between items-center py-4 border-b border-gray-50">
                    <div onclick="window.selectAndClose('${type}', '${type === 'satuan' ? item.pendek : item.nama}')" class="flex-1 font-bold text-gray-700">${item.nama} ${type === 'satuan' ? `<span class="text-gray-300 font-medium ml-2">${item.pendek}</span>` : ''}</div>
                    ${isSettingMode ? `
                        <div class="flex gap-4">
                            <button onclick="window.formEditSetting('${type}', '${id}')" class="text-gray-400"><i class="fa-solid fa-pen text-sm"></i></button>
                            <button onclick="window.hapusSetting('${type}', '${id}')" class="text-rose-300"><i class="fa-solid fa-trash-can text-sm"></i></button>
                        </div>
                    ` : `
                        <div onclick="window.selectAndClose('${type}', '${type === 'satuan' ? item.pendek : item.nama}')" class="w-5 h-5 rounded-full border-2 border-gray-200"></div>
                    `}
                </div>
            `).join('')}
        </div>
        <button onclick="window.formEditSetting('${type}', null)" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold active:scale-95 shadow-lg">+ Tambah ${type === 'kategori' ? 'Kategori' : 'Satuan'} Baru</button>
    `;
};

window.formEditSetting = (type, id) => {
    const item = id ? (type === 'kategori' ? dataKategori[id] : dataSatuan[id]) : { nama: "", pendek: "" };
    const content = document.getElementById('modal-content');
    content.innerHTML = `
        <div class="flex items-center mb-8">
            <button onclick="window.bukaPicker('${type}', true)" class="mr-4 text-gray-400"><i class="fa-solid fa-arrow-left text-lg"></i></button>
            <h3 class="font-bold text-xl text-gray-800">${id ? 'Ubah' : 'Buat'} ${type === 'kategori' ? 'Kategori' : 'Satuan'}</h3>
        </div>
        <div class="space-y-6">
            <div class="relative border-2 border-emerald-500 rounded-xl p-1">
                <label class="absolute -top-2.5 left-3 px-1 bg-white text-[11px] font-bold text-emerald-500">Nama ${type === 'kategori' ? 'Kategori' : 'Satuan'}</label>
                <input type="text" id="set-nama" value="${item.nama}" class="w-full p-4 bg-transparent outline-none font-bold text-gray-700" placeholder="${type === 'kategori' ? 'Sembako' : 'Kotak/Dus'}">
            </div>
            ${type === 'satuan' ? `
                <div class="relative border-2 border-gray-100 rounded-xl p-1">
                    <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase">Satuan Pendek</label>
                    <input type="text" id="set-pendek" value="${item.pendek}" class="w-full p-4 bg-transparent outline-none font-bold text-gray-700 uppercase" placeholder="KOTK">
                </div>
            ` : ''}
        </div>
        <button onclick="window.prosesSimpanSetting('${type}', '${id}')" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold mt-8 active:scale-95 shadow-lg">Simpan</button>
    `;
};

window.prosesSimpanSetting = async (type, id) => {
    const nama = document.getElementById('set-nama').value;
    const pendek = type === 'satuan' ? document.getElementById('set-pendek').value : null;
    type === 'kategori' ? await SetingInv.simpanKategori(nama, id) : await SetingInv.simpanSatuan(nama, pendek, id);
    window.bukaPicker(type, true);
};

window.hapusSetting = async (type, id) => {
    type === 'kategori' ? await SetingInv.hapusKategori(id) : await SetingInv.hapusSatuan(id);
    window.bukaPicker(type, true);
};

window.selectAndClose = (type, val) => {
    document.getElementById(`edit-${type}`).value = val;
    window.tutupModal();
};

window.filterInventaris = () => {
    const list = document.getElementById('list-barang');
    if(!list) return; list.innerHTML = "";
    Object.entries(databaseBarang).forEach(([id, item]) => {
        const inisial = item.nama.substring(0, 2).toUpperCase();
        list.innerHTML += `<div class="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3"><div class="w-10 h-10 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center font-bold text-xs">${inisial}</div><div class="flex-1"><h4 class="font-bold text-sm text-gray-700">${item.nama}</h4><p class="text-[9px] text-gray-400 font-bold uppercase">${item.kategori}</p></div><div class="text-right"><p class="text-xs font-black text-emerald-600">${item.stok} ${item.satuan}</p></div></div>`;
    });
};

window.bukaHalamanEdit = (id) => { currentEditId = id; window.switchView('view-edit'); };
window.batalEdit = () => window.switchView('view-list');
window.tutupModal = () => document.getElementById('modal-container').classList.add('hidden');
window.overlayClose = (e) => { if(e.target.id === 'modal-container') window.tutupModal(); };
window.switchView = (v) => { ['view-list','view-edit','view-pengaturan'].forEach(i => document.getElementById(i).classList.add('hidden')); document.getElementById(v).classList.remove('hidden'); };