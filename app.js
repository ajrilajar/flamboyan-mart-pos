import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDL9F1DOnjrCCtDZ13aXL-yX4oAyQfUu9Y",
    databaseURL: "https://gen-lang-client-0116140691-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "gen-lang-client-0116140691",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const renderZone = document.getElementById('inventory-render');

onValue(ref(db, 'products'), (snapshot) => {
    const data = snapshot.val();
    renderZone.innerHTML = "";
    
    for (let key in data) {
        const p = data[key];
        const html = `
            <div class="item-card">
                <div class="box-initial">${p.nama.substring(0,2).toUpperCase()}</div>
                <div class="info-center">
                    <div class="name-product">${p.nama}</div>
                    <div class="price-container">
                        <div>
                            <div class="price-label">Penjualan</div>
                            <div class="price-val">Rp ${Number(p.hargaJual).toLocaleString('id-ID')}</div>
                        </div>
                        <div>
                            <div class="price-label">Pembelian</div>
                            <div class="price-val">Rp ${Number(p.hargaBeli).toLocaleString('id-ID')}</div>
                        </div>
                    </div>
                </div>
                <div class="info-right">
                    <span class="badge-cat">${p.kategori}</span>
                    <div class="total-stock">${p.stok} ${p.satuan || 'PCS'}</div>
                </div>
            </div>`;
        renderZone.innerHTML += html;
    }
});