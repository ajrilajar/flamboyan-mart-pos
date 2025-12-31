// SPA/modules/tambah-barang-inventaris.js
import {
    db,
    collection,
    addDoc,
    setDoc,
    doc,
    updateDoc,
    onSnapshot,
    runTransaction,
    query,
    where,
    getDoc,
    deleteDoc, // Added based on frequent usage in deletion logic
    getDocs // Added based on frequent usage
} from "../firebase-config.js";

// ============ STATE LOKAL ============
window.appState = { satuanUtama: null, satuanTambahan: [] };
let modePilih = '';
let indexEdit = -1;
window.editingProductId = null;
window.cachedPihakData = {};
window.modePilihPihak = '';

// ============ FUNGSI GLOBAL ============

// 1. Setup Tab (Offline/Online)
window.validateFormSave = function () {
    try {
        const nEl = document.getElementById('nama_barang');
        const kEl = document.getElementById('kategori');
        const sEl = document.getElementById('satuan');

        const nama = nEl ? nEl.value.trim() : '';
        const kategori = kEl ? kEl.value.trim() : '';
        const satuan = sEl ? sEl.value.trim() : '';

        const isValid = nama && kategori && satuan;
        const btn = document.getElementById('btnSimpan');
        if (btn) btn.disabled = !isValid;
    } catch (e) {
        console.warn("Validation Error (Safe to ignore):", e);
    }
};

window.rescueInputs = function () {
    ['nama_barang', 'kategori', 'satuan', 'harga_beli'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.disabled = false;
            el.readOnly = (id === 'kategori' || id === 'satuan'); // Select-like
            el.style.pointerEvents = 'auto';
        }
    });
};

window.setupTabs = function () {
    const container = document.getElementById('dynamic-tabs');
    if (!container) return;
    container.innerHTML = '';

    // Tab Online selalu aktif (tidak perlu cek toggle yang sudah dihapus)
    const tabsDef = [
        { id: 'offline', label: 'Offline' },
        { id: 'online', label: 'Online' },
        { id: 'tambahan', label: 'Detail Tambahan' }
    ];

    tabsDef.forEach(t => {
        const div = document.createElement('div');
        div.className = 'tab';
        div.innerText = t.label;
        div.onclick = () => window.switchTab(t.id, div);
        container.appendChild(div);
    });
    window.switchTab('offline', container.firstChild);
};

window.switchTab = function (tabId, tabElement) {
    document.querySelectorAll('#dynamic-tabs .tab').forEach(t => t.classList.remove('active'));
    if (tabElement) tabElement.classList.add('active');
    document.querySelectorAll('.tab-content-section').forEach(el => el.style.display = 'none');
    const target = document.getElementById('section-' + tabId);
    if (target) target.style.display = 'block';

    const subTabContainer = document.getElementById('sub-tabs-online');
    if (tabId === 'online') {
        if (subTabContainer) subTabContainer.style.display = 'flex';
        window.switchSubTab('suplayer');
    } else {
        if (subTabContainer) subTabContainer.style.display = 'none';
    }
};

window.switchSubTab = function (subId) {
    const btnSup = document.getElementById('btn-sub-suplayer');
    const btnMark = document.getElementById('btn-sub-marketplace');
    const secSup = document.getElementById('sub-section-suplayer');
    const secMark = document.getElementById('sub-section-marketplace');

    if (subId === 'suplayer') {
        btnSup.classList.add('active');
        btnMark.classList.remove('active');
        if (secSup) secSup.style.display = 'block';
        if (secMark) secMark.style.display = 'none';
    } else {
        btnSup.classList.remove('active');
        btnMark.classList.add('active');
        if (secSup) secSup.style.display = 'none';
        if (secMark) secMark.style.display = 'block';
    }
};

// ============ FUNGSI BANTUAN (SINGLE SOURCE OF TRUTH) ============
window.reconstructUnitState = function (prod) {
    if (!prod) return "";
    window.appState = { satuanUtama: null, satuanTambahan: [] };
    let rawUnits = prod.konversi_satuan || [];

    if (rawUnits.length === 0) return "";

    rawUnits.sort((a, b) => parseFloat(a.rasio) - parseFloat(b.rasio));
    const main = rawUnits.find(s => parseFloat(s.rasio) === 1) || rawUnits[0];

    const dbMain = (window.satuanData || []).find(s => s.nama === main.nama);
    const codeMain = main.kode || (dbMain ? dbMain.kode : main.nama);

    window.appState.satuanUtama = { nama: main.nama, kode: codeMain };

    window.appState.satuanTambahan = rawUnits
        .filter(s => s.nama !== main.nama)
        .map(s => {
            const dbSub = (window.satuanData || []).find(d => d.nama === s.nama);
            return {
                nama: s.nama,
                kode: s.kode || (dbSub ? dbSub.kode : s.nama),
                rasio: s.rasio
            };
        });

    let displayString = main.nama;
    if (window.appState.satuanTambahan.length > 0) {
        const extraNames = window.appState.satuanTambahan.map(s => s.nama).join(', ');
        displayString += ` (${extraNames})`;
    }

    return displayString;
};

window.applyDefaultUnitLogic = function () {
    window.appState.satuanUtama = null;
    window.appState.satuanTambahan = [];
    const defaults = window.defaultUnitSettings;

    if (defaults && defaults.utama) {
        window.appState.satuanUtama = defaults.utama;
        window.appState.satuanTambahan = defaults.tambahan || [];
        let display = defaults.utama.nama;
        if (defaults.tambahan && defaults.tambahan.length > 0) {
            const extras = defaults.tambahan.map(s => s.nama).join(', ');
            display += ` (${extras})`;
        }
        const mainInput = document.getElementById('satuan');
        if (mainInput) mainInput.value = display;
    } else {
        const mainInput = document.getElementById('satuan');
        if (mainInput) mainInput.value = "";
    }

    window.renderUICompact();
    if (window.renderDynamicUnits) window.renderDynamicUnits();
    if (window.updateDropdownDefaults) window.updateDropdownDefaults();
    if (window.validateFormSave) window.validateFormSave();
};

// ============ LOGIKA SATUAN ============
window.bukaPanelSatuanCompact = function () {
    const isSettingsMode = document.getElementById('page-tambah-barang-v6').classList.contains('hidden');

    if (isSettingsMode) {
        if (window.satuanDefaultState) {
            window.appState.satuanUtama = window.satuanDefaultState.utama ? { ...window.satuanDefaultState.utama } : null;
            window.appState.satuanTambahan = window.satuanDefaultState.tambahan ? window.satuanDefaultState.tambahan.map(u => ({ ...u })) : [];
        } else {
            window.appState = { satuanUtama: null, satuanTambahan: [] };
        }
    }
    window.openPanel('panelSatuanCompact');
    window.renderUICompact();
};

window.resetSatuanDraft = function () {
    window.appState.satuanUtama = null;
    window.appState.satuanTambahan = [];
    window.renderUICompact();
    window.showToast("Direset (Klik Simpan untuk terapkan)", "refresh");
};

window.renderUICompact = function () {
    const inputSatuanUtama = document.getElementById('inputSatuanUtama');
    const area = document.getElementById('areaKonversi');
    const btnSimpan = document.getElementById('btnSimpanSatuanCompact');
    const container = document.getElementById('listKonversiContainer');
    const isSettingsMode = document.getElementById('page-tambah-barang-v6').classList.contains('hidden');
    const resetBtn = document.getElementById('btn-reset-satuan-draft');
    if (resetBtn) resetBtn.style.display = isSettingsMode ? 'block' : 'none';

    if (btnSimpan) {
        btnSimpan.onclick = isSettingsMode ? window.simpanSatuanPengaturan : window.simpanSatuanTambahBarang;
    }

    if (window.appState.satuanUtama) {
        if (inputSatuanUtama) inputSatuanUtama.value = `${window.appState.satuanUtama.nama} (${window.appState.satuanUtama.kode})`;
        if (area) area.style.display = 'block';
        if (btnSimpan) btnSimpan.disabled = false;
    } else {
        if (inputSatuanUtama) inputSatuanUtama.value = '';
        if (area) area.style.display = 'none';
        if (btnSimpan) btnSimpan.disabled = !isSettingsMode;
    }

    if (!container) return; // Safeguard container access
    container.innerHTML = '';
    if (window.appState.satuanTambahan.length === 0) {
        container.innerHTML = '<div class="empty-state"><span class="material-icons-outlined">scale</span><div>Belum ada satuan besar.</div></div>';
        return;
    }

    window.appState.satuanTambahan.forEach((item, index) => {
        const baseCode = window.appState.satuanUtama ? window.appState.satuanUtama.kode : '...';
        const row = document.createElement('div');
        row.className = 'compact-conversion-row';
        row.innerHTML = `
            <div class="row-left">
                <span class="static-num">1</span>
                <div class="clickable-unit" onclick="window.bukaPanelEditCompact(${index})">
                    <span class="unit-code">${item.nama} (${item.kode})</span>
                    <span class="material-icons-outlined icon-edit">edit</span>
                </div>
                <span class="static-num">=</span>
            </div>
            <div class="row-center">
                <input type="tel" class="compact-input-field" value="${item.rasio}" placeholder="0" oninput="this.classList.remove('error-field'); window.updateRasioCompact(${index}, this.value)" onblur="window.validasiRasio(${index})">
                <span class="base-unit-code">${baseCode}</span>
            </div>
            ${!window.editingProductId ? `
            <div class="btn-delete-compact" onclick="window.hapusSatuanCompact(${index})">
                <span class="material-icons-outlined">delete_outline</span>
            </div>` : ''}
        `;
        container.appendChild(row);
    });
};

window.updateRasioCompact = function (index, val) {
    const cleaned = val.replace(/[^\d]/g, '');
    window.appState.satuanTambahan[index].rasio = cleaned;
};

window.validasiRasio = function (index) {
    const item = window.appState.satuanTambahan[index];
    if (item.rasio && parseFloat(item.rasio) <= 0) {
        alert("Rasio harus lebih besar dari 0");
        window.appState.satuanTambahan[index].rasio = '';
        window.renderUICompact();
    }
};

window.hapusSatuanCompact = function (index) {
    window.appState.satuanTambahan.splice(index, 1);
    window.renderUICompact();
};

window.bukaPanelEditCompact = function (index) {
    window.modePilih = 'edit';
    window.indexEdit = index;
    const judulPanel = document.querySelector('#panelSatuan .standard-header h2');
    if (judulPanel) judulPanel.textContent = 'Ganti Satuan';
    const inputSearch = document.getElementById('searchSatuan');
    if (inputSearch) inputSearch.value = "";
    window.openPanel('panelSatuan');
    window.filterSatuan();
};

window.bukaPanelPilihSatuan = function (mode) {
    if (mode === 'utama' && window.editingProductId) {
        window.showToast("Satuan dasar tidak boleh diubah saat edit!", "warning");
        return;
    }
    window.modePilih = mode;
    window.openPanel('panelSatuan');
    window.filterSatuan();
};

window.updateDropdownDefaults = function () {
    const mainUnit = window.appState.satuanUtama;
    if (!mainUnit) return;
    const setIfMatch = (dispId, inpId) => {
        const d = document.getElementById(dispId);
        const i = document.getElementById(inpId);
        if (d && i) {
            const exists = [mainUnit, ...window.appState.satuanTambahan].find(u => u.nama === i.value);
            if (!i.value || !exists) {
                d.innerText = mainUnit.kode;
                i.value = mainUnit.nama;
            }
        }
    };
    setIfMatch('displayUnitstok_awal', 'satuan_stok_awal');
    setIfMatch('displayUnitStokMin', 'satuan_stok_min');
    setIfMatch('selectedUnitText', 'satuan_beli_terpilih');
};

window.filterSatuan = function () {
    const searchInput = document.getElementById('searchSatuan');
    if (!searchInput) return;
    window.checkSearchInput(searchInput);

    const searchTerm = searchInput.value.toLowerCase();
    const container = document.getElementById('listSatuan');
    container.innerHTML = '';

    const kodeTerpakai = [];
    if (modePilih === 'utama') {
        if (window.appState.satuanTambahan) {
            window.appState.satuanTambahan.forEach(s => kodeTerpakai.push(s.kode));
        }
    } else {
        if (window.appState.satuanUtama) kodeTerpakai.push(window.appState.satuanUtama.kode);
        if (window.appState.satuanTambahan) {
            window.appState.satuanTambahan.forEach(s => kodeTerpakai.push(s.kode));
        }
    }

    const data = window.satuanData || [];
    const filtered = data.filter(item => {
        const matchSearch = item.nama.toLowerCase().includes(searchTerm) || item.kode.toLowerCase().includes(searchTerm);
        if (window.modePilih === 'edit' && window.indexEdit !== -1) {
            const currentItem = window.appState.satuanTambahan[window.indexEdit];
            const kodeSedangDiedit = currentItem ? currentItem.kode : null;
            if (item.kode === kodeSedangDiedit) return matchSearch;
        }
        return matchSearch && !kodeTerpakai.includes(item.kode);
    });

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">Satuan tidak tersedia (Coba buat baru)</div>';
        return;
    }

    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = 'common-list-item';
        div.style.cursor = 'pointer';

        div.innerHTML = `
        <div class="unit-info">
            <b>${item.nama}</b>
            <div style="color:var(--gray);font-size:12px">${item.kode}</div>
        </div>`;

        div.onclick = () => {
            if (window.modePilih === 'utama') {
                window.appState.satuanUtama = { nama: item.nama, kode: item.kode };
                window.goBack();
                if (window.renderUICompact) window.renderUICompact();
            }
            else if (window.modePilih === 'tambahan') {
                window.appState.satuanTambahan.push({ nama: item.nama, kode: item.kode, rasio: '' });
                window.goBack();
                if (window.renderUICompact) {
                    window.renderUICompact();
                    setTimeout(() => {
                        const inputs = document.querySelectorAll('.compact-input-field');
                        if (inputs.length > 0) {
                            const lastInput = inputs[inputs.length - 1];
                            lastInput.focus();
                            lastInput.addEventListener('input', () => lastInput.classList.remove('error-field'), { once: true });
                        }
                    }, 300);
                }
            }
            else if (window.modePilih === 'edit') {
                if (window.indexEdit !== undefined && window.indexEdit !== -1) {
                    window.appState.satuanTambahan[window.indexEdit] = {
                        ...window.appState.satuanTambahan[window.indexEdit],
                        nama: item.nama,
                        kode: item.kode
                    };
                }
                window.goBack();
                if (window.renderUICompact) window.renderUICompact();
                window.indexEdit = -1;
            }
            if (window.renderDynamicUnits) window.renderDynamicUnits();
        };
        container.appendChild(div);
    });
};

window.validateUnitRatios = function () {
    let allValid = true;
    const inputs = document.querySelectorAll('.compact-input-field');
    window.appState.satuanTambahan.forEach((item, index) => {
        const inputEl = inputs[index];
        if (!item.rasio || parseFloat(item.rasio) <= 0) {
            if (inputEl) inputEl.classList.add('error-field');
            allValid = false;
        } else {
            if (inputEl) inputEl.classList.remove('error-field');
        }
    });
    if (!allValid) window.showToast("Isi semua rasio dengan benar!", "error");
    return allValid;
};

window.simpanSatuanPengaturan = function () {
    if (!window.appState.satuanUtama) {
        setDoc(doc(db, 'settings', 'default_satuan'), { data: null })
            .then(() => window.showToast("Satuan default dinonaktifkan", "delete"))
            .catch(e => alert("Gagal: " + e.message));
        return;
    }

    if (!window.validateUnitRatios()) return;

    const newData = {
        utama: window.appState.satuanUtama,
        tambahan: window.appState.satuanTambahan
    };
    updateDoc(doc(db, 'settings/default_satuan'), { data: newData })
        .then(() => window.showToast("Satuan default disimpan & aktif", "success"))
        .catch(e => {
            if (e.code === 'not-found') {
                setDoc(doc(db, 'settings/default_satuan'), { data: newData });
            }
        });
};

window.simpanSatuanTambahBarang = function () {
    if (!window.appState.satuanUtama) {
        document.getElementById('inputSatuanUtama').classList.add('error-field');
        window.showToast("Pilih satuan dasar!", "error");
        return;
    } else {
        document.getElementById('inputSatuanUtama').classList.remove('error-field');
    }

    if (!window.validateUnitRatios()) return;

    let result = window.appState.satuanUtama.nama;
    if (window.appState.satuanTambahan.length > 0) {
        const extras = window.appState.satuanTambahan.map(s => s.nama).join(', ');
        result += ` (${extras})`;
    }
    document.getElementById('satuan').value = result;
    window.resetDataOnlineBarang();
    if (window.renderDynamicUnits) window.renderDynamicUnits();
    if (window.updateDropdownDefaults) window.updateDropdownDefaults();
    window.validateFormSave();
    window.goBack();
};

window.simpanSatuanCompact = function () {
    const isSettingsMode = document.getElementById('page-tambah-barang-v6').classList.contains('hidden');
    if (isSettingsMode) window.simpanSatuanPengaturan();
    else window.simpanSatuanTambahBarang();
};

window.filterKategori = function () {
    console.log('[filterKategori] Dipanggil');
    const searchInput = document.getElementById('searchKategori');
    if (!searchInput) {
        console.log('[filterKategori] searchKategori input tidak ditemukan!');
        return;
    }
    window.checkSearchInput(searchInput);

    const searchTerm = searchInput.value.toLowerCase().trim();
    const container = document.getElementById('listKategori');
    if (!container) {
        console.log('[filterKategori] listKategori container tidak ditemukan!');
        return;
    }

    container.innerHTML = '';
    const data = window.kategoriData || [];
    console.log('[filterKategori] Data kategori:', data.length, 'items');

    const filtered = data.filter(item => {
        const nama = item.nama ? String(item.nama).toLowerCase() : "";
        return nama.includes(searchTerm);
    });

    console.log('[filterKategori] Filtered:', filtered.length, 'items');

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">Kategori tidak ditemukan</div>';
        return;
    }

    filtered.forEach(item => {
        console.log('[filterKategori] Rendering:', item.nama);
        const div = document.createElement('div');
        div.className = 'common-list-item info-only';

        const nameEl = document.createElement('b');
        nameEl.textContent = item.nama;

        const countEl = document.createElement('div');
        countEl.textContent = `${item.count || 0} Barang`;
        countEl.className = 'subtitle';

        div.appendChild(nameEl);
        div.appendChild(countEl);

        div.onclick = () => {
            console.log('[filterKategori] Kategori dipilih:', item.nama);
            document.getElementById('kategori').value = item.nama;
            window.goBack();
            window.validateFormSave();
        };
        container.appendChild(div);
    });

    console.log('[filterKategori] Selesai rendering ke container');
};

// ============ LOGIKA ONLINE ============
window.tambahBarisSuplayer = function () {
    window.modePilihPihak = 'suplayer';
    document.getElementById('titlePanelPihak').innerText = 'Pilih Suplayer';
    document.getElementById('searchPihakOnline').value = '';
    window.openPanel('panelPilihPihak');
    window.filterPihakOnline();
};

window.tambahBarisMarketplace = function () {
    window.modePilihPihak = 'marketplace';
    document.getElementById('titlePanelPihak').innerText = 'Pilih Marketplace';
    document.getElementById('searchPihakOnline').value = '';
    window.openPanel('panelPilihPihak');
    window.filterPihakOnline();
};

window.filterPihakOnline = function () {
    const container = document.getElementById('listPihakOnline');
    const kwInput = document.getElementById('searchPihakOnline');
    if (kwInput) window.checkSearchInput(kwInput);
    const kw = kwInput ? kwInput.value.toLowerCase().trim() : "";
    if (!container) return;
    container.innerHTML = '';

    const pihakTerpilih = [];
    const selector = window.modePilihPihak === 'suplayer' ? '#list-suplayer-container b' : '#list-marketplace-container b';
    document.querySelectorAll(selector).forEach(el => pihakTerpilih.push(el.innerText.trim().toLowerCase()));

    let found = false;
    const targetKey = (window.modePilihPihak === 'suplayer') ? 'suplayer' : 'marketplace';
    const sourceData = window.cachedPihakData[targetKey] || {};

    Object.entries(sourceData).forEach(([id, p]) => {
        const namaPihak = p.nama ? p.nama.toLowerCase() : "";
        if (namaPihak.includes(kw) && !pihakTerpilih.includes(namaPihak)) {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `<div class="name">${p.nama}</div><div class="subtitle">${targetKey.toUpperCase()}</div>`;
            div.onclick = () => window.konfirmasiPilihPihak(p.nama);
            container.appendChild(div);
            found = true;
        }
    });

    if (!found) {
        container.innerHTML = `<div class="empty-state">Data tidak ditemukan</div>`;
    }
};

window.tambahPihakBaru = function () {
    const tipe = window.modePilihPihak;
    if (window.openAdd) {
        window.openAdd(tipe === 'marketplace' ? 'marketplace' : 'suplayer');
    } else {
        alert("Fungsi Tambah belum siap");
    }
};

window.konfirmasiPilihPihak = function (namaPihak) {
    const panel = document.getElementById('panelPilihPihak');
    if (panel && panel.classList.contains('show')) window.goBack();
    window.renderKolomHargaOnline(namaPihak);
};

window.renderKolomHargaOnline = function (namaPihak, isEditMode = false) {
    const tipe = window.modePilihPihak;
    const container = document.getElementById(tipe === 'suplayer' ? 'list-suplayer-container' : 'list-marketplace-container');
    if (!container) return;

    if (!isEditMode) {
        const existing = Array.from(container.children).find(c => {
            const titleEl = c.querySelector('b');
            return titleEl && titleEl.innerText.trim() === namaPihak;
        });
        if (existing) {
            console.warn(`Pihak "${namaPihak}" sudah ditambahkan`);
            return;
        }
    }

    const headerColor = tipe === 'marketplace' ? '#e67e22' : 'var(--green)';
    const inputClassExtra = tipe === 'marketplace' ? 'input-marketplace' : '';
    const rowId = Date.now();
    const card = document.createElement('div');
    card.className = 'card-online-pihak';
    card.id = `card-pihak-${rowId}`;
    card.style.border = '1px solid #ddd';
    card.style.padding = '15px';
    card.style.borderRadius = '12px';
    card.style.marginBottom = '15px';
    card.style.background = '#fff';
    card.dataset.pihakNama = namaPihak;

    let html = `
        <div class="card-online-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <b style="color:${headerColor}">${namaPihak}</b>
            <span class="material-icons-outlined" style="color:var(--red); cursor:pointer;" onclick="this.closest('.card-online-pihak').remove(); window.isFormDirty = true;">delete</span>
        </div>`;

    if (tipe === 'suplayer') {
        const defaultUnitCode = window.appState.satuanUtama ? window.appState.satuanUtama.kode : '';
        const defaultUnitName = window.appState.satuanUtama ? window.appState.satuanUtama.nama : '';

        html += `
        <div class="flex-row" style="display:flex; margin-bottom:10px; position:relative; z-index:10;">
            <div class="input-group w-80" style="flex: 1;">
                <input type="number" class="input-box-v6 harga-default-suplayer" placeholder=" " inputmode="numeric">
                <label class="floating-label">Harga Beli Default</label>
            </div>
            <div class="custom-select-container w-20 unit-dropdown-trigger" onclick="window.toggleCardUnitDropdown(this)" 
                 style="width: 20%; position: relative; cursor: pointer;">
                <div class="select-trigger" style="display:flex; align-items:center; justify-content:center; height:100%;">
                    <span class="unit-display-target" style="font-size:13px; font-weight:600; color:var(--green); margin-right:4px;">${defaultUnitCode}</span>
                    <span class="material-icons-outlined" style="font-size:16px;">expand_more</span>
                </div>
                <div class="select-options" style="min-width: 150px; right: 0; left: auto;"></div>
                <input type="hidden" class="online-selected-unit" value="${defaultUnitName}">
            </div>
        </div>
        <div style="font-size:11px; color:var(--gray); margin-bottom:15px; margin-top:-5px;">*Harga default digunakan jika harga satuan spesifik kosong.</div>
        <hr class="section-divider" style="margin-bottom:15px;">
        `;
    }

    const renderRow = (nama, kode) => `
        <div class="input-group" style="margin-top:12px; position:relative;">
            <input type="number" class="input-box-v6 ${inputClassExtra} online-price-input" placeholder=" " data-unit="${nama}">
            <label class="floating-label">${tipe === 'suplayer' ? 'Harga Beli' : 'Harga Jual'} (${nama})</label>
            <span class="unit-indicator">${kode}</span>
        </div>`;

    if (window.appState.satuanUtama) html += renderRow(window.appState.satuanUtama.nama, window.appState.satuanUtama.kode);
    window.appState.satuanTambahan.forEach(s => {
        if (s.nama) html += renderRow(s.nama, s.kode);
    });

    card.innerHTML = html;
    container.appendChild(card);

    if (tipe === 'marketplace') {
        const inputs = card.querySelectorAll('.online-price-input');
        inputs.forEach(input => {
            const namaPihakUntukEvent = namaPihak;
            input.addEventListener('input', function () {
                const hasil = window.hitungTerimaBersih(this, namaPihakUntukEvent);
                let infoLabel = this.parentElement.querySelector('.estimasi-terima');

                if (hasil !== null) {
                    if (!infoLabel) {
                        infoLabel = document.createElement('div');
                        infoLabel.className = 'estimasi-terima';
                        infoLabel.style = "font-size: 10px; color: var(--gray); margin-top: 4px; font-weight: 600; position:absolute; bottom: -18px; left: 0;";
                        this.parentElement.appendChild(infoLabel);
                    }
                    infoLabel.innerHTML = `Terima Bersih: <span style="color:var(--green)">Rp ${Math.floor(hasil).toLocaleString('id-ID')}</span>`;
                    this.parentElement.style.marginBottom = "20px";
                } else if (infoLabel) {
                    infoLabel.remove();
                    this.parentElement.style.marginBottom = "";
                }
                window.isFormDirty = true;
            });
            if (input.value) {
                input.dispatchEvent(new Event('input'));
            }
        });
    }

    if (!isEditMode) {
        window.isFormDirty = true;
    }
    return card;
};

window.toggleCardUnitDropdown = function (trigger) {
    const list = trigger.querySelector('.select-options');
    if (!list) return;
    document.querySelectorAll('.select-options.open').forEach(el => {
        if (el !== list) el.classList.remove('open');
    });
    list.innerHTML = '';
    const units = [];
    if (window.appState.satuanUtama) units.push(window.appState.satuanUtama);
    if (window.appState.satuanTambahan) units.push(...window.appState.satuanTambahan);

    units.forEach(u => {
        const item = document.createElement('div');
        item.className = 'select-option';
        item.innerText = u.nama;
        item.onclick = (e) => {
            e.stopPropagation();
            trigger.querySelector('.unit-display-target').innerText = u.kode;
            trigger.querySelector('.online-selected-unit').value = u.nama;
            list.classList.remove('open');
        };
        list.appendChild(item);
    });
    list.classList.toggle('open');
};

if (!window.dropdownCloseListenerAdded) {
    document.addEventListener('click', function (e) {
        const isTrigger = e.target.closest('.unit-dropdown-trigger') || e.target.closest('.custom-select-container');
        if (!isTrigger) {
            document.querySelectorAll('.select-options.open').forEach(el => el.classList.remove('open'));
        }
    });
    window.dropdownCloseListenerAdded = true;
}

window.resetDataOnlineBarang = function () {
    const listSup = document.getElementById('list-suplayer-container');
    const listMark = document.getElementById('list-marketplace-container');
    const hasData = (listSup && listSup.children.length > 0) || (listMark && listMark.children.length > 0);

    if (hasData) {
        if (listSup) listSup.innerHTML = '';
        if (listMark) listMark.innerHTML = '';
        window.showToast("Data Online direset karena satuan berubah", "refresh");
    }
};

window.hitungTerimaBersih = function (inputEl, namaMarketplace) {
    const hargaJual = parseFloat(inputEl.value) || 0;
    if (hargaJual <= 0) return null;

    // Cari Market ID dari nama
    let marketId = null;
    if (window.cachedPihakData && window.cachedPihakData.marketplace) {
        // Cari ID yang namanya cocok
        const markets = window.cachedPihakData.marketplace;
        for (const [id, m] of Object.entries(markets)) {
            if (m.nama === namaMarketplace) {
                marketId = id;
                break;
            }
        }
    }

    if (!marketId) {
        // Jika tidak ketemu (misal data baru), asumsi biaya 0 -> terima bersih = harga jual
        return hargaJual;
    }

    // Ambil Data Kategori dari Form (jika ada) untuk cari Rate Kategori
    // Rate disimpan dalam dokumen kategori -> biaya_admin_detail -> marketId
    let kategoriNama = document.getElementById('kategori').value;
    let rate = { persen: 0, fixed: 0 };

    if (window.kategoriData) {
        const kData = window.kategoriData.find(k => k.nama === kategoriNama);
        if (kData && kData.biaya_admin_detail && kData.biaya_admin_detail[marketId]) {
            rate = kData.biaya_admin_detail[marketId];
        }
    }

    // Hitung Biaya
    const biayaPersen = hargaJual * (rate.persen / 100);
    const biayaTotal = biayaPersen + rate.fixed;
    const terimaBersih = hargaJual - biayaTotal;

    return terimaBersih > 0 ? terimaBersih : 0;
};


// ============ FUNGSI SIMPAN & LOAD ============
window.prosesSimpanProduk = async function () {
    // --- PROTEKSI LOCK DATE ---
    if (window.editingProductId) {
        try {
            const accSnap = await getDoc(doc(db, 'settings', 'accounting'));
            if (accSnap.exists() && accSnap.data().lock_date) {
                const lockDate = accSnap.data().lock_date;
                const prodSnap = await getDoc(doc(db, 'products', window.editingProductId));
                const createdAt = prodSnap.data().created_at;
                if (createdAt && createdAt.split('T')[0] <= lockDate) {
                    const alasan = prompt("PERINGATAN: Periode Akuntansi Terkunci. Masukkan alasan perubahan:");
                    if (!alasan || alasan.trim() === "") {
                        alert("Edit Dibatalkan: Alasan wajib diisi!");
                        return;
                    }
                    console.log("Audit Edit:", alasan);
                }
            }
        } catch (e) { console.warn("Skip lock date check", e); }
    }

    const btn = document.getElementById('btnSimpan');
    const nama = document.getElementById('nama_barang').value.trim();
    const kategori = document.getElementById('kategori').value;

    if (!nama || !kategori || !window.appState.satuanUtama) {
        window.showToast("Nama, Kategori, dan Satuan wajib diisi!", "error");
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="material-icons-outlined">hourglass_top</span> Menyimpan...`;
    }

    try {
        const ph = document.getElementById('placeholder-barang');
        const photoData = ph ? (ph.dataset.imageBase64 || "") : "";

        // 1. COLLECT OFFLINE PRICES
        const offlinePrices = [];
        let baseHPP = 0;
        const elHgBeli = document.getElementById('harga_beli');
        const elSatBeli = document.getElementById('satuan_beli_terpilih');
        const topPrice = elHgBeli ? (parseFloat(elHgBeli.value) || 0) : 0;
        const topUnitName = elSatBeli ? elSatBeli.value : "";

        if (topPrice > 0) {
            let topRatio = 1;
            if (topUnitName !== window.appState.satuanUtama.nama) {
                const t = window.appState.satuanTambahan.find(x => x.nama === topUnitName);
                if (t) topRatio = parseFloat(t.rasio);
            }
            baseHPP = topPrice / topRatio;
        }

        const multiUnitContainer = document.getElementById('multi-unit-container');
        if (multiUnitContainer) {
            const sections = multiUnitContainer.children;
            const allUnits = [window.appState.satuanUtama, ...window.appState.satuanTambahan];

            for (let i = 0; i < sections.length; i++) {
                const unitInfo = allUnits[i];
                if (!unitInfo) continue;

                const hargaWarung = document.getElementById(`harga_warung_${i}`)?.value || 0;
                const hargaEceran = document.getElementById(`harga_eceran_${i}`)?.value || 0;

                const grosirTiers = [];
                const tierRows = document.querySelectorAll(`#grosir-area-${i} .grosir-tier-row`);
                tierRows.forEach(row => {
                    const min = row.querySelector('.input-min-qty').value;
                    const harga = row.querySelector('.input-harga-grosir').value;
                    if (min && harga) grosirTiers.push({ min_qty: parseFloat(min), harga: parseFloat(harga) });
                });

                offlinePrices.push({
                    unit_nama: unitInfo.nama,
                    unit_kode: unitInfo.kode,
                    harga_jual_umum: parseFloat(hargaWarung),
                    harga_jual_rekomendasi: parseFloat(hargaEceran) || parseFloat(hargaWarung),
                    tiers_grosir: grosirTiers
                });
            }
        }

        // 2. COLLECT ONLINE PRICES
        const suplayerList = [];
        document.querySelectorAll('#list-suplayer-container .card-online-pihak').forEach(card => {
            const namaP = card.querySelector('b').innerText;
            const defaultH = parseFloat(card.querySelector('.harga-default-suplayer')?.value) || 0;
            const defaultU = card.querySelector('.online-selected-unit')?.value;

            const rincian = [];
            const inputs = card.querySelectorAll('.online-price-input');
            const allUnits = [window.appState.satuanUtama, ...window.appState.satuanTambahan];

            inputs.forEach((inp, idx) => {
                const u = allUnits[idx];
                if (u && inp.value) {
                    rincian.push({ satuan: u.nama, harga: parseFloat(inp.value) });
                }
            });

            suplayerList.push({
                nama: namaP,
                tipe: 'PEMASOK',
                harga_default: defaultH,
                satuan_default: defaultU,
                rincian_harga: rincian
            });
        });

        const marketList = [];
        document.querySelectorAll('#list-marketplace-container .card-online-pihak').forEach(card => {
            const namaP = card.querySelector('b').innerText;
            const rincian = [];
            const inputs = card.querySelectorAll('.online-price-input');
            const allUnits = [window.appState.satuanUtama, ...window.appState.satuanTambahan];

            inputs.forEach((inp, idx) => {
                const u = allUnits[idx];
                if (u && inp.value) {
                    rincian.push({ satuan: u.nama, harga: parseFloat(inp.value) });
                }
            });
            marketList.push({ nama: namaP, rincian_harga: rincian });
        });

        // 3. CALCULATE INVENTORY
        const elStokAwal = document.getElementById('stok_awal');
        const elSatStokAwal = document.getElementById('satuan_stok_awal');
        const elStokMin = document.getElementById('stok_min');
        const elSatStokMin = document.getElementById('satuan_stok_min');

        const stokAwalInput = elStokAwal ? (parseFloat(elStokAwal.value) || 0) : 0;
        const satuanStokAwal = elSatStokAwal ? elSatStokAwal.value : "";
        const hargaModalInput = topPrice;
        const satuanHargaModal = topUnitName;
        const stokMin = elStokMin ? (parseFloat(elStokMin.value) || 0) : 0;
        const satuanStokMin = elSatStokMin ? elSatStokMin.value : "";

        const satuanDasar = window.appState.satuanUtama.nama;

        const getRatio = (unitName) => {
            if (!unitName || unitName === satuanDasar) return 1;
            const found = window.appState.satuanTambahan.find(x => x.nama === unitName);
            let r = found ? parseFloat(found.rasio) : 1;
            return (r <= 0) ? 1 : r;
        };

        const rasioHarga = getRatio(satuanHargaModal);
        const hpp_average = hargaModalInput > 0 ? (hargaModalInput / rasioHarga) : 0;
        const rasioStok = getRatio(satuanStokAwal);
        const totalQtyBase = stokAwalInput * rasioStok;
        const totalNilaiAsetAwal = totalQtyBase * hpp_average;

        // 4. PREPARE PAYLOADS & REFS
        let prodRef, invRef;
        if (window.editingProductId) {
            prodRef = doc(db, 'products', window.editingProductId);
            invRef = doc(db, 'inventory', window.editingProductId);
        } else {
            prodRef = doc(collection(db, 'products'));
            invRef = doc(db, 'inventory', prodRef.id);
        }

        const konversiSchema = [
            { nama: window.appState.satuanUtama.nama, kode: window.appState.satuanUtama.kode, rasio: 1 },
            ...window.appState.satuanTambahan.map(s => ({ nama: s.nama, kode: s.kode, rasio: parseFloat(s.rasio) }))
        ];

        const productPayload = {
            _id: prodRef.id,
            nama: nama,
            kategori: kategori,
            kategori_pencarian: window.generateKeywords ? window.generateKeywords(nama) : [nama.toLowerCase()],
            foto: photoData,
            konversi_satuan: konversiSchema,
            harga_offline: offlinePrices.map(p => ({
                satuan: p.unit_nama,
                harga_jual_umum: p.harga_jual_umum,
                harga_jual_rekomendasi: p.harga_jual_rekomendasi,
                tiers_grosir: p.tiers_grosir
            })),
            harga_online: { marketplace: marketList, suplayer_dropship: suplayerList },
            stok_manajemen: { batas_minimum: stokMin, satuan_batas_min: satuanStokMin },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata_tampilan: { harga_modal: topPrice, satuan_harga_modal: topUnitName }
        };

        if (window.editingProductId) delete productPayload.created_at;

        const inventoryPayload = {
            _id: invRef.id,
            product_id: prodRef.id,
            updated_at: new Date().toISOString()
        };

        const isNew = !window.editingProductId;
        const trxRef = isNew ? doc(collection(db, 'transactions')) : null;

        await runTransaction(db, async (transaction) => {
            transaction.set(prodRef, productPayload, { merge: true });
            if (isNew) {
                inventoryPayload.qty_total = totalQtyBase;
                inventoryPayload.hpp_average = hpp_average;
                inventoryPayload.nilai_aset_total = totalNilaiAsetAwal;
                inventoryPayload.version = 1;
                transaction.set(invRef, inventoryPayload, { merge: true });

                transaction.set(trxRef, {
                    tipe: "SALDO_AWAL",
                    no_faktur: "INIT-" + Date.now().toString().slice(-6),
                    waktu_wib: new Date().toISOString(),
                    tanggal_string: new Date().toISOString().split('T')[0],
                    partner_snapshot: { nama: "Sistem", tipe: "INTERNAL" },
                    items: [{
                        product_id: prodRef.id,
                        nama_produk: nama,
                        qty_input: stokAwalInput,
                        satuan_input: satuanStokAwal,
                        qty_total_dasar: totalQtyBase,
                        hpp_average: hpp_average,
                        subtotal: totalNilaiAsetAwal,
                        catatan: "Saldo awal"
                    }]
                });
            } else {
                inventoryPayload.hpp_average = hpp_average;
                inventoryPayload.last_updated = new Date().toISOString();
                transaction.set(invRef, inventoryPayload, { merge: true });
            }
        });

        window.showToast("Monster Logic: Produk & Inventory tersimpan!", "check_circle");
        window.isFormDirty = false;
        const isEditMode = (window.editingProductId !== null);
        window.resetFormV6();

        if (isEditMode) window.goToPage('page-inventaris');
        else window.goBack();

    } catch (error) {
        console.error("Gagal simpan produk:", error);
        alert("Gagal menyimpan data: " + error.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<span class="material-icons-outlined">save</span> Simpan`;
        }
    }
};


// ============ LOGIKA EDIT PRODUK (POPULATE FORM) ============
window.loadProductForEdit = async function (id) {
    if (!id) return;
    window.resetFormV6(); // Clean slate
    window.editingProductId = id;

    // Hide Stok Awal in Edit Mode
    const secStok = document.getElementById('stokAwalContainer');
    const inpStok = document.getElementById('stok_awal');
    if (secStok) secStok.style.setProperty('display', 'none', 'important');
    if (inpStok) inpStok.disabled = true;

    const pageTitle = document.getElementById('pageTitleTambah');
    if (pageTitle) pageTitle.innerText = "Ubah Barang";

    const catContainer = document.getElementById('kategori')?.parentElement;
    if (catContainer) {
        catContainer.style.pointerEvents = 'none';
        catContainer.style.opacity = '0.6';
        catContainer.style.backgroundColor = '#f5f5f5';
    }

    const btnSimpan = document.getElementById('btnSimpan');
    if (btnSimpan) {
        btnSimpan.innerHTML = 'Loading...';
        btnSimpan.disabled = true;
    }

    try {
        const prodRef = doc(db, 'products', id);
        const prodSnap = await getDoc(prodRef);
        if (!prodSnap.exists()) throw new Error("Produk tidak ditemukan");
        const prod = prodSnap.data();

        // 1. Basic Info
        document.getElementById('nama_barang').value = prod.nama;
        document.getElementById('kategori').value = prod.kategori;

        // 2. Units (State Reconstructed)
        const displayUnitString = window.reconstructUnitState(prod);
        const elInputMain = document.getElementById('inputSatuanUtama');
        if (elInputMain && window.appState.satuanUtama) {
            elInputMain.value = `${window.appState.satuanUtama.nama} (${window.appState.satuanUtama.kode})`;
        }
        const elSatuanDisplay = document.getElementById('satuan');
        if (elSatuanDisplay) elSatuanDisplay.value = displayUnitString;

        // Render Units UI
        if (window.renderUICompact) window.renderUICompact();
        if (window.renderDynamicUnits) window.renderDynamicUnits();

        // 3. Prices (Offline)
        const meta = prod.metadata_tampilan || {};
        const storedHarga = meta.harga_modal !== undefined ? meta.harga_modal : (prod.harga_modal || 0);
        const storedUnit = meta.satuan_harga_modal || prod.satuan_harga_modal;

        if (storedHarga !== undefined) {
            const hb = document.getElementById('harga_beli');
            if (hb) hb.value = storedHarga;
            const targetUnit = storedUnit || window.appState.satuanUtama?.nama;
            const sb = document.getElementById('satuan_beli_terpilih');
            if (sb) sb.value = targetUnit;
            const disp = document.getElementById('selectedUnitText');
            let uCode = targetUnit || '';
            if (targetUnit === window.appState.satuanUtama?.nama) {
                uCode = window.appState.satuanUtama?.kode;
            } else {
                const sub = window.appState.satuanTambahan.find(s => s.nama === targetUnit);
                if (sub) uCode = sub.kode;
            }
            if (disp) disp.innerText = uCode;
        }

        setTimeout(() => {
            if (prod.harga_offline) {
                prod.harga_offline.forEach((p) => {
                    let uiIndex = -1;
                    if (p.satuan === window.appState.satuanUtama?.nama) uiIndex = 0;
                    else {
                        const idx = window.appState.satuanTambahan.findIndex(s => s.nama === p.satuan);
                        if (idx !== -1) uiIndex = idx + 1;
                    }

                    if (uiIndex !== -1) {
                        const warungEl = document.getElementById(`harga_warung_${uiIndex}`);
                        const eceranEl = document.getElementById(`harga_eceran_${uiIndex}`);
                        if (warungEl) warungEl.value = p.harga_jual_umum || '';
                        if (eceranEl) eceranEl.value = p.harga_jual_rekomendasi || '';

                        const grosirArea = document.getElementById(`grosir-area-${uiIndex}`);
                        if (grosirArea && p.tiers_grosir) {
                            grosirArea.innerHTML = '';
                            p.tiers_grosir.forEach(t => {
                                let uCode = 'UNIT';
                                if (uiIndex === 0) uCode = window.appState.satuanUtama?.kode || 'UNIT';
                                else if (window.appState.satuanTambahan[uiIndex - 1]) uCode = window.appState.satuanTambahan[uiIndex - 1].kode;

                                const div = document.createElement('div');
                                div.className = 'grosir-tier-row';
                                div.style = "display: flex; gap: 10px; margin-top: 10px; align-items: center;";
                                div.innerHTML = `
                                    <div class="input-group" style="flex:1; position:relative;">
                                        <input type="number" class="input-box-v6 input-min-qty" placeholder=" " value="${t.min_qty}">
                                        <label class="floating-label">Min Qty</label>
                                        <span class="unit-indicator">${uCode}</span>
                                    </div>
                                    <div class="input-group" style="flex:2; position:relative;">
                                        <input type="number" class="input-box-v6 input-harga-grosir" placeholder=" " value="${t.harga}">
                                        <label class="floating-label">Harga Grosir</label>
                                        <span class="material-icons-outlined" onclick="this.closest('.grosir-tier-row').remove()" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: var(--red); cursor: pointer;">delete</span>
                                    </div>`;
                                grosirArea.appendChild(div);
                            });
                        }
                    }
                });
            }
        }, 100);

        // 4. Online Prices
        const online = prod.harga_online || {};
        if (online.suplayer_dropship) {
            online.suplayer_dropship.forEach(sup => {
                window.modePilihPihak = 'suplayer';
                const card = window.renderKolomHargaOnline(sup.nama, true);
                if (card) {
                    const dh = card.querySelector('.harga-default-suplayer');
                    if (dh) dh.value = sup.harga_default || '';
                    const du = card.querySelector('.online-selected-unit');
                    if (du) du.value = sup.satuan_default || '';
                    const dt = card.querySelector('.unit-display-target');
                    if (dt && sup.satuan_default) {
                        let code = sup.satuan_default;
                        if (sup.satuan_default === window.appState.satuanUtama?.nama) code = window.appState.satuanUtama?.kode;
                        else {
                            const found = window.appState.satuanTambahan.find(s => s.nama === sup.satuan_default);
                            if (found) code = found.kode;
                        }
                        dt.innerText = code;
                    }
                    card.querySelectorAll('.online-price-input').forEach(inp => {
                        const match = sup.rincian_harga?.find(r => r.satuan === inp.dataset.unit);
                        if (match) { inp.value = match.harga; inp.dispatchEvent(new Event('input')); }
                    });
                }
            });
        }
        if (online.marketplace) {
            online.marketplace.forEach(m => {
                window.modePilihPihak = 'marketplace';
                const card = window.renderKolomHargaOnline(m.nama, true);
                if (card) {
                    card.querySelectorAll('.online-price-input').forEach(inp => {
                        const match = m.rincian_harga?.find(r => r.satuan === inp.dataset.unit);
                        if (match) { inp.value = match.harga; inp.dispatchEvent(new Event('input')); }
                    });
                }
            });
        }

        // 5. Stock Manajemen
        if (prod.stok_manajemen) {
            document.getElementById('stok_min').value = prod.stok_manajemen.batas_minimum || 0;
            document.getElementById('displayUnitStokMin').innerText = prod.stok_manajemen.satuan_batas_min || "";
            document.getElementById('satuan_stok_min').value = prod.stok_manajemen.satuan_batas_min || "";
        }

        // 6. Photo
        if (prod.foto) {
            const ph = document.getElementById('placeholder-barang');
            if (ph) {
                ph.dataset.imageBase64 = prod.foto;
                const clickArea = document.getElementById('photo-click-area');
                if (clickArea) clickArea.innerHTML = `<img src="${prod.foto}" style="width:100%; height:100%; object-fit:cover;">`;
                ph.classList.add('has-image');
            }
        }

        if (btnSimpan) {
            btnSimpan.innerHTML = '<span class="material-icons-outlined">save</span> Perbarui Barang';
            btnSimpan.disabled = false;
        }
        window.rescueInputs();
        window.validateFormSave();
    } catch (e) {
        alert("Gagal load produk: " + e.message);
        if (btnSimpan) { btnSimpan.innerHTML = '<span class="material-icons-outlined">save</span> Simpan'; btnSimpan.disabled = false; }
        window.goBack();
    }
};

window.resetFormV6 = function () {
    window.rescueInputs();
    document.querySelectorAll('.input-box-v6').forEach(i => i.value = '');
    const btnSimpan = document.getElementById('btnSimpan');
    if (btnSimpan) btnSimpan.disabled = true;

    const secStok = document.getElementById('stokAwalContainer');
    const inpStok = document.getElementById('stok_awal');
    if (secStok) secStok.style.display = 'flex';
    if (inpStok) inpStok.disabled = false;

    const pageTitle = document.getElementById('pageTitleTambah');
    if (pageTitle) pageTitle.innerText = "Tambah Barang Baru";

    window.editingProductId = null;
    window.appState = { satuanUtama: null, satuanTambahan: [] };

    const catContainer = document.getElementById('kategori')?.parentElement;
    if (catContainer) {
        catContainer.style.pointerEvents = 'auto';
        catContainer.style.opacity = '1';
        catContainer.style.backgroundColor = 'white';
    }

    const idsToClear = ['selectedUnitText', 'displayUnitStokAwal', 'displayUnitStokMin', 'satuan_beli_terpilih', 'satuan_stok_awal', 'satuan_stok_min', 'satuan', 'inputSatuanUtama'];
    idsToClear.forEach(id => {
        const el = document.getElementById(id);
        if (el) { if (el.tagName === 'INPUT') el.value = ""; else el.innerText = ""; }
    });

    document.querySelectorAll('.select-options').forEach(el => { el.innerHTML = ''; el.classList.remove('open'); });
    const multi = document.getElementById('multi-unit-container');
    if (multi) multi.innerHTML = "";
    const listSup = document.getElementById('list-suplayer-container');
    if (listSup) listSup.innerHTML = '';
    const listMark = document.getElementById('list-marketplace-container');
    if (listMark) listMark.innerHTML = '';

    const ph = document.getElementById('placeholder-barang');
    const clickArea = document.getElementById('photo-click-area');
    if (ph && clickArea) {
        clickArea.innerHTML = `<span class="material-icons-outlined" style="font-size: 48px; color: #ccc;">add_a_photo</span>`;
        ph.classList.remove('has-image');
        ph.style.border = "2px dashed #ccc";
        ph.style.background = "var(--blue-soft)";
        delete ph.dataset.imageBase64;
    }
    const fileInput = document.getElementById('file-barang');
    if (fileInput) fileInput.value = "";
    window.isFormDirty = false;
};

window.reconstructUnitState = function (prod) {
    window.appState = { satuanUtama: null, satuanTambahan: [] };
    let rawUnits = prod.konversi_satuan || [];
    if (rawUnits.length === 0) return "";
    rawUnits.sort((a, b) => parseFloat(a.rasio) - parseFloat(b.rasio));
    const main = rawUnits.find(s => parseFloat(s.rasio) === 1) || rawUnits[0];
    const dbMain = (window.satuanData || []).find(s => s.nama === main.nama);
    const codeMain = main.kode || (dbMain ? dbMain.kode : main.nama);
    window.appState.satuanUtama = { nama: main.nama, kode: codeMain };
    window.appState.satuanTambahan = rawUnits.filter(s => s.nama !== main.nama).map(s => {
        const dbSub = (window.satuanData || []).find(d => d.nama === s.nama);
        return { nama: s.nama, kode: s.kode || (dbSub ? dbSub.kode : s.nama), rasio: s.rasio };
    });
    let displayString = main.nama;
    if (window.appState.satuanTambahan.length > 0) {
        displayString += ` (${window.appState.satuanTambahan.map(s => s.nama).join(', ')})`;
    }
    return displayString;
};

window.applyDefaultUnitLogic = function () {
    window.appState.satuanUtama = null;
    window.appState.satuanTambahan = [];
    const defaults = window.defaultUnitSettings;
    if (defaults && defaults.utama) {
        window.appState.satuanUtama = defaults.utama;
        window.appState.satuanTambahan = defaults.tambahan || [];
        let display = defaults.utama.nama;
        if (defaults.tambahan?.length > 0) display += ` (${defaults.tambahan.map(s => s.nama).join(', ')})`;
        const mainInput = document.getElementById('satuan');
        if (mainInput) mainInput.value = display;
    } else {
        const mainInput = document.getElementById('satuan');
        if (mainInput) mainInput.value = "";
    }
    if (window.renderUICompact) window.renderUICompact();
    if (window.renderDynamicUnits) window.renderDynamicUnits();
    if (window.validateFormSave) window.validateFormSave();
};

window.generateKeywords = function (text) {
    if (!text) return [];
    const words = text.toLowerCase().split(" ");
    let keywords = [];
    words.forEach(w => {
        let term = "";
        for (let char of w) { term += char; keywords.push(term); }
    });
    return [...new Set(keywords)];
};
