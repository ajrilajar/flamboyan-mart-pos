// Import database dari file konfigurasi pusat (PENTING)
import { db, push, ref } from "./firebase-config.js";

// ============ STATE LOKAL ============
let appState = { satuanUtama: null, satuanTambahan: [] };
let modePilih = '';
let indexEdit = -1;

// ============ FUNGSI GLOBAL (Ditempel ke Window agar bisa diklik HTML) ============

// 1. Setup Tab (Offline/Online)
window.setupTabs = function() {
    const isOnlineMode = document.getElementById('market-chk').checked;
    const container = document.getElementById('dynamic-tabs');
    if(!container) return;
    
    container.innerHTML = ''; 

    let tabsDef = [];
    if (isOnlineMode) {
        tabsDef = [
            { id: 'offline', label: 'Offline' },
            { id: 'online', label: 'Online' },
            { id: 'tambahan', label: 'Detail Tambahan' }
        ];
    } else {
        tabsDef = [
            { id: 'offline', label: 'Detail Stok' }, 
            { id: 'tambahan', label: 'Detail Tambahan' }
        ];
    }

    tabsDef.forEach((t, index) => {
        const div = document.createElement('div');
        div.className = `tab ${index === 0 ? 'active' : ''}`;
        div.innerText = t.label;
        div.onclick = () => window.switchTab(t.id, div);
        container.appendChild(div);
    });

    window.switchTab('offline', container.firstChild);
};

window.switchTab = function(tabId, tabElement) {
    document.querySelectorAll('#dynamic-tabs .tab').forEach(t => t.classList.remove('active'));
    if(tabElement) tabElement.classList.add('active');

    document.querySelectorAll('.tab-content-section').forEach(el => el.style.display = 'none');

    const target = document.getElementById('section-' + tabId);
    if(target) target.style.display = 'block';
};

// 2. Format Rupiah
window.formatRupiah = function(input) {
    const value = input.value.replace(/[^\d]/g, '');
    if (value) input.value = 'Rp ' + parseInt(value).toLocaleString('id-ID');
    else input.value = '';
};

// Event listener formatting (dijalankan saat file dimuat)
const rupiahInputs = ['harga_jual', 'harga_beli', 'harga_eceran', 'harga_grosir', 'harga_marketplace'];
rupiahInputs.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('blur', function() { window.formatRupiah(this); });
});

// 3. Logika Satuan Compact
window.bukaPanelSatuanCompact = function() { 
    window.openPanel('panelSatuanCompact'); 
    window.renderUICompact();
};

window.renderUICompact = function() {
    const inputSatuanUtama = document.getElementById('inputSatuanUtama');
    const area = document.getElementById('areaKonversi');
    const btnSimpan = document.getElementById('btnSimpanSatuanCompact');
    const container = document.getElementById('listKonversiContainer');

    if (appState.satuanUtama) {
        inputSatuanUtama.value = `${appState.satuanUtama.nama} (${appState.satuanUtama.kode})`;
        area.style.display = 'block';
        btnSimpan.disabled = false;
    } else {
        inputSatuanUtama.value = '';
        area.style.display = 'none';
        btnSimpan.disabled = true;
    }

    container.innerHTML = '';
    
    if (appState.satuanTambahan.length === 0) {
        container.innerHTML = '<div class="empty-state"><span class="material-icons-outlined">scale</span><div>Belum ada satuan besar.<br>Klik tombol di bawah untuk menambahkan.</div></div>';
        return;
    }

    appState.satuanTambahan.forEach((item, index) => {
        const baseCode = appState.satuanUtama ? appState.satuanUtama.kode : '...';
        const row = document.createElement('div');
        row.className = 'compact-conversion-row';
        row.innerHTML = `
            <div class="row-left">
                <span class="static-num">1</span>
                <div class="clickable-unit" onclick="bukaPanelEditCompact(${index})">
                    <span class="unit-code">${item.kode}</span>
                    <span class="material-icons-outlined icon-edit">edit</span>
                </div>
                <span class="static-num">=</span>
            </div>
            <div class="row-center">
                <input type="tel" class="compact-input-field" value="${item.rasio}" placeholder="0" oninput="updateRasioCompact(${index}, this.value)" onblur="validasiRasio(${index})">
                <span class="base-unit-code">${baseCode}</span>
            </div>
            <div class="btn-delete-compact" onclick="hapusSatuanCompact(${index})">
                <span class="material-icons-outlined">delete_outline</span>
            </div>
        `;
        container.appendChild(row);
    });
};

window.updateRasioCompact = function(index, val) {
    const cleaned = val.replace(/[^\d]/g, '');
    if (cleaned && parseFloat(cleaned) > 0) appState.satuanTambahan[index].rasio = cleaned;
    else appState.satuanTambahan[index].rasio = '';
};

window.validasiRasio = function(index) {
    const item = appState.satuanTambahan[index];
    if (item.rasio && parseFloat(item.rasio) <= 0) {
        alert("Rasio harus lebih besar dari 0");
        appState.satuanTambahan[index].rasio = '';
        window.renderUICompact();
    }
};

window.hapusSatuanCompact = function(index) {
    if (confirm("Hapus satuan ini?")) {
        appState.satuanTambahan.splice(index, 1);
        window.renderUICompact();
    }
};

window.bukaPanelEditCompact = function(index) {
    modePilih = 'edit';
    indexEdit = index;
    document.getElementById('panelSatuanTitle').textContent = 'Ganti Satuan';
    window.openPanel('panelSatuan');
    window.filterSatuan();
};

window.bukaPanelPilihSatuan = function(mode) { 
    modePilih = mode; 
    window.openPanel('panelSatuan'); 
    window.filterSatuan(); 
};

// GANTI FUNGSI INI SEPENUHNYA
window.filterSatuan = function() {
    const searchTerm = document.getElementById('searchSatuan').value.toLowerCase();
    const container = document.getElementById('listSatuan');
    container.innerHTML = '';
    
    const filtered = window.satuanData.filter(item => 
        item.nama.toLowerCase().includes(searchTerm) || item.kode.toLowerCase().includes(searchTerm));
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><span class="material-icons-outlined">straighten</span><div>Tidak ada satuan yang ditemukan</div></div>';
        return;
    }
    
    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `<div class="name">${item.nama}</div><div class="subtitle">${item.kode}</div>`;
        div.onclick = () => {
            if (modePilih === 'utama') {
                appState.satuanUtama = { nama: item.nama, kode: item.kode };
                appState.satuanTambahan = []; // Reset tambahan jika utama berubah
                window.goBack(); // Tutup panel list
                // HAPUS BARIS INI: window.openPanel('panelSatuanCompact'); (Penyebab layar abu-abu)
                window.renderUICompact(); // Render ulang panel di bawahnya
            } else if (modePilih === 'tambahan') {
                if (appState.satuanTambahan.find(s => s.kode === item.kode)) {
                    alert('Satuan ini sudah ada!'); return;
                }
                if (appState.satuanUtama && appState.satuanUtama.kode === item.kode) {
                    alert('Tidak bisa sama dengan satuan dasar!'); return;
                }
                appState.satuanTambahan.push({ nama: item.nama, kode: item.kode, rasio: '' });
                window.goBack(); // Tutup panel list
                // HAPUS BARIS INI: window.openPanel('panelSatuanCompact');
                window.renderUICompact();
            } else if (modePilih === 'edit') {
                if (appState.satuanTambahan.find((s, idx) => s.kode === item.kode && idx !== indexEdit)) {
                    alert('Satuan sudah ada!'); return;
                }
                if (appState.satuanUtama && appState.satuanUtama.kode === item.kode) {
                    alert('Tidak bisa sama dengan satuan dasar!'); return;
                }
                const rasioLama = appState.satuanTambahan[indexEdit].rasio;
                appState.satuanTambahan[indexEdit] = { nama: item.nama, kode: item.kode, rasio: rasioLama };
                window.goBack(); // Tutup panel list
                // HAPUS BARIS INI: window.openPanel('panelSatuanCompact');
                window.renderUICompact();
            } else {
                // Fallback untuk mode biasa (bukan compact)
                document.getElementById('satuan').value = item.nama;
                window.goBack();
            }
        };
        container.appendChild(div);
    });
};

window.simpanSatuanCompact = function() {
    if(!appState.satuanUtama) { alert("Pilih satuan dasar!"); return; }
    
    for (let i = 0; i < appState.satuanTambahan.length; i++) {
        if (!appState.satuanTambahan[i].rasio) {
            alert("Isi semua rasio!"); return;
        }
    }
    
    let result = appState.satuanUtama.nama;
    if(appState.satuanTambahan.length > 0) {
        const extras = appState.satuanTambahan.map(s => s.nama).join(', ');
        result += ` (${extras})`;
    }
    
    document.getElementById('satuan').value = result;
    window.goBack();
};

// 4. Simpan Barang (Firebase)
document.getElementById('btnSimpan').addEventListener('click', function() {
    const namaBarang = document.getElementById('nama_barang').value.trim();
    if (!namaBarang) { alert("Nama wajib diisi!"); return; }

    const kategori = document.getElementById('kategori').value.trim();
    const satuan = document.getElementById('satuan').value.trim();
    
    // Konversi Rupiah ke Number
    const cleanRp = (id) => parseInt(document.getElementById(id).value.replace(/[^\d]/g, '')) || 0;
    const cleanNum = (id) => parseInt(document.getElementById(id).value) || 0;

    // Logic Satuan
    let kodeSatuan = "PCS";
    let satuanUtamaNama = "";
    
    if (appState.satuanUtama) {
        satuanUtamaNama = appState.satuanUtama.nama;
        kodeSatuan = appState.satuanUtama.kode;
    } else {
        satuanUtamaNama = satuan.split('(')[0].trim();
        const satuanInfo = window.satuanData.find(s => s.nama === satuanUtamaNama);
        if (satuanInfo) kodeSatuan = satuanInfo.kode;
    }
    
    const konversiData = [];
    if (appState.satuanTambahan && appState.satuanTambahan.length > 0) {
        appState.satuanTambahan.forEach((item) => {
            if (item.nama && item.rasio) {
                konversiData.push({
                    satuan: item.nama,
                    rasio: parseFloat(item.rasio).toFixed(2),
                    jumlahUtama: '1',
                    jumlahTambahan: item.rasio
                });
            }
        });
    }

    const barangData = {
        nama: namaBarang,
        kategori: kategori || "Umum",
        satuan: kodeSatuan,
        satuanNama: satuan || "Pieces",
        satuanUtama: satuanUtamaNama,
        satuanTambahan: appState.satuanTambahan ? appState.satuanTambahan.map(s => s.nama).filter(n => n) : [],
        konversi: konversiData,
        stok: cleanNum('stok_awal'),
        stokMin: cleanNum('stok_min'),
        hargaJual: cleanRp('harga_jual'),
        hargaBeli: cleanRp('harga_beli'),
        hargaEceran: cleanRp('harga_eceran'),
        hargaGrosir: cleanRp('harga_grosir'),
        hargaMarketplace: cleanRp('harga_marketplace'),
        stokMarketplace: cleanNum('stok_marketplace'),
        peringatanStok: document.getElementById('peringatan_stok').checked,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    push(ref(db, 'products'), barangData)
        .then(() => {
            alert("Barang berhasil disimpan!");
            window.resetFormV6();
            window.goToPage('page-inventaris');
        })
        .catch(error => {
            alert("Gagal: " + error.message);
        });
});

window.resetFormV6 = function() {
    document.querySelectorAll('.input-box-v6').forEach(i => i.value = '');
    document.getElementById('peringatan_stok').checked = false;
    document.getElementById('btnSimpan').disabled = true;
    appState = { satuanUtama: null, satuanTambahan: [] };
};

// 5. Panel Kategori
window.filterKategori = function() {
    const searchTerm = document.getElementById('searchKategori').value.toLowerCase();
    const container = document.getElementById('listKategori');
    container.innerHTML = '';
    
    const filtered = window.kategoriData.filter(item => item.nama.toLowerCase().includes(searchTerm));
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><span class="material-icons-outlined">category</span><div>Tidak ditemukan</div></div>';
        return;
    }
    
    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `<div class="name">${item.nama}</div><div class="subtitle">${item.count || 0} barang</div>`;
        div.onclick = () => {
            document.getElementById('kategori').value = item.nama;
            window.goBack();
        };
        container.appendChild(div);
    });
};

document.getElementById('nama_barang').addEventListener('input', function() {
    document.getElementById('btnSimpan').disabled = !this.value.trim();
});