import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDL9F1DOnjrCCtDZ13aXL-yX4oAyQfUu9Y",
    databaseURL: "https://gen-lang-client-0116140691-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "gen-lang-client-0116140691",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const container = document.getElementById('inventory-list');

onValue(ref(db, 'products'), (snapshot) => {
    const data = snapshot.val();
    container.innerHTML = "";
    
    for (let id in data) {
        const item = data[id];
        container.innerHTML += `
            <div class="card-item">
                <div class="col-initial">${item.nama.substring(0,2).toUpperCase()}</div>
                <div class="col-info">
                    <div class="product-name">${item.nama}</div>
                    <div class="price-row">
                        <div><div class="price-label">Penjualan</div><div class="price-value">Rp ${Number(item.hargaJual).toLocaleString('id-ID')}</div></div>
                        <div><div class="price-label">Pembelian</div><div class="price-value">Rp ${Number(item.hargaBeli).toLocaleString('id-ID')}</div></div>
                    </div>
                </div>
                <div class="col-stock">
                    <span class="tag-cat">${item.kategori}</span>
                    <div class="stock-text">${item.stok} ${item.satuan || 'PCS'}</div>
                </div>
            </div>`;
    }
});