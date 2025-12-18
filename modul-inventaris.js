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
                <h2 class="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight text-left">Inventaris</h2>
                <button class="p-2 text-emerald-600 active:scale-90 transition-transform"><i class="fa-solid fa-gear text-lg"></i></button>
            </div>
            
            <div class="flex gap-2 mb-1">
                <div class="relative flex-1">
                    <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                    <input type="text" id="cariBarang" oninput="window.filterInventaris()" placeholder="Cari Barang..." class="w-full pl-9 pr-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-xl outline-none shadow-sm focus:border-emerald-500 text-sm transition-all">
                </div>
            </div>
            
            <div id="list-barang" class="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 pb-32"></div>
            
            <button onclick="window.bukaHalamanEdit(null)" class="fixed bottom-24 right-4 md:right-[calc(50%-26rem)] bg-emerald-500 text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-3 font-bold z-40 active:scale-95 transition-all text-sm border-none">
                <i class="fa-solid fa-box-open text-lg"></i> <span>Tambah Barang</span>
            </button>
        </div>

        <div id="view-detail" class="hidden fixed inset-0 bg-white z-[60] overflow-y-auto pb-32">
            <div class="${desktopWidth} mx-auto min-h-screen bg-white shadow-2xl border-x">
                <div class="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                    <button onclick="window.switchView('view-list')" class="p-2 text-gray-600"><i class="fa-solid fa-arrow-left text-xl"></i></button>
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
                    <button onclick="window.batalEdit()" class="p-2 text-gray-600 mr-4"><i class="fa-solid fa-arrow-left text-xl"></i></button>
                    <h3 id="edit-title" class="font-bold text-lg text-gray-800">Tambah Barang</h3>
                </div>

                <div class="p-4 space-y-4 flex-1">
                    <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-5">
                        <div class="relative">
                            <label class="absolute -top-2 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest z-10">Nama Barang</label>
                            <input type="text" id="edit-nama" oninput="window.deteksiInput(this.value)" placeholder="Masukkan nama barang" class="w-full p-4 border rounded-xl border-gray-200 outline-none focus:border-emerald-500 font-bold text-gray-700 transition-all">
                        </div>

                        <div onclick="window.bukaPickerKategori()" class="p-4 border border-gray-200 rounded-xl flex justify-between items-center cursor-pointer active:bg-gray-50 transition-all">
                            <div>
                                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Kategori</p>
                                <input type="text" id="edit-kategori" class="font-bold text-gray-700 outline-none pointer-events-none text-base" placeholder="Pilih Kategori" readonly>
                            </div>
                            <i class="fa-solid fa-chevron-right text-gray-300"></i>
                        </div>
                    </div>

                    <div id="tab-container" class="space-y-4 opacity-40 pointer-events-none transition-all duration-300">
                        <div class="flex border-b border-gray-200">
                            <button class="flex-1 py-3 text-emerald-600 font-bold border-b-2 border-emerald-500 text-sm uppercase tracking-tighter">Detail Stok</button>
                            <button class="flex-1 py-3 text-gray-400 font-bold text-sm uppercase tracking-tighter">Detail Tambahan</button>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Stok Awal</label>
                                <input type="number" id="edit-stok" class="w-full mt-1 outline-none font-bold text-gray-700 text-sm" placeholder="0">
                            </div>
                            <div onclick="window.bukaPickerSatuan()" class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center cursor-pointer">
                                <div>
                                    <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Satuan</label>
                                    <input type="text" id="edit-satuan" value="PCS" class="w-full mt-1 outline-none font-bold text-gray-700 text-sm pointer-events-none" readonly>
                                </div>
                                <i class="fa-solid fa-chevron-right text-gray-300 text-[10px]"></i>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Harga Jual</label>
                                <div class="flex items-center gap-1 font-bold text-gray-700 text-sm">
                                    <span>Rp</span><input type="number" id="edit-jual" class="w-full outline-none" placeholder="0">
                                </div>
                            </div>
                            <div class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Harga Beli</label>
                                <div class="flex items-center gap-1 font-bold text-gray-700 text-sm">
                                    <span>Rp</span><input type="number" id="edit-beli" class="w-full outline-none" placeholder="0">
                                </div>
                            </div>
                        </div>

                        <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                            <div class="flex items-center gap-3">
                                <i class="fa-solid fa-bell text-emerald-500"></i>
                                <span class="font-bold text-gray-700 text-sm">Peringatan Stok Rendah</span>
                            </div>
                            <div class="w-10 h-5 bg-gray-200 rounded-full relative p-1 cursor-pointer">
                                <div class="w-3 h-3 bg-white rounded-full transition-all"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="p-4 bg-gray-50 border-t flex justify-center sticky bottom-0 z-20">
                    <button onclick="window.simpanPerubahanBarang()" class="w-full ${desktopWidth} bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all uppercase tracking-widest">Simpan</button>
                </div>
            </div>
        </div>

        <div id="picker-kategori" class="hidden fixed inset-0 bg-black/50 z-[100] flex items-end justify-center overflow-hidden">
            <div class="bg-white w-full ${desktopWidth} rounded-t-3xl animate-slide-up flex flex-col h-[70vh]">
                <div class="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3 flex-shrink-0"></div>
                <div class="px-6 pb-4 border-b">
                    <h3 class="font-bold text-xl text-gray-800">Pilih Kategori Barang</h3>
                </div>
                <div class="overflow-y-auto px-6 py-2 flex-1">
                    ${daftarKategori.map(kat => `
                        <div onclick="window.pilihKategori('${kat}')" class="py-4 border-b border-gray-50 font-bold text-gray-700 active:text-emerald-600 cursor-pointer transition-all">${kat}</div>
                    `).join('')}
                </div>
                <div class="p-6"><button onclick="window.tutupPickerKategori()" class="w-full py-4 text-gray-400 font-bold">Tutup</button></div>
            </div>
        </div>
    `;

    onValue(ref(db, 'products'), (snap) => {
        databaseBarang = snap.val() || {};
        window.filterInventaris();
    });
}

// LOGIKA TAMBAH BARANG DINAMIS (Gambar 7 & 8)
window.deteksiInput = (val) => {
    const tabContainer = document.getElementById('tab-container');
    if (val.trim().length > 0) {
        tabContainer.classList.remove('opacity-40', 'pointer-events-none');
    } else {
        tabContainer.classList.add('opacity-40', 'pointer-events-none');
    }
};

window.filterInventaris = () => {
    const keyword = document.getElementById('cariBarang')?.value.toLowerCase() || "";
    const listDiv = document.getElementById('list-barang');
    if (!listDiv) return;
    listDiv.innerHTML = "";
    Object.entries(databaseBarang).forEach(([id, item]) => {
        if (item.nama.toLowerCase().includes(keyword)) {
            const inisial = item.nama.substring(0, 2).toUpperCase();
            listDiv.innerHTML += `
                <div onclick="window.bukaDetailBarang('${id}')" class="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm active:bg-gray-50 flex flex-col gap-2 transition-all cursor-pointer">
                    <div class="flex gap-3 items-center">
                        <div class="w-11 h-11 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">${inisial}</div>
                        <div class="flex-1 overflow-hidden">
                            <h4 class="font-bold text-gray-800 text-sm leading-tight truncate">${item.nama}</h4>
                            <span class="text-[9px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded font-bold uppercase border border-gray-100 tracking-tighter">${item.kategori || 'Umum'}</span>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-1 border-t pt-2 mt-1">
                        <div><p class="text-[8px] text-gray-400 font-bold uppercase mb-0.5">Jual</p><p class="text-[11px] font-bold text-gray-700">Rp ${Number(item.harga_jual).toLocaleString()}</p></div>
                        <div><p class="text-[8px] text-gray-400 font-bold uppercase mb-0.5">Beli</p><p class="text-[11px] font-bold text-gray-700">Rp ${Number(item.harga_beli).toLocaleString()}</p></div>
                        <div class="text-right"><p class="text-[8px] text-gray-400 font-bold uppercase mb-0.5">Stok</p><p class="text-[11px] font-black text-emerald-700">${item.stok} ${item.satuan}</p></div>
                    </div>
                </div>`;
        }
    });
};

window.bukaDetailBarang = (id) => {
    const item = databaseBarang[id];
    window.switchView('view-detail');
    document.getElementById('detail-render').innerHTML = `
        <div class="flex justify-between items-start mb-6 animate-fadeIn">
            <div class="flex gap-4">
                <div class="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg">${item.nama.substring(0,2).toUpperCase()}</div>
                <div><h3 class="text-2xl font-bold text-gray-800">${item.nama}</h3><p class="text-sm text-gray-400 font-medium">Kuantitas: <span class="text-emerald-600 font-bold">${item.stok} ${item.satuan}</span></p></div>
            </div>
            <span class="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold uppercase border border-gray-200">${item.kategori || 'Umum'}</span>
        </div>
        `;
    document.getElementById('btnKeEdit').onclick = () => window.bukaHalamanEdit(id);
    document.getElementById('btnHapus').onclick = () => { if(confirm('Hapus barang?')) remove(ref(db, 'products/'+id)).then(() => window.switchView('view-list')); };
};

window.bukaHalamanEdit = (id) => {
    currentEditId = id; 
    window.switchView('view-edit');
    if (id) {
        const item = databaseBarang[id];
        document.getElementById('edit-title').innerText = "Ubah Barang";
        document.getElementById('edit-nama').value = item.nama;
        document.getElementById('edit-kategori').value = item.kategori;
        document.getElementById('edit-satuan').value = item.satuan;
        document.getElementById('edit-jual').value = item.harga_jual;
        document.getElementById('edit-beli').value = item.harga_beli;
        document.getElementById('edit-stok').value = item.stok;
        window.deteksiInput(item.nama);
    } else {
        document.getElementById('edit-title').innerText = "Tambah Barang";
        ['edit-nama', 'edit-kategori', 'edit-jual', 'edit-beli', 'edit-stok'].forEach(el => document.getElementById(el).value = "");
        document.getElementById('edit-satuan').value = "PCS";
        window.deteksiInput("");
    }
};

window.bukaPickerKategori = () => document.getElementById('picker-kategori').classList.remove('hidden');
window.tutupPickerKategori = () => document.getElementById('picker-kategori').classList.add('hidden');
window.pilihKategori = (kat) => { document.getElementById('edit-kategori').value = kat; window.tutupPickerKategori(); };
window.switchView = (viewId) => { ['view-list', 'view-detail', 'view-edit'].forEach(id => document.getElementById(id).classList.add('hidden')); document.getElementById(viewId).classList.remove('hidden'); };
window.batalEdit = () => currentEditId ? window.switchView('view-detail') : window.switchView('view-list');

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
    if (currentEditId) { await update(ref(db, `products/${currentEditId}`), data); window.bukaDetailBarang(currentEditId); }
    else { await set(push(ref(db, 'products')), data); window.switchView('view-list'); }
};