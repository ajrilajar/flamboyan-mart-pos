import { ref, onValue, push, set, remove, update } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { db } from "./firebase-config.js";

let databaseBarang = {};
let currentEditId = null;

export function renderInventori() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div id="view-list-inventori" class="flex flex-col gap-4 max-w-7xl mx-auto p-4 animate-fadeIn">
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

            <div id="list-barang" class="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-32">
                <p class="col-span-full text-center py-20 text-gray-400 font-medium italic">Memuat data produk...</p>
            </div>

            <button id="btnTambahProduk" onclick="window.bukaModal()" class="fixed bottom-24 right-6 bg-emerald-500 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold z-40 active:scale-95 transition-all">
                <i class="fa-solid fa-plus text-xl"></i> <span>Tambah Barang</span>
            </button>
        </div>

        <div id="view-detail-produk" class="hidden fixed inset-0 bg-white z-[60] overflow-y-auto pb-32">
            <div class="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                <div class="flex items-center gap-4">
                    <button onclick="window.tutupDetail()" class="p-2 text-gray-600 active:bg-gray-100 rounded-full">
                        <i class="fa-solid fa-arrow-left text-xl"></i>
                    </button>
                    <span class="font-bold text-gray-800">Detail Produk</span>
                </div>
                <div class="flex gap-2">
                    <button id="btnEditDetail" class="p-2 text-gray-500"><i class="fa-solid fa-pen"></i></button>
                    <button id="btnHapusDetail" class="p-2 text-rose-400"><i class="fa-solid fa-trash-can"></i></button>
                    <button class="p-2 text-gray-500"><i class="fa-solid fa-ellipsis-vertical text-xl"></i></button>
                </div>
            </div>

            <div id="content-detail-produk" class="p-5">
                </div>

            <div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex gap-3 z-20">
                <button onclick="alert('Fitur Masuk Stok segera hadir')" class="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    <i class="fa-solid fa-box-open"></i> Stok Masuk
                </button>
                <button onclick="alert('Fitur Keluar Stok segera hadir')" class="flex-1 bg-rose-500 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    <i class="fa-solid fa-box-archive"></i> Stok Keluar
                </button>
            </div>
        </div>

        <div id="modalBarang" class="fixed inset-0 bg-black/60 z-[100] hidden flex items-end justify-center backdrop-blur-sm transition-all">
            <div class="bg-white w-full max-w-md rounded-t-[2.5rem] p-6 animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 id="modalTitle" class="font-bold text-xl text-gray-800">Tambah Barang</h3>
                    <button onclick="window.tutupModal()" class="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-400"><i class="fa-solid fa-xmark text-xl"></i></button>
                </div>
                <div class="space-y-4 pb-6">
                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-gray-400 uppercase ml-2">Nama Produk</label>
                        <input type="text" id="nama" placeholder="Contoh: Aqua 600ml" class="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-emerald-500 outline-none transition-all">
                    </div>
                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-gray-400 uppercase ml-2">Kategori</label>
                        <input type="text" id="kategori" placeholder="Minuman / Sembako" class="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-emerald-500 outline-none transition-all">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-gray-400 uppercase ml-2">Harga Beli</label>
                            <input type="number" id="beli" placeholder="0" class="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-emerald-500 outline-none">
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-gray-400 uppercase ml-2">Harga Jual</label>
                            <input type="number" id="jual" placeholder="0" class="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-emerald-500 outline-none">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-gray-400 uppercase ml-2">Stok Awal</label>
                            <input type="number" id="stok" placeholder="0" class="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-emerald-500 outline-none">
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-gray-400 uppercase ml-2">Satuan</label>
                            <input type="text" id="satuan" placeholder="PCS / DUS" class="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-emerald-500 outline-none uppercase text-center font-bold">
                        </div>
                    </div>
                    <button id="btnSimpan" onclick="window.simpanBarang()" class="w-full bg-emerald-600 text-white py-5 rounded-2xl font-extrabold mt-6 shadow-xl shadow-emerald-100 active:scale-95 transition-all">SIMPAN DATA</button>
                </div>
            </div>
        </div>
    `;

    // Listen Realtime Data
    onValue(ref(db, 'products'), (snapshot) => {
        databaseBarang = snapshot.val() || {};
        window.filterInventori();
    });
}

// 1. Logika Filter & List
window.filterInventori = () => {
    const keyword = document.getElementById('cariBarang')?.value.toLowerCase() || "";
    const listDiv = document.getElementById('list-barang');
    if (!listDiv) return;

    listDiv.innerHTML = "";
    const dataArray = Object.keys(databaseBarang).reverse(); // Terbaru di atas

    if (dataArray.length === 0) {
        listDiv.innerHTML = `<div class="col-span-full text-center py-20"><i class="fa-solid fa-box-open text-5xl text-gray-200 mb-4"></i><p class="text-gray-400">Belum ada barang di inventori</p></div>`;
        return;
    }

    dataArray.forEach(id => {
        const item = databaseBarang[id];
        if (item.nama.toLowerCase().includes(keyword)) {
            const inisial = item.nama.substring(0, 2).toUpperCase();
            listDiv.innerHTML += `
                <div onclick="window.bukaDetail('${id}')" class="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col gap-4 shadow-sm hover:shadow-md active:bg-gray-50 transition-all cursor-pointer">
                    <div class="flex gap-4">
                        <div class="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-xl">${inisial}</div>
                        <div>
                            <h4 class="font-bold text-gray-800 text-lg leading-tight mb-1">${item.nama}</h4>
                            <span class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md uppercase font-bold border border-gray-200">${item.kategori || 'Umum'}</span>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-2 pt-4 border-t border-gray-50">
                        <div><p class="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Jual</p><p class="text-sm font-bold text-gray-700">Rp ${Number(item.harga_jual).toLocaleString('id-ID')}</p></div>
                        <div><p class="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Beli</p><p class="text-sm font-bold text-gray-700">Rp ${Number(item.harga_beli).toLocaleString('id-ID')}</p></div>
                        <div class="text-right"><p class="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Stok</p><p class="text-sm font-black ${item.stok <= 0 ? 'text-rose-500' : 'text-emerald-700'}">${item.stok} ${item.satuan || 'PCS'}</p></div>
                    </div>
                </div>`;
        }
    });
};

// 2. Logika Halaman Detail (Sesuai INVENTORI 4.jpeg)
window.bukaDetail = (id) => {
    const item = databaseBarang[id];
    currentEditId = id;
    
    document.getElementById('view-list-inventori').classList.add('hidden');
    document.getElementById('view-detail-produk').classList.remove('hidden');

    const inisial = item.nama.substring(0, 2).toUpperCase();
    const nilaiStok = item.stok * item.harga_beli;

    document.getElementById('content-detail-produk').innerHTML = `
        <div class="flex justify-between items-start mb-8 animate-fadeIn">
            <div class="flex gap-4">
                <div class="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-100">${inisial}</div>
                <div>
                    <h3 class="text-2xl font-black text-gray-800 leading-tight">${item.nama}</h3>
                    <p class="text-gray-400 font-medium">Kuantitas: <span class="text-emerald-600 font-bold">${item.stok} ${item.satuan}</span></p>
                </div>
            </div>
            <span class="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold uppercase border">${item.kategori || 'Umum'}</span>
        </div>

        <div class="grid grid-cols-3 gap-4 mb-8">
            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p class="text-[9px] text-gray-400 font-black uppercase mb-1">Jual / Satuan</p>
                <p class="font-bold text-gray-700">Rp ${Number(item.harga_jual).toLocaleString()}</p>
            </div>
            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p class="text-[9px] text-gray-400 font-black uppercase mb-1">Beli / Satuan</p>
                <p class="font-bold text-gray-700">Rp ${Number(item.harga_beli).toLocaleString()}</p>
            </div>
            <div class="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <p class="text-[9px] text-emerald-600 font-black uppercase mb-1">Nilai Stok</p>
                <p class="font-bold text-emerald-700">Rp ${nilaiStok.toLocaleString()}</p>
            </div>
        </div>

        <div class="flex border-b mb-6">
            <button class="flex-1 py-3 border-b-2 border-emerald-500 text-emerald-600 font-bold text-sm uppercase tracking-widest">Aktivitas Item</button>
            <button class="flex-1 py-3 text-gray-400 font-bold text-sm uppercase tracking-widest">Detail Barang</button>
        </div>

        <div class="space-y-3">
            <div class="p-4 border border-gray-100 rounded-2xl bg-gray-50/50 flex justify-between items-center">
                <div>
                    <p class="text-[10px] text-emerald-600 font-black uppercase mb-1 tracking-tighter">Stok Awal Sistem</p>
                    <p class="font-bold text-gray-800">Inisialisasi Produk</p>
                    <p class="text-[10px] text-gray-400 mt-1">10 Des 2025 • 10:00</p>
                </div>
                <div class="text-right">
                    <p class="text-lg font-black text-emerald-600">+ ${item.stok}</p>
                    <p class="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 rounded-full inline-block uppercase">Tersedia</p>
                </div>
            </div>
        </div>
    `;

    // Tombol di dalam Detail
    document.getElementById('btnEditDetail').onclick = () => window.editDariDetail(id);
    document.getElementById('btnHapusDetail').onclick = () => window.hapusProduk(id);
};

window.tutupDetail = () => {
    document.getElementById('view-list-inventori').classList.remove('hidden');
    document.getElementById('view-detail-produk').classList.add('hidden');
    currentEditId = null;
};

// 3. Logika Modal (Tambah/Edit)
window.bukaModal = () => document.getElementById('modalBarang').classList.remove('hidden');

window.tutupModal = () => {
    document.getElementById('modalBarang').classList.add('hidden');
    currentEditId = null;
    ['nama', 'kategori', 'beli', 'jual', 'stok', 'satuan'].forEach(id => document.getElementById(id).value = "");
    document.getElementById('modalTitle').innerText = "Tambah Barang";
};

window.editDariDetail = (id) => {
    const item = databaseBarang[id];
    currentEditId = id;
    document.getElementById('modalTitle').innerText = "Edit Produk";
    document.getElementById('nama').value = item.nama;
    document.getElementById('kategori').value = item.kategori || "";
    document.getElementById('beli').value = item.harga_beli;
    document.getElementById('jual').value = item.harga_jual;
    document.getElementById('stok').value = item.stok;
    document.getElementById('satuan').value = item.satuan;
    window.bukaModal();
};

window.simpanBarang = async () => {
    const data = {
        nama: document.getElementById('nama').value,
        kategori: document.getElementById('kategori').value,
        harga_beli: Number(document.getElementById('beli').value),
        harga_jual: Number(document.getElementById('jual').value),
        stok: Number(document.getElementById('stok').value),
        satuan: document.getElementById('satuan').value.toUpperCase() || 'PCS',
        updatedAt: Date.now()
    };

    if (!data.nama || !data.harga_jual) return alert("Nama dan Harga Jual wajib diisi!");

    if (currentEditId) {
        await update(ref(db, `products/${currentEditId}`), data);
        window.bukaDetail(currentEditId); // Refresh tampilan detail
    } else {
        await set(push(ref(db, 'products')), data);
    }
    window.tutupModal();
};

window.hapusProduk = async (id) => {
    if (confirm(`Hapus permanen ${databaseBarang[id].nama} dari sistem?`)) {
        await remove(ref(db, 'products/' + id));
        window.tutupDetail();
    }
};