import { ref, onValue, push, set, remove, update } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { db } from "./firebase-config.js";

let databaseBarang = {};
let currentEditId = null;
let daftarKategori = ["Palen", "Sabun Cuci", "Obat Nyamuk", "Shampoo", "Sabun", "Obat", "Sembako", "Snack", "Sampo Saset", "Minuman"];

const desktopWidth = "max-w-4xl";

export function renderInventaris() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div id="view-list" class="flex flex-col gap-3 ${desktopWidth} mx-auto p-3 sm:p-4 animate-fadeIn">
            <div class="flex justify-between items-center px-1">
                <h2 class="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">Inventaris</h2>
                <button class="p-2 text-emerald-600"><i class="fa-solid fa-gear text-lg"></i></button>
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

        <div id="view-edit" class="hidden fixed inset-0 bg-gray-50 z-[70] overflow-y-auto pb-24">
            <div class="${desktopWidth} mx-auto min-h-screen bg-gray-50 shadow-2xl border-x">
                <div class="flex items-center p-4 bg-white border-b sticky top-0 z-10">
                    <button onclick="window.batalEdit()" class="p-2 text-gray-600 mr-4"><i class="fa-solid fa-arrow-left text-xl"></i></button>
                    <h3 id="edit-title" class="font-bold text-lg text-gray-800">Tambah Barang</h3>
                </div>

                <div class="p-4 space-y-4">
                    <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                        <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Barang</label>
                            <input type="text" id="edit-nama" placeholder="Contoh: Superklin Sachet" class="w-full mt-1 font-bold text-gray-700 outline-none border-b border-gray-50 focus:border-emerald-500 py-1 text-base">
                        </div>
                        <div onclick="window.bukaPickerKategori()" class="flex justify-between items-center cursor-pointer py-1 border-b border-gray-50 active:bg-gray-50 transition-all">
                            <div>
                                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kategori</label>
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
                            <div class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center"><div><label class="text-[9px] font-bold text-gray-400 uppercase">Satuan</label><input type="text" id="edit-satuan" class="w-full mt-1 outline-none font-bold text-gray-700 text-sm uppercase" placeholder="PCS"></div><i class="fa-solid fa-chevron-right text-gray-300 text-[10px]"></i></div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm"><label class="text-[9px] font-bold text-gray-400 uppercase">Harga Jual</label><div class="flex items-center gap-1 font-bold text-gray-700 text-sm"><span>Rp</span><input type="number" id="edit-jual" class="w-full outline-none" placeholder="0"></div></div>
                            <div class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm"><label class="text-[9px] font-bold text-gray-400 uppercase">Harga Beli</label><div class="flex items-center gap-1 font-bold text-gray-700 text-sm"><span>Rp</span><input type="number" id="edit-beli" class="w-full outline-none" placeholder="0"></div></div>
                        </div>
                    </div>
                </div>
                <div class="p-4 fixed bottom-0 left-0 right-0 bg-gray-50 border-t flex justify-center z-[80]">
                    <button onclick="window.simpanPerubahanBarang()" class="w-full ${desktopWidth} bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all">Simpan</button>
                </div>
            </div>
        </div>

        <div id="picker-kategori" class="hidden fixed inset-0 bg-black/50 z-[100] flex items-end justify-center">
            <div class="bg-white w-full ${desktopWidth} rounded-t-3xl animate-slide-up flex flex-col h-[85vh]">
                <div class="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3 flex-shrink-0"></div>
                
                <div id="view-pilih-kategori" class="flex flex-col h-full overflow-hidden">
                    <div class="px-6 pb-4 flex-shrink-0">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-xl text-gray-800 tracking-tight">Pilih Kategori Barang</h3>
                            <button onclick="window.tutupPickerKategori()" class="text-gray-400 p-2"><i class="fa-solid fa-xmark text-xl"></i></button>
                        </div>
                        <div class="relative">
                            <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input type="text" id="cariKategori" oninput="window.renderKategoriList()" placeholder="Cari Kategori" class="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-emerald-500 transition-all">
                        </div>
                    </div>
                    <div id="list-kategori-picker" class="flex-1 overflow-y-auto px-6 space-y-1"></div>
                    <div class="p-6 border-t flex-shrink-0">
                        <button onclick="window.switchKategoriView('view-buat-kategori')" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95">
                            <i class="fa-solid fa-plus"></i> Tambah Kategori Baru
                        </button>
                    </div>
                </div>

                <div id="view-buat-kategori" class="hidden flex flex-col h-full p-6 animate-fadeIn">
                    <div class="flex items-center mb-8">
                        <button onclick="window.switchKategoriView('view-pilih-kategori')" class="mr-4 text-gray-600 p-2"><i class="fa-solid fa-arrow-left text-xl"></i></button>
                        <h3 class="font-bold text-xl text-gray-800">Buat Kategori Barang</h3>
                    </div>
                    <div class="flex-1">
                        <div class="relative">
                            <label class="absolute -top-2.5 left-4 px-1 bg-white text-[11px] font-bold text-emerald-500">Nama Kategori</label>
                            <input type="text" id="input-kategori-baru" oninput="window.cekInputKategoriBaru(this.value)" class="w-full p-4 border-2 border-emerald-500 rounded-xl outline-none text-gray-700 font-medium" placeholder="Contoh: Rokok">
                        </div>
                    </div>
                    <div class="pt-6">
                        <button id="btn-simpan-kategori" onclick="window.prosesTambahKategori()" class="w-full bg-gray-100 text-gray-400 py-4 rounded-xl font-bold transition-all" disabled>Simpan</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    onValue(ref(db, 'products'), (snap) => {
        databaseBarang = snap.val() || {};
        window.filterInventaris();
    });
}

// LOGIKA KATEGORI DINAMIS
window.bukaPickerKategori = () => { 
    document.getElementById('picker-kategori').classList.remove('hidden'); 
    window.switchKategoriView('view-pilih-kategori'); 
    window.renderKategoriList(); 
};
window.tutupPickerKategori = () => document.getElementById('picker-kategori').classList.add('hidden');

window.switchKategoriView = (viewId) => { 
    document.getElementById('view-pilih-kategori').classList.add('hidden'); 
    document.getElementById('view-buat-kategori').classList.add('hidden'); 
    document.getElementById(viewId).classList.remove('hidden'); 
};

window.renderKategoriList = () => {
    const list = document.getElementById('list-kategori-picker');
    const cari = document.getElementById('cariKategori').value.toLowerCase();
    const kategoriSekarang = document.getElementById('edit-kategori').value;
    list.innerHTML = "";
    daftarKategori.forEach(kat => {
        if (kat.toLowerCase().includes(cari)) {
            const isSelected = kat === kategoriSekarang;
            list.innerHTML += `
                <div onclick="window.pilihKategori('${kat}')" class="flex justify-between items-center py-4 border-b border-gray-50 cursor-pointer active:bg-gray-50">
                    <span class="text-gray-700 font-medium ${isSelected ? 'text-emerald-600 font-bold' : ''}">${kat}</span>
                    <div class="w-5 h-5 rounded-full border-2 ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-200'} flex items-center justify-center transition-all">
                        ${isSelected ? '<i class="fa-solid fa-check text-[10px] text-white"></i>' : ''}
                    </div>
                </div>`;
        }
    });
};

window.pilihKategori = (kat) => { 
    document.getElementById('edit-kategori').value = kat; 
    window.tutupPickerKategori(); 
};

window.cekInputKategoriBaru = (val) => {
    const btn = document.getElementById('btn-simpan-kategori');
    if (val.trim().length > 0) {
        btn.classList.replace('bg-gray-100', 'bg-emerald-500');
        btn.classList.replace('text-gray-400', 'text-white');
        btn.disabled = false;
    } else {
        btn.classList.replace('bg-emerald-500', 'bg-gray-100');
        btn.classList.replace('text-white', 'text-gray-400');
        btn.disabled = true;
    }
};

window.prosesTambahKategori = () => {
    const input = document.getElementById('input-kategori-baru');
    const nama = input.value.trim();
    if (nama && !daftarKategori.includes(nama)) {
        daftarKategori.unshift(nama);
        window.pilihKategori(nama);
        input.value = "";
    }
};

// SISA LOGIKA (Navigasi & Firebase) Tetap Sama...
window.switchView = (viewId) => { ['view-list', 'view-detail', 'view-edit'].forEach(id => {const el = document.getElementById(id); if(el) el.classList.add('hidden');}); document.getElementById(viewId).classList.remove('hidden'); window.scrollTo(0,0);};
window.filterInventaris = () => {
    const keyword = document.getElementById('cariBarang')?.value.toLowerCase() || "";
    const listDiv = document.getElementById('list-barang');
    if (!listDiv) return;
    listDiv.innerHTML = "";
    Object.entries(databaseBarang).forEach(([id, item]) => {
        if (item.nama.toLowerCase().includes(keyword)) {
            const inisial = item.nama.substring(0, 2).toUpperCase();
            listDiv.innerHTML += `
                <div onclick="window.bukaDetailBarang('${id}')" class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm active:bg-gray-50 flex flex-col gap-2 transition-all cursor-pointer">
                    <div class="flex gap-3 items-center">
                        <div class="w-11 h-11 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">${inisial}</div>
                        <div class="flex-1 overflow-hidden">
                            <h4 class="font-bold text-gray-800 text-sm truncate">${item.nama}</h4>
                            <span class="text-[9px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded font-bold uppercase border border-gray-100">${item.kategori || 'Umum'}</span>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-1 border-t pt-2 mt-1 text-center">
                        <div><p class="text-[8px] text-gray-400 uppercase">Jual</p><p class="text-[10px] font-bold text-gray-700">Rp ${Number(item.harga_jual || 0).toLocaleString()}</p></div>
                        <div><p class="text-[8px] text-gray-400 uppercase">Beli</p><p class="text-[10px] font-bold text-gray-700">Rp ${Number(item.harga_beli || 0).toLocaleString()}</p></div>
                        <div class="text-right"><p class="text-[8px] text-gray-400 uppercase">Stok</p><p class="text-[10px] font-black text-emerald-700">${item.stok || 0} ${item.satuan || 'PCS'}</p></div>
                    </div>
                </div>`;
        }
    });
};

window.bukaDetailBarang = (id) => {
    const item = databaseBarang[id];
    currentEditId = id;
    window.switchView('view-detail');
    // Implementasi detail render...
};

window.bukaHalamanEdit = (id) => {
    currentEditId = id; 
    window.switchView('view-edit');
    if (id) {
        const item = databaseBarang[id];
        document.getElementById('edit-nama').value = item.nama || "";
        document.getElementById('edit-kategori').value = item.kategori || "";
        document.getElementById('edit-satuan').value = item.satuan || "PCS";
        document.getElementById('edit-jual').value = item.harga_jual || 0;
        document.getElementById('edit-beli').value = item.harga_beli || 0;
        document.getElementById('edit-stok').value = item.stok || 0;
    } else {
        ['edit-nama', 'edit-kategori', 'edit-jual', 'edit-beli', 'edit-stok'].forEach(el => {
            const f = document.getElementById(el); if(f) f.value = el.includes('nama') ? "" : 0;
        });
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
        updatedAt: Date.now()
    };
    if (currentEditId) { await update(ref(db, `products/${currentEditId}`), data); }
    else { await set(push(ref(db, 'products')), data); }
    window.switchView('view-list');
};

window.batalEdit = () => currentEditId ? window.switchView('view-detail') : window.switchView('view-list');