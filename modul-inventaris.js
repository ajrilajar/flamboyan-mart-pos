import { ref, onValue, push, set, remove, update } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { db } from "./firebase-config.js";
import * as SetingInv from "./modul-pengaturan-inventaris.js";

let databaseBarang = {}, dataKategori = {}, dataSatuan = {};
let currentEditId = null;
let multiUnits = []; 

const desktopWidth = "max-w-4xl";

export function renderInventaris() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div id="view-list" class="flex flex-col gap-2 ${desktopWidth} mx-auto p-2 sm:p-4 animate-fadeIn">
            <div class="flex justify-between items-center px-1">
                <h2 class="text-xl font-bold text-gray-800 tracking-tight uppercase">Inventaris</h2>
                <button onclick="window.switchView('view-pengaturan')" class="p-2 text-emerald-600 active:scale-90 transition-all">
                    <i class="fa-solid fa-gear text-lg"></i>
                </button>
            </div>
            <div id="list-barang" class="grid grid-cols-1 md:grid-cols-2 gap-3 pb-32 px-1"></div>
            
            <button onclick="window.bukaHalamanEdit(null)" class="fixed bottom-24 right-4 md:right-[calc(50%-20rem)] bg-emerald-500 text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 font-bold z-40 border-none outline-none active:scale-95 transition-all">
                <i class="fa-solid fa-box-open text-sm"></i> <span class="uppercase text-[11px]">Tambah Barang</span>
            </button>
        </div>

        <div id="view-edit" class="hidden fixed inset-0 bg-white z-[70] overflow-y-auto">
            <div class="${desktopWidth} mx-auto min-h-screen bg-white flex flex-col">
                <div class="flex items-center p-2 border-b sticky top-0 bg-white z-10">
                    <button onclick="window.batalEdit()" class="p-2 text-gray-600 mr-1"><i class="fa-solid fa-arrow-left text-xl"></i></button>
                    <h3 id="edit-title" class="font-bold text-base text-gray-800 uppercase tracking-tight">Tambah Barang</h3>
                </div>
                
                <div class="p-3 space-y-4 flex-1">
                    <div class="relative border border-gray-200 rounded-lg focus-within:border-emerald-500 transition-all">
                        <label class="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-bold text-gray-400 uppercase tracking-widest">Nama Barang</label>
                        <input type="text" id="edit-nama" placeholder="NAMA BARANG" class="w-full p-2.5 bg-transparent outline-none font-bold text-gray-700 uppercase text-sm">
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div onclick="window.bukaPickerSelection('kategori')" class="relative border border-gray-200 rounded-lg p-2.5 flex justify-between items-center cursor-pointer">
                            <label class="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-bold text-gray-400 uppercase tracking-widest">Kategori</label>
                            <input type="text" id="edit-kategori" placeholder="PILIH KATEGORI" class="font-bold text-gray-700 outline-none pointer-events-none text-xs proper-case" readonly>
                            <i class="fa-solid fa-chevron-right text-gray-300 text-[10px]"></i>
                        </div>
                        <div onclick="window.bukaPilihSatuanPengukuran()" class="relative border border-gray-200 rounded-lg p-2.5 flex justify-between items-center cursor-pointer">
                            <label class="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-bold text-gray-400 uppercase tracking-widest">Satuan</label>
                            <input type="text" id="edit-satuan-display" placeholder="PILIH SATUAN" class="w-full font-bold text-gray-700 outline-none pointer-events-none text-xs uppercase truncate" readonly>
                            <i class="fa-solid fa-chevron-right text-gray-300 text-[10px] flex-shrink-0"></i>
                        </div>
                    </div>

                    <div id="info-konversi" class="hidden flex items-start gap-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                        <i class="fa-solid fa-link mt-0.5"></i><span id="text-konversi" class="uppercase"></span>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div class="relative border border-gray-200 rounded-lg">
                            <label class="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-bold text-gray-400 uppercase tracking-widest">Stok Awal</label>
                            <input type="number" id="edit-stok" placeholder="0" class="w-full p-2.5 bg-transparent outline-none font-bold text-gray-700 text-sm">
                        </div>
                        <div class="relative border border-gray-200 rounded-lg flex items-center px-2">
                            <label class="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-bold text-gray-400 uppercase tracking-widest">Harga Jual</label>
                            <span class="text-gray-400 text-[10px] font-bold mr-1">RP</span>
                            <input type="number" id="edit-jual" placeholder="0" class="w-full py-2.5 bg-transparent outline-none font-bold text-gray-700 text-sm">
                        </div>
                    </div>
                </div>

                <div class="p-3 bg-white border-t sticky bottom-0 z-20">
                    <button onclick="window.simpanBarang()" class="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-lg uppercase text-sm">Simpan</button>
                </div>
            </div>
        </div>

        <div id="view-pengaturan" class="hidden fixed inset-0 bg-gray-50 z-[100] overflow-y-auto">
             <div class="${desktopWidth} mx-auto min-h-screen bg-gray-50 flex flex-col shadow-2xl border-x">
                <div class="flex items-center p-4 bg-white border-b sticky top-0 z-10">
                    <button onclick="window.switchView('view-list')" class="mr-4 p-2 active:bg-gray-100 rounded-full"><i class="fa-solid fa-arrow-left text-xl text-gray-600"></i></button>
                    <h3 class="font-bold text-lg text-gray-800 uppercase">Pengaturan Inventaris</h3>
                </div>
                <div class="p-3 space-y-2">
                    <div onclick="window.bukaKelolaSetting('kategori')" class="bg-white p-4 rounded-xl flex justify-between items-center shadow-sm cursor-pointer border border-gray-100 active:bg-gray-50">
                        <div class="flex items-center gap-4"><i class="fa-solid fa-boxes-stacked text-emerald-500"></i><span class="font-bold text-gray-700 uppercase text-sm">Kelola Kategori</span></div>
                        <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                    </div>
                    <div onclick="window.bukaKelolaSetting('satuan')" class="bg-white p-4 rounded-xl flex justify-between items-center shadow-sm cursor-pointer border border-gray-100 active:bg-gray-50">
                        <div class="flex items-center gap-4"><i class="fa-solid fa-scale-balanced text-emerald-500"></i><span class="font-bold text-gray-700 uppercase text-sm">Kelola Satuan Ukur</span></div>
                        <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                    </div>
                </div>
            </div>
        </div>

        <div id="view-multi-satuan" class="hidden fixed inset-0 bg-white z-[120] flex flex-col">
            <div class="${desktopWidth} mx-auto w-full h-full flex flex-col bg-white">
                <div class="flex items-center p-3 border-b">
                    <button onclick="window.tutupMultiSatuan()" class="mr-3 p-2 active:bg-gray-100 rounded-full"><i class="fa-solid fa-arrow-left text-xl text-gray-600"></i></button>
                    <h3 class="font-bold text-lg text-gray-800 uppercase tracking-tight">Satuan Pengukuran</h3>
                </div>
                <div class="p-4 space-y-6 flex-1 overflow-y-auto">
                    <div onclick="window.bukaPickerDasar('utama')" class="relative border border-gray-200 rounded-xl p-3 flex justify-between items-center cursor-pointer">
                        <label class="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 uppercase tracking-widest">Satuan Utama</label>
                        <input type="text" id="val-satuan-utama" placeholder="PILIH SATUAN UTAMA" class="font-bold text-gray-700 outline-none pointer-events-none uppercase" readonly>
                        <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                    </div>
                    <div id="dynamic-secondary-units" class="space-y-6"></div>
                    <button onclick="window.tambahSatuanSekunder()" class="text-emerald-600 font-bold text-[10px] flex items-center gap-2 py-2 uppercase tracking-widest">
                        <i class="fa-solid fa-circle-plus text-base"></i> Tambah Satuan Lainnya
                    </button>
                </div>
                <div class="p-3 border-t grid grid-cols-2 gap-2 bg-gray-50">
                    <button onclick="window.tutupMultiSatuan()" class="py-3 font-bold text-gray-400 text-[10px] uppercase tracking-widest bg-white border rounded-xl">Batal</button>
                    <button onclick="window.konfirmasiSatuan()" class="py-3 bg-emerald-500 text-white font-bold rounded-xl active:scale-95 uppercase text-sm">Simpan</button>
                </div>
            </div>
        </div>

        <div id="modal-container" onclick="window.overlayClose(event)" class="hidden fixed inset-0 bg-black/60 z-[200] flex items-end justify-center overflow-hidden transition-all">
            <div id="modal-panel" class="bg-white w-full ${desktopWidth} rounded-t-[2rem] max-h-[85vh] animate-slide-up relative">
                <div id="drag-handle" class="w-full py-4 cursor-grab active:cursor-grabbing">
                    <div class="w-12 h-1.5 bg-gray-200 rounded-full mx-auto"></div>
                </div>
                <div id="modal-content" class="flex flex-col overflow-hidden h-full pb-8"></div>
            </div>
        </div>
    `;

    initDragLogic();
    loadFirebaseData();
}

// Poin 5: Fitur Drag to Close Logic
function initDragLogic() {
    const panel = document.getElementById('modal-panel');
    const handle = document.getElementById('drag-handle');
    let startY = 0, currentY = 0;

    const onStart = (e) => {
        startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        panel.style.transition = 'none';
    };

    const onMove = (e) => {
        if (startY === 0) return;
        currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        const deltaY = currentY - startY;
        if (deltaY > 0) panel.style.transform = `translateY(${deltaY}px)`;
    };

    const onEnd = () => {
        const deltaY = currentY - startY;
        panel.style.transition = 'transform 0.3s ease-out';
        if (deltaY > 150) window.tutupModal();
        else panel.style.transform = `translateY(0)`;
        startY = 0;
    };

    handle.addEventListener('touchstart', onStart);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
}

// Poin 4: Sticky Button & No Missing Items
function renderListPicker(type, mode = null, index = null) {
    const content = document.getElementById('modal-content');
    const data = type === 'kategori' ? dataKategori : dataSatuan;
    const title = type === 'kategori' ? 'Pilih Kategori' : 'Pilih Satuan Dasar';
    const btnLabel = type === 'kategori' ? 'Tambah Kategori Baru' : 'Tambah Satuan Baru';

    content.innerHTML = `
        <div class="px-6 mb-4 flex-shrink-0">
            <h3 class="font-bold text-lg text-gray-800 uppercase tracking-tight">${title}</h3>
        </div>
        <div class="flex-1 overflow-y-auto px-6 space-y-1 divide-y divide-gray-50 no-scrollbar">
            ${Object.entries(data).map(([id, item]) => `
                <div onclick="window.selectAndClose('${type}', '${type === 'satuan' ? item.pendek : item.nama}', '${mode}', ${index})" class="py-4 flex justify-between items-center cursor-pointer active:bg-gray-50 transition-all">
                    <span class="font-bold text-gray-700 text-sm proper-case">${item.nama} ${item.pendek ? `<span class="text-gray-300 ml-2 font-medium uppercase">${item.pendek}</span>` : ''}</span>
                    <i class="fa-solid fa-chevron-right text-gray-200 text-xs"></i>
                </div>
            `).join('')}
        </div>
        <div class="p-6 bg-white border-t flex-shrink-0">
            <button onclick="window.renderFormTambahBaru('${type}', '${mode}', ${index})" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest">${btnLabel}</button>
        </div>
    `;
}

window.bukaPickerSelection = (type) => {
    document.body.classList.add('modal-open');
    document.getElementById('modal-container').classList.remove('hidden');
    document.getElementById('modal-panel').style.transform = `translateY(0)`;
    renderListPicker(type);
};

window.tutupModal = () => {
    document.body.classList.remove('modal-open');
    document.getElementById('modal-container').classList.add('hidden');
};

// Poin 1 & 2: Propercase & Larger Column
window.filterInventaris = () => {
    const list = document.getElementById('list-barang');
    if(!list) return; list.innerHTML = "";
    Object.entries(databaseBarang).forEach(([id, item]) => {
        const inisial = item.nama.substring(0, 2).toUpperCase();
        list.innerHTML += `
            <div class="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm active:bg-gray-50 transition-all">
                <div class="w-12 h-12 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center font-bold text-xs">${inisial}</div>
                <div class="flex-1 overflow-hidden">
                    <h4 class="font-bold text-[15px] text-gray-700 truncate proper-case">${item.nama}</h4>
                    <p class="text-[10px] text-gray-400 font-bold tracking-tighter proper-case">${item.kategori}</p>
                </div>
                <div class="text-right">
                    <p class="text-sm font-black text-emerald-600">${item.stok} <span class="uppercase text-[10px]">${item.satuan}</span></p>
                </div>
            </div>`;
    });
};

// Fungsi lainnya tetap
window.konfirmasiSatuan = () => {
    const utama = document.getElementById('val-satuan-utama').value;
    if (!utama) return alert("PILIH SATUAN UTAMA!");
    let display = utama;
    let chainInfo = `1 ${utama}`;
    multiUnits.forEach(m => { if (m.unit && m.ratio) { display += ` & ${m.unit}`; chainInfo += ` → ${m.ratio} ${m.unit}`; } });
    document.getElementById('edit-satuan-display').value = display;
    const infoDiv = document.getElementById('info-konversi');
    if (multiUnits.length > 0) { infoDiv.classList.remove('hidden'); document.getElementById('text-konversi').innerText = chainInfo; } 
    else { infoDiv.classList.add('hidden'); }
    window.switchView('view-edit');
};

window.bukaPickerDasar = (mode, index = null) => {
    document.getElementById('modal-container').classList.remove('hidden');
    renderListPicker('satuan', mode, index);
};

window.renderFormTambahBaru = (type, mode, index, id = null) => {
    const content = document.getElementById('modal-content');
    const item = id ? (type === 'kategori' ? dataKategori[id] : dataSatuan[id]) : { nama: "", pendek: "" };
    content.innerHTML = `
        <div class="flex items-center px-6 mb-8 flex-shrink-0">
            <button onclick="${id ? `window.bukaKelolaSetting('${type}')` : `window.renderListPicker('${type}', '${mode}', ${index})`}" class="mr-4 text-gray-400 p-2"><i class="fa-solid fa-arrow-left text-lg"></i></button>
            <h3 class="font-bold text-lg text-gray-800 uppercase">${id ? 'Ubah' : 'Buat'} ${type} Baru</h3>
        </div>
        <div class="flex-1 overflow-y-auto px-6 space-y-6">
            <div class="relative border-2 border-emerald-500 rounded-xl p-1">
                <label class="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-emerald-500 uppercase">Nama ${type}</label>
                <input type="text" id="new-name" value="${item.nama}" class="w-full p-3 bg-transparent outline-none font-bold text-gray-700 uppercase" placeholder="NAMA ${type.toUpperCase()}">
            </div>
            ${type === 'satuan' ? `
                <div class="relative border border-gray-200 rounded-xl p-1 bg-gray-50">
                    <label class="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-gray-400 uppercase tracking-widest">Satuan Pendek (Maks 5 Huruf)</label>
                    <input type="text" id="new-short" value="${item.pendek}" maxlength="5" class="w-full p-3 bg-transparent outline-none font-bold text-gray-700 uppercase" placeholder="PENDEK">
                </div>
            ` : ''}
        </div>
        <div class="p-6 flex-shrink-0">
            <button onclick="window.prosesSimpanData('${type}', '${id}', '${mode}', ${index})" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold shadow-lg active:scale-95 uppercase text-xs tracking-widest">Simpan & Selesai</button>
        </div>
    `;
};

window.prosesSimpanData = async (type, id, mode, index) => {
    const nama = document.getElementById('new-name').value.trim();
    if (!nama) return;
    const pendek = type === 'satuan' ? document.getElementById('new-short').value : null;
    if (type === 'kategori') { await SetingInv.simpanKategori(nama, id); if(!id) window.selectAndClose('kategori', nama); } 
    else { await SetingInv.simpanSatuanDasar(nama, pendek, id); if(!id) window.selectAndClose('satuan', pendek.toUpperCase(), mode, index); }
    if(id) window.bukaKelolaSetting(type);
};

window.bukaKelolaSetting = (type) => {
    document.getElementById('modal-container').classList.remove('hidden');
    const content = document.getElementById('modal-content');
    const data = type === 'kategori' ? dataKategori : dataSatuan;
    content.innerHTML = `
        <div class="px-6 mb-5 flex-shrink-0"><h3 class="font-bold text-lg text-gray-800 uppercase tracking-tight">Kelola ${type}</h3></div>
        <div class="flex-1 overflow-y-auto px-6 space-y-1 divide-y divide-gray-50 no-scrollbar">
            ${Object.entries(data).map(([id, item]) => `
                <div class="flex justify-between items-center py-4">
                    <span class="font-bold text-gray-700 text-sm proper-case">${item.nama} ${item.pendek ? `<span class="text-gray-300 ml-2 font-medium uppercase">${item.pendek}</span>` : ''}</span>
                    <div class="flex gap-4">
                        <button onclick="window.renderFormTambahBaru('${type}', null, null, '${id}')" class="text-gray-300"><i class="fa-solid fa-pen text-sm"></i></button>
                        <button onclick="window.hapusSettingData('${type}', '${id}')" class="text-rose-200"><i class="fa-solid fa-trash-can text-sm"></i></button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="p-6 flex-shrink-0">
            <button onclick="window.renderFormTambahBaru('${type}', null, null)" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest">+ Tambah Baru</button>
        </div>
    `;
};

window.hapusSettingData = async (type, id) => { type === 'kategori' ? await SetingInv.hapusKategori(id) : await SetingInv.hapusSatuanDasar(id); window.bukaKelolaSetting(type); };
window.selectAndClose = (type, val, mode, index) => {
    if (type === 'kategori') { document.getElementById('edit-kategori').value = val; } 
    else { if (mode === 'utama') document.getElementById('val-satuan-utama').value = val.toUpperCase(); else multiUnits[index].unit = val.toUpperCase(); renderKonversiList(); }
    window.tutupModal();
};

function renderKonversiList() {
    const container = document.getElementById('dynamic-secondary-units');
    const utama = document.getElementById('val-satuan-utama').value || 'UTAMA';
    container.innerHTML = multiUnits.map((item, idx) => `
        <div class="space-y-4 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 relative animate-fadeIn">
            <button onclick="window.hapusRowKonversi(${idx})" class="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-md border-2 border-white"><i class="fa-solid fa-xmark"></i></button>
            <div onclick="window.bukaPickerDasar('sekunder', ${idx})" class="relative border border-gray-200 rounded-xl p-2.5 flex justify-between items-center cursor-pointer bg-white">
                <label class="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-bold text-gray-400 uppercase tracking-widest">Satuan Ke-${idx + 2}</label>
                <input type="text" value="${item.unit}" placeholder="PILIH SATUAN" class="font-bold text-gray-700 outline-none pointer-events-none uppercase text-xs" readonly>
                <i class="fa-solid fa-chevron-right text-gray-300 text-[10px]"></i>
            </div>
            <div class="relative border border-gray-200 rounded-xl p-0.5 bg-white">
                <label class="absolute -top-2 left-2 px-1 bg-white text-[9px] font-bold text-gray-400 uppercase">1 ${utama} = Berapa?</label>
                <input type="number" oninput="window.updateRatio(${idx}, this.value)" value="${item.ratio}" class="w-full p-2 outline-none font-bold text-gray-700 text-sm" placeholder="ANGKA">
            </div>
        </div>
    `).join('');
}

window.loadFirebaseData = () => { 
    onValue(ref(db, 'products'), s => { databaseBarang = s.val() || {}; window.filterInventaris(); }); 
    onValue(ref(db, 'settings/categories'), s => { dataKategori = s.val() || {}; }); 
    onValue(ref(db, 'settings/units'), s => { dataSatuan = s.val() || {}; }); 
};
window.switchView = (v) => { document.querySelectorAll('[id^="view-"]').forEach(el => el.classList.add('hidden')); document.getElementById(v).classList.remove('hidden'); window.scrollTo(0,0); };
window.overlayClose = (e) => { if(e.target.id === 'modal-container') window.tutupModal(); };
window.tutupMultiSatuan = () => window.switchView('view-edit');
window.bukaPilihSatuanPengukuran = () => window.switchView('view-multi-satuan');
window.tambahSatuanSekunder = () => { multiUnits.push({ unit: '', ratio: '' }); renderKonversiList(); };
window.hapusRowKonversi = (idx) => { multiUnits.splice(idx, 1); renderKonversiList(); };
window.updateRatio = (idx, val) => multiUnits[idx].ratio = val;
window.bukaHalamanEdit = (id) => { currentEditId = id; multiUnits = []; window.switchView('view-edit'); };
window.batalEdit = () => window.switchView('view-list');