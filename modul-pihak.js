import { ref, onValue, push, set } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { db } from "./firebase-config.js";

export function renderPihak() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h2 class="font-bold text-gray-700 uppercase text-sm tracking-widest">Daftar Pihak</h2>
            <button onclick="bukaModalPihak()" class="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">+ PIHAK</button>
        </div>
        <div id="list-pihak" class="space-y-3 pb-20">Memuat data...</div>

        <div id="modalPihak" class="fixed inset-0 bg-black bg-opacity-50 z-[100] hidden flex items-end justify-center">
            <div class="bg-white w-full max-w-md rounded-t-3xl p-6 animate-slide-up shadow-2xl">
                <div class="flex justify-between mb-6">
                    <h3 class="font-bold text-lg text-emerald-900">Tambah Pihak</h3>
                    <button onclick="tutupModalPihak()"><i class="fa-solid fa-xmark text-xl text-gray-400"></i></button>
                </div>
                <div class="space-y-4">
                    <input type="text" id="namaPihak" placeholder="Nama Pihak" class="w-full p-3 bg-gray-50 rounded-xl border outline-none">
                    <select id="jenisPihak" class="w-full p-3 bg-gray-50 rounded-xl border outline-none">
                        <option value="Pelanggan">Pelanggan</option>
                        <option value="Pemasok">Pemasok</option>
                    </select>
                    <input type="number" id="telpPihak" placeholder="Telepon" class="w-full p-3 bg-gray-50 rounded-xl border outline-none">
                    <button onclick="simpanPihak()" class="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg mt-4">SIMPAN PIHAK</button>
                </div>
            </div>
        </div>`;

    onValue(ref(db, 'parties'), (snapshot) => {
        const data = snapshot.val() || {};
        const list = document.getElementById('list-pihak');
        list.innerHTML = "";
        for (let id in data) {
            const p = data[id];
            list.innerHTML += `
                <div class="bg-white p-4 rounded-2xl border flex justify-between items-center shadow-sm">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center font-bold text-emerald-600">${p.nama.charAt(0)}</div>
                        <div><p class="font-bold text-sm">${p.nama}</p><p class="text-[10px] text-gray-400 uppercase">${p.jenis}</p></div>
                    </div>
                    <div class="text-right"><p class="font-bold text-emerald-600">Rp 0</p></div>
                </div>`;
        }
    });
}

// DAFTARKAN KE WINDOW
window.bukaModalPihak = () => document.getElementById('modalPihak').classList.remove('hidden');
window.tutupModalPihak = () => document.getElementById('modalPihak').classList.add('hidden');
window.simpanPihak = async () => {
    const data = {
        nama: document.getElementById('namaPihak').value,
        jenis: document.getElementById('jenisPihak').value,
        telepon: document.getElementById('telpPihak').value,
        saldo: 0,
        timestamp: Date.now()
    };
    if(!data.nama) return alert("Nama wajib diisi!");
    await set(push(ref(db, 'parties')), data);
    window.tutupModalPihak();
};