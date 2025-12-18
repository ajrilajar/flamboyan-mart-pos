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
            
            <button onclick="window.bukaHalamanEdit(null)" class="fixed bottom-24 right-4 md:right-[calc(50%-26rem)] bg-emerald-500 text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-2 font-bold z-40 border-4 border-white active:scale-95 transition-all text-sm">
                <i class="fa-solid fa-box-open"></i> <span>Tambah Barang</span>
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
                <div class="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-center z-20">
                    <div class="w-full ${desktopWidth} p-3 sm:p-4 flex gap-2 sm:gap-3">
                        <button class="flex-1 bg-emerald-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2"><i class="fa-solid fa-box-open"></i> Stok Masuk</button>
                        <button class="flex-1 bg-rose-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2"><i class="fa-solid fa-box-archive"></i> Stok Keluar</button>
                    </div>
                </div>
            </div>
        </div>

        <div id="view-edit" class="hidden fixed inset-0 bg-gray-50 z-[70] overflow-y-auto pb-24">
            <div class="${desktopWidth} mx-auto min-h-screen bg-gray-50 shadow-2xl border-x">
                <div class="flex items-center p-4 bg-white border-b sticky top-0 z-10">
                    <button onclick="window.batalEdit()" class="p-2 text-gray-600 mr-4"><i class="fa-solid fa-arrow-left text-xl"></i></button>
                    <h3 id="edit-title" class="font-bold text-lg text-gray-800">Ubah Barang</h3>
                </div>
                <div class="p-3 sm:p-4 space-y-3 sm:space-y-4">
                    <div class="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm">
                        <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Nama Barang</label>
                        <input type="text" id="edit-nama" class="w-full mt-1 font-bold text-gray-700 outline-none border-b border-gray-50 focus:border-emerald-500 py-0.5 text-sm sm:text-base">
                    </div>
                    <div onclick="window.bukaPickerKategori()" class="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center cursor-pointer active:bg-gray-50">
                        <div>
                            <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Kategori</label>
                            <input type="text" id="edit-kategori" class="w-full mt-1 font-bold text-gray-700 outline-none pointer-events-none text-sm" readonly>
                        </div>
                        <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                    </div>
                    </div>
                <div class="p-4 fixed bottom-0 left-0 right-0 bg-gray-50 border-t flex justify-center">
                    <button onclick="window.simpanPerubahanBarang()" class="w-full ${desktopWidth} bg-emerald-500 text-white py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all">Simpan Perubahan Barang</button>
                </div>
            </div>
        </div>
    `;

    // Pastikan listener Firebase mengarah ke fungsi filter yang baru
    onValue(ref(db, 'products'), (snap) => {
        databaseBarang = snap.val() || {};
        window.filterInventaris();
    });
}

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
                        <div class="w-11 h-11 sm:w-14 sm:h-14 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center font-bold text-sm sm:text-xl flex-shrink-0">${inisial}</div>
                        <div class="flex-1 overflow-hidden">
                            <h4 class="font-bold text-gray-800 text-sm sm:text-lg leading-tight truncate">${item.nama}</h4>
                            <span class="text-[9px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded font-bold uppercase border border-gray-100 tracking-tighter">${item.kategori || 'Umum'}</span>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-1 sm:gap-2 border-t pt-2 mt-1">
                        <div><p class="text-[8px] text-gray-400 font-bold uppercase mb-0.5 tracking-tighter">Jual</p><p class="text-[11px] sm:text-sm font-bold text-gray-700">Rp ${Number(item.harga_jual).toLocaleString()}</p></div>
                        <div><p class="text-[8px] text-gray-400 font-bold uppercase mb-0.5 tracking-tighter">Beli</p><p class="text-[11px] sm:text-sm font-bold text-gray-700">Rp ${Number(item.harga_beli).toLocaleString()}</p></div>
                        <div class="text-right"><p class="text-[8px] text-gray-400 font-bold uppercase mb-0.5 tracking-tighter">Stok</p><p class="text-[11px] sm:text-sm font-black ${item.stok <= 0 ? 'text-rose-500' : 'text-emerald-700'}">${item.stok} ${item.satuan}</p></div>
                    </div>
                </div>`;
        }
    });
};

window.bukaDetailBarang = (id) => {
    const item = databaseBarang[id];
    window.switchView('view-detail');
    document.getElementById('detail-render').innerHTML = `
        <div class="flex justify-between items-start mb-4 animate-fadeIn">
            <div class="flex gap-3">
                <div class="w-14 h-14 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">${item.nama.substring(0,2).toUpperCase()}</div>
                <div><h3 class="text-xl font-bold text-gray-800 leading-tight">${item.nama}</h3><p class="text-xs text-gray-400 font-medium">Kuantitas: <span class="text-emerald-600 font-bold">${item.stok} ${item.satuan}</span></p></div>
            </div>
            <span class="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-bold uppercase border border-gray-100 tracking-widest">${item.kategori || 'Umum'}</span>
        </div>
        <div class="grid grid-cols-3 gap-2 mb-4">
            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <p class="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Harga Jual</p>
                <p class="text-xs font-bold text-gray-700">Rp ${Number(item.harga_jual).toLocaleString()}</p>
            </div>
            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <p class="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Harga Beli</p>
                <p class="text-xs font-bold text-gray-700">Rp ${Number(item.harga_beli).toLocaleString()}</p>
            </div>
            <div class="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                <p class="text-[9px] text-emerald-600 font-bold uppercase mb-0.5">Nilai Stok</p>
                <p class="text-xs font-bold text-emerald-700">Rp ${(item.stok * item.harga_beli).toLocaleString()}</p>
            </div>
        </div>
        <div class="flex border-b border-gray-100 mb-6">
            <button class="flex-1 py-3 border-b-2 border-emerald-500 text-emerald-600 font-bold text-[10px] uppercase tracking-widest">Aktivitas Barang</button>
            <button class="flex-1 py-3 text-gray-400 font-bold text-[10px] uppercase tracking-widest">Detail Barang</button>
        </div>
    `;
    document.getElementById('btnKeEdit').onclick = () => window.bukaHalamanEdit(id);
    document.getElementById('btnHapus').onclick = () => { if(confirm('Hapus barang ini secara permanen?')) remove(ref(db, 'products/'+id)).then(() => window.switchView('view-list')); };
};

window.simpanPerubahanBarang = async () => {
    const data = {
        nama: document.getElementById('edit-nama').value,
        kategori: document.getElementById('edit-kategori').value,
        satuan: (document.getElementById('edit-satuan')?.value || "PCS").toUpperCase(),
        harga_jual: Number(document.getElementById('edit-jual')?.value || 0),
        harga_beli: Number(document.getElementById('edit-beli')?.value || 0),
        limit: Number(document.getElementById('edit-limit')?.value || 10),
        stok: currentEditId ? databaseBarang[currentEditId].stok : 0,
        updatedAt: Date.now()
    };
    if (currentEditId) { 
        await update(ref(db, `products/${currentEditId}`), data); 
        window.bukaDetailBarang(currentEditId); 
    } else { 
        await set(push(ref(db, 'products')), data); 
        window.switchView('view-list'); 
    }
};

// Fungsi navigasi standar...
window.switchView = (viewId) => {
    ['view-list', 'view-detail', 'view-edit'].forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
};