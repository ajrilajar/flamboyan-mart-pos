import { ref, onValue, push, set, remove, update } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { db } from "./firebase-config.js";

let databaseBarang = {}, dataKategori = {}, dataSatuan = {};
let currentEditId = null, currentSetId = null;
let multiUnits = []; //

const desktopWidth = "max-w-4xl";

export function renderInventaris() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div id="view-list" class="flex flex-col gap-2 ${desktopWidth} mx-auto p-2 sm:p-4 animate-fadeIn">
            <div class="flex justify-between items-center px-1">
                <h2 class="text-xl font-bold text-gray-800 tracking-tight">Inventaris</h2>
                <button onclick="window.switchView('view-pengaturan')" class="p-2 text-emerald-600 active:scale-90 transition-all">
                    <i class="fa-solid fa-gear text-lg"></i>
                </button>
            </div>
            <div id="list-barang" class="grid grid-cols-1 md:grid-cols-2 gap-2 pb-32"></div>
            <button onclick="window.bukaHalamanEdit(null)" class="fixed bottom-24 right-4 md:right-[calc(50%-20rem)] bg-emerald-500 text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-3 font-bold z-40 active:scale-95 border-none">
                <i class="fa-solid fa-box-open text-lg"></i> <span>Tambah Barang</span>
            </button>
        </div>

        <div id="view-edit" class="hidden fixed inset-0 bg-white z-[70] overflow-y-auto">
            <div class="${desktopWidth} mx-auto min-h-screen bg-white flex flex-col shadow-xl">
                <div class="flex items-center p-3 border-b sticky top-0 bg-white z-10">
                    <button onclick="window.batalEdit()" class="p-2 text-gray-600 mr-2"><i class="fa-solid fa-arrow-left text-xl"></i></button>
                    <h3 id="edit-title" class="font-bold text-lg text-gray-800">Tambah Barang</h3>
                </div>
                
                <div class="p-3 space-y-4 flex-1">
                    <div class="relative border border-gray-200 rounded-lg focus-within:border-emerald-500 transition-all">
                        <label class="absolute -top-2 left-2 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Barang</label>
                        <input type="text" id="edit-nama" placeholder="Nama Barang" class="w-full p-2.5 bg-transparent outline-none font-bold text-gray-700">
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div onclick="window.bukaPickerKategori()" class="relative border border-gray-200 rounded-lg p-2.5 flex justify-between items-center cursor-pointer">
                            <label class="absolute -top-2 left-2 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kategori</label>
                            <input type="text" id="edit-kategori" placeholder="Kategori" class="font-bold text-gray-700 outline-none pointer-events-none text-sm" readonly>
                            <i class="fa-solid fa-chevron-right text-gray-300 text-[10px]"></i>
                        </div>
                        <div onclick="window.bukaPilihSatuanPengukuran()" class="relative border border-gray-200 rounded-lg p-2.5 flex justify-between items-center cursor-pointer">
                            <label class="absolute -top-2 left-2 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Satuan</label>
                            <input type="text" id="edit-satuan-display" placeholder="Satuan" class="font-bold text-gray-700 outline-none pointer-events-none text-sm uppercase truncate" readonly>
                            <i class="fa-solid fa-chevron-right text-gray-300 text-[10px]"></i>
                        </div>
                    </div>

                    <div id="info-konversi" class="hidden flex items-center gap-2 text-[11px] text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                        <i class="fa-solid fa-circle-info"></i><span id="text-konversi"></span>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="relative border border-gray-200 rounded-lg">
                            <label class="absolute -top-2 left-2 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stok Awal</label>
                            <input type="number" id="edit-stok" placeholder="Stok Awal" class="w-full p-2.5 bg-transparent outline-none font-bold text-gray-700 text-sm">
                        </div>
                        <div class="relative border border-gray-200 rounded-lg flex items-center px-2">
                            <label class="absolute -top-2 left-2 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Harga Jual</label>
                            <span class="text-gray-400 text-xs font-bold mr-1">Rp</span>
                            <input type="number" id="edit-jual" placeholder="Harga Jual" class="w-full py-2.5 bg-transparent outline-none font-bold text-gray-700 text-sm">
                        </div>
                    </div>
                </div>

                <div class="p-3 bg-white border-t sticky bottom-0 z-20">
                    <button onclick="window.simpanBarang()" class="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-lg active:scale-95 transition-all">Simpan</button>
                </div>
            </div>
        </div>

        <div id="view-multi-satuan" class="hidden fixed inset-0 bg-white z-[120] flex flex-col">
            <div class="${desktopWidth} mx-auto w-full h-full flex flex-col bg-white">
                <div class="flex items-center p-3 border-b">
                    <button onclick="window.tutupMultiSatuan()" class="mr-3 p-2"><i class="fa-solid fa-arrow-left text-xl text-gray-600"></i></button>
                    <h3 class="font-bold text-lg text-gray-800">Pilih Satuan Pengukuran</h3>
                </div>
                <div class="p-4 space-y-6 flex-1 overflow-y-auto">
                    <div onclick="window.bukaPickerDasar('utama')" class="relative border border-gray-200 rounded-xl p-3 flex justify-between items-center cursor-pointer">
                        <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Satuan Utama</label>
                        <input type="text" id="val-satuan-utama" placeholder="Satuan Utama" class="font-bold text-gray-700 outline-none pointer-events-none" readonly>
                        <i class="fa-solid fa-chevron-right text-gray-300"></i>
                    </div>
                    <div id="dynamic-secondary-units" class="space-y-6"></div>
                    <button onclick="window.tambahSatuanSekunder()" class="text-emerald-600 font-bold text-xs flex items-center gap-2 py-2">
                        <i class="fa-solid fa-circle-plus text-lg"></i> Tambah Satuan Lainnya
                    </button>
                </div>
                <div class="p-3 border-t grid grid-cols-2 gap-2 bg-gray-50">
                    <button onclick="window.tutupMultiSatuan()" class="py-3 font-bold text-gray-400 text-xs border rounded-xl bg-white uppercase tracking-widest">Batal</button>
                    <button onclick="window.konfirmasiSatuan()" class="py-3 bg-emerald-500 text-white font-bold rounded-xl active:scale-95 transition-all">Simpan</button>
                </div>
            </div>
        </div>

        <div id="modal-container" onclick="window.overlayClose(event)" class="hidden fixed inset-0 bg-black/60 z-[200] flex items-end justify-center transition-all overflow-hidden">
            <div id="modal-panel" class="bg-white w-full ${desktopWidth} rounded-t-[2rem] flex flex-col max-h-[85vh] animate-slide-up shadow-2xl">
                <div onclick="window.tutupModal()" class="w-10 h-1 bg-gray-200 rounded-full mx-auto my-3 cursor-pointer"></div>
                <div id="modal-content" class="px-6 pb-8 overflow-y-auto flex flex-col h-full"></div>
            </div>
        </div>

        <div id="view-pengaturan" class="hidden fixed inset-0 bg-gray-50 z-[100] overflow-y-auto">...</div>
    `;

    loadFirebaseData();
}

// LOGIKA PICKER & TAMBAH BARU (SESUAI GAMBAR 5 & 6)
window.bukaPickerKategori = () => {
    document.getElementById('modal-container').classList.remove('hidden');
    renderListPicker('kategori');
};

window.bukaPickerDasar = (mode, index = null) => {
    document.getElementById('modal-container').classList.remove('hidden');
    renderListPicker('satuan', mode, index);
};

function renderListPicker(type, mode = null, index = null) {
    const content = document.getElementById('modal-content');
    const data = type === 'kategori' ? dataKategori : dataSatuan;
    const title = type === 'kategori' ? 'Pilih Kategori Barang' : 'Pilih Satuan Dasar';

    content.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-lg text-gray-800 tracking-tight">${title}</h3>
            <button onclick="window.tutupModal()" class="text-gray-400"><i class="fa-solid fa-xmark text-xl"></i></button>
        </div>
        <div class="space-y-1 overflow-y-auto flex-1 custom-scroll">
            ${Object.entries(data).map(([id, item]) => `
                <div onclick="window.selectFix('${type}', '${type === 'satuan' ? item.pendek : item.nama}', '${mode}', ${index})" class="flex justify-between items-center py-4 border-b border-gray-50 cursor-pointer active:bg-gray-50 transition-all">
                    <span class="font-bold text-gray-700">${item.nama} ${type === 'satuan' ? `<span class="text-gray-300 text-xs ml-2 font-medium">${item.pendek}</span>` : ''}</span>
                    <i class="fa-solid fa-chevron-right text-gray-200 text-xs"></i>
                </div>
            `).join('')}
        </div>
        <div class="mt-6 pt-4 border-t">
            <button onclick="window.renderFormTambahBaru('${type}', '${mode}', ${index})" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all tracking-wide">
                <i class="fa-solid fa-plus mr-2"></i> Tambah ${type === 'kategori' ? 'Kategori' : 'Satuan'} Baru
            </button>
        </div>
    `;
}

// FORM TAMBAH BARU (GAMBAR 6, 12, 14)
window.renderFormTambahBaru = (type, mode, index) => {
    const content = document.getElementById('modal-content');
    content.innerHTML = `
        <div class="flex items-center mb-8">
            <button onclick="window.renderListPicker('${type}', '${mode}', ${index})" class="mr-4 text-gray-400 p-2"><i class="fa-solid fa-arrow-left text-lg"></i></button>
            <h3 class="font-bold text-xl text-gray-800">Buat ${type === 'kategori' ? 'Kategori' : 'Satuan'} Baru</h3>
        </div>
        <div class="space-y-6">
            <div class="relative border-2 border-emerald-500 rounded-xl p-1">
                <label class="absolute -top-2.5 left-3 px-1 bg-white text-[11px] font-bold text-emerald-500 tracking-widest uppercase">Nama ${type === 'kategori' ? 'Kategori' : 'Satuan'}</label>
                <input type="text" id="new-name" class="w-full p-4 bg-transparent outline-none font-bold text-gray-700" placeholder="Contoh: ${type === 'kategori' ? 'Rokok' : 'Kotak/Dus'}">
            </div>
            ${type === 'satuan' ? `
                <div class="relative border border-gray-200 rounded-xl p-1 bg-gray-50">
                    <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Satuan Pendek (Maks 5 Huruf)</label>
                    <input type="text" id="new-short" maxlength="5" class="w-full p-4 bg-transparent outline-none font-bold text-gray-700 uppercase" placeholder="KOTK">
                </div>
            ` : ''}
        </div>
        <button onclick="window.prosesSimpanBaru('${type}', '${mode}', ${index})" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold mt-10 active:scale-95 shadow-lg uppercase tracking-widest">Simpan & Pilih</button>
    `;
};

window.prosesSimpanBaru = async (type, mode, index) => {
    const nama = document.getElementById('new-name').value.trim();
    if (!nama) return;
    
    let valueToSet = nama;
    if (type === 'kategori') {
        await push(ref(db, 'settings/categories'), { nama });
    } else {
        const pendek = document.getElementById('new-short').value.substring(0, 5).toUpperCase();
        await push(ref(db, 'settings/units'), { nama, pendek });
        valueToSet = pendek;
    }
    
    window.selectFix(type, valueToSet, mode, index);
};

// LOGIKA PENETAPAN NILAI
window.selectFix = (type, val, mode, index) => {
    if (type === 'kategori') {
        document.getElementById('edit-kategori').value = val;
    } else {
        if (mode === 'utama') document.getElementById('val-satuan-utama').value = val;
        else multiUnits[index].unit = val;
        renderKonversiList();
    }
    window.tutupModal();
};

window.konfirmasiSatuan = () => {
    const utama = document.getElementById('val-satuan-utama').value;
    if (!utama) return alert("Pilih Satuan Utama!");
    
    let display = utama;
    let info = "";
    multiUnits.forEach(m => {
        if (m.unit && m.ratio) {
            display += ` & ${m.unit}`; //
            info += `1 ${utama} = ${m.ratio} ${m.unit} • `;
        }
    });
    
    document.getElementById('edit-satuan-display').value = display;
    const infoDiv = document.getElementById('info-konversi');
    if (info) {
        infoDiv.classList.remove('hidden');
        document.getElementById('text-konversi').innerText = info.slice(0, -3);
    } else {
        infoDiv.classList.add('hidden');
    }
    window.switchView('view-edit');
};

// UTILITY
window.loadFirebaseData = () => {
    onValue(ref(db, 'products'), s => { databaseBarang = s.val() || {}; window.filterInventaris(); });
    onValue(ref(db, 'settings/categories'), s => { dataKategori = s.val() || {}; });
    onValue(ref(db, 'settings/units'), s => { dataSatuan = s.val() || {}; });
};

window.switchView = (v) => {
    document.querySelectorAll('[id^="view-"]').forEach(el => el.classList.add('hidden'));
    document.getElementById(v).classList.remove('hidden');
    window.scrollTo(0,0);
};

window.tutupModal = () => document.getElementById('modal-container').classList.add('hidden');
window.overlayClose = (e) => { if (e.target.id === 'modal-container') window.tutupModal(); };
window.tutupMultiSatuan = () => window.switchView('view-edit');
window.bukaPilihSatuanPengukuran = () => window.switchView('view-multi-satuan');
window.tambahSatuanSekunder = () => { multiUnits.push({ unit: '', ratio: '' }); renderKonversiList(); };
window.hapusRowKonversi = (idx) => { multiUnits.splice(idx, 1); renderKonversiList(); };
window.updateRatio = (idx, val) => multiUnits[idx].ratio = val;

window.filterInventaris = () => {
    const list = document.getElementById('list-barang');
    if(!list) return; list.innerHTML = "";
    Object.entries(databaseBarang).forEach(([id, item]) => {
        const inisial = item.nama.substring(0, 2).toUpperCase();
        list.innerHTML += `<div class="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3"><div class="w-10 h-10 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center font-bold text-xs">${inisial}</div><div class="flex-1 overflow-hidden"><h4 class="font-bold text-sm text-gray-700 truncate">${item.nama}</h4><p class="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">${item.kategori}</p></div><div class="text-right"><p class="text-xs font-black text-emerald-600">${item.stok} ${item.satuan}</p></div></div>`;
    });
};

function renderKonversiList() {
    const container = document.getElementById('dynamic-secondary-units');
    container.innerHTML = multiUnits.map((item, idx) => `
        <div class="space-y-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 relative animate-fadeIn">
            <button onclick="window.hapusRowKonversi(${idx})" class="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-md border-2 border-white"><i class="fa-solid fa-xmark"></i></button>
            <div onclick="window.bukaPickerDasar('sekunder', ${idx})" class="relative border border-gray-200 rounded-xl p-3 flex justify-between items-center cursor-pointer bg-white">
                <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Satuan Ke-${idx + 2}</label>
                <input type="text" value="${item.unit}" placeholder="Pilih Satuan" class="font-bold text-gray-700 outline-none pointer-events-none" readonly>
                <i class="fa-solid fa-chevron-right text-gray-300"></i>
            </div>
            <div class="relative border border-gray-200 rounded-xl p-1 bg-white">
                <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tingkat Konversi</label>
                <input type="number" oninput="window.updateRatio(${idx}, this.value)" value="${item.ratio}" class="w-full p-2.5 outline-none font-bold text-gray-700" placeholder="1 Utama = ...">
            </div>
        </div>
    `).join('');
}

window.bukaHalamanEdit = (id) => { currentEditId = id; multiUnits = []; window.switchView('view-edit'); };
window.batalEdit = () => window.switchView('view-list');