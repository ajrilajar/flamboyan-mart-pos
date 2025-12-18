import { ref, push, remove, update } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { db } from "./firebase-config.js";

export async function simpanKategori(nama, id = null) {
    if (!nama) return;
    const path = id ? `settings/categories/${id}` : `settings/categories`;
    id ? await update(ref(db, path), { nama }) : await push(ref(db, path), { nama });
}

export async function hapusKategori(id) {
    if (confirm('Hapus kategori ini?')) await remove(ref(db, `settings/categories/${id}`));
}

export async function simpanSatuan(nama, pendek, id = null) {
    if (!nama || !pendek) return;
    const path = id ? `settings/units/${id}` : `settings/units`;
    const data = { nama, pendek: pendek.toUpperCase() };
    id ? await update(ref(db, path), data) : await push(ref(db, path), data);
}

export async function hapusSatuan(id) {
    if (confirm('Hapus satuan ini?')) await remove(ref(db, `settings/units/${id}`));
}