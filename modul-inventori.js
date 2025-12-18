import { ref, onValue, push, set, remove, update } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { db } from "./firebase-config.js";

let databaseBarang = {};
let currentEditId = null;

export function renderInventori() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div class="flex flex-col gap-4">
            <div class="flex justify-between items-center">
                <h2 class="text-xl font-bold text-gray-800">Inventaris</h2>
                <button class="p-2 text-emerald-600"><i class="fa-solid fa-gear"></i></button>
            </div>

            <div class="flex gap-2">
                <div class="relative flex-1">
                    <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-gray-400"></i>
                    <input type="text" id="cariBarang" oninput="window.filterInventori()" placeholder="Cari Barang..." class="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg outline-none">
                </div>
                <button class="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600">
                    <i class="fa-solid fa-sliders"></i>
                </button>
            </div>

            <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button class="px-4 py-1 bg-white border rounded-full text-sm text-gray-600 whitespace-nowrap">Kategori <i class="fa-solid fa-chevron-down ml-1 text-[10px]"></i></button>
                <button class="px-4 py-1 bg-white border rounded-full text-sm text-gray-600 whitespace-nowrap">Stok <i class="fa-solid fa-chevron-down ml-1 text-[10px]"></i></button>
                <button class="px-4 py-1 bg-white border rounded-full text-sm text-gray-600 whitespace-nowrap">Jenis <i class="fa-solid fa-chevron-down ml-1 text-[10px]"></i></button>
            </div>

            <div id="list-barang" class="grid grid-cols-1 md:grid-cols-2 gap-4 pb-24">
                <p class="col-span-full text-center py-10 text-gray-400 text-sm">Memuat data...</p>
            </div>
        </div>

        <button onclick="window.bukaModal()" class="fixed bottom-24 right-6 bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-bold z-40 active:scale-95 transition-transform">
            <i class="fa-solid fa-box-open"></i> Tambah Barang
        </button>

        <div id="modalBarang" class="fixed inset-0 bg-black bg-opacity-50 z-[100] hidden flex items-end justify-center">
            <div class="bg-white w-full max-w-md rounded-t-3xl p-6 animate-slide-up shadow-2xl overflow-y-auto max-h-[90vh]">
                <div class="flex justify-between items-center mb-6">
                    <h3 id="modalTitle" class="font-bold text-lg">Tambah Barang</h3>
                    <button onclick="window.tutupModal()"><i class="fa-solid fa-xmark text-xl text-gray-400"></i></button>
                </div>
                <div class="space-y-4">
                    <input type="text" id="nama" placeholder="Nama Barang" class="w-full p-3 bg-gray-50 rounded-xl border outline-none">
                    <input type="text" id="kategori" placeholder="Kategori (Sembako/Obat/dll)" class="w-full p-3 bg-gray-50 rounded-xl border outline-none">
                    <div class="grid grid-cols-2 gap-3">
                        <input type="number" id="beli" placeholder="Harga Pembelian" class="w-full p-3 bg-gray-50 rounded-xl border outline-none">
                        <input type="number" id="jual" placeholder="Harga Penjualan" class="w-full p-3 bg-gray-50 rounded-xl border outline-none">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <input type="number" id="stok" placeholder="Jumlah Stok" class="w-full p-3 bg-gray-50 rounded-xl border outline-none">
                        <input type="text" id="satuan" placeholder="Satuan (SCHT/KMAS/PCS)" class="w-full p-3 bg-gray-50 rounded-xl border outline-none">
                    </div>
                    <button id="btnSimpan" onclick="window.simpanBarang()" class="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold">SIMPAN BARANG</button>
                </div>
            </div>
        </div>
    `;

    // Listen data dari Firebase
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
            // Ambil inisial (contoh: Superklin Sachet -> SS)
            const inisial = item.nama.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

            listDiv.innerHTML += `
                <div onclick="window.opsiBarang('${id}')" class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3 active:bg-gray-50 cursor-pointer">
                    <div class="flex justify-between items-start">
                        <div class="flex gap-3">
                            <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-500 text-lg">${inisial}</div>
                            <div>
                                <h4 class="font-bold text-gray-800">${item.nama}</h4>
                                <span class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase font-bold">${item.kategori || 'Tanpa Kategori'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-2 border-t pt-3 mt-1">
                        <div>
                            <p class="text-[10px] text-gray-400 font-bold uppercase">Penjualan</p>
                            <p class="text-sm font-bold text-gray-700">Rp ${Number(item.harga_jual).toLocaleString()}</p>
                        </div>
                        <div>
                            <p class="text-[10px] text-gray-400 font-bold uppercase">Pembelian</p>
                            <p class="text-sm font-bold text-gray-700">Rp ${Number(item.harga_beli).toLocaleString()}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] text-gray-400 font-bold uppercase">Jumlah</p>
                            <p class="text-sm font-bold ${item.stok <= 0 ? 'text-red-500' : 'text-gray-700'}">${item.stok} ${item.satuan}</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }
};

// Fungsi Modal
window.bukaModal = () => document.getElementById('modalBarang').classList.remove('hidden');
window.tutupModal = () => {
    document.getElementById('modalBarang').classList.add('hidden');
    currentEditId = null;
    document.getElementById('modalTitle').innerText = "Tambah Barang";
    document.getElementById('nama').value = "";
    document.getElementById('kategori').value = "";
    document.getElementById('beli').value = "";
    document.getElementById('jual').value = "";
    document.getElementById('stok').value = "";
    document.getElementById('satuan').value = "";
};

window.opsiBarang = (id) => {
    const item = databaseBarang[id];
    const action = confirm(`Opsi untuk ${item.nama}:\n\nOK -> EDIT\nCANCEL -> HAPUS`);
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
    } else if (confirm(`Hapus ${item.nama} permanen?`)) {
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
        timestamp: Date.now()
    };

    if (!data.nama) return alert("Nama wajib diisi!");

    if (currentEditId) {
        await update(ref(db, `products/${currentEditId}`), data);
    } else {
        await set(push(ref(db, 'products')), data);
    }
    window.tutupModal();
};