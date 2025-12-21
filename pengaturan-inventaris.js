import { db, push, ref, update, remove } from "./firebase-config.js";

let actT = null; 
let actI = null;

const properCase = (s) => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

// ============ CRUD GLOBAL (Kategori, Market, Supplier) ============
window.openAdd = (t) => { 
    actT = t; 
    actI = null; 
    document.getElementById('crudFormTitle').innerText = "Tambah"; 
    document.getElementById('crudInput').value = ""; 
    window.goToPage('page-form-crud'); 
};

window.openEdit = (t, i, n) => { 
    actT = t; 
    actI = i; 
    document.getElementById('crudFormTitle').innerText = "Edit"; 
    document.getElementById('crudInput').value = n; 
    document.getElementById('crudSaveBtn').disabled = false; 
    window.goToPage('page-form-crud'); 
};

document.getElementById('crudSaveBtn').onclick = () => {
    const val = properCase(document.getElementById('crudInput').value); 
    const path = actT === 'cat' ? 'categories' : actT === 'mkt' ? 'marketplaces' : 'suppliers';
    
    actI ? 
        update(ref(db, `${path}/${actI}`), {nama: val}).then(() => window.goBack()) : 
        push(ref(db, path), {nama: val}).then(() => window.goBack());
};

document.getElementById('crudInput').oninput = function() { 
    document.getElementById('crudSaveBtn').disabled = !this.value; 
};

// ============ CRUD SATUAN ============
window.openAddUnit = () => { 
    actI = null; 
    document.getElementById('formUnitTitle').innerText="Tambah Satuan"; 
    document.getElementById('unitName').value=""; 
    document.getElementById('unitShort').value=""; 
    window.goToPage('page-form-unit'); 
};

window.openEditUnit = (id, n, k) => { 
    actI = id; 
    document.getElementById('formUnitTitle').innerText="Edit Satuan"; 
    document.getElementById('unitName').value=n; 
    document.getElementById('unitShort').value=k; 
    window.goToPage('page-form-unit'); 
};

document.getElementById('btnActionUnit').onclick = () => {
    const data = { 
        nama: properCase(document.getElementById('unitName').value), 
        kode: document.getElementById('unitShort').value.toUpperCase() 
    };
    
    actI ? 
        update(ref(db, `units/${actI}`), data).then(() => window.goBack()) : 
        push(ref(db, 'units'), data).then(() => window.goBack());
};

document.getElementById('unitName').oninput = () => { 
    document.getElementById('btnActionUnit').disabled = !(document.getElementById('unitName').value && document.getElementById('unitShort').value); 
};

document.getElementById('unitShort').oninput = function() { 
    this.value = this.value.toUpperCase(); 
    document.getElementById('btnActionUnit').disabled = !(document.getElementById('unitName').value && this.value); 
};

// ============ MODAL TAMBAH CEPAT (V6) ============
// Simpan Kategori Baru (Modal)
window.simpanKategoriBaru = function() {
    const nama = document.getElementById('namaKategoriBaru').value.trim();
    if (!nama) return;
    
    const properName = nama.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    
    push(ref(db, 'categories'), { nama: properName, createdAt: new Date().toISOString() })
        .then(() => {
            document.getElementById('kategori').value = properName;
            window.goBack();
        }).catch(error => alert("Gagal: " + error.message));
};

document.getElementById('namaKategoriBaru').addEventListener('input', function() {
    document.getElementById('btnSimpanKategori').disabled = !this.value.trim();
});

// Simpan Satuan Baru (Modal)
function validasiFormSatuan() {
    const nama = document.getElementById('namaSatuanBaru').value.trim();
    const kode = document.getElementById('kodeSatuanBaru').value.trim();
    document.getElementById('btnSimpanSatuan').disabled = !(nama && kode);
}

document.getElementById('namaSatuanBaru').addEventListener('input', validasiFormSatuan);
document.getElementById('kodeSatuanBaru').addEventListener('input', validasiFormSatuan);

window.simpanSatuanBaru = function() {
    const nama = document.getElementById('namaSatuanBaru').value.trim();
    const kode = document.getElementById('kodeSatuanBaru').value.trim().toUpperCase();
    if (!nama || !kode) return;
    
    const properName = nama.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    
    push(ref(db, 'units'), { nama: properName, kode: kode, createdAt: new Date().toISOString() })
        .then(() => {
            document.getElementById('satuan').value = properName;
            window.goBack();
        }).catch(error => alert("Gagal: " + error.message));
};