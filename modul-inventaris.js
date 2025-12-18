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
            
            <button onclick="window.bukaHalamanEdit(null)" class="fixed bottom-24 right-4 md:right-[calc(50%-26rem)] bg-emerald-500 text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-2 font-bold z-40 active:scale-95 transition-all text-sm">
                <i class="fa-solid fa-plus text-lg"></i> <span>Tambah Barang</span>
            </button>
        </div>

        <div id="view-detail" class="hidden fixed inset-0 bg-white z-[60] overflow-y-auto pb-32">
            </div>

        <div id="view-edit" class="hidden fixed inset-0 bg-gray-50 z-[70] overflow-y-auto pb-24">
            <div class="${desktopWidth} mx-auto min-h-screen bg-gray-50 shadow-2xl border-x">
                <div class="flex items-center p-4 bg-white border-b sticky top-0 z-10">
                    <button onclick="window.batalEdit()" class="p-2 text-gray-600 mr-4"><i class="fa-solid fa-arrow-left text-xl"></i></button>
                    <h3 id="edit-title" class="font-bold text-lg text-gray-800">Tambah Barang</h3>
                </div>

                <div class="p-3 sm:p-4 space-y-3">
                    <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                        <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Barang</label>
                            <input type="text" id="edit-nama" oninput="window.cekInputNama(this.value)" placeholder="Contoh: Indomie Goreng" class="w-full mt-1 font-bold text-gray-700 outline-none border-b border-gray-100 focus:border-emerald-500 py-1 text-base">
                        </div>

                        <div onclick="window.bukaPickerKategori()" class="flex justify-between items-center cursor-pointer py-2 border-b border-gray-50">
                            <div>
                                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kategori</label>
                                <input type="text" id="edit-kategori" class="w-full mt-1 font-bold text-gray-700 outline-none pointer-events-none text-sm" readonly placeholder="Pilih Kategori">
                            </div>
                            <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                        </div>
                    </div>

                    <div id="section-harga" class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Harga Beli</label>
                            <div class="flex items-center gap-1 mt-1 border-b border-gray-100 focus-within:border-emerald-500">
                                <span class="text-gray-400 text-sm font-bold">Rp</span>
                                <input type="number" id="edit-beli" class="w-full font-bold text-gray-700 outline-none py-1 text-sm">
                            </div>
                        </div>
                        <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Harga Jual</label>
                            <div class="flex items-center gap-1 mt-1 border-b border-gray-100 focus-within:border-emerald-500">
                                <span class="text-gray-400 text-sm font-bold">Rp</span>
                                <input type="number" id="edit-jual" class="w-full font-bold text-gray-700 outline-none py-1 text-sm">
                            </div>
                        </div>
                        <div class="col-span-2 pt-2">
                            <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stok Awal</label>
                            <div class="flex items-center gap-3 mt-1">
                                <input type="number" id="edit-stok" placeholder="0" class="flex-1 font-bold text-gray-700 outline-none border-b border-gray-100 focus:border-emerald-500 py-1 text-sm">
                                <input type="text" id="edit-satuan" placeholder="PCS" class="w-20 font-bold text-gray-500 outline-none border-b border-gray-100 focus:border-emerald-500 py-1 text-sm text-center uppercase">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="p-4 fixed bottom-0 left-0 right-0 bg-gray-50 border-t flex justify-center z-50">
                    <button onclick="window.simpanPerubahanBarang()" class="w-full ${desktopWidth} bg-emerald-500 text-white py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all">Simpan Barang</button>
                </div>
            </div>
        </div>
        
        <div id="picker-kategori" class="hidden fixed inset-0 bg-black/50 z-[100] flex items-end">
            <div class="bg-white w-full rounded-t-3xl p-6 animate-slide-up max-h-[70vh] overflow-y-auto">
                <div class="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
                <h4 class="font-bold text-lg mb-4 text-gray-800">Pilih Kategori</h4>
                <div class="grid grid-cols-2 gap-3">
                    ${daftarKategori.map(kat => `
                        <button onclick="window.pilihKategori('${kat}')" class="p-4 rounded-2xl border border-gray-100 bg-gray-50 text-left font-bold text-gray-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all text-sm">${kat}</button>
                    `).join('')}
                </div>
                <button onclick="window.tutupPickerKategori()" class="w-full mt-6 py-4 text-gray-400 font-bold">Batal</button>
            </div>
        </div>
    `;

    // Pasang ulang Firebase Listener
    onValue(ref(db, 'products'), (snap) => {
        databaseBarang = snap.val() || {};
        window.filterInventaris();
    });
}

// FUNGSI LOGIKA TAMBAH BARANG
window.bukaHalamanEdit = (id) => {
    currentEditId = id;
    window.switchView('view-edit');
    const title = document.getElementById('edit-title');
    
    if (id) {
        title.innerText = "Ubah Barang";
        const b = databaseBarang[id];
        document.getElementById('edit-nama').value = b.nama;
        document.getElementById('edit-kategori').value = b.kategori;
        document.getElementById('edit-beli').value = b.harga_beli;
        document.getElementById('edit-jual').value = b.harga_jual;
        document.getElementById('edit-stok').value = b.stok;
        document.getElementById('edit-satuan').value = b.satuan;
    } else {
        title.innerText = "Tambah Barang Baru";
        // Reset Form
        document.getElementById('edit-nama').value = "";
        document.getElementById('edit-kategori').value = "";
        document.getElementById('edit-beli').value = "";
        document.getElementById('edit-jual').value = "";
        document.getElementById('edit-stok').value = "";
        document.getElementById('edit-satuan').value = "PCS";
    }
};

window.cekInputNama = (val) => {
    // Di sini Anda bisa menambahkan logika "gambar 8" 
    // Seperti menampilkan saran barang serupa jika sudah mengetik 1 huruf
    console.log("Input Nama:", val);
};

window.bukaPickerKategori = () => document.getElementById('picker-kategori').classList.remove('hidden');
window.tutupPickerKategori = () => document.getElementById('picker-kategori').classList.add('hidden');
window.pilihKategori = (kat) => {
    document.getElementById('edit-kategori').value = kat;
    window.tutupPickerKategori();
};

window.batalEdit = () => {
    if(confirm('Batalkan perubahan?')) window.switchView('view-list');
};