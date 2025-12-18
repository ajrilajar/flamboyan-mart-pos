import { ref, onValue, push, set, remove, update } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { db } from "./firebase-config.js";

let databaseBarang = {};
let dataKategori = {};
let dataSatuan = {};
let currentEditId = null;
let currentSettingId = null;

const desktopWidth = "max-w-4xl";

export function renderInventaris() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div id="view-list" class="flex flex-col gap-3 ${desktopWidth} mx-auto p-3 sm:p-4 animate-fadeIn">
            <div class="flex justify-between items-center px-1">
                <h2 class="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">Inventaris</h2>
                <button onclick="window.switchView('view-pengaturan')" class="p-2 text-emerald-600 active:scale-90 transition-all">
                    <i class="fa-solid fa-gear text-lg"></i>
                </button>
            </div>
            <div id="list-barang" class="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 pb-32"></div>
            <button onclick="window.bukaHalamanEdit(null)" class="fixed bottom-24 right-4 md:right-[calc(50%-20rem)] bg-emerald-500 text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-3 font-bold z-40 active:scale-95 border-none">
                <i class="fa-solid fa-box-open text-lg"></i> <span>Tambah Barang</span>
            </button>
        </div>

        <div id="view-pengaturan" class="hidden fixed inset-0 bg-gray-50 z-[100] overflow-y-auto">
            <div class="${desktopWidth} mx-auto min-h-screen bg-gray-50 shadow-2xl border-x flex flex-col">
                <div class="flex items-center p-4 bg-white border-b sticky top-0 z-10">
                    <button onclick="window.switchView('view-list')" class="mr-4 text-gray-600 p-2"><i class="fa-solid fa-arrow-left text-xl"></i></button>
                    <h3 class="font-bold text-lg text-gray-800">Pengaturan Barang</h3>
                </div>
                <div class="p-4 space-y-6">
                    <div>
                        <p class="text-xs font-bold text-gray-400 uppercase mb-3 ml-1">Umum</p>
                        <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                            <div onclick="window.bukaKelolaKategori()" class="p-4 flex items-center justify-between active:bg-gray-50 cursor-pointer border-b border-gray-50">
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500"><i class="fa-solid fa-boxes-stacked"></i></div>
                                    <div><p class="font-bold text-gray-800 text-sm">Kelola Kategori Barang</p><p class="text-[10px] text-gray-400">Kelola kategori item secara efektif.</p></div>
                                </div>
                                <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                            </div>
                            <div onclick="window.bukaKelolaSatuan()" class="p-4 flex items-center justify-between active:bg-gray-50 cursor-pointer">
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500"><i class="fa-solid fa-scale-balanced"></i></div>
                                    <div><p class="font-bold text-gray-800 text-sm">Kelola Satuan Ukur</p><p class="text-[10px] text-gray-400">Kelola Satuan Ukur</p></div>
                                </div>
                                <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="view-kelola-kategori" class="hidden fixed inset-0 bg-white z-[110] flex flex-col">
            <div class="${desktopWidth} mx-auto w-full h-full flex flex-col bg-white">
                <div class="flex items-center p-4 border-b">
                    <button onclick="window.switchView('view-pengaturan')" class="mr-4 p-2"><i class="fa-solid fa-arrow-left text-xl text-gray-600"></i></button>
                    <h3 class="font-bold text-lg text-gray-800 flex-1">Kelola Kategori Item</h3>
                    <i class="fa-solid fa-circle-info text-emerald-500 text-lg"></i>
                </div>
                <div class="p-4 bg-gray-50 border-b">
                    <div class="relative">
                        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input type="text" placeholder="Cari Kategori Barang" class="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl outline-none focus:border-emerald-500">
                    </div>
                </div>
                <div id="list-kategori-pengaturan" class="flex-1 overflow-y-auto px-4 divide-y divide-gray-50"></div>
                <div class="p-4 border-t">
                    <button onclick="window.bukaModalKategori(null)" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 shadow-lg">
                        <i class="fa-solid fa-plus"></i> Tambah Kategori Baru
                    </button>
                </div>
            </div>
        </div>

        <div id="view-kelola-satuan" class="hidden fixed inset-0 bg-white z-[110] flex flex-col">
            <div class="${desktopWidth} mx-auto w-full h-full flex flex-col bg-white">
                <div class="flex items-center p-4 border-b">
                    <button onclick="window.switchView('view-pengaturan')" class="mr-4 p-2"><i class="fa-solid fa-arrow-left text-xl text-gray-600"></i></button>
                    <h3 class="font-bold text-lg text-gray-800 flex-1">Kelola Satuan Ukur</h3>
                    <i class="fa-solid fa-circle-info text-emerald-500 text-lg"></i>
                </div>
                <div class="p-4 bg-gray-50 border-b">
                    <div class="relative">
                        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input type="text" placeholder="Cari Satuan" class="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl outline-none focus:border-emerald-500">
                    </div>
                </div>
                <div id="list-satuan-pengaturan" class="flex-1 overflow-y-auto px-4 divide-y divide-gray-50"></div>
                <div class="p-4 border-t">
                    <button onclick="window.bukaModalSatuan(null)" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 shadow-lg">
                        <i class="fa-solid fa-plus"></i> Tambahkan Satuan Baru
                    </button>
                </div>
            </div>
        </div>

        <div id="modal-pengaturan" class="hidden fixed inset-0 bg-black/60 z-[150] flex items-end justify-center p-0 transition-all duration-300">
            <div id="modal-panel" class="bg-white w-full ${desktopWidth} rounded-t-[2.5rem] animate-slide-up flex flex-col h-auto max-h-[90vh]">
                <div onclick="window.tutupModalPengaturan()" class="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-4 cursor-pointer"></div>
                <div id="modal-content-area" class="px-7 pb-8 pt-2"></div>
            </div>
        </div>
    `;

    // Ambil Data Firebase
    onValue(ref(db, 'products'), (snap) => { databaseBarang = snap.val() || {}; window.filterInventaris(); });
    onValue(ref(db, 'settings/categories'), (snap) => { dataKategori = snap.val() || {}; window.renderListKategoriPengaturan(); });
    onValue(ref(db, 'settings/units'), (snap) => { dataSatuan = snap.val() || {}; window.renderListSatuanPengaturan(); });
}

// ==========================================
// LOGIKA KATEGORI (GAMBAR 11, 12, 13)
// ==========================================

window.bukaKelolaKategori = () => window.switchView('view-kelola-kategori');

window.renderListKategoriPengaturan = () => {
    const list = document.getElementById('list-kategori-pengaturan');
    list.innerHTML = "";
    Object.entries(dataKategori).forEach(([id, item]) => {
        const count = Object.values(databaseBarang).filter(b => b.kategori === item.nama).length;
        list.innerHTML += `
            <div class="flex items-center justify-between py-4 group">
                <div><p class="font-bold text-gray-800">${item.nama}</p><p class="text-xs text-gray-400">${count} Barang</p></div>
                <div class="flex gap-4">
                    <button onclick="window.bukaModalKategori('${id}')" class="p-2 text-gray-400 hover:text-emerald-500"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="window.hapusKategori('${id}')" class="p-2 text-gray-400 hover:text-rose-500"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>`;
    });
};

window.bukaModalKategori = (id) => {
    currentSettingId = id;
    const item = id ? dataKategori[id] : { nama: "" };
    document.getElementById('modal-pengaturan').classList.remove('hidden');
    document.getElementById('modal-content-area').innerHTML = `
        <h3 class="font-bold text-xl text-gray-800 mb-6">${id ? 'Ubah Kategori' : 'Buat Kategori Barang'}</h3>
        <div class="relative">
            <label class="absolute -top-2.5 left-4 px-1 bg-white text-[11px] font-bold text-emerald-500">Nama Kategori</label>
            <input type="text" id="input-nama-kategori" value="${item.nama}" class="w-full p-4 border-2 border-emerald-500 rounded-2xl outline-none font-bold text-gray-700" placeholder="Contoh: Rokok">
        </div>
        <button onclick="window.simpanKategori()" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold mt-8 shadow-lg active:scale-95">${id ? 'Perbarui' : 'Simpan'}</button>
    `;
};

window.simpanKategori = async () => {
    const nama = document.getElementById('input-nama-kategori').value.trim();
    if (!nama) return;
    if (currentSettingId) { await update(ref(db, `settings/categories/${currentSettingId}`), { nama }); }
    else { await push(ref(db, 'settings/categories'), { nama }); }
    window.tutupModalPengaturan();
};

window.hapusKategori = (id) => { if(confirm('Hapus kategori ini?')) remove(ref(db, `settings/categories/${id}`)); };

// ==========================================
// LOGIKA SATUAN (GAMBAR 10, 14, 15)
// ==========================================

window.bukaKelolaSatuan = () => window.switchView('view-kelola-satuan');

window.renderListSatuanPengaturan = () => {
    const list = document.getElementById('list-satuan-pengaturan');
    list.innerHTML = "";
    Object.entries(dataSatuan).forEach(([id, item]) => {
        list.innerHTML += `
            <div class="flex items-center justify-between py-4 group">
                <div><p class="font-bold text-gray-800">${item.nama}</p><p class="text-xs text-gray-400 uppercase tracking-widest">${item.pendek}</p></div>
                <div class="flex gap-4">
                    <button onclick="window.bukaModalSatuan('${id}')" class="p-2 text-gray-400 hover:text-emerald-500"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="window.hapusSatuan('${id}')" class="p-2 text-gray-400 hover:text-rose-500"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>`;
    });
};

window.bukaModalSatuan = (id) => {
    currentSettingId = id;
    const item = id ? dataSatuan[id] : { nama: "", pendek: "" };
    document.getElementById('modal-pengaturan').classList.remove('hidden');
    document.getElementById('modal-content-area').innerHTML = `
        <h3 class="font-bold text-xl text-gray-800 mb-6">${id ? 'Ubah Satuan Ukur' : 'Tambahkan Satuan Baru'}</h3>
        <div class="space-y-6">
            <div class="relative">
                <label class="absolute -top-2.5 left-4 px-1 bg-white text-[11px] font-bold text-emerald-500">Nama Satuan</label>
                <input type="text" id="input-nama-satuan" value="${item.nama}" class="w-full p-4 border-2 border-emerald-500 rounded-2xl outline-none font-bold text-gray-700" placeholder="Contoh: Kotak/Dus">
            </div>
            <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm">
                <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Nama Satuan Pendek</label>
                <input type="text" id="input-pendek-satuan" value="${item.pendek}" class="w-full bg-transparent outline-none font-bold text-gray-700 uppercase" placeholder="KOTK">
            </div>
        </div>
        <button onclick="window.simpanSatuan()" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold mt-8 shadow-lg active:scale-95">${id ? 'Perbarui' : 'Simpan'}</button>
    `;
};

window.simpanSatuan = async () => {
    const data = { 
        nama: document.getElementById('input-nama-satuan').value.trim(),
        pendek: document.getElementById('input-pendek-satuan').value.trim().toUpperCase()
    };
    if (!data.nama || !data.pendek) return;
    if (currentSettingId) { await update(ref(db, `settings/units/${currentSettingId}`), data); }
    else { await push(ref(db, 'settings/units'), data); }
    window.tutupModalPengaturan();
};

window.hapusSatuan = (id) => { if(confirm('Hapus satuan ini?')) remove(ref(db, `settings/units/${id}`)); };

// ==========================================
// UTILITY & CORE
// ==========================================

window.switchView = (viewId) => {
    ['view-list', 'view-pengaturan', 'view-kelola-kategori', 'view-kelola-satuan'].forEach(id => {
        const el = document.getElementById(id); if(el) el.classList.add('hidden');
    });
    document.getElementById(viewId).classList.remove('hidden');
};

window.tutupModalPengaturan = () => document.getElementById('modal-pengaturan').classList.add('hidden');

// Tutup modal saat klik overlay hitam
window.onclick = (e) => { 
    if (e.target.id === 'modal-pengaturan') window.tutupModalPengaturan(); 
};

// Pastikan fungsi filter tetap bekerja untuk list utama
window.filterInventaris = () => {
    const listDiv = document.getElementById('list-barang');
    if (!listDiv) return;
    listDiv.innerHTML = "";
    Object.entries(databaseBarang).forEach(([id, item]) => {
        const inisial = item.nama.substring(0, 2).toUpperCase();
        listDiv.innerHTML += `
            <div class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm active:bg-gray-50 flex flex-col gap-2 transition-all cursor-pointer">
                <div class="flex gap-3 items-center">
                    <div class="w-11 h-11 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center font-bold text-sm">${inisial}</div>
                    <div class="flex-1 overflow-hidden">
                        <h4 class="font-bold text-gray-800 text-sm truncate">${item.nama}</h4>
                        <span class="text-[9px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded font-bold uppercase border border-gray-100">${item.kategori || 'Umum'}</span>
                    </div>
                </div>
            </div>`;
    });
};