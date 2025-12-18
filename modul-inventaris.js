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
            
            <button onclick="window.bukaHalamanEdit(null)" class="fixed bottom-24 right-4 md:right-[calc(50%-26rem)] bg-emerald-500 text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-3 font-bold z-40 active:scale-95 transition-all text-sm">
                <i class="fa-solid fa-box-open text-lg"></i> <span>Tambah Barang</span>
            </button>
        </div>

        <div id="view-edit" class="hidden fixed inset-0 bg-white z-[70] overflow-y-auto pb-24">
            <div class="${desktopWidth} mx-auto min-h-screen bg-white shadow-2xl border-x flex flex-col">
                <div class="flex items-center p-4 bg-white sticky top-0 z-10">
                    <button onclick="window.batalEdit()" class="p-2 text-gray-600 mr-4"><i class="fa-solid fa-arrow-left text-xl"></i></button>
                    <h3 id="edit-title" class="font-bold text-lg text-gray-800">Tambah Barang</h3>
                </div>

                <div class="p-4 space-y-5 flex-1">
                    <div class="relative">
                        <label class="absolute -top-2.5 left-3 px-1 bg-white text-[11px] font-bold text-gray-400 uppercase tracking-widest z-10">Nama Barang</label>
                        <input type="text" id="edit-nama" oninput="window.deteksiInputBarang(this.value)" placeholder="Nama Barang" class="w-full p-4 border rounded-xl border-gray-200 outline-none focus:border-emerald-500 font-bold text-gray-700 transition-all">
                    </div>

                    <div id="konten-tambah-barang" class="hidden space-y-5 animate-fadeIn">
                        <div onclick="window.bukaPickerKategori()" class="p-4 border border-gray-200 rounded-xl flex justify-between items-center cursor-pointer">
                            <div>
                                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Kategori</p>
                                <input type="text" id="edit-kategori" class="font-bold text-gray-700 outline-none pointer-events-none text-base" placeholder="Pilih Kategori" readonly>
                            </div>
                            <i class="fa-solid fa-chevron-right text-gray-300"></i>
                        </div>

                        <div class="flex border-b border-gray-200">
                            <button class="flex-1 py-3 text-emerald-600 font-bold border-b-2 border-emerald-500 text-sm uppercase">Detail Stok</button>
                            <button class="flex-1 py-3 text-gray-400 font-bold text-sm uppercase">Detail Tambahan</button>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <label class="text-[9px] font-bold text-gray-400 uppercase">Stok Awal</label>
                                <input type="number" id="edit-stok" class="w-full bg-transparent outline-none font-bold text-gray-700" placeholder="Stok Awal">
                            </div>
                            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                                <div class="flex-1">
                                    <label class="text-[9px] font-bold text-gray-400 uppercase">Satuan</label>
                                    <input type="text" id="edit-satuan" value="PCS" class="w-full bg-transparent outline-none font-bold text-gray-700" placeholder="Satuan">
                                </div>
                                <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <label class="text-[9px] font-bold text-gray-400 uppercase">Harga Jual</label>
                                <input type="number" id="edit-jual" class="w-full bg-transparent outline-none font-bold text-gray-700" placeholder="Harga Jual">
                            </div>
                            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <label class="text-[9px] font-bold text-gray-400 uppercase">Harga Beli</label>
                                <input type="number" id="edit-beli" class="w-full bg-transparent outline-none font-bold text-gray-700" placeholder="Harga Beli">
                            </div>
                            <div class="col-span-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <label class="text-[9px] font-bold text-gray-400 uppercase">Harga Eceran</label>
                                <input type="number" id="edit-eceran" class="w-full bg-transparent outline-none font-bold text-gray-700" placeholder="Harga Eceran">
                            </div>
                            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <label class="text-[9px] font-bold text-gray-400 uppercase">Harga Grosir</label>
                                <input type="number" id="edit-grosir" class="w-full bg-transparent outline-none font-bold text-gray-700" placeholder="Harga Grosir">
                            </div>
                            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <label class="text-[9px] font-bold text-gray-400 uppercase">Jumlah Minimum ...</label>
                                <input type="number" id="edit-min" class="w-full bg-transparent outline-none font-bold text-gray-700" placeholder="0">
                            </div>
                        </div>

                        <div class="flex justify-between items-center py-2">
                            <div class="flex items-center gap-2">
                                <i class="fa-solid fa-bell text-emerald-500"></i>
                                <span class="font-bold text-gray-700 text-sm">Peringatan Stok Rendah</span>
                            </div>
                            <div class="w-10 h-5 bg-gray-200 rounded-full relative"><div class="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
                        </div>
                    </div>
                </div>

                <div class="p-4 bg-white border-t sticky bottom-0 z-20">
                    <button id="btn-simpan-barang" onclick="window.simpanPerubahanBarang()" class="w-full bg-gray-100 text-gray-400 py-4 rounded-xl font-bold text-lg transition-all cursor-not-allowed" disabled>Simpan</button>
                </div>
            </div>
        </div>

        <div id="picker-kategori" class="hidden fixed inset-0 bg-black/50 z-[100] flex items-end">
            <div class="bg-white w-full rounded-t-3xl p-6 animate-slide-up max-h-[70vh] overflow-y-auto ${desktopWidth} mx-auto">
                <div class="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
                <h4 class="font-bold text-lg mb-4">Pilih Kategori</h4>
                <div class="grid grid-cols-1 gap-1">
                    ${daftarKategori.map(kat => `<button onclick="window.pilihKategori('${kat}')" class="w-full text-left py-4 border-b border-gray-50 font-bold text-gray-700 active:bg-emerald-50">${kat}</button>`).join('')}
                </div>
                <button onclick="window.tutupPickerKategori()" class="w-full mt-4 py-3 font-bold text-gray-400">Tutup</button>
            </div>
        </div>
    `;

    onValue(ref(db, 'products'), (snap) => {
        databaseBarang = snap.val() || {};
        window.filterInventaris();
    });
}

// LOGIKA DINAMIS TAMBAH BARANG
window.deteksiInputBarang = (val) => {
    const konten = document.getElementById('konten-tambah-barang');
    const btn = document.getElementById('btn-simpan-barang');
    
    if (val.trim().length > 0) {
        konten.classList.remove('hidden');
        btn.classList.replace('bg-gray-100', 'bg-emerald-500');
        btn.classList.replace('text-gray-400', 'text-white');
        btn.disabled = false;
        btn.classList.remove('cursor-not-allowed');
    } else {
        konten.classList.add('hidden');
        btn.classList.replace('bg-emerald-500', 'bg-gray-100');
        btn.classList.replace('text-white', 'text-gray-400');
        btn.disabled = true;
        btn.classList.add('cursor-not-allowed');
    }
};

window.bukaHalamanEdit = (id) => {
    currentEditId = id;
    window.switchView('view-edit');
    if (id) {
        const item = databaseBarang[id];
        document.getElementById('edit-title').innerText = "Ubah Barang";
        document.getElementById('edit-nama').value = item.nama;
        document.getElementById('edit-kategori').value = item.kategori || "";
        document.getElementById('edit-jual').value = item.harga_jual;
        document.getElementById('edit-beli').value = item.harga_beli;
        document.getElementById('edit-stok').value = item.stok;
        document.getElementById('edit-satuan').value = item.satuan;
        window.deteksiInputBarang(item.nama);
    } else {
        document.getElementById('edit-title').innerText = "Tambah Barang";
        window.deteksiInputBarang("");
    }
};

// Fungsi pendukung lainnya...
window.filterInventaris = () => {
    const keyword = document.getElementById('cariBarang')?.value.toLowerCase() || "";
    const listDiv = document.getElementById('list-barang');
    if (!listDiv) return;
    listDiv.innerHTML = "";
    Object.entries(databaseBarang).forEach(([id, item]) => {
        if (item.nama.toLowerCase().includes(keyword)) {
            const inisial = item.nama.substring(0, 2).toUpperCase();
            listDiv.innerHTML += `<div onclick="window.bukaDetailBarang('${id}')" class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm active:bg-gray-50 flex flex-col gap-3 cursor-pointer"><div class="flex gap-3"><div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-400">${inisial}</div><div><h4 class="font-bold text-gray-800">${item.nama}</h4><span class="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded font-bold uppercase">${item.kategori || 'Umum'}</span></div></div><div class="grid grid-cols-3 gap-2 border-t pt-3"><div><p class="text-[9px] text-gray-400 font-bold uppercase">Jual</p><p class="text-xs font-bold text-gray-700">Rp ${Number(item.harga_jual).toLocaleString()}</p></div><div><p class="text-[9px] text-gray-400 font-bold uppercase">Beli</p><p class="text-xs font-bold text-gray-700">Rp ${Number(item.harga_beli).toLocaleString()}</p></div><div class="text-right"><p class="text-[9px] text-gray-400 font-bold uppercase">Stok</p><p class="text-xs font-bold text-emerald-700">${item.stok} ${item.satuan}</p></div></div></div>`;
        }
    });
};

window.bukaDetailBarang = (id) => {
    const item = databaseBarang[id];
    window.switchView('view-detail');
    // Implementasi detail render sesuai INVENTORI 4.jpeg sebelumnya...
};

window.switchView = (viewId) => { ['view-list', 'view-detail', 'view-edit'].forEach(id => document.getElementById(id).classList.add('hidden')); document.getElementById(viewId).classList.remove('hidden'); };
window.bukaPickerKategori = () => document.getElementById('picker-kategori').classList.remove('hidden');
window.tutupPickerKategori = () => document.getElementById('picker-kategori').classList.add('hidden');
window.pilihKategori = (kat) => { document.getElementById('edit-kategori').value = kat; window.tutupPickerKategori(); };
window.batalEdit = () => window.switchView('view-list');

window.simpanPerubahanBarang = async () => {
    const data = {
        nama: document.getElementById('edit-nama').value,
        kategori: document.getElementById('edit-kategori').value,
        satuan: document.getElementById('edit-satuan').value.toUpperCase(),
        harga_jual: Number(document.getElementById('edit-jual').value),
        harga_beli: Number(document.getElementById('edit-beli').value),
        harga_eceran: Number(document.getElementById('edit-eceran').value),
        harga_grosir: Number(document.getElementById('edit-grosir').value),
        stok: Number(document.getElementById('edit-stok').value),
        updatedAt: Date.now()
    };
    if (currentEditId) { await update(ref(db, `products/${currentEditId}`), data); }
    else { await set(push(ref(db, 'products')), data); }
    window.switchView('view-list');
};