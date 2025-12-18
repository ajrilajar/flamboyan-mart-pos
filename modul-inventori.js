import { ref, onValue, push, set, remove, update } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { db } from "./firebase-config.js";

let currentEditId = null;
let databaseBarang = {};

export function renderInventori() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h2 class="font-bold text-gray-700 uppercase text-sm tracking-widest">Stok Barang</h2>
            <button onclick="bukaModal()" class="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">+ BARANG</button>
        </div>
        <div id="list-barang" class="space-y-3 pb-20">Memuat data...</div>

        <div id="modalBarang" class="fixed inset-0 bg-black bg-opacity-50 z-[100] hidden flex items-end justify-center">
            <div class="bg-white w-full max-w-md rounded-t-3xl p-6 animate-slide-up shadow-2xl">
                <div class="flex justify-between mb-6">
                    <h3 id="modalTitle" class="font-bold text-lg">Tambah Barang</h3>
                    <button onclick="tutupModal()"><i class="fa-solid fa-xmark text-xl text-gray-400"></i></button>
                </div>
                <div class="space-y-4">
                    <input type="text" id="nama" placeholder="Nama Barang" class="w-full p-3 bg-gray-50 rounded-xl border outline-none focus:border-emerald-500">
                    <div class="grid grid-cols-2 gap-3">
                        <input type="number" id="beli" placeholder="Harga Beli" class="w-full p-3 bg-gray-50 rounded-xl border outline-none focus:border-emerald-500">
                        <input type="number" id="jual" placeholder="Harga Jual" class="w-full p-3 bg-gray-50 rounded-xl border outline-none focus:border-emerald-500">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <input type="number" id="stok" placeholder="Stok" class="w-full p-3 bg-gray-50 rounded-xl border outline-none focus:border-emerald-500">
                        <input type="text" id="satuan" placeholder="Satuan (PCS/SCHT)" class="w-full p-3 bg-gray-50 rounded-xl border outline-none focus:border-emerald-500">
                    </div>
                    <button id="btnSimpan" onclick="simpanBarang()" class="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold">SIMPAN BARANG</button>
                </div>
            </div>
        </div>`;
    
    onValue(ref(db, 'products'), (snapshot) => {
        databaseBarang = snapshot.val() || {};
        const list = document.getElementById('list-barang');
        list.innerHTML = "";
        for (let id in databaseBarang) {
            const item = databaseBarang[id];
            list.innerHTML += `
                <div onclick="opsiBarang('${id}')" class="bg-white p-4 rounded-2xl border flex justify-between items-center shadow-sm active:bg-gray-50 cursor-pointer">
                    <div>
                        <p class="font-bold text-sm text-gray-800">${item.nama}</p>
                        <p class="text-[10px] text-gray-400 uppercase font-bold">Jual: Rp ${item.harga_jual.toLocaleString()}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-emerald-600">${item.stok}</p>
                        <p class="text-[10px] text-gray-400 font-bold uppercase">${item.satuan}</p>
                    </div>
                </div>`;
        }
    });
}

// DAFTARKAN KE WINDOW AGAR BISA DIAKSES HTML
window.bukaModal = () => document.getElementById('modalBarang').classList.remove('hidden');
window.tutupModal = () => {
    document.getElementById('modalBarang').classList.add('hidden');
    currentEditId = null;
    document.getElementById('modalTitle').innerText = "Tambah Barang";
};

window.opsiBarang = (id) => {
    const item = databaseBarang[id];
    const action = confirm(`Pilih aksi untuk ${item.nama}:\n\nOK untuk EDIT\nCANCEL untuk HAPUS`);
    if (action) {
        currentEditId = id;
        window.bukaModal();
        document.getElementById('modalTitle').innerText = "Edit Barang";
        document.getElementById('nama').value = item.nama;
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
        harga_beli: Number(document.getElementById('beli').value),
        harga_jual: Number(document.getElementById('jual').value),
        stok: Number(document.getElementById('stok').value),
        satuan: document.getElementById('satuan').value.toUpperCase(),
        timestamp: Date.now()
    };
    if (currentEditId) await update(ref(db, 'products/' + currentEditId), data);
    else await set(push(ref(db, 'products')), data);
    window.tutupModal();
};