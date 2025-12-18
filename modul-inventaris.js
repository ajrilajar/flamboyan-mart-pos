import { ref, onValue, push, set, update } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { db } from "./firebase-config.js";
import * as SetingInv from "./modul-pengaturan-inventaris.js";

let databaseBarang = {}, dataKategori = {}, dataSatuan = {};
let currentEditId = null;
let multiUnits = []; // Array untuk menyimpan satuan tambahan [{unit: 'BTG', ratio: 10}]

const desktopWidth = "max-w-4xl";

export function renderInventaris() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div id="view-list" class="flex flex-col gap-2 ${desktopWidth} mx-auto p-2 sm:p-4 animate-fadeIn">
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
                <div class="flex items-center p-3 border-b sticky top-0 bg-white z-10">
                    <button onclick="window.batalEdit()" class="p-2 text-gray-600 mr-2"><i class="fa-solid fa-arrow-left text-xl"></i></button>
                    <h3 id="edit-title" class="font-bold text-lg text-gray-800">Tambah Barang</h3>
                </div>
                
                <div class="p-3 space-y-3 flex-1 overflow-x-hidden">
                    <div class="relative border border-gray-200 rounded-lg group focus-within:border-emerald-500 transition-all">
                        <label class="absolute -top-2 left-2 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest group-focus-within:text-emerald-500">Nama Barang</label>
                        <input type="text" id="edit-nama" placeholder="Nama Barang" class="w-full p-2.5 bg-transparent outline-none font-bold text-gray-700">
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                    <div id="info-konversi" class="hidden flex items-center gap-2 text-[11px] text-emerald-600 font-bold bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
                        <i class="fa-solid fa-circle-info"></i>
                        <span id="text-konversi"></span>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
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
                    
                    <div id="list-harga-sekunder" class="space-y-3"></div>
                </div>

                <div class="p-3 bg-white border-t sticky bottom-0 z-20">
                    <button onclick="window.simpanBarang()" class="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-lg active:scale-95 transition-all">Simpan</button>
                </div>
            </div>
        </div>

        <div id="view-multi-satuan" class="hidden fixed inset-0 bg-white z-[100] flex flex-col">
            <div class="${desktopWidth} mx-auto w-full h-full flex flex-col bg-white shadow-2xl">
                <div class="flex items-center p-3 border-b">
                    <button onclick="window.tutupMultiSatuan()" class="mr-3 p-2"><i class="fa-solid fa-arrow-left text-xl text-gray-600"></i></button>
                    <h3 class="font-bold text-lg text-gray-800">Pilih Satuan Pengukuran</h3>
                </div>
                <div class="p-3 space-y-4 flex-1 overflow-y-auto" id="container-konversi">
                    <div onclick="window.bukaPickerDasar('utama')" class="relative border border-gray-200 rounded-xl p-3 flex justify-between items-center cursor-pointer">
                        <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Satuan Utama</label>
                        <input type="text" id="val-satuan-utama" placeholder="Pilih Satuan Utama" class="font-bold text-gray-700 outline-none pointer-events-none" readonly>
                        <i class="fa-solid fa-chevron-right text-gray-300"></i>
                    </div>

                    <div id="dynamic-secondary-units" class="space-y-4"></div>

                    <button onclick="window.tambahSatuanSekunder()" class="text-emerald-600 font-bold text-xs flex items-center gap-2 py-2">
                        <i class="fa-solid fa-circle-plus"></i> Tambah Satuan Lainnya
                    </button>
                </div>
                <div class="p-3 border-t grid grid-cols-2 gap-2 bg-gray-50">
                    <button onclick="window.tutupMultiSatuan()" class="py-3 font-bold text-gray-400 uppercase tracking-widest text-xs border rounded-xl bg-white">Batal</button>
                    <button onclick="window.konfirmasiSatuan()" class="py-3 bg-emerald-500 text-white font-bold rounded-xl active:scale-95 transition-all">Simpan</button>
                </div>
            </div>
        </div>

        <div id="modal-container" onclick="window.overlayClose(event)" class="hidden fixed inset-0 bg-black/60 z-[200] flex items-end justify-center transition-all overflow-hidden">
            <div class="bg-white w-full ${desktopWidth} rounded-t-[2rem] flex flex-col max-h-[80vh] animate-slide-up">
                <div onclick="window.tutupModal()" class="w-10 h-1 bg-gray-200 rounded-full mx-auto my-3 cursor-pointer"></div>
                <div id="modal-content" class="px-5 pb-8 overflow-y-auto"></div>
            </div>
        </div>
        
        <div id="view-pengaturan" class="hidden fixed inset-0 bg-gray-50 z-[100] overflow-y-auto">...</div>
    `;

    loadFirebaseData();
}

function loadFirebaseData() {
    onValue(ref(db, 'products'), s => { databaseBarang = s.val() || {}; window.filterInventaris(); });
    onValue(ref(db, 'settings/categories'), s => { dataKategori = s.val() || {}; });
    onValue(ref(db, 'settings/units'), s => { dataSatuan = s.val() || {}; });
}

// LOGIKA MULTI SATUAN (GAMBAR 16-20)
window.bukaPilihSatuanPengukuran = () => {
    document.getElementById('view-multi-satuan').classList.remove('hidden');
    renderKonversiList();
};

window.tambahSatuanSekunder = () => {
    multiUnits.push({ unit: '', ratio: '' });
    renderKonversiList();
};

function renderKonversiList() {
    const container = document.getElementById('dynamic-secondary-units');
    container.innerHTML = multiUnits.map((item, idx) => `
        <div class="space-y-3 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 relative animate-fadeIn">
            <button onclick="window.hapusRowKonversi(${idx})" class="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px]"><i class="fa-solid fa-xmark"></i></button>
            <div onclick="window.bukaPickerDasar('sekunder', ${idx})" class="relative border border-gray-200 rounded-xl p-3 flex justify-between items-center cursor-pointer bg-white">
                <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Satuan Ke-${idx + 2}</label>
                <input type="text" value="${item.unit}" placeholder="Pilih Satuan" class="font-bold text-gray-700 outline-none pointer-events-none" readonly>
                <i class="fa-solid fa-chevron-right text-gray-300"></i>
            </div>
            <div class="relative border border-gray-200 rounded-xl p-1 bg-white">
                <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase">Tingkat Konversi</label>
                <input type="number" oninput="window.updateRatio(${idx}, this.value)" value="${item.ratio}" class="w-full p-2.5 outline-none font-bold text-gray-700" placeholder="1 ${document.getElementById('val-satuan-utama').value || 'Utama'} = ...">
            </div>
        </div>
    `).join('');
}

window.bukaPickerDasar = (mode, index = null) => {
    document.getElementById('modal-container').classList.remove('hidden');
    const content = document.getElementById('modal-content');
    content.innerHTML = `
        <h3 class="font-bold text-lg text-gray-800 mb-4">Pilih Satuan Dasar</h3>
        <div class="divide-y divide-gray-50">
            ${Object.entries(dataSatuan).map(([id, s]) => `
                <div onclick="window.pilihSatuanFix('${mode}', '${s.pendek}', ${index})" class="py-3.5 flex justify-between items-center cursor-pointer active:bg-gray-50">
                    <span class="font-bold text-gray-700">${s.nama} <span class="text-gray-300 text-xs ml-2">${s.pendek}</span></span>
                    <i class="fa-solid fa-chevron-right text-gray-200 text-[10px]"></i>
                </div>
            `).join('')}
        </div>
        <button onclick="window.switchView('view-kelola-satuan')" class="w-full mt-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs">+ Tambah Satuan Baru</button>
    `;
};

window.pilihSatuanFix = (mode, pendek, index) => {
    if (mode === 'utama') document.getElementById('val-satuan-utama').value = pendek;
    else multiUnits[index].unit = pendek;
    window.tutupModal();
    renderKonversiList();
};

window.konfirmasiSatuan = () => {
    const utama = document.getElementById('val-satuan-utama').value;
    if (!utama) return alert("Pilih Satuan Utama!");
    
    // Update Display di Form (Gambar 20)
    let display = utama;
    let info = "";
    multiUnits.forEach(m => {
        if (m.unit && m.ratio) {
            display += ` & ${m.unit}`;
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
    
    tutupMultiSatuan();
    renderHargaInputs();
};

function renderHargaInputs() {
    const listHarga = document.getElementById('list-harga-sekunder');
    const utama = document.getElementById('val-satuan-utama').value;
    listHarga.innerHTML = multiUnits.map((m, idx) => `
        <div class="relative border border-gray-200 rounded-lg flex items-center px-2 animate-fadeIn">
            <label class="absolute -top-2 left-2 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Harga Jual per ${m.unit}</label>
            <span class="text-gray-400 text-xs font-bold mr-1">Rp</span>
            <input type="number" data-unit="${m.unit}" class="input-harga-sekunder w-full py-2.5 bg-transparent outline-none font-bold text-gray-700 text-sm">
        </div>
    `).join('');
}

// FUNGSI STANDAR
window.updateRatio = (idx, val) => multiUnits[idx].ratio = val;
window.hapusRowKonversi = (idx) => { multiUnits.splice(idx, 1); renderKonversiList(); };
window.tutupMultiSatuan = () => document.getElementById('view-multi-satuan').classList.add('hidden');
window.tutupModal = () => document.getElementById('modal-container').classList.add('hidden');
window.overlayClose = (e) => { if (e.target.id === 'modal-container') window.tutupModal(); };
window.switchView = (v) => { document.querySelectorAll('[id^="view-"]').forEach(el => el.classList.add('hidden')); document.getElementById(v).classList.remove('hidden'); };
window.batalEdit = () => window.switchView('view-list');