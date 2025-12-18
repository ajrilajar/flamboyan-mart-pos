import { ref, onValue, push, set, remove, update } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { db } from "./firebase-config.js";

let currentEditId = null;
let databaseBarang = {};

export function renderInventori() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 class="font-extrabold text-xl text-emerald-900">Inventori</h2>
                <p id="total-aset" class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Memuat Nilai Stok...</p>
            </div>
            <button onclick="bukaModal()" class="bg-emerald-600 text-white px-5 py-2 rounded-2xl text-xs font-bold shadow-lg active:scale-95 transition-all">
                + BARANG
            </button>
        </div>

        <div class="relative mb-6">
            <input type="text" id="cariInventori" oninput="filterInventori()" placeholder="Cari nama barang atau kategori..." class="w-full p-4 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
            <i class="fa-solid fa-magnifying-glass absolute right-4 top-4 text-gray-300"></i>
        </div>

        <div id="list-barang" class="space-y-4 pb-28">
            <div class="animate-pulse flex space-x-4 p-4 bg-white rounded-2xl">
                <div class="rounded-full bg-gray-200 h-10 w-10"></div>
                <div class="flex-1 space-y-2 py-1">
                    <div class="h-2 bg-gray-200 rounded w-3/4"></div>
                    <div class="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        </div>

        <div id="modalBarang" class="fixed inset-0 bg-black/60 z-[100] hidden flex items-end justify-center backdrop-blur-sm">
            <div class="bg-white w-full max-w-md rounded-t-[2.5rem] p-8 animate-slide-up shadow-2xl">
                <div class="flex justify-between items-center mb-6">
                    <h3 id="modalTitle" class="font-extrabold text-xl text-gray-800">Tambah Barang</h3>
                    <button onclick="tutupModal()" class="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center"><i class="fa-solid fa-xmark text-gray-400"></i></button>
                </div>
                
                <div class="space-y-5 max-h-[60vh] overflow-y-auto pr-2 custom-scroll">
                    <div class="group">
                        <label class="text-[10px] text-gray-400 font-bold uppercase ml-1">Nama Produk</label>
                        <input type="text" id="nama" class="w-full p-4 bg-gray-50 rounded-2xl border border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all" placeholder="Misal: Indomie Mi Goreng">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[10px] text-gray-400 font-bold uppercase ml-1">Harga Beli</label>
                            <input type="number" id="beli" class="w-full p-4 bg-gray-50 rounded-2xl border border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all" placeholder="0">
                        </div>
                        <div>
                            <label class="text-[10px] text-gray-400 font-bold uppercase ml-1">Harga Jual</label>
                            <input type="number" id="jual" class="w-full p-4 bg-gray-50 rounded-2xl border border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all" placeholder="0">
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[10px] text-gray-400 font-bold uppercase ml-1">Stok Saat Ini</label>
                            <input type="number" id="stok" class="w-full p-4 bg-gray-50 rounded-2xl border border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all" placeholder="0">
                        </div>
                        <div>
                            <label class="text-[10px] text-gray-400 font-bold uppercase ml-1">Satuan</label>
                            <select id="satuan" class="w-full p-4 bg-gray-50 rounded-2xl border border-transparent focus:border-emerald-500 focus:bg-white outline-none appearance-none">
                                <option value="PCS">PCS</option>
                                <option value="BKS">BUNGKUS</option>
                                <option value="SCHT">SACHET</option>
                                <option value="KMAS">KEMASAN</option>
                                <option value="KOTK">KOTAK</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="text-[10px] text-gray-400 font-bold uppercase ml-1">Peringatan Stok Rendah</label>
                        <input type="number" id="stokRendah" class="w-full p-4 bg-gray-50 rounded-2xl border border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all" placeholder="10">
                    </div>
                </div>

                <button id="btnSimpan" onclick="simpanBarang()" class="w-full bg-emerald-600 text-white py-5 rounded-[1.5rem] font-bold shadow-xl shadow-emerald-100 active:scale-95 transition-all mt-8 uppercase tracking-widest text-sm">
                    Simpan Ke Inventori
                </button>
            </div>
        </div>
    `;
    
    // Inisialisasi Real-time Data
    const productsRef = ref(db, 'products');
    onValue(productsRef, (snapshot) => {
        databaseBarang = snapshot.val() || {};
        filterInventori();
        hitungNilaiAset();
    });
}

window.filterInventori = () => {
    const keyword = document.getElementById('cariInventori')?.value.toLowerCase() || "";
    const listDiv = document.getElementById('list-barang');
    if(!listDiv) return;

    listDiv.innerHTML = "";
    for (let id in databaseBarang) {
        const item = databaseBarang[id];
        if (item.nama.toLowerCase().includes(keyword)) {
            const isLow = item.stok <= (item.low_stock_alert || 0);
            listDiv.innerHTML += `
                <div onclick="opsiBarang('${id}')" class="bg-white p-5 rounded-[1.5rem] border border-gray-50 flex justify-between items-center shadow-sm active:bg-emerald-50 transition-all cursor-pointer group">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 ${isLow ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'} rounded-2xl flex items-center justify-center font-bold text-lg shadow-inner">
                            ${item.nama.charAt(0)}
                        </div>
                        <div>
                            <p class="font-bold text-gray-800 text-sm group-hover:text-emerald-700 transition-colors">${item.nama}</p>
                            <p class="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                                Jual: Rp ${Number(item.harga_jual).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-extrabold text-lg ${isLow ? 'text-rose-500' : 'text-emerald-600'}">${item.stok}</p>
                        <p class="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">${item.satuan}</p>
                    </div>
                </div>`;
        }
    }
}

function hitungNilaiAset() {
    let total = 0;
    for(let id in databaseBarang) {
        const item = databaseBarang[id];
        total += (Number(item.stok) * Number(item.harga_beli || 0));
    }
    const asetEl = document.getElementById('total-aset');
    if(asetEl) asetEl.innerText = `Nilai Stok: Rp ${total.toLocaleString()}`;
}

// FUNGSI MODAL & LOGIKA (DAFTARKAN KE WINDOW)
window.bukaModal = () => document.getElementById('modalBarang').classList.remove('hidden');
window.tutupModal = () => {
    document.getElementById('modalBarang').classList.add('hidden');
    currentEditId = null;
    document.getElementById('modalTitle').innerText = "Tambah Barang";
    document.getElementById('btnSimpan').innerText = "SIMPAN KE INVENTORI";
    // Clear inputs
    ['nama', 'beli', 'jual', 'stok', 'stokRendah'].forEach(id => document.getElementById(id).value = "");
};

window.opsiBarang = (id) => {
    const item = databaseBarang[id];
    const action = confirm(`Opsi untuk ${item.nama}:\n\nOK -> EDIT\nCANCEL -> HAPUS`);
    if (action) {
        currentEditId = id;
        document.getElementById('modalTitle').innerText = "Edit Produk";
        document.getElementById('btnSimpan').innerText = "PERBARUI DATA";
        document.getElementById('nama').value = item.nama;
        document.getElementById('beli').value = item.harga_beli;
        document.getElementById('jual').value = item.harga_jual;
        document.getElementById('stok').value = item.stok;
        document.getElementById('satuan').value = item.satuan;
        document.getElementById('stokRendah').value = item.low_stock_alert || 10;
        window.bukaModal();
    } else if (confirm(`Hapus ${item.nama} permanen?`)) {
        remove(ref(db, 'products/' + id));
    }
};

window.simpanBarang = async () => {
    const data = {
        nama: document.getElementById('nama').value,
        harga_beli: Number(document.getElementById('beli').value),
        harga_jual: Number(document.getElementById('jual').value),
        stok: Number(document.getElementById('stok').value),
        satuan: document.getElementById('satuan').value,
        low_stock_alert: Number(document.getElementById('stokRendah').value),
        timestamp: Date.now()
    };
    
    if(!data.nama || data.harga_jual <= 0) return alert("Lengkapi data minimal Nama dan Harga Jual!");

    try {
        if (currentEditId) {
            await update(ref(db, `products/${currentEditId}`), data);
        } else {
            await set(push(ref(db, 'products')), data);
        }
        window.tutupModal();
    } catch (e) { alert("Error: " + e.message); }
};