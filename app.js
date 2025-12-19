import { db } from './firebase-config.js'; // Menggunakan file config Anda
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

const inventoryContainer = document.getElementById('inventory-list');

// Fungsi untuk Load Data dari Firebase
function loadInventory() {
    const inventoryRef = ref(db, 'products');
    
    onValue(inventoryRef, (snapshot) => {
        inventoryContainer.innerHTML = "";
        const data = snapshot.val();
        
        for (let id in data) {
            const item = data[id];
            const initial = item.nama.substring(0, 2).toUpperCase();
            
            const itemHTML = `
                <div class="card-item" onclick="editItem('${id}')">
                    <div class="initial-box">${initial}</div>
                    <div class="item-info">
                        <div class="item-name">${item.nama}</div>
                        <div class="price-row">
                            <div>Penjualan<br><strong>Rp ${item.hargaJual.toLocaleString()}</strong></div>
                            <div>Pembelian<br><strong>Rp ${item.hargaBeli.toLocaleString()}</strong></div>
                        </div>
                    </div>
                    <div class="stock-info">
                        <span class="category-tag">${item.kategori}</span>
                        <div class="stock-value">${item.stok} ${item.satuan}</div>
                    </div>
                </div>
            `;
            inventoryContainer.innerHTML += itemHTML;
        }
    });
}

// Jalankan fungsi saat aplikasi dibuka
loadInventory();