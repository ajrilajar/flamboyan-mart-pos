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
            <div class="flex gap-2 mb-1">
                <div class="relative flex-1">
                    <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                    <input type="text" id="cariBarang" oninput="window.filterInventaris()" placeholder="Cari Barang..." class="w-full pl-9 pr-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-xl outline-none shadow-sm focus:border-emerald-500 text-sm transition-all">
                </div>
            </div>
            <div id="list-barang" class="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 pb-32"></div>
            <button onclick="window.bukaHalamanEdit(null)" class="fixed bottom-24 right-4 md:right-[calc(50%-20rem)] bg-emerald-500 text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-3 font-bold z-40 active:scale-95 border-none">
                <i class="fa-solid fa-box-open text-lg"></i> <span>Tambah Barang</span>
            </button>
        </div>

        <div id="view-detail" class="hidden fixed inset-0 bg-white z-[60] overflow-y-auto pb-32">
            <div class="${desktopWidth} mx-auto min-h-screen bg-white shadow-2xl border-x">
                <div class="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                    <button onclick="window.switchView('view-list')" class="p-2 text-gray-600 active:bg-gray-100 rounded-full"><i class="fa-solid fa-arrow-left text-xl"></i></button>
                    <div class="flex gap-2">
                        <button id="btnKeEdit" class="p-2 text-gray-500"><i class="fa-solid fa-pen"></i></button>
                        <button id="btnHapus" class="p-2 text-rose-400"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
                <div id="detail-render" class="p-4 sm:p-5"></div>
            </div>
        </div>

        <div id="view-edit" class="hidden fixed inset-0 bg-gray-50 z-[70] overflow-y-auto pb-24">
            <div class="${desktopWidth} mx-auto min-h-screen bg-gray-50 shadow-2xl border-x flex flex-col">
                <div class="flex items-center p-4 bg-white border-b sticky top-0 z-10">
                    <button onclick="window.batalEdit()" class="p-2 text-gray-600 mr-4 active:bg-gray-100 rounded-full"><i class="fa-solid fa-arrow-left text-xl"></i></button>
                    <h3 id="edit-title" class="font-bold text-lg text-gray-800 uppercase tracking-tight">Barang</h3>
                </div>
                <div class="p-4 space-y-4 flex-1">
                    <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                        <div>
                            <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Nama Barang</label>
                            <input type="text" id="edit-nama" placeholder="Masukkan nama barang..." class="w-full mt-1 font-bold text-gray-700 outline-none border-b border-gray-100 focus:border-emerald-500 py-1 text-base">
                        </div>
                        <div onclick="window.bukaPickerSelection('kategori')" class="flex justify-between items-center cursor-pointer py-1 border-b border-gray-100 active:bg-gray-50">
                            <div>
                                <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Kategori</label>
                                <input type="text" id="edit-kategori" class="w-full mt-1 font-bold text-gray-700 outline-none pointer-events-none text-sm" placeholder="Pilih Kategori" readonly>
                            </div>
                            <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="flex border-b border-gray-200">
                            <button class="flex-1 py-3 text-emerald-600 font-bold border-b-2 border-emerald-500 text-sm uppercase">Detail Stok</button>
                            <button class="flex-1 py-3 text-gray-400 font-bold text-sm uppercase">Detail Tambahan</button>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm"><label class="text-[9px] font-bold text-gray-400 uppercase">Stok Awal</label><input type="number" id="edit-stok" class="w-full mt-1 outline-none font-bold text-gray-700 text-sm" placeholder="0"></div>
                            <div onclick="window.bukaPickerSelection('satuan')" class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center cursor-pointer">
                                <div><label class="text-[9px] font-bold text-gray-400 uppercase">Satuan</label><input type="text" id="edit-satuan" class="w-full mt-1 outline-none font-bold text-gray-700 text-sm uppercase pointer-events-none" placeholder="PCS" readonly></div>
                                <i class="fa-solid fa-chevron-right text-gray-300 text-[10px]"></i>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm"><label class="text-[9px] font-bold text-gray-400 uppercase">Harga Jual</label><div class="flex items-center gap-1 font-bold text-gray-700 text-sm"><span>Rp</span><input type="number" id="edit-jual" class="w-full outline-none" placeholder="0"></div></div>
                            <div class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm"><label class="text-[9px] font-bold text-gray-400 uppercase">Harga Beli</label><div class="flex items-center gap-1 font-bold text-gray-700 text-sm"><span>Rp</span><input type="number" id="edit-beli" class="w-full outline-none" placeholder="0"></div></div>
                            <div class="col-span-2 bg-white p-3 rounded-xl border border-gray-100 shadow-sm"><label class="text-[9px] font-bold text-gray-400 uppercase">Harga Eceran</label><div class="flex items-center gap-1 font-bold text-gray-700 text-sm"><span>Rp</span><input type="number" id="edit-eceran" class="w-full outline-none" placeholder="0"></div></div>
                            <div class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm"><label class="text-[9px] font-bold text-gray-400 uppercase">Harga Grosir</label><div class="flex items-center gap-1 font-bold text-gray-700 text-sm"><span>Rp</span><input type="number" id="edit-grosir" class="w-full outline-none" placeholder="0"></div></div>
                            <div class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm"><label class="text-[9px] font-bold text-gray-400 uppercase text-[8px]">Min. Stok</label><input type="number" id="edit-min" class="w-full mt-1 outline-none font-bold text-gray-700 text-sm" placeholder="10"></div>
                        </div>
                    </div>
                </div>
                <div class="p-4 bg-gray-50 border-t flex justify-center sticky bottom-0 z-20">
                    <button onclick="window.simpanPerubahanBarang()" class="w-full ${desktopWidth} bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all uppercase tracking-widest">Simpan Barang</button>
                </div>
            </div>
        </div>

        <div id="view-pengaturan" class="hidden fixed inset-0 bg-gray-50 z-[100] overflow-y-auto">
             <div class="${desktopWidth} mx-auto min-h-screen bg-gray-50 shadow-2xl border-x flex flex-col">
                <div class="flex items-center p-4 bg-white border-b sticky top-0 z-10">
                    <button onclick="window.switchView('view-list')" class="mr-4 p-2 active:bg-gray-100 rounded-full"><i class="fa-solid fa-arrow-left text-xl text-gray-600"></i></button>
                    <h3 class="font-bold text-lg text-gray-800">Pengaturan Barang</h3>
                </div>
                <div class="p-4 space-y-6">
                    <div>
                        <p class="text-[10px] font-bold text-gray-400 uppercase mb-3 ml-1 tracking-widest">Umum</p>
                        <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm divide-y">
                            <div onclick="window.switchView('view-kelola-kategori')" class="p-4 flex items-center justify-between active:bg-gray-50 cursor-pointer">
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500"><i class="fa-solid fa-boxes-stacked"></i></div>
                                    <div><p class="font-bold text-gray-800 text-sm">Kelola Kategori Barang</p><p class="text-[10px] text-gray-400">Kelola kategori item secara efektif.</p></div>
                                </div>
                                <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                            </div>
                            <div onclick="window.switchView('view-kelola-satuan')" class="p-4 flex items-center justify-between active:bg-gray-50 cursor-pointer">
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

        <div id="view-kelola-kategori" class="hidden fixed inset-0 bg-white z-[110] flex flex-col animate-fadeIn">
            <div class="${desktopWidth} mx-auto w-full h-full flex flex-col bg-white">
                <div class="flex items-center p-4 border-b">
                    <button onclick="window.switchView('view-pengaturan')" class="mr-4 p-2"><i class="fa-solid fa-arrow-left text-xl text-gray-600"></i></button>
                    <h3 class="font-bold text-lg text-gray-800 flex-1">Kelola Kategori Item</h3>
                    <i class="fa-solid fa-circle-info text-emerald-500 text-lg"></i>
                </div>
                <div id="list-kategori-pengaturan" class="flex-1 overflow-y-auto px-4 divide-y divide-gray-50"></div>
                <div class="p-4 border-t"><button onclick="window.bukaModalSetting('kategori', null)" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold active:scale-95 shadow-lg">+ Tambah Kategori Baru</button></div>
            </div>
        </div>

        <div id="view-kelola-satuan" class="hidden fixed inset-0 bg-white z-[110] flex flex-col animate-fadeIn">
            <div class="${desktopWidth} mx-auto w-full h-full flex flex-col bg-white">
                <div class="flex items-center p-4 border-b">
                    <button onclick="window.switchView('view-pengaturan')" class="mr-4 p-2"><i class="fa-solid fa-arrow-left text-xl text-gray-600"></i></button>
                    <h3 class="font-bold text-lg text-gray-800 flex-1">Kelola Satuan Ukur</h3>
                </div>
                <div id="list-satuan-pengaturan" class="flex-1 overflow-y-auto px-4 divide-y divide-gray-50"></div>
                <div class="p-4 border-t"><button onclick="window.bukaModalSetting('satuan', null)" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold active:scale-95 shadow-lg">+ Tambahkan Satuan Baru</button></div>
            </div>
        </div>

        <div id="modal-container" onclick="window.handleOverlayClick(event)" class="hidden fixed inset-0 bg-black/60 z-[200] flex items-end justify-center transition-all duration-300 overflow-hidden">
            <div id="modal-panel" class="bg-white w-full ${desktopWidth} rounded-t-[2.5rem] animate-slide-up flex flex-col h-auto max-h-[85vh]">
                <div onclick="window.tutupModal()" class="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-4 cursor-pointer hover:bg-gray-300"></div>
                <div id="modal-content" class="px-7 pb-8 pt-2"></div>
            </div>
        </div>
    `;

    // Ambil Data Firebase
    onValue(ref(db, 'products'), (snap) => { databaseBarang = snap.val() || {}; window.filterInventaris(); });
    onValue(ref(db, 'settings/categories'), (snap) => { dataKategori = snap.val() || {}; window.renderListKategoriPengaturan(); });
    onValue(ref(db, 'settings/units'), (snap) => { dataSatuan = snap.val() || {}; window.renderListSatuanPengaturan(); });
}

// ==========================================
// LOGIKA PICKER (UNTUK FORM TAMBAH BARANG)
// ==========================================

window.bukaPickerSelection = (type) => {
    document.getElementById('modal-container').classList.remove('hidden');
    const content = document.getElementById('modal-content');
    const data = type === 'kategori' ? dataKategori : dataSatuan;
    const title = type === 'kategori' ? 'Pilih Kategori Barang' : 'Pilih Satuan Ukur';
    const currentVal = document.getElementById(`edit-${type}`).value;

    content.innerHTML = `
        <h3 class="font-bold text-xl text-gray-800 mb-5">${title}</h3>
        <div class="space-y-1 overflow-y-auto max-h-[50vh] custom-scroll">
            ${Object.entries(data).map(([id, item]) => {
                const isSelected = item.nama === currentVal || item.pendek === currentVal;
                return `
                <div onclick="window.setSelectionValue('${type}', '${type === 'satuan' ? item.pendek : item.nama}')" class="flex justify-between items-center py-4 border-b border-gray-50 cursor-pointer active:bg-gray-50">
                    <span class="font-medium ${isSelected ? 'text-emerald-600 font-bold' : 'text-gray-700'}">${item.nama} ${type === 'satuan' ? `(${item.pendek})` : ''}</span>
                    <div class="w-6 h-6 rounded-full border-2 ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-200'} flex items-center justify-center transition-all">
                        ${isSelected ? '<i class="fa-solid fa-check text-[10px] text-white"></i>' : ''}
                    </div>
                </div>`;
            }).join('')}
        </div>
        <button onclick="window.tutupModal()" class="w-full mt-6 py-4 text-gray-400 font-bold uppercase tracking-widest text-xs">Tutup</button>
    `;
};

window.setSelectionValue = (type, val) => {
    document.getElementById(`edit-${type}`).value = val;
    window.tutupModal();
};

// ==========================================
// LOGIKA PENGATURAN (CRUD KATEGORI & SATUAN)
// ==========================================

window.bukaModalSetting = (type, id) => {
    currentSettingId = id;
    document.getElementById('modal-container').classList.remove('hidden');
    const content = document.getElementById('modal-content');
    
    if (type === 'kategori') {
        const item = id ? dataKategori[id] : { nama: "" };
        content.innerHTML = `
            <h3 class="font-bold text-xl text-gray-800 mb-6">${id ? 'Ubah Kategori' : 'Buat Kategori Barang'}</h3>
            <div class="relative">
                <label class="absolute -top-2.5 left-4 px-1 bg-white text-[11px] font-bold text-emerald-500">Nama Kategori</label>
                <input type="text" id="input-nama-kat" value="${item.nama}" class="w-full p-4 border-2 border-emerald-500 rounded-2xl outline-none font-bold text-gray-700" placeholder="Contoh: Sembako">
            </div>
            <button onclick="window.simpanSetting('categories', 'input-nama-kat')" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold mt-8 shadow-lg active:scale-95 transition-all uppercase tracking-widest">${id ? 'Perbarui' : 'Simpan'}</button>
        `;
    } else {
        const item = id ? dataSatuan[id] : { nama: "", pendek: "" };
        content.innerHTML = `
            <h3 class="font-bold text-xl text-gray-800 mb-6">${id ? 'Ubah Satuan Ukur' : 'Tambahkan Satuan Baru'}</h3>
            <div class="space-y-6">
                <div class="relative">
                    <label class="absolute -top-2.5 left-4 px-1 bg-white text-[11px] font-bold text-emerald-500">Nama Satuan</label>
                    <input type="text" id="input-nama-unit" value="${item.nama}" class="w-full p-4 border-2 border-emerald-500 rounded-2xl outline-none font-bold text-gray-700" placeholder="Contoh: Kotak/Dus">
                </div>
                <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100"><label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Nama Satuan Pendek</label><input type="text" id="input-short-unit" value="${item.pendek}" class="w-full bg-transparent outline-none font-bold text-gray-700 uppercase" placeholder="KOTK"></div>
            </div>
            <button onclick="window.simpanSetting('units', ['input-nama-unit', 'input-short-unit'])" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold mt-8 shadow-lg active:scale-95 transition-all uppercase tracking-widest">${id ? 'Perbarui' : 'Simpan'}</button>
        `;
    }
};

window.simpanSetting = async (path, inputId) => {
    let data = {};
    if (Array.isArray(inputId)) {
        data = { nama: document.getElementById(inputId[0]).value, pendek: document.getElementById(inputId[1]).value.toUpperCase() };
    } else {
        data = { nama: document.getElementById(inputId).value };
    }
    if (!data.nama) return;
    if (currentSettingId) { await update(ref(db, `settings/${path}/${currentSettingId}`), data); }
    else { await push(ref(db, `settings/${path}`), data); }
    window.tutupModal();
};

window.hapusSetting = (path, id) => { if(confirm('Hapus item ini?')) remove(ref(db, `settings/${path}/${id}`)); };

window.renderListKategoriPengaturan = () => {
    const list = document.getElementById('list-kategori-pengaturan');
    if(!list) return; list.innerHTML = "";
    Object.entries(dataKategori).forEach(([id, item]) => {
        const count = Object.values(databaseBarang).filter(b => b.kategori === item.nama).length;
        list.innerHTML += `<div class="flex items-center justify-between py-4"><div><p class="font-bold text-gray-800">${item.nama}</p><p class="text-xs text-gray-400">${count} Barang</p></div><div class="flex gap-4"><button onclick="window.bukaModalSetting('kategori', '${id}')" class="p-2 text-gray-400"><i class="fa-solid fa-pen"></i></button><button onclick="window.hapusSetting('categories', '${id}')" class="p-2 text-rose-300"><i class="fa-solid fa-trash-can"></i></button></div></div>`;
    });
};

window.renderListSatuanPengaturan = () => {
    const list = document.getElementById('list-satuan-pengaturan');
    if(!list) return; list.innerHTML = "";
    Object.entries(dataSatuan).forEach(([id, item]) => {
        list.innerHTML += `<div class="flex items-center justify-between py-4"><div><p class="font-bold text-gray-800">${item.nama}</p><p class="text-[10px] text-gray-400 uppercase tracking-widest">${item.pendek}</p></div><div class="flex gap-4"><button onclick="window.bukaModalSetting('satuan', '${id}')" class="p-2 text-gray-400"><i class="fa-solid fa-pen"></i></button><button onclick="window.hapusSetting('units', '${id}')" class="p-2 text-rose-300"><i class="fa-solid fa-trash-can"></i></button></div></div>`;
    });
};

// ==========================================
// UTILITY & CORE
// ==========================================

window.handleOverlayClick = (e) => { if (e.target.id === 'modal-container') window.tutupModal(); };
window.tutupModal = () => document.getElementById('modal-container').classList.add('hidden');

window.switchView = (viewId) => {
    ['view-list', 'view-detail', 'view-edit', 'view-pengaturan', 'view-kelola-kategori', 'view-kelola-satuan'].forEach(id => {
        const el = document.getElementById(id); if (el) el.classList.add('hidden');
    });
    document.getElementById(viewId).classList.remove('hidden');
    window.scrollTo(0,0);
};

window.filterInventaris = () => {
    const listDiv = document.getElementById('list-barang');
    if (!listDiv) return; listDiv.innerHTML = "";
    Object.entries(databaseBarang).forEach(([id, item]) => {
        const inisial = item.nama.substring(0, 2).toUpperCase();
        listDiv.innerHTML += `
            <div onclick="window.bukaDetailBarang('${id}')" class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm active:bg-gray-50 flex flex-col gap-2 transition-all cursor-pointer">
                <div class="flex gap-3 items-center">
                    <div class="w-11 h-11 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center font-bold text-sm">${inisial}</div>
                    <div class="flex-1 overflow-hidden">
                        <h4 class="font-bold text-gray-800 text-sm truncate">${item.nama}</h4>
                        <span class="text-[9px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded font-bold uppercase border border-gray-100 tracking-tighter">${item.kategori || 'Umum'}</span>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-1 border-t pt-2 mt-1">
                    <div><p class="text-[8px] text-gray-400 uppercase">Jual</p><p class="text-[10px] font-bold text-gray-700">Rp ${Number(item.harga_jual || 0).toLocaleString()}</p></div>
                    <div><p class="text-[8px] text-gray-400 uppercase">Beli</p><p class="text-[10px] font-bold text-gray-700">Rp ${Number(item.harga_beli || 0).toLocaleString()}</p></div>
                    <div class="text-right"><p class="text-[8px] text-gray-400 uppercase">Stok</p><p class="text-[10px] font-black text-emerald-700">${item.stok || 0} ${item.satuan || 'PCS'}</p></div>
                </div>
            </div>`;
    });
};

window.bukaDetailBarang = (id) => {
    const item = databaseBarang[id]; currentEditId = id; window.switchView('view-detail');
    document.getElementById('detail-render').innerHTML = `<div class="flex gap-4 mb-6"><div class="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-bold text-2xl">${item.nama.substring(0,2).toUpperCase()}</div><div><h3 class="text-xl font-bold text-gray-800 leading-tight">${item.nama}</h3><p class="text-sm text-gray-400 font-medium">Kuantitas: <span class="text-emerald-600 font-bold">${item.stok} ${item.satuan}</span></p></div></div>`;
};

window.bukaHalamanEdit = (id) => {
    currentEditId = id; window.switchView('view-edit');
    if (id) {
        const item = databaseBarang[id];
        document.getElementById('edit-nama').value = item.nama;
        document.getElementById('edit-kategori').value = item.kategori;
        document.getElementById('edit-satuan').value = item.satuan;
        document.getElementById('edit-jual').value = item.harga_jual;
        document.getElementById('edit-beli').value = item.harga_beli;
        document.getElementById('edit-stok').value = item.stok;
        document.getElementById('edit-min').value = item.limit || 10;
    } else {
        ['edit-nama', 'edit-kategori', 'edit-jual', 'edit-beli', 'edit-stok', 'edit-eceran', 'edit-grosir', 'edit-min'].forEach(el => { if(document.getElementById(el)) document.getElementById(el).value = ""; });
        document.getElementById('edit-satuan').value = "PCS";
    }
};

window.simpanPerubahanBarang = async () => {
    const data = {
        nama: document.getElementById('edit-nama').value,
        kategori: document.getElementById('edit-kategori').value,
        satuan: document.getElementById('edit-satuan').value.toUpperCase(),
        harga_jual: Number(document.getElementById('edit-jual').value),
        harga_beli: Number(document.getElementById('edit-beli').value),
        stok: Number(document.getElementById('edit-stok').value),
        limit: Number(document.getElementById('edit-min').value),
        updatedAt: Date.now()
    };
    if (currentEditId) { await update(ref(db, `products/${currentEditId}`), data); }
    else { await set(push(ref(db, 'products')), data); }
    window.switchView('view-list');
};

window.batalEdit = () => currentEditId ? window.switchView('view-detail') : window.switchView('view-list');