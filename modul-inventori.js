import { ref, onValue, push, set, remove, update } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { db } from "./firebase-config.js";

let databaseBarang = {};
let currentEditId = null;

export function renderInventori() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div class="flex flex-col gap-4 max-w-7xl mx-auto p-4">
            <div class="flex justify-between items-center px-1 mb-2">
                <h2 class="text-2xl font-bold text-gray-800">Inventaris</h2>
                <button class="p-2 text-emerald-600 active:scale-90 transition-transform">
                    <i class="fa-solid fa-gear text-xl"></i>
                </button>
            </div>

            <div class="flex gap-2 mb-2">
                <div class="relative flex-1">
                    <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input type="text" id="cariBarang" oninput="window.filterInventori()" 
                        placeholder="Cari Barang..." 
                        class="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500 shadow-sm transition-all">
                </div>
                <button class="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-600 shadow-sm active:bg-gray-100">
                    <i class="fa-solid fa-sliders text-lg"></i>
                </button>
            </div>

            <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-2">
                <button class="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 whitespace-nowrap shadow-sm">Kategori <i class="fa-solid fa-chevron-down ml-1"></i></button>
                <button class="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 whitespace-nowrap shadow-sm">Stok <i class="fa-solid fa-chevron-down ml-1"></i></button>
                <button class="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 whitespace-nowrap shadow-sm">Jenis <i class="fa-solid fa-chevron-down ml-1"></i></button>
            </div>

            <div id="list-barang" class="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-32">
                <p class="col-span-full text-center py-20 text-gray-400">Memuat data...</p>
            </div>
        </div>

        <button onclick="window.bukaModal()" class="fixed bottom-24 right-6 bg-emerald-500 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold z-40 active:scale-95 transition-all">
            <i class="fa-solid fa-box-open"></i> <span>Tambah Barang</span>
        </button>

        <div id="modalBarang" class="fixed inset-0 bg-black/50 z-[100] hidden flex items-end justify-center backdrop-blur-sm">
            <div class="bg-white w-full max-w-md rounded-t-[2.5rem] p-6 animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 id="modalTitle" class="font-bold text-xl text-gray-800">Tambah Barang</h3>
                    <button onclick="window.tutupModal()" class="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-400"><i class="fa-solid fa-xmark text-xl"></i></button>
                </div>
                <div class="space-y-4">
                    <input type="text" id="nama" placeholder="Nama Barang" class="w-full p-4 bg-gray-50 rounded-2xl border focus:border-emerald-500 outline-none">
                    <input type="text" id="kategori" placeholder="Kategori (Sembako, Sabun, dll)" class="w-full p-4 bg-gray-50 rounded-2xl border focus:border-emerald-500 outline-none">
                    <div class="grid grid-cols-2 gap-4">
                        <input type="number" id="beli" placeholder="Harga Pembelian" class="w-full p-4 bg-gray-50 rounded-2xl border focus:border-emerald-500 outline-none">
                        <input type="number" id="jual" placeholder="Harga Penjualan" class="w-full p-4 bg-gray-50 rounded-2xl border focus:border-emerald-500 outline-none">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <input type="number" id="stok" placeholder="Jumlah" class="w-full p-4 bg-gray-50 rounded-2xl border focus:border-emerald-500 outline-none">
                        <input type="text" id="satuan" placeholder="Satuan (PCS/BKS)" class="w-full p-4 bg-gray-50 rounded-2xl border focus:border-emerald-500 outline-none uppercase">
                    </div>
                    <button id="btnSimpan" onclick="window.simpanBarang()" class="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold mt-4 shadow-lg shadow-emerald-50">SIMPAN KE INVENTORI</button>
                </div>
            </div>
        </div>
    `;

    onValue(ref(db, 'products'), (snapshot) => {
        databaseBarang = snapshot.val() || {};
        window.filterInventori();
    });
}

window.filterInventori = () => {
    const keyword = document.getElementById('cariBarang')?.value.toLowerCase() || "";
    const listDiv = document.getElementById('list-barang');
    if (!listDiv) return;

    listDiv.innerHTML = "";
    for (let id in databaseBarang) {
        const item = databaseBarang[id];
        if (item.nama.toLowerCase().includes(keyword)) {
            const inisial = item.nama.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            listDiv.innerHTML += `
                <div onclick="window.opsiBarang('${id}')" class="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col gap-4 shadow-sm active:bg-gray-50 cursor-pointer group">
                    <div class="flex justify-between items-start">
                        <div class="flex gap-4">
                            <div class="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-500 text-xl">${inisial}</div>
                            <div>
                                <h4 class="font-bold text-gray-800 text-lg leading-tight mb-1">${item.nama}</h4>
                                <span class="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-md uppercase font-bold border border-gray-200">${item.kategori || 'Umum'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-2 pt-4 border-t border-gray-50">
                        <div><p class="text-[10px] text-gray-400 font-bold uppercase mb-1">Penjualan</p><p class="text-sm font-bold text-gray-700">Rp ${Number(item.harga_jual).toLocaleString('id-ID')}</p></div>
                        <div><p class="text-[10px] text-gray-400 font-bold uppercase mb-1">Pembelian</p><p class="text-sm font-bold text-gray-700">Rp ${Number(item.harga_beli).toLocaleString('id-ID')}</p></div>
                        <div class="text-right"><p class="text-[10px] text-gray-400 font-bold uppercase mb-1">Jumlah</p><p class="text-sm font-extrabold ${item.stok <= 0 ? 'text-red-500' : 'text-gray-800'}">${item.stok} ${item.satuan || 'PCS'}</p></div>
                    </div>
                </div>`;
        }
    }
};

// Modal Functions tetap sama agar fungsi Simpan/Edit tidak rusak
window.bukaModal = () => document.getElementById('modalBarang').classList.remove('hidden');
window.tutupModal = () => {
    document.getElementById('modalBarang').classList.add('hidden');
    currentEditId = null;
    ['nama', 'kategori', 'beli', 'jual', 'stok', 'satuan'].forEach(id => document.getElementById(id).value = "");
    document.getElementById('modalTitle').innerText = "Tambah Barang";
};

window.opsiBarang = (id) => {
    const item = databaseBarang[id];
    const action = confirm(`Aksi untuk ${item.nama}:\n\nOK untuk EDIT\nCANCEL untuk HAPUS`);
    if (action) {
        currentEditId = id;
        window.bukaModal();
        document.getElementById('modalTitle').innerText = "Edit Barang";
        document.getElementById('nama').value = item.nama;
        document.getElementById('kategori').value = item.kategori || "";
        document.getElementById('beli').value = item.harga_beli;
        document.getElementById('jual').value = item.harga_jual;
        document.getElementById('stok').value = item.stok;
        document.getElementById('satuan').value = item.satuan;
    } else if (confirm(`Hapus ${item.nama}?`)) {
        remove(ref(db, 'products/' + id));
    }
};

window.simpanBarang = async () => {
    const data = {
        nama: document.getElementById('nama').value,
        kategori: document.getElementById('kategori').value,
        harga_beli: Number(document.getElementById('beli').value),
        harga_jual: Number(document.getElementById('jual').value),
        stok: Number(document.getElementById('stok').value),
        satuan: document.getElementById('satuan').value.toUpperCase(),
        updatedAt: Date.now()
    };
    if (currentEditId) await update(ref(db, `products/${currentEditId}`), data);
    else await set(push(ref(db, 'products')), data);
    window.tutupModal();
};