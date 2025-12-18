import { ref, onValue, push, set, update } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { db } from "./firebase-config.js";

let keranjang = [];
let databaseBarang = {};
let databasePihak = {};

export function renderTransaksi() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h2 class="font-bold text-gray-700 uppercase text-sm tracking-widest">POS Cepat</h2>
            <div class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold">MODE JUAL</div>
        </div>

        <div class="relative mb-4">
            <input type="text" id="cariBarangPOS" oninput="filterBarangPOS()" placeholder="Cari nama barang..." class="w-full p-4 bg-white border rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-emerald-500">
            <i class="fa-solid fa-magnifying-glass absolute right-4 top-4 text-gray-400"></i>
        </div>

        <div id="daftar-barang-pos" class="grid grid-cols-2 gap-3 mb-24">
            </div>

        <div id="floating-cart" class="fixed bottom-24 left-4 right-4 bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center hidden animate-slide-up">
            <div>
                <p id="cart-count" class="text-[10px] font-bold uppercase opacity-80">0 Item</p>
                <p id="cart-total" class="font-bold text-lg">Rp 0</p>
            </div>
            <button onclick="bukaCheckout()" class="bg-white text-emerald-600 px-6 py-2 rounded-xl font-bold text-sm">BAYAR</button>
        </div>

        <div id="modalCheckout" class="fixed inset-0 bg-black bg-opacity-50 z-[100] hidden flex items-end justify-center">
            <div class="bg-white w-full max-w-md rounded-t-3xl p-6 animate-slide-up">
                <h3 class="font-bold text-lg mb-4">Konfirmasi Pembayaran</h3>
                <div class="space-y-4 mb-6">
                    <div class="bg-gray-50 p-3 rounded-xl border">
                        <label class="text-[10px] text-gray-400 font-bold uppercase">Pilih Pelanggan</label>
                        <select id="pilihPihak" class="w-full bg-transparent outline-none text-sm font-medium">
                            <option value="Tunai">Penjualan Tunai</option>
                            </select>
                    </div>
                </div>
                <div class="border-t pt-4 mb-6">
                    <div class="flex justify-between text-gray-500 text-sm mb-1">
                        <span>Subtotal</span>
                        <span id="checkout-subtotal">Rp 0</span>
                    </div>
                    <div class="flex justify-between font-bold text-xl text-emerald-700">
                        <span>Total Akhir</span>
                        <span id="checkout-total">Rp 0</span>
                    </div>
                </div>
                <button onclick="prosesBayar()" class="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg">PROSES & KURANGI STOK</button>
                <button onclick="tutupCheckout()" class="w-full text-gray-400 py-3 mt-2 text-sm">Batal</button>
            </div>
        </div>
    `;

    // Ambil Data Barang & Pihak
    onValue(ref(db, 'products'), (snap) => {
        databaseBarang = snap.val() || {};
        filterBarangPOS();
    });
    onValue(ref(db, 'parties'), (snap) => {
        databasePihak = snap.val() || {};
        updateDropdownPihak();
    });
}

// --- LOGIKA POS ---

window.filterBarangPOS = () => {
    const keyword = document.getElementById('cariBarangPOS')?.value.toLowerCase() || "";
    const container = document.getElementById('daftar-barang-pos');
    if(!container) return;
    
    container.innerHTML = "";
    for(let id in databaseBarang) {
        const item = databaseBarang[id];
        if(item.nama.toLowerCase().includes(keyword)) {
            container.innerHTML += `
                <div onclick="tambahKeKeranjang('${id}')" class="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition-transform">
                    <p class="font-bold text-xs text-gray-800 truncate">${item.nama}</p>
                    <p class="text-emerald-600 font-bold text-sm">Rp ${item.harga_jual.toLocaleString()}</p>
                    <p class="text-[9px] text-gray-400 uppercase font-bold mt-1">Stok: ${item.stok}</p>
                </div>`;
        }
    }
}

window.tambahKeKeranjang = (id) => {
    const item = databaseBarang[id];
    if(item.stok <= 0) return alert("Stok Habis!");
    
    keranjang.push({ id, ...item });
    updateFloatingCart();
}

function updateFloatingCart() {
    const cartEl = document.getElementById('floating-cart');
    if(keranjang.length > 0) {
        cartEl.classList.remove('hidden');
        const total = keranjang.reduce((sum, i) => sum + i.harga_jual, 0);
        document.getElementById('cart-count').innerText = `${keranjang.length} Item`;
        document.getElementById('cart-total').innerText = `Rp ${total.toLocaleString()}`;
    } else {
        cartEl.classList.add('hidden');
    }
}

function updateDropdownPihak() {
    const select = document.getElementById('pilihPihak');
    if(!select) return;
    select.innerHTML = `<option value="Tunai">Penjualan Tunai</option>`;
    for(let id in databasePihak) {
        if(databasePihak[id].jenis === "Pelanggan") {
            select.innerHTML += `<option value="${id}">${databasePihak[id].nama}</option>`;
        }
    }
}

window.bukaCheckout = () => document.getElementById('modalCheckout').classList.remove('hidden');
window.tutupCheckout = () => document.getElementById('modalCheckout').classList.add('hidden');

window.prosesBayar = async () => {
    const total = keranjang.reduce((sum, i) => sum + i.harga_jual, 0);
    const pihakId = document.getElementById('pilihPihak').value;

    try {
        // 1. Simpan Transaksi
        const trxRef = push(ref(db, 'transactions'));
        await set(trxRef, {
            waktu: Date.now(),
            total: total,
            pihak: pihakId,
            items: keranjang
        });

        // 2. Update Stok Barang
        for(let item of keranjang) {
            const stokBaru = databaseBarang[item.id].stok - 1;
            await update(ref(db, `products/${item.id}`), { stok: stokBaru });
        }

        alert("Transaksi Berhasil!");
        keranjang = [];
        updateFloatingCart();
        window.tutupCheckout();
    } catch (e) {
        alert("Gagal: " + e.message);
    }
}