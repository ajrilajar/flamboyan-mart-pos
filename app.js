import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

// Konfigurasi milik Anda
const firebaseConfig = {
    apiKey: "AIzaSyDL9F1DOnjrCCtDZ13aXL-yX4oAyQfUu9Y",
    databaseURL: "https://gen-lang-client-0116140691-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "gen-lang-client-0116140691",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const listDiv = document.getElementById('inventory-list');

// Ambil data dan tampilkan ke HTML
onValue(ref(db, 'products'), (snapshot) => {
    const data = snapshot.val();
    listDiv.innerHTML = "";
    for (let id in data) {
        const item = data[id];
        listDiv.innerHTML += `
            <div class="card-item">
                <div class="initial-box">${item.nama.substring(0,2).toUpperCase()}</div>
                <div class="item-info">
                    <div class="item-name"><strong>${item.nama}</strong></div>
                    <div class="price-row">
                        <span>Penjualan<br><strong>Rp ${item.hargaJual}</strong></span>
                        <span>Pembelian<br><strong>Rp ${item.hargaBeli}</strong></span>
                    </div>
                </div>
                <div class="stock-side">
                    <span class="tag">${item.kategori}</span>
                    <div class="stock"><strong>${item.stok} ${item.satuan}</strong></div>
                </div>
            </div>`;
    }
});