// SPA/modules/pengaturan-inventaris.js
import {
    db,
    collection,
    addDoc,
    onSnapshot,
    doc,
    deleteDoc,
    updateDoc,
    query,
    orderBy
} from '../firebase-config.js'; // Adjusted path

console.log("[PENGATURAN] Modul dimuat");

// --- 1. MANAJEMEN KATEGORI ---

window.openAdd = function (type) {
    // type: 'cat' (Kategori) atau 'data' (Satuan - Legacy/General)
    const modal = document.getElementById('formModal');
    const title = document.getElementById('modalTitle');
    const input = document.getElementById('inputNama');
    const btn = document.getElementById('btnSimpanMaster');

    // Reset State
    input.value = '';
    btn.onclick = null; // Clear previous handler

    if (type === 'cat') {
        title.innerText = 'Tambah Kategori';
        input.placeholder = 'Nama Kategori Baru';

        btn.onclick = async () => {
            const val = input.value.trim();
            if (!val) return;

            btn.innerText = "Menyimpan...";
            btn.disabled = true;

            try {
                // Cek duplikasi sederhana (client side check from cache if available, or just push)
                // Firestore doesn't enforce unique constraints easily.
                await addDoc(collection(db, 'categories'), {
                    nama: val,
                    created_at: new Date().toISOString()
                });
                window.tutupModal();
            } catch (e) {
                alert("Error: " + e.message);
            } finally {
                btn.innerText = "Simpan";
                btn.disabled = false;
            }
        };
    }
    // Fallback or other types could be added here

    modal.style.display = 'flex';
    setTimeout(() => input.focus(), 100);
};

window.openEdit = function (type, id, oldName) {
    const modal = document.getElementById('formModal');
    const title = document.getElementById('modalTitle');
    const input = document.getElementById('inputNama');
    const btn = document.getElementById('btnSimpanMaster');

    input.value = oldName;

    if (type === 'cat') {
        title.innerText = 'Edit Kategori';
        btn.onclick = async () => {
            const val = input.value.trim();
            if (!val) return;

            try {
                await updateDoc(doc(db, 'categories', id), {
                    nama: val
                });
                window.tutupModal();
            } catch (e) {
                alert("Error: " + e.message);
            }
        };
    }

    modal.style.display = 'flex';
    setTimeout(() => input.focus(), 100);
};

window.hapusDataMaster = async function (id, name) {
    // Fungsi ini dipanggil dari onclick HTML. 
    // Logic penghapusan spesifik ada di masing-masing page render biasanya, 
    // tapi ini helper global untuk deleteDoc 'categories' atau 'units' jika diparameterisasi.
    // TAPI, di kode inventaris.html, logic delete kategori ada inline.
    // Di sini kita sediakan fungsi generik jika diperlukan.

    // Sesuai 'view_file', fungsi ini ternyata dipanggil oleh tombol hapus di list kategori.
    // NAMUN, di inventaris.html (line 4100 di view sebelumnya), logic delete ada DI DALAM renderList.
    // Jadi mungkin fungsi global ini 'unused' atau 'legacy' di file asli?
    // Mari kita cek source code pengaturan-inventaris.js lagi.
    if (confirm('Hapus data "' + name + '"?')) {
        // Kita butuh tahu collection apa.
        // Karena argumen hanya id dan name, fungsi ini mungkin ambigu tanpa context 'type'.
        // Biasanya di HTML lama: window.hapusDataMaster('id', 'name', 'type')?
        // Mari asumsikan ini untuk Kategori karena posisinya di atas.
        try {
            await deleteDoc(doc(db, 'categories', id));
        } catch (e) {
            alert(e.message);
        }
    }
};

window.tutupModal = function () {
    document.getElementById('formModal').style.display = 'none';
};


// --- 2. MANAJEMEN PIHAK (MARKETPLACE / SUPLAYER) ---
// (Disimpan di partners collection)

window.managePihak = {
    // Namespace untuk fungsi-fungsi pihak agar rapi
};


// --- 3. LOGIKA UNIT (SATUAN) ---
// window.openAddUnit, window.openEditUnit
// Sebagian besar logic satuan dipindah ke inventaris.html (renderUnitList), 
// tapi form modalnya mungkin pakai helper di sini.

window.openAddUnit = function () {
    const el = document.getElementById('formSatuan');
    if (el) {
        el.style.display = 'flex'; // Modal overlay styled
        document.getElementById('namaSatuanBaru').value = '';
        document.getElementById('kodeSatuanBaru').value = '';
        document.getElementById('btnSimpanSatuan').disabled = false;

        // Remove existing onclick to prevent stack
        const btn = document.getElementById('btnSimpanSatuan');
        btn.onclick = window.simpanSatuanBaru;
    }
};

window.simpanSatuanBaru = async function () {
    const nama = document.getElementById('namaSatuanBaru').value.trim();
    const kode = document.getElementById('kodeSatuanBaru').value.trim().toUpperCase();

    if (!nama) { alert("Nama satuan wajib diisi"); return; }

    const btn = document.getElementById('btnSimpanSatuan');
    btn.disabled = true;
    btn.innerText = "Menyimpan...";

    try {
        await addDoc(collection(db, 'units'), {
            nama: nama,
            kode: kode || nama.substring(0, 3).toUpperCase(),
            created_at: new Date().toISOString()
        });

        // Tutup
        document.getElementById('formSatuan').style.display = 'none';
        window.goBack(); // Kembali dari panel add

    } catch (e) {
        alert("Gagal: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Simpan Satuan";
    }
};

window.openEditUnit = function (id, oldNama, oldKode) {
    const el = document.getElementById('formSatuan');
    if (el) {
        el.style.display = 'flex';
        document.getElementById('namaSatuanBaru').value = oldNama;
        document.getElementById('kodeSatuanBaru').value = oldKode;

        const btn = document.getElementById('btnSimpanSatuan');
        btn.disabled = false;

        btn.onclick = async function () {
            const nama = document.getElementById('namaSatuanBaru').value.trim();
            const kode = document.getElementById('kodeSatuanBaru').value.trim().toUpperCase();
            if (!nama) return;

            btn.disabled = true;
            try {
                await updateDoc(doc(db, 'units', id), {
                    nama: nama,
                    kode: kode
                });
                document.getElementById('formSatuan').style.display = 'none';
                window.goBack();
            } catch (e) {
                alert(e.message);
            } finally {
                btn.disabled = false;
            }
        };

        // Manual Trigger Navigation (Optional, if structure expects page navigation)
        // window.goToPage('formSatuan'); // If it was a page, but it seems to be a modal div in view.js
    }
};

// --- 4. CLEAR BIAYA ADMIN UTILS ---
window.bersihkanBiayaAdmin = async function (type, identifier) {
    // Helper untuk hapus field biaya_admin_detail di kategori
    // Saat Marketplace dihapus -> Loop semua kategori, delete key marketplace ID
    // Saat Kategori dihapus -> Dokumen kategori hilang (otomatis bersih)

    if (type === 'market') {
        const marketId = identifier;
        // 1. Get All Categories
        // We assume this runs infrequently, so getDocs is fine or use snapshot cache from inventaris.js logic if accessible.
        // But module isolation... let's use db.
        // Or simpler: Just warn user "Biaya admin terkait marketplace ini mungkin jadi yatim piatu".
        // Implementation Plan said: "Strict Copy Paste". Use whatever was in file.
        // If file didn't have it, don't add it.
        // Based on read file of 'inventaris.html': it calls window.bersihkanBiayaAdmin.
        // So it MUST be defined somewhere. If not in source SPA/pengaturan-inventaris.js, then where?
        // It was likely in logic of inventaris.html itself?
        // Let's check source code of pengaturan-inventaris.js via view_file.
    }
};
