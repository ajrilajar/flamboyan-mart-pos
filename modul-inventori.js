import { ref, onValue, push, set, remove, update } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { db } from "./firebase-config.js";

let databaseBarang = {};
let currentEditId = null;

// Daftar Kategori sesuai gambar INVENTORI 5.jpeg
let daftarKategori = [
    "Palen", "Sabun Cuci", "Obat Nyamuk", "Shampoo", 
    "Sabun", "Obat", "Sembako", "Snack", 
    "Sampo Saset", "Minuman"
];

export function renderInventori() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div id="view-list" class="flex flex-col gap-4 max-w-7xl mx-auto p-4 animate-fadeIn">
            <div class="flex justify-between items-center mb-2 px-1">
                <h2 class="text-2xl font-bold text-gray-800">Inventaris</h2>
                <button class="p-2 text-emerald-600"><i class="fa-solid fa-gear text-xl"></i></button>
            </div>
            <div class="flex gap-2 mb-2">
                <div class="relative flex-1">
                    <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input type="text" id="cariBarang" oninput="window.filterInventori()" placeholder="Cari Barang..." class="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none shadow-sm focus:border-emerald-500">
                </div>
                <button class="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-600 shadow-sm"><i class="fa-solid fa-sliders"></i></button>
            </div>
            <div id="list-barang" class="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-32"></div>
            <button onclick="window.bukaHalamanEdit(null)" class="fixed bottom-24 right-6 bg-emerald-500 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold z-40 active:scale-95 border-4 border-white">
                <i class="fa-solid fa-box-open"></i> Tambah Barang
            </button>
        </div>

        <div id="view-detail" class="hidden fixed inset-0 bg-white z-[60] overflow-y-auto">
            <div class="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                <button onclick="window.switchView('view-list')" class="p-2 text-gray-600"><i class="fa-solid fa-arrow-left text-xl"></i></button>
                <div class="flex gap-2">
                    <button id="btnKeEdit" class="p-2 text-gray-500"><i class="fa-solid fa-pen text-lg"></i></button>
                    <button id="btnHapus" class="p-2 text-rose-400"><i class="fa-solid fa-trash-can text-lg"></i></button>
                </div>
            </div>
            <div id="detail-render" class="p-5 pb-32"></div>
            <div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex gap-3 z-20">
                <button class="flex-1 bg-emerald-500 text-white py-4 rounded-full font-bold shadow-lg flex items-center justify-center gap-2"><i class="fa-solid fa-box-open"></i> Tambah Stok</button>
                <button class="flex-1 bg-rose-500 text-white py-4 rounded-full font-bold shadow-lg flex items-center justify-center gap-2"><i class="fa-solid fa-box-archive"></i> Kurangi Stok</button>
            </div>
        </div>

        <div id="view-edit" class="hidden fixed inset-0 bg-gray-50 z-[70] overflow-y-auto">
            <div class="flex items-center p-4 bg-white border-b sticky top-0 z-10">
                <button onclick="window.batalEdit()" class="p-2 text-gray-600 mr-4"><i class="fa-solid fa-arrow-left text-xl"></i></button>
                <h3 id="edit-title" class="font-bold text-lg text-gray-800">Ubah Barang</h3>
            </div>
            <div class="p-4 space-y-4">
                <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <label class="text-[10px] font-bold text-gray-400 uppercase">Nama Barang</label>
                    <input type="text" id="edit-nama" class="w-full mt-1 font-bold text-gray-700 outline-none border-b border-gray-50 focus:border-emerald-500 py-1">
                </div>
                
                <div onclick="window.bukaPickerKategori()" class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center cursor-pointer active:bg-gray-50">
                    <div>
                        <label class="text-[10px] font-bold text-gray-400 uppercase">Kategori</label>
                        <input type="text" id="edit-kategori" class="w-full mt-1 font-bold text-gray-700 outline-none pointer-events-none" placeholder="Pilih Kategori" readonly>
                    </div>
                    <i class="fa-solid fa-chevron-right text-gray-300"></i>
                </div>

                <div class="flex border-b">
                    <button class="flex-1 py-3 text-emerald-600 font-bold border-b-2 border-emerald-500 text-sm uppercase">Detail Stok</button>
                    <button class="flex-1 py-3 text-gray-400 font-bold text-sm uppercase">Detail Tambahan</button>
                </div>

                <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                    <div class="flex-1">
                        <label class="text-[10px] font-bold text-gray-400 uppercase">Satuan</label>
                        <input type="text" id="edit-satuan" class="w-full mt-1 font-bold text-gray-700 outline-none uppercase" placeholder="PCS">
                    </div>
                    <i class="fa-solid fa-chevron-right text-gray-300"></i>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <label class="text-[10px] font-bold text-gray-400 uppercase">Harga Jual</label>
                        <div class="flex items-center gap-1 mt-1 font-bold text-gray-700"><span>Rp</span><input type="number" id="edit-jual" class="w-full outline-none"></div>
                    </div>
                    <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <label class="text-[10px] font-bold text-gray-400 uppercase">Harga Beli</label>
                        <div class="flex items-center gap-1 mt-1 font-bold text-gray-700"><span>Rp</span><input type="number" id="edit-beli" class="w-full outline-none"></div>
                    </div>
                </div>

                <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                    <div class="flex items-center gap-3"><i class="fa-solid fa-bell text-emerald-500"></i><span class="font-bold text-gray-700">Peringatan Stok Rendah</span></div>
                    <div class="w-10 h-5 bg-emerald-500 rounded-full relative p-1"><div class="w-3 h-3 bg-white rounded-full ml-auto"></div></div>
                </div>

                <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <label class="text-[10px] font-bold text-gray-400 uppercase">Jumlah Stok Rendah</label>
                    <input type="number" id="edit-limit" class="w-full mt-1 font-bold text-gray-700 outline-none" placeholder="10">
                </div>
            </div>
            <div class="p-4 sticky bottom-0 bg-gray-50 border-t">
                <button onclick="window.simpanPerubahan()" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all uppercase">Perbarui Barang</button>
            </div>
        </div>

        <div id="picker-kategori" class="hidden fixed inset-0 bg-black/50 z-[100] flex items-end justify-center">
            <div class="bg-white w-full max-w-md rounded-t-3xl animate-slide-up flex flex-col max-h-[85vh]">
                <div class="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3"></div>
                
                <div class="px-6 pb-4">
                    <h3 class="font-bold text-xl text-gray-800 mb-4">Pilih Kategori Barang</h3>
                    <div class="relative mb-4">
                        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input type="text" id="cariKategori" oninput="window.filterKategoriList()" placeholder="Cari Kategori" class="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-emerald-500">
                    </div>
                </div>

                <div id="list-kategori-picker" class="overflow-y-auto px-6 space-y-1 flex-1">
                    </div>

                <div class="p-6 border-t">
                    <button onclick="window.tambahKategoriBaru()" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
                        <i class="fa-solid fa-plus"></i> Tambah Kategori Baru
                    </button>
                </div>
            </div>
        </div>
    `;

    onValue(ref(db, 'products'), (snap) => {
        databaseBarang = snap.val() || {};
        window.filterInventori();
    });
}

// Logika Navigasi
window.switchView = (viewId) => {
    ['view-list', 'view-detail', 'view-edit'].forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
};

// Picker Kategori Logic
window.bukaPickerKategori = () => {
    document.getElementById('picker-kategori').classList.remove('hidden');
    window.renderKategoriList();
};

window.tutupPickerKategori = () => document.getElementById('picker-kategori').classList.add('hidden');

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
                    <div class="w-5 h-5 rounded-full border-2 ${isSelected ? 'border-emerald-500 bg-emerald-500 ring-2 ring-emerald-100' : 'border-gray-200'} flex items-center justify-center">
                        ${isSelected ? '<i class="fa-solid fa-check text-[10px] text-white"></i>' : ''}
                    </div>
                </div>
            `;
        }
    });
};

window.filterKategoriList = () => window.renderKategoriList();

window.pilihKategori = (kat) => {
    document.getElementById('edit-kategori').value = kat;
    window.tutupPickerKategori();
};

window.tambahKategoriBaru = () => {
    const nama = prompt("Masukkan Nama Kategori Baru:");
    if (nama && !daftarKategori.includes(nama)) {
        daftarKategori.unshift(nama);
        window.pilihKategori(nama);
    }
};

// Sisanya (List, Detail, Simpan) tetap konsisten dengan Patch sebelumnya
window.filterInventori = () => {
    const keyword = document.getElementById('cariBarang')?.value.toLowerCase() || "";
    const listDiv = document.getElementById('list-barang');
    if (!listDiv) return;
    listDiv.innerHTML = "";
    Object.entries(databaseBarang).forEach(([id, item]) => {
        if (item.nama.toLowerCase().includes(keyword)) {
            const inisial = item.nama.substring(0, 2).toUpperCase();
            listDiv.innerHTML += `
                <div onclick="window.bukaDetail('${id}')" class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm active:bg-gray-50 flex flex-col gap-3">
                    <div class="flex justify-between items-start">
                        <div class="flex gap-3">
                            <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-400 text-lg">${inisial}</div>
                            <div>
                                <h4 class="font-bold text-gray-800">${item.nama}</h4>
                                <span class="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded font-bold uppercase">${item.kategori || 'Umum'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-2 border-t pt-3">
                        <div><p class="text-[9px] text-gray-400 font-bold uppercase">Jual</p><p class="text-xs font-bold">Rp ${Number(item.harga_jual).toLocaleString()}</p></div>
                        <div><p class="text-[9px] text-gray-400 font-bold uppercase">Beli</p><p class="text-xs font-bold">Rp ${Number(item.harga_beli).toLocaleString()}</p></div>
                        <div class="text-right"><p class="text-[9px] text-gray-400 font-bold uppercase">Stok</p><p class="text-xs font-bold ${item.stok <= (item.limit || 0) ? 'text-rose-500' : 'text-gray-700'}">${item.stok} ${item.satuan}</p></div>
                    </div>
                </div>`;
        }
    });
};

window.bukaDetail = (id) => {
    const item = databaseBarang[id];
    window.switchView('view-detail');
    document.getElementById('detail-render').innerHTML = `
        <div class="flex justify-between items-start mb-6">
            <div class="flex gap-4">
                <div class="w-16 h-16 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-2xl shadow-lg">${item.nama.substring(0,2).toUpperCase()}</div>
                <div><h3 class="text-xl font-bold text-gray-800">${item.nama}</h3><p class="text-sm text-gray-400 font-medium">Kuantitas: <span class="text-gray-800 font-bold">${item.stok} ${item.satuan}</span></p></div>
            </div>
            <span class="px-3 py-1 bg-gray-100 text-gray-500 rounded text-xs font-bold uppercase">${item.kategori || 'Umum'}</span>
        </div>
        <div class="grid grid-cols-3 gap-4 mb-6">
            <div><p class="text-[10px] text-gray-400 font-bold uppercase">Jual</p><p class="font-bold">Rp ${item.harga_jual.toLocaleString()}</p></div>
            <div><p class="text-[10px] text-gray-400 font-bold uppercase">Beli</p><p class="font-bold">Rp ${item.harga_beli.toLocaleString()}</p></div>
            <div><p class="text-[10px] text-gray-400 font-bold uppercase">Nilai Stok</p><p class="font-bold text-emerald-600">Rp ${(item.stok * item.harga_beli).toLocaleString()}</p></div>
        </div>
        <div class="flex border-b mb-6"><button class="flex-1 py-3 border-b-2 border-emerald-500 text-emerald-600 font-bold text-sm">Aktivitas Item</button><button class="flex-1 py-3 text-gray-400 font-bold text-sm">Detail Barang</button></div>
    `;
    document.getElementById('btnKeEdit').onclick = () => window.bukaHalamanEdit(id);
    document.getElementById('btnHapus').onclick = () => { if(confirm('Hapus?')) remove(ref(db, 'products/'+id)).then(() => window.switchView('view-list')); };
};

window.bukaHalamanEdit = (id) => {
    currentEditId = id;
    window.switchView('view-edit');
    if (id) {
        const item = databaseBarang[id];
        document.getElementById('edit-title').innerText = "Ubah Barang";
        document.getElementById('edit-nama').value = item.nama;
        document.getElementById('edit-kategori').value = item.kategori || "";
        document.getElementById('edit-satuan').value = item.satuan;
        document.getElementById('edit-jual').value = item.harga_jual;
        document.getElementById('edit-beli').value = item.harga_beli;
        document.getElementById('edit-limit').value = item.limit || 10;
    } else {
        document.getElementById('edit-title').innerText = "Tambah Barang";
        ['edit-nama', 'edit-kategori', 'edit-satuan', 'edit-jual', 'edit-beli', 'edit-limit'].forEach(el => document.getElementById(el).value = "");
    }
};

window.batalEdit = () => currentEditId ? window.switchView('view-detail') : window.switchView('view-list');

window.simpanPerubahan = async () => {
    const data = {
        nama: document.getElementById('edit-nama').value,
        kategori: document.getElementById('edit-kategori').value,
        satuan: document.getElementById('edit-satuan').value.toUpperCase(),
        harga_jual: Number(document.getElementById('edit-jual').value),
        harga_beli: Number(document.getElementById('edit-beli').value),
        limit: Number(document.getElementById('edit-limit').value),
        stok: currentEditId ? databaseBarang[currentEditId].stok : 0,
        updatedAt: Date.now()
    };
    if (currentEditId) {
        await update(ref(db, `products/${currentEditId}`), data);
        window.bukaDetail(currentEditId);
    } else {
        await set(push(ref(db, 'products')), data);
        window.switchView('view-list');
    }
};