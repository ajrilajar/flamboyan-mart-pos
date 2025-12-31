// SPA/modules/inventaris/logic.js
import {
    db,
    collection,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    doc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    limit,
    runTransaction,
    writeBatch
} from '../../firebase-config.js';

import '../../modules/tambah-barang-inventaris.js'; // Global Side Effects
import '../../modules/pengaturan-inventaris.js'; // Global Side Effects

export function init() {
    console.log("[INVENTARIS] Init Logic");

    // ============ LISTENER MANAGEMENT ============
    const moduleListeners = [];
    const trackListener = (unsub) => {
        if (unsub) moduleListeners.push(unsub);
    };

    // Override global activeListener management for this module
    window.activeListener = () => {
        console.log("[INVENTARIS] Stopping all module listeners");
        moduleListeners.forEach(u => u && u());
        moduleListeners.length = 0;

        // Clean up other globals to prevent leaks
        window.currentDetailId = null;
        window.editingProductId = null;

        // Stop detail listeners if active
        if (window.stopDetailListeners) window.stopDetailListeners();
    };

    // ============ GLOBAL VARIABLES ============
    // Ensure these are available for legacy code
    window.productsData = [];
    window.filteredData = [];
    window.kategoriData = [];
    window.satuanData = [];
    window.defaultUnitSettings = { utama: null, tambahan: [] };

    // Internal cache for rendering
    const cache = { products: {}, cat: {}, unit: {} };
    window.cache = cache; // Expose for debugging/legacy

    // ============ NAVIGATION & UI HELPERS ============
    let pageHistory = ['page-inventaris'];
    let panelStack = [];
    window.currentCategoryFilter = "";

    // ============ UI SEARCH HELPERS ============
    window.checkSearchInput = function (input) {
        const wrap = input.parentElement;
        const clearBtn = wrap.querySelector('.search-clear');
        if (clearBtn) {
            clearBtn.style.display = input.value ? 'block' : 'none';
        }
    };

    window.clearSearch = function (btn) {
        const wrap = btn.parentElement;
        const input = wrap.querySelector('input');
        if (input) {
            input.value = '';
            btn.style.display = 'none';
            input.focus();

            // Trigger relevant filters based on input ID
            if (input.id === 'inputSearchProduk' && window.renderProductList) window.renderProductList();
            if (input.id === 'searchKategori' && window.filterKategori) window.filterKategori();
            if (input.id === 'searchSatuan' && window.filterSatuan) window.filterSatuan();
            if (input.id === 'searchPihakOnline' && window.filterPihakOnline) window.filterPihakOnline();
        }
    };

    window.bukaPanelKategori = function () {
        const input = document.getElementById('searchKategori');
        if (input) input.value = '';
        window.openPanel('panelKategori');
        if (window.filterKategori) window.filterKategori();
    };

    // ============ FILTER LOGIC (INVENTORY LIST) ============
    window.bukaFilterKategori = function () {
        document.getElementById('bs-overlay').classList.add('show');
        document.getElementById('bs-content').classList.add('show');
        window.renderCategoryBottomSheet();
    };

    window.tutupFilterKategori = function () {
        document.getElementById('bs-content').classList.remove('show');
        document.getElementById('bs-overlay').classList.remove('show');
    };

    window.renderCategoryBottomSheet = function () {
        const container = document.getElementById('bs-category-list');
        if (!container) return;
        container.innerHTML = '';

        const dataToUse = window.kategoriData || [];

        // 1. Opsi "Semua Kategori"
        const allSelected = window.currentCategoryFilter === "";
        container.innerHTML += `
            <div class="bs-item ${allSelected ? 'selected' : ''}" onclick="window.pilihKategoriFilter('')">
                <div class="bs-item-name">Semua Kategori</div>
                <div class="bs-radio"></div>
            </div>
        `;

        // 2. Loop Data Kategori
        dataToUse.sort((a, b) => (a.nama || "").localeCompare(b.nama || "")).forEach(cat => {
            const nama = cat.nama || "";
            if (nama) {
                const isSelected = window.currentCategoryFilter === nama;
                const itemHtml = `
                    <div class="bs-item ${isSelected ? 'selected' : ''}" onclick="window.pilihKategoriFilter('${nama}')">
                        <div class="bs-item-name">${nama}</div>
                        <div class="bs-radio"></div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', itemHtml);
            }
        });
    };

    window.pilihKategoriFilter = function (nama) {
        window.currentCategoryFilter = nama;

        const chip = document.getElementById('chip-kategori');
        const label = document.getElementById('label-kategori');

        if (nama === "") {
            if (label) label.innerText = "Kategori";
            if (chip) chip.classList.remove('active');
        } else {
            if (label) label.innerText = nama;
            if (chip) chip.classList.add('active');
        }

        if (window.renderProductList) window.renderProductList();
        window.tutupFilterKategori();
    };

    window.filterKategoriDiModal = function (input) {
        const term = input.value.toLowerCase();
        const items = document.querySelectorAll('.bs-item');
        items.forEach(item => {
            const text = item.querySelector('.bs-item-name').innerText.toLowerCase();
            item.style.display = text.includes(term) ? 'flex' : 'none';
        });
    };

    window.kelolaKategoriDariFilter = function () {
        window.tutupFilterKategori();
        window.goToPage('page-kategori');
    };

    window.clearCategorySearch = function (btn) {
        const input = document.getElementById('bs-search-input');
        if (input) {
            input.value = '';
            window.filterKategoriDiModal(input);
            if (window.checkSearchInput) window.checkSearchInput(input);
        }
    };

    window.bukaFilterStok = () => alert("Filter Stok segera hadir!");
    window.bukaFilterJenis = () => alert("Filter Jenis segera hadir!");


    window.goBack = function () {
        // A. Cek Panel Popup
        if (panelStack.length > 0) {
            const panelId = panelStack.pop();
            const panelEl = document.getElementById(panelId);
            if (panelEl) panelEl.classList.remove('show');
            if (panelStack.length === 0) {
                const overlay = document.getElementById('modalOverlay');
                if (overlay) overlay.classList.remove('show');
            }
            return;
        }

        // B. Cek Form Kotor
        const pageTambah = document.getElementById('page-tambah-barang-v6');
        const isTambahPageActive = pageTambah && !pageTambah.classList.contains('hidden');
        if (isTambahPageActive && window.isFormDirty) {
            const modal = document.getElementById('modalDiscardTambahBarang');
            if (modal) modal.style.display = 'flex';
            return;
        }

        // C. Navigasi Halaman
        if (pageHistory.length > 1) {
            pageHistory.pop();
            const prevPage = pageHistory[pageHistory.length - 1];

            // PATCH: Inline style visibility fix
            document.querySelectorAll('.page').forEach(p => {
                p.classList.add('hidden');
                if (p.id === 'page-tambah-barang-v6') p.style.display = 'none';
            });

            const prevPageEl = document.getElementById(prevPage);
            if (prevPageEl) {
                prevPageEl.classList.remove('hidden');
                if (prevPageEl.id === 'page-tambah-barang-v6') prevPageEl.style.display = '';
            }

            // Handle FAB visibility
            if (prevPage === 'page-inventaris') {
                const fab = document.getElementById('fab-tambah-barang'); // ID sesuai view.js
                if (fab) fab.style.display = 'flex';
            }
        } else {
            // Default: back to dashboard via router
            if (window.navigasi) window.navigasi('loadDashboard');
        }
    };

    window.goToPage = function (pageId) {
        closeAllPanels();

        // RESET PENCARIAN SAAT PINDAH HALAMAN
        document.querySelectorAll('.search-wrap input').forEach(input => {
            input.value = '';
            if (window.checkSearchInput) window.checkSearchInput(input);
            else {
                const btn = input.parentElement.querySelector('.search-clear');
                if (btn) btn.classList.remove('show');
            }
        });

        document.querySelectorAll('.page').forEach(p => {
            p.classList.add('hidden');
            if (p.id === 'page-tambah-barang-v6') p.style.display = 'none'; // Force hide others
        });

        const page = document.getElementById(pageId);
        if (page) {
            page.classList.remove('hidden');
            if (pageId === 'page-tambah-barang-v6') page.style.display = ''; // Force show target

            pageHistory.push(pageId);

            // Hide FAB on non-list pages
            const fab = document.getElementById('main-fab-inventaris'); // Fixed ID
            if (fab) fab.style.display = (pageId === 'page-inventaris') ? 'flex' : 'none';
        }
    };

    window.openPanel = function (panelId) {
        panelStack.push(panelId);
        const panel = document.getElementById(panelId);
        if (panel) panel.classList.add('show');
        const overlay = document.getElementById('modalOverlay');
        if (overlay) overlay.classList.add('show');

        // RESET PENCARIAN DI PANEL
        const inputs = panel.querySelectorAll('.search-wrap input');
        inputs.forEach(input => {
            input.value = '';
            if (window.checkSearchInput) window.checkSearchInput(input);
        });
    };

    function closeAllPanels() {
        panelStack.forEach(panelId => {
            const el = document.getElementById(panelId);
            if (el) el.classList.remove('show');
        });
        panelStack = [];
        const overlay = document.getElementById('modalOverlay');
        if (overlay) overlay.classList.remove('show');
    }

    // ============ ANTI-CRASH & DIRTY CHECK ============
    window.isFormDirty = false;

    window.initDirtyCheck = function () {
        const formContainer = document.getElementById('page-tambah-barang-v6');
        if (!formContainer) return;
        formContainer.oninput = null;
        formContainer.addEventListener('input', function (e) {
            if (e.isTrusted) {
                window.isFormDirty = true;
            }
        });
    };

    window.tutupModalDiscard = function () {
        const m = document.getElementById('modalDiscardTambahBarang');
        if (m) m.style.display = 'none';
    };

    window.konfirmasiBuang = function () {
        document.getElementById('modalDiscardTambahBarang').style.display = 'none';
        if (window.resetFormV6) window.resetFormV6();
        if (pageHistory.length > 1) {
            pageHistory.pop();
            const prevPage = pageHistory[pageHistory.length - 1];

            document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
            const prevPageEl = document.getElementById(prevPage);
            if (prevPageEl) prevPageEl.classList.remove('hidden');

            if (prevPage === 'page-inventaris') {
                const fab = document.getElementById('fab-tambah-barang');
                if (fab) fab.style.display = 'flex';
            }
        } else {
            if (window.navigasi) window.navigasi('loadDashboard');
        }
    };

    window.bukaTambahBarang = function () {
        // 1. Reset Form State
        if (window.resetFormV6) window.resetFormV6();
        if (window.updateFormVisibility) window.updateFormVisibility();

        // 2. Terapkan Logika Default Unit
        if (window.applyDefaultUnitLogic) {
            window.applyDefaultUnitLogic();
        }

        // 3. Navigasi ke Halaman
        const pageEl = document.getElementById('page-tambah-barang-v6');
        if (pageEl) {
            pageEl.style.display = ''; // Clear inline style
            window.goToPage('page-tambah-barang-v6');
        }

        // 4. Init Tabs
        if (window.setupTabs && typeof window.setupTabs === 'function') {
            window.setupTabs();
        }

        // 5. Init Dirty Check
        if (window.initDirtyCheck) {
            window.initDirtyCheck();
        }
        window.isFormDirty = false;
    };

    window.showToast = function (message, icon = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'toast-msg';
        toast.innerHTML = `<span class="material-icons-outlined" style="font-size:18px;">${icon}</span>${message}`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    // ============ CORE FIRESTORE LISTENERS ============

    // 1. PRODUCTS (Unified Smart Listener) - Defined later
    // Initial Load is handled by window.bukaTambahBarang or manually if needed

    // 2. CATEGORIES
    trackListener(onSnapshot(collection(db, 'categories'), (snap) => {
        window.kategoriData = [];
        cache.cat = {};
        snap.forEach(doc => {
            const d = doc.data();
            d.id = doc.id;
            window.kategoriData.push(d);
            cache.cat[doc.id] = d;
        });
        if (window.filterCategoryList) window.filterCategoryList({ value: '' });
        if (window.refreshList) window.refreshList(cache.cat, 'category-list-display', 'Kategori', 'cat');
        // Update Biaya Admin Level 1 if visible
        if (window.renderListKategoriBiaya) window.renderListKategoriBiaya();
    }));

    // 3. UNITS
    trackListener(onSnapshot(collection(db, 'units'), (snap) => {
        window.satuanData = [];
        snap.forEach(doc => {
            const d = doc.data();
            d.id = doc.id;
            window.satuanData.push(d);
        });
        if (window.filterUnitList) window.filterUnitList({ value: '' });
    }));

    // 4. PARTNERS (Unified)
    trackListener(onSnapshot(collection(db, 'partners'), (snap) => {
        window.cachedPihakData = { suplayer: {}, marketplace: {} };
        snap.forEach(doc => {
            const d = doc.data();
            if (d.tipe === 'MARKETPLACE') {
                window.cachedPihakData.marketplace[doc.id] = d;
            } else {
                window.cachedPihakData.suplayer[doc.id] = d;
            }
        });
    }));

    // 5. PREFERENCES
    trackListener(onSnapshot(doc(db, 'settings', 'preferences'), (snap) => {
        if (snap.exists()) {
            const prefs = snap.data();
            const safelySetCheck = (id, val, cb) => {
                const el = document.getElementById(id);
                if (el && val !== undefined) {
                    el.checked = val;
                    if (cb) cb();
                }
            };
            safelySetCheck('toggle-gambar', prefs.unggah_gambar, window.updateFormVisibility);
            // market-chk sudah dihapus, tidak perlu load preference lagi
        }
    }));

    // ============ RENDER FUNCTIONS ============

    // Helper for Card Generation (Strict Source Fidelity)
    function createProductCard(p) {
        const meta = p.metadata_tampilan || {};
        const initial = (p.nama || '??').substring(0, 2).toUpperCase();
        const hargaBeli = meta.harga_modal || 0;
        const satuan = meta.satuan_harga_modal || p.satuan || '';

        let hargaJual = 0;
        if (p.harga_offline) {
            const match = p.harga_offline.find(h => h.satuan === satuan);
            if (match) hargaJual = match.harga_jual_umum;
            else if (p.harga_offline.length > 0) hargaJual = p.harga_offline[0].harga_jual_umum;
        }

        return `
        <div class="card" id="card-${p.id}" onclick="window.openProductDetail('${p.id}')" style="position:relative; cursor:pointer; overflow:hidden;">
            <div class="initial" style="margin-top:0; background:#f3f3f3; color:#666; font-weight:700;">${initial}</div>
            <div class="info" style="width:100%;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:2px;">
                    <div class="name" style="font-weight:700; color:#333; margin-right:8px; line-height:1.2; font-size:14px;">${p.nama}</div>
                    <div style="font-size:10px; font-weight:600; background:#f3f3f3; color:#666; padding:3px 6px; border-radius:4px; white-space:nowrap; flex-shrink:0;">
                        ${p.kategori || '-'}
                    </div>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-size:10px; color:#999; font-weight:600; letter-spacing:0.5px; text-transform:uppercase;">Modal</span>
                        <div style="font-size:13px; color:#666; font-weight:700; margin-top:0;">
                            Rp ${Number(hargaBeli).toLocaleString('id-ID')}
                            <span style="font-size:10px; color:#aaa; font-weight:400;">/${satuan}</span>
                        </div>
                    </div>
                    <div style="display:flex; flex-direction:column; border-left:1px solid #eee; padding-left:15px;">
                        <span style="font-size:10px; color:#999; font-weight:600; letter-spacing:0.5px; text-transform:uppercase;">Jual</span>
                        <div style="font-size:13px; color:#333; font-weight:700; margin-top:0;">
                            Rp ${Number(hargaJual).toLocaleString('id-ID')}
                            <span style="font-size:10px; color:#aaa; font-weight:400;">/${satuan}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // Render Product List is defined above/below, verifying...
    window.renderProductList = function () {
        const container = document.getElementById('inventory-list');
        if (!container) return;
        container.innerHTML = '';

        let data = Object.entries(cache.products).map(([id, p]) => ({ id, ...p }));
        const term = document.getElementById('inputSearchProduk')?.value.toLowerCase() || '';

        if (term) {
            data = data.filter(p => p.nama.toLowerCase().includes(term));
        }
        if (window.currentCategoryFilter) {
            data = data.filter(p => (p.kategori || '') === window.currentCategoryFilter);
        }

        data.sort((a, b) => a.nama.localeCompare(b.nama));

        if (data.length === 0) {
            container.innerHTML = `<div class="empty-state">${term ? 'Tidak ada barang ditemukan' : 'Data kosong'}</div>`;
            return;
        }

        data.forEach(p => {
            const html = createProductCard(p);
            container.insertAdjacentHTML('beforeend', html);
        });
    };

    // ... UI actions ...

    // ... Search Logic ...

    window.loadInventarisData = function (searchTerm = "") {
        const listContainer = document.getElementById('inventory-list');
        if (!listContainer) return;

        let q = collection(db, 'products');
        let constraints = [];

        if (searchTerm) {
            const capTerm = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1);
            constraints.push(orderBy('nama'));
            constraints.push(startAt(capTerm));
            constraints.push(endAt(capTerm + '\uf8ff'));
        } else {
            if (window.currentCategoryFilter) {
                constraints.push(where('kategori', '==', window.currentCategoryFilter));
            }
            constraints.push(orderBy('nama'));
        }

        constraints.push(limit(50));
        const finalQuery = query(q, ...constraints);

        // Stop previous listener
        if (moduleListeners.products) moduleListeners.products();

        // IMPORTANT: Clear cache to prevent "ghost" items from previous search
        cache.products = {};
        listContainer.innerHTML = ''; // Show visual clearing

        moduleListeners.products = onSnapshot(finalQuery, (snapshot) => {
            if (snapshot.empty) {
                listContainer.innerHTML = '<div class="empty-state">Data tidak ditemukan</div>';
                return;
            }

            snapshot.docChanges().forEach(change => {
                if (change.type === "added" || change.type === "modified") {
                    cache.products[change.doc.id] = change.doc.data();
                }
                if (change.type === "removed") {
                    delete cache.products[change.doc.id];
                }
            });

            // Re-render full list from updated reference
            window.renderProductList();
        });

        // Track global active listener for teardown
        window.activeListener = moduleListeners.products;
    };

    window.openProductDetail = function (id) {
        window.currentDetailId = id;
        const p = cache.products[id];
        if (!p) return;

        const detailView = document.getElementById('product-detail-view');
        if (detailView) detailView.classList.remove('hidden');

        if (document.getElementById('header-product-name')) document.getElementById('header-product-name').innerText = p.nama;
        const titleEl = document.querySelector('.prod-title');
        if (titleEl) titleEl.innerText = p.nama;
        const badgeEl = document.querySelector('.cat-badge-soft');
        if (badgeEl) badgeEl.innerText = p.kategori || '-';
        const initEl = document.querySelector('.initial-box-large');
        if (initEl) initEl.innerText = p.nama.substring(0, 2).toUpperCase();

        let unsubStock = null;
        let unsubHistory = null;

        window.stopDetailListeners = () => {
            if (unsubStock) unsubStock();
            if (unsubHistory) unsubHistory();
            window.stopDetailListeners = null;
        };

        const oldClose = window.closeProductDetail;
        window.closeProductDetail = function () {
            if (window.stopDetailListeners) window.stopDetailListeners();
            if (detailView) detailView.classList.add('hidden');
            window.tutupModalTambahStok();
        };

        unsubStock = onSnapshot(doc(db, 'inventory', id), (snap) => {
            if (snap.exists()) {
                const d = snap.data();
                window.currentDetailStock = d.qty_total || 0;
                if (document.getElementById('detail-header-qty')) document.getElementById('detail-header-qty').innerText = `Stok: ${d.qty_total} Unit`;
                if (document.getElementById('detail-nilai-stok')) document.getElementById('detail-nilai-stok').innerText = `Rp ${(d.nilai_aset_total || 0).toLocaleString('id-ID')}`;
                if (document.getElementById('info-raw-stok')) document.getElementById('info-raw-stok').innerText = `${d.qty_total}`;
            }
        });

        if (window.loadProductActivities) window.loadProductActivities(id);
        if (window.switchDetailTab) window.switchDetailTab('activity');
    };

    // ============ ACTIONS ============

    window.openEditProduct = function (id) {
        document.getElementById('page-inventaris').classList.add('hidden');
        document.getElementById('product-detail-view').classList.add('hidden');
        document.getElementById('page-tambah-barang-v6').classList.remove('hidden');

        if (window.loadProductForEdit) window.loadProductForEdit(id);

        window.closeEditPageSmart = function () {
            if (window.isEditingFromDetail) {
                window.openProductDetail(id);
                document.getElementById('page-tambah-barang-v6').classList.add('hidden');
            } else {
                window.goBack();
            }
        };
    };

    window.hapusProduk = async function (id) {
        if (!confirm("Yakin hapus produk ini? Data inventory dan history akan hilang.")) return;
        try {
            const batch = writeBatch(db);
            batch.delete(doc(db, 'products', id));
            batch.delete(doc(db, 'inventory', id));
            await batch.commit();
            window.showToast("Produk dihapus", "delete");
            window.goBack();
        } catch (e) {
            alert(e.message);
        }
    };

    window.handleEditFromDetail = function () {
        window.isEditingFromDetail = true;
        window.openEditProduct(window.currentDetailId);
    };

    window.toggleDetailMenu = function () {
        const menu = document.getElementById('detail-menu-dropdown');
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    };

    window.handleDeleteFromDetail = function () {
        document.getElementById('detail-menu-dropdown').style.display = 'none';
        if (window.hapusProduk && window.currentDetailId) {
            const p = cache.products[window.currentDetailId];
            window.hapusProduk(window.currentDetailId, p ? p.nama : 'Item ini');
        }
    };

    // ============ UI UTILS & MISC (From Last View) ============

    // --- SEARCH & FILTER FEATURES (EXACT SOURCE LOGIC + ENHANCEMENTS) ---

    // 1. Bottom Sheet Control
    window.bukaFilterKategori = function () {
        const overlay = document.getElementById('bs-overlay');
        const content = document.getElementById('bs-content');
        if (overlay && content) {
            overlay.classList.add('show');
            content.classList.add('show');
            window.renderKategoriDiModal();
        }
    };

    window.tutupFilterKategori = function () {
        const overlay = document.getElementById('bs-overlay');
        const content = document.getElementById('bs-content');
        if (overlay && content) {
            overlay.classList.remove('show');
            content.classList.remove('show');
        }
    };

    // 2. Render List in Modal (STRICT SOURCE HTML)
    window.renderKategoriDiModal = function () {
        const container = document.getElementById('bs-category-list');
        if (!container) return;

        container.innerHTML = '';

        // Use window.kategoriData if available (from app.js listener), else fallback to cache
        // Note: app.js usually handles the listener and populates window.kategoriData
        let dataToUse = window.kategoriData || [];
        if (dataToUse.length === 0 && cache.cat) {
            dataToUse = Object.values(cache.cat).map(c => ({ nama: c.nama || c }));
        }

        // "Semua Kategori" Option
        const allSelected = !window.currentCategoryFilter;
        container.innerHTML += `
            <div class="bs-item ${allSelected ? 'selected' : ''}" onclick="window.pilihKategoriFilter('')">
                <div class="bs-item-name">Semua Kategori</div>
                <div class="bs-radio"></div>
            </div>
        `;

        dataToUse.forEach(cat => {
            const nama = cat.nama || cat;
            if (nama) {
                const isSelected = window.currentCategoryFilter === nama;
                const itemHtml = `
                    <div class="bs-item ${isSelected ? 'selected' : ''}" onclick="window.pilihKategoriFilter('${nama}')">
                        <div class="bs-item-name">${nama}</div>
                        <div class="bs-radio"></div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', itemHtml);
            }
        });
    };

    // 3. Selection Logic
    window.pilihKategoriFilter = function (nama) {
        window.currentCategoryFilter = nama;

        // Update Chip Label
        const label = document.getElementById('label-kategori');
        if (label) label.innerText = nama || 'Kategori';

        // Update Chip Style (Active/Inactive)
        const chip = document.getElementById('chip-kategori');
        if (chip) {
            if (nama) chip.classList.add('active');
            else chip.classList.remove('active');
        }

        window.tutupFilterKategori();

        // Reload Data
        if (window.loadInventarisData) window.loadInventarisData("");
    };

    // 4. Modal Search
    window.filterKategoriDiModal = function (input) {
        const term = input.value.toLowerCase();
        const items = document.querySelectorAll('.bs-item');
        items.forEach(item => {
            const nameEl = item.querySelector('.bs-item-name');
            if (nameEl) {
                const text = nameEl.innerText.toLowerCase();
                item.style.display = text.includes(term) ? 'flex' : 'none';
            }
        });
    };

    // 5. Manage Categories
    window.kelolaKategoriDariFilter = function () {
        window.tutupFilterKategori();
        window.bukaPengaturan();
    };

    window.clearCategorySearch = function (btn) {
        const wrap = btn.parentElement;
        const input = wrap.querySelector('input');
        if (input) {
            input.value = '';
            input.focus();
            if (window.checkSearchInput) window.checkSearchInput(input);

            // Reset List Client-Side Immediate
            const items = document.querySelectorAll('.bs-item');
            items.forEach(item => item.style.display = 'flex');
        }
    };

    window.updateOnlineStatus = function (checkbox) {
        const el = document.getElementById('status-icon');
        if (el) el.style.color = checkbox.checked ? "var(--green)" : "var(--gray)";
    };

    // Debounce helper for search
    let searchTimeout;
    window.handleSearch = function (input) {
        // Validation Button X (Redundant but safe)
        if (window.checkSearchInput) window.checkSearchInput(input);

        const term = input.value.trim();

        // 1. Client-Side Immediate Feedback
        const cards = document.querySelectorAll('.card');
        const lowerTerm = term.toLowerCase();

        cards.forEach(card => {
            const nameEl = card.querySelector('.name');
            if (nameEl) {
                const text = nameEl.innerText.toLowerCase();
                // Use 'flex' or 'block' depending on card design, usually 'block' for div
                card.style.display = text.includes(lowerTerm) ? 'block' : 'none';
            }
        });

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (window.loadInventarisData) {
                window.loadInventarisData(term);
            }
        }, 600);
    };

    window.checkSearchInput = function (input) {
        const wrap = input.parentElement;
        if (!wrap) return;

        const clearBtn = wrap.querySelector('.search-clear');
        if (clearBtn) {
            // Use class toggle for reliability
            if (input.value && input.value.trim().length > 0) {
                clearBtn.classList.add('show');
            } else {
                clearBtn.classList.remove('show');
            }
        }
    };

    // Updated clearSearch to be context-aware
    window.clearSearch = function (btn) {
        const wrap = btn.parentElement;
        const input = wrap.querySelector('input');
        if (input) {
            input.value = '';
            input.focus();
            if (window.checkSearchInput) window.checkSearchInput(input);

            // Context-Aware Reset
            if (input.id === 'searchKategori') {
                if (window.filterKategori) window.filterKategori(input);
                return;
            }
            if (input.id === 'searchSatuan') {
                if (window.filterSatuan) window.filterSatuan(input);
                return;
            }
            if (input.id === 'searchPihakOnline') {
                if (window.filterPihakOnline) window.filterPihakOnline(input);
                return;
            }

            // Default: Main Inventory Reset
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => card.style.display = 'block');
            if (window.loadInventarisData) window.loadInventarisData("");
        }
    };

    // ============ PANEL LOGIC FOR ADD PRODUCT ============

    // 1. KATEGORI PANEL
    window.renderKategoriPanel = function () {
        const container = document.getElementById('listKategori');
        if (!container) return;
        container.innerHTML = '';

        let data = window.kategoriData || [];
        // Fallback to cache if window.kategoriData empty
        if (data.length === 0 && cache.cat) {
            data = Object.values(cache.cat).map(c => ({ nama: c.nama || c }));
        }

        if (data.length === 0) {
            container.innerHTML = '<div class="empty-state">Belum ada kategori</div>';
            return;
        }

        // Hitung jumlah produk per kategori
        const countMap = {};
        if (cache.products) {
            Object.values(cache.products).forEach(product => {
                const katNama = product.kategori || product.kategori_nama;
                if (katNama) {
                    countMap[katNama] = (countMap[katNama] || 0) + 1;
                }
            });
        }

        // Sort
        data.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));

        data.forEach(cat => {
            const nama = cat.nama || cat;
            const count = countMap[nama] || 0;

            const item = document.createElement('div');
            item.className = 'common-list-item info-only';

            const nameEl = document.createElement('b');
            nameEl.textContent = nama;

            const countEl = document.createElement('div');
            countEl.textContent = `${count} Barang`;
            countEl.className = 'subtitle';

            item.appendChild(nameEl);
            item.appendChild(countEl);

            item.onclick = () => {
                const input = document.getElementById('kategori');
                if (input) input.value = nama;
                window.goBack();
                window.validateFormSave();
            };
            container.appendChild(item);
        });
    };

    window.filterKategori = function (input) {
        const term = input.value.toLowerCase();
        const container = document.getElementById('listKategori');
        if (!container) return;

        Array.from(container.children).forEach(item => {
            if (item.classList.contains('empty-state')) return;
            const nameEl = item.querySelector('b');
            if (nameEl) {
                const text = nameEl.innerText.toLowerCase();
                item.style.display = text.includes(term) ? 'flex' : 'none';
            }
        });
    };

    // 2. SATUAN PANEL
    window.renderSatuanPanel = function () {
        const container = document.getElementById('listSatuan');
        if (!container) return;
        container.innerHTML = '';

        let data = window.satuanData || [];
        if (data.length === 0) {
            container.innerHTML = '<div class="empty-state">Belum ada satuan</div>';
            return;
        }

        data.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));

        data.forEach(sat => {
            const nama = sat.nama;
            const item = document.createElement('div');
            item.style.cssText = "display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #eee; cursor:pointer; align-items:center;";
            item.innerHTML = `<div class="item-name" style="font-weight:500;">${nama} <span style="color:#999; font-size:12px;">(${sat.kode || '-'})</span></div>`;
            item.onclick = () => {
                // Context: Satuan Utama vs Tambahan? 
                // Logic in tambah-barang-inventaris.js usually handles 'window.pilihSatuan' 
                // But here we need to know WHICH input triggered this.
                // For now, assume generic handler or check active context string if available.
                // Simple approach: Check hidden state or simple assignment if strict V6 flow.

                // If opened via 'bukaPanelPilihSatuan('utama')', we set #inputSatuanUtama
                // If 'tambahan', we do something else.
                // We need 'window.currentSatuanMode' or similar.

                if (window.pilihSatuanCallback) {
                    window.pilihSatuanCallback(sat);
                } else {
                    // Fallback for simple 'Satuan' field on main form
                    const simpleInput = document.getElementById('satuan');
                    if (simpleInput && !document.getElementById('panelSatuanCompact').classList.contains('show')) {
                        simpleInput.value = nama;
                    }
                }
                window.goBack();
            };
            container.appendChild(item);
        });
    };

    window.filterSatuan = function (input) {
        const term = input.value.toLowerCase();
        const container = document.getElementById('listSatuan');
        if (!container) return;

        Array.from(container.children).forEach(item => {
            if (item.classList.contains('empty-state')) return;
            // Check text content including code
            const text = item.innerText.toLowerCase();
            item.style.display = text.includes(term) ? 'flex' : 'none';
        });
    };

    // Hook into bukaPanelKategori
    window.bukaPanelKategori = function () {
        window.openPanel('panelKategori');
        window.renderKategoriPanel();
        const input = document.getElementById('searchKategori');
        if (input) {
            input.value = '';
            if (window.checkSearchInput) window.checkSearchInput(input);
        }
    };

    window.bukaPanelSatuanCompact = function () {
        window.openPanel('panelSatuanCompact');
        // Retrieve current value if needed
        const currentSatuan = document.getElementById('satuan')?.value;
        const disp = document.getElementById('inputSatuanUtama');
        if (currentSatuan && disp && !disp.value) {
            disp.value = currentSatuan;
        }
    };

    window.bukaPanelPilihSatuan = function (mode) {
        // Setup callback for when a unit is clicked
        window.pilihSatuanCallback = function (satData) {
            if (mode === 'utama') {
                const input = document.getElementById('inputSatuanUtama');
                if (input) input.value = satData.nama;

                // Auto-update main form field too if simple mode?
                const mainInput = document.getElementById('satuan');
                if (mainInput) mainInput.value = satData.nama;

            } else if (mode === 'tambahan') {
                // Logic for adding conversion unit
                // This requires managing the 'listKonversiContainer' list
                // Since I don't have the full source for 'tambahUnitKonversi', I'll stub it nicely
                window.tambahUnitKonversi(satData);
            }
        };

        window.openPanel('panelSatuan');
        window.renderSatuanPanel();
        const input = document.getElementById('searchSatuan');
        if (input) {
            input.value = '';
            if (window.checkSearchInput) window.checkSearchInput(input);
        }
    };

    // Helper for conversion unit (Stub/Simplification)
    window.tambahUnitKonversi = function (satData) {
        const container = document.getElementById('listKonversiContainer');
        const area = document.getElementById('areaKonversi');
        if (area) area.style.display = 'block';

        const div = document.createElement('div');
        div.className = 'conversion-item';
        div.style.cssText = "display:flex; gap:10px; margin-bottom:10px; align-items:center; background:#f9f9f9; padding:10px; border-radius:8px;";
        div.innerHTML = `
            <div style="flex:1;">
                <div style="font-weight:600; font-size:14px;">${satData.nama}</div>
                <div style="font-size:12px; color:#666;">1 ${satData.nama} = ...</div>
            </div>
            <input type="number" class="input-box-v6" placeholder="Rasio" style="width:80px; padding:5px;">
            <span class="material-icons-outlined" style="color:red; cursor:pointer;" onclick="this.parentElement.remove()">delete</span>
         `;
        container.appendChild(div);
    };

    window.toggleUnitDropdown = function (triggerElement) {
        let allUnits = [];
        if (window.appState && window.appState.satuanUtama) {
            allUnits.push(window.appState.satuanUtama);
            if (window.appState.satuanTambahan && window.appState.satuanTambahan.length > 0) {
                allUnits.push(...window.appState.satuanTambahan);
            }
        }
        if (allUnits.length === 0) {
            window.showToast("Pilih Satuan Barang terlebih dahulu.", "warning");
            return;
        }

        const parent = triggerElement.parentElement;
        const listContainer = parent.querySelector('.select-options');
        if (!listContainer) return;

        document.querySelectorAll('.select-options.open').forEach(el => {
            if (el !== listContainer) el.classList.remove('open');
        });

        listContainer.innerHTML = '';
        allUnits.forEach(unit => {
            const item = document.createElement('div');
            item.className = 'select-option';
            item.innerHTML = `<div style="font-weight:500;">${unit.nama}</div>`;
            item.onclick = function (e) {
                e.stopPropagation();
                const targetText = triggerElement.querySelector('.unit-display-target');
                if (targetText) targetText.innerText = unit.kode;
                const hiddenInput = parent.querySelector('input[type="hidden"]');
                if (hiddenInput) hiddenInput.value = unit.nama;
                listContainer.classList.remove('open');
                window.isFormDirty = true;
            };
            listContainer.appendChild(item);
        });
        listContainer.classList.toggle('open');
    };

    window.renderUnitFromParentField = function () {
        const parentInput = document.getElementById('satuan');
        if (!parentInput || !parentInput.value) return;

        const fullValue = parentInput.value;
        const namaDasar = fullValue.split('(')[0].trim();
        const dbSatuan = window.satuanData || [];
        const dataFound = dbSatuan.find(s => s.nama.toLowerCase() === namaDasar.toLowerCase());
        const kodeResmi = dataFound ? dataFound.kode : namaDasar;

        const displayBeli = document.getElementById('selectedUnitText');
        const hiddenBeli = document.getElementById('satuan_beli_terpilih');
        if (displayBeli) displayBeli.innerText = kodeResmi;
        if (hiddenBeli) hiddenBeli.value = namaDasar;

        window.renderDynamicUnits();
    };

    window.renderDynamicUnits = function () {
        const container = document.getElementById('multi-unit-container');
        if (!container) return;
        if (!window.appState.satuanUtama) return;

        const isEdit = !!window.editingProductId;
        const toggleG = document.getElementById('toggle-grosir');
        const toggleE = document.getElementById('toggle-eceran');
        const isGrosirActive = isEdit ? true : (toggleG?.checked ?? true);
        const isEceranActive = isEdit ? true : (toggleE?.checked ?? true);

        const allUnits = [window.appState.satuanUtama, ...window.appState.satuanTambahan];
        container.innerHTML = '';

        allUnits.forEach((uObj, index) => {
            const unit = uObj.nama;
            const kode = uObj.kode || unit;
            const section = document.createElement('div');
            section.className = "unit-price-section";
            section.style = "margin-bottom: 30px; padding: 15px; background: #fff; border: 1px solid #eee; border-radius: 12px;";

            let htmlContent = `
        <div class="section-title-v6" style="color:var(--green); margin-bottom:15px;">Satuan: ${unit}</div>
        <div class="input-group">
            <input type="number" class="input-box-v6" id="harga_warung_${index}" placeholder=" " style="padding-right: 45px;" oninput="window.syncEceranDinamis(${index})">
            <label class="floating-label">Harga Warung</label>
            <span class="unit-indicator">${kode}</span>
        </div>`;

            if (isEceranActive) {
                htmlContent += `
        <div class="input-group" style="margin-top:15px;">
            <input type="number" class="input-box-v6" id="harga_eceran_${index}" placeholder=" " style="padding-right: 45px;">
            <label class="floating-label">Harga Eceran</label>
            <span class="unit-indicator">${kode}</span>
        </div>`;
            }

            if (isGrosirActive) {
                htmlContent += `
        <div id="grosir-area-${index}" style="margin-top:10px;"></div>
        <button type="button" class="btn-tambah-tier green" onclick="window.tambahGrosirDinamis(${index}, '${kode}')" style="margin-top: 15px; width:100%;"> 
            <span class="material-icons-outlined">add_circle_outline</span>
            Tambah Grosir ${unit}
        </button>`;
            }
            section.innerHTML = htmlContent;
            container.appendChild(section);
        });
    };

    window.syncEceranDinamis = function (index) {
        const warungVal = document.getElementById(`harga_warung_${index}`).value;
        const eceranInput = document.getElementById(`harga_eceran_${index}`);
        if (eceranInput && warungVal) {
            eceranInput.value = warungVal;
        }
    };

    window.tambahGrosirDinamis = function (index, kode) {
        const area = document.getElementById(`grosir-area-${index}`);
        if (!area) return;

        const parentInput = document.getElementById('satuan');
        let namaPanjang = kode;
        if (parentInput && parentInput.value) {
            const parts = parentInput.value.match(/^(.*?)\s*(?:\((.*?)\))?$/);
            const units = [];
            if (parts) {
                units.push(parts[1].trim());
                if (parts[2]) units.push(...parts[2].split(',').map(u => u.trim()));
                namaPanjang = units[index] || kode;
            }
        }

        const row = document.createElement('div');
        row.className = 'grosir-tier-row';
        row.style = "display: flex; gap: 10px; margin-top: 10px; align-items: center;";
        const numAttr = `type="number" min="0" onkeypress="return (event.charCode >= 48 && event.charCode <= 57)"`;

        row.innerHTML = `
        <div class="input-group" style="flex:1; position:relative;">
            <input ${numAttr} name="grosir_min_${index}[]" class="input-box-v6 input-min-qty" placeholder=" " inputmode="numeric">
            <label class="floating-label">Min Qty</label>
            <span class="unit-indicator">${kode}</span>
        </div>
        <div class="input-group" style="flex:2; position:relative;">
            <input ${numAttr} name="grosir_harga_${index}[]" class="input-box-v6 input-harga-grosir" placeholder=" " style="padding-right:40px;">
            <label class="floating-label">Harga Grosir ${namaPanjang}</label>
            <span class="material-icons-outlined" 
                  onclick="this.closest('.grosir-tier-row').remove()" 
                  style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: var(--red); cursor: pointer; font-size: 20px; z-index: 5;">
                delete
            </span>
        </div>`;
        area.appendChild(row);
    };

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

    window.loadInventarisData = function (searchTerm = "") {
        const listContainer = document.getElementById('inventory-list');
        if (!listContainer) return;

        // Remove immediate clearing to prevent flash.
        // listContainer.innerHTML = ''; 

        let q = collection(db, 'products');
        let constraints = [];

        if (searchTerm) {
            // Heuristic: Capitalize first letter to match typical Product Names in Firestore
            // e.g. "gula" -> "Gula". Firestore is case-sensitive.
            const capTerm = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1);

            constraints.push(orderBy('nama'));
            constraints.push(startAt(capTerm));
            constraints.push(endAt(capTerm + '\uf8ff'));
        } else {
            // Default view
            if (window.currentCategoryFilter) {
                constraints.push(where('kategori', '==', window.currentCategoryFilter));
            }
            constraints.push(orderBy('nama'));
        }

        constraints.push(limit(50));

        const finalQuery = query(q, ...constraints);

        // Stop previous listener
        if (moduleListeners.products) moduleListeners.products();

        moduleListeners.products = onSnapshot(finalQuery, (snapshot) => {
            // NOW we clear, just before rendering new data
            listContainer.innerHTML = '';

            if (snapshot.empty) {
                if (searchTerm) {
                    listContainer.innerHTML = `<div class="empty-state">Tidak ada barang "${searchTerm}"</div>`;
                } else {
                    listContainer.innerHTML = '<div class="empty-state">Tidak ada barang ditemukan</div>';
                }
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();
                data.id = doc.id;
                cache.products[doc.id] = data;
                // Render Card
                const cardHtml = createProductCard(data);
                listContainer.insertAdjacentHTML('beforeend', cardHtml);
            });

            // Re-apply client-side filter if needed? 
            // No, the query result satisfies the "server" search which is authority.
            // But we might want to ensure the specific text input is respected if user typed more while loading.
            // For now, trust the query.

        }, (error) => {
            console.error("Error loading products:", error);
        });

        window.activeListener = moduleListeners.products;
    };
    // Biaya Admin Level 1 (Kategori)
    window.renderListKategoriBiaya = function () {
        const container = document.getElementById('list-biaya-kategori');
        if (!container) return;
        container.innerHTML = '';
        const categories = Object.entries(cache.cat || {}).map(([id, val]) => ({ id, ...val }));
        categories.sort((a, b) => a.nama.localeCompare(b.nama));
        if (categories.length === 0) {
            container.innerHTML = '<div class="empty-state">Belum ada kategori</div>';
            return;
        }
        categories.forEach(cat => {
            const details = cat.biaya_admin_detail || {};
            const setKeys = Object.keys(details).length;
            const item = document.createElement('div');
            item.className = 'common-list-item';
            item.onclick = () => window.bukaLevel2Biaya(cat.id, cat.nama);
            item.innerHTML = `
            <div class="unit-info">
                <b>${cat.nama}</b>
                <div style="color:var(--gray);font-size:12px">${setKeys} Marketplace diatur</div>
            </div>
            <div class="unit-actions">
                <span class="material-icons-outlined" style="color:#ccc">chevron_right</span>
            </div>`;
            container.appendChild(item);
        });
    };

    // Initialize Standard
    if (window.setupTabs) window.setupTabs();
    if (window.initDirtyCheck) window.initDirtyCheck();

    window.addEventListener('click', function (e) {
        const container = document.getElementById('unitDropdownContainer');
        const list = document.getElementById('dropdownUnitList');
        if (container && list && !container.contains(e.target)) {
            list.classList.remove('open');
        }
    });

    // Initial Data Load
    if (window.loadInventarisData) window.loadInventarisData("");

    console.log("[INVENTARIS] Logic Ready");
}
