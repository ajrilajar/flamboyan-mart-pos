import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDL9F1DOnjrCCtDZ13aXL-yX4oAyQfUu9Y",
    databaseURL: "https://gen-lang-client-0116140691-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "gen-lang-client-0116140691",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const inventoryContainer = document.getElementById('inventory-list');

// Mendengarkan data secara Realtime
onValue(ref(db, 'products'), (snapshot) => {
    const data = snapshot.val();
    inventoryContainer.innerHTML = "";

    for (let id in data) {
        const item = data[id];
        const initial = item.nama.substring(0, 2).toUpperCase();

        const cardHTML = `
            <div class="card-item">
                <div class="initial-box">${initial}</div>
                <div class="item-info">
                    <div class="item-name">${item.nama}</div>
                    <div class="price-row">
                        <div class="price-col">Penjualan<strong>Rp ${Number(item.hargaJual).toLocaleString('id-ID')}</strong></div>
                        <div class="price-col">Pembelian<strong>Rp ${Number(item.hargaBeli).toLocaleString('id-ID')}</strong></div>
                    </div>
                </div>
                <div class="stock-side">
                    <span class="category-tag">${item.kategori}</span>
                    <div class="stock-count">${item.stok} ${item.satuan || 'PCS'}</div>
                </div>
            </div>
        `;
        inventoryContainer.insertAdjacentHTML('beforeend', cardHTML);
    }
});