export const view = `
    <div class="modal-overlay" id="modalOverlay"></div>
    <div id="loading-indicator" style="display: none; text-align: center; padding: 20px; color: var(--green);">
        <span class="material-icons-outlined" style="font-size: 30px; animation: spin 1s linear infinite;">autorenew</span>
        <div style="font-size: 12px; margin-top: 5px;">Memuat data...</div>
    </div>

    <!-- HEADER: SAMA PERSIS -->
    <!-- HEADER: SAMA PERSIS -->
    <!-- MAIN INVENTORY PAGE WRAPPER -->
    <div id="page-inventaris" class="page">
        <div class="inventaris-header">
            <h2>Inventaris</h2>
            <span class="material-icons-outlined header-settings" onclick="window.bukaPengaturan()">settings</span>
        </div>

        <div class="sticky-header-group">
            <!-- SEARCH AREA SAMA PERSIS -->
            <div class="search-area" style="border-bottom: none; padding-bottom: 5px; gap: 10px;">
                <div class="search-wrap">
                    <span class="material-icons-outlined">search</span>
                    <input type="text" id="inputSearchProduk" placeholder="Cari Barang..."
                        oninput="window.checkSearchInput(this)" 
                        onkeyup="window.handleSearch(this)">
                    <span class="material-icons-outlined search-clear" onclick="window.clearSearch(this)">close</span>
                </div>
            </div>

            <!-- FILTER CHIPS AREA SAMA PERSIS -->
            <div class="filter-chips-area">
                <button class="filter-chip" id="chip-kategori" onclick="window.bukaFilterKategori()">
                    <span id="label-kategori">Kategori</span>
                    <span class="material-icons-outlined">expand_more</span>
                </button>
                <button class="filter-chip" id="chip-stok" onclick="window.bukaFilterStok()">
                    <span id="label-stok">Stok</span>
                    <span class="material-icons-outlined">expand_more</span>
                </button>
                <button class="filter-chip" id="chip-jenis" onclick="window.bukaFilterJenis()">
                    <span id="label-jenis">Jenis</span>
                    <span class="material-icons-outlined">expand_more</span>
                </button>
            </div>
        </div>

        <!-- LIST CONTAINER -->
        <div class="inventory-list" id="inventory-list" onscroll="checkScrollLoad(this)">
            <!-- DATA AKAN DIMUAT DI SINI -->
        </div>

        <!-- FAB UTAMA (TAMBAH BARANG) -->
        <div id="main-fab-inventaris" class="fab" onclick="window.bukaTambahBarang()">
            <span class="material-icons-outlined">add</span>
        </div>
    </div>


    <!-- ============================================== -->
    <!--  CLEAN VIEW: PANELS  -->
    <!-- ============================================== -->

    <!-- MODAL POPUP & OVERLAYS (Required for basic toasts) -->
    <div id="toast-container"></div>

    <!-- Restoring Filter Category Bottom Sheet (Required for functionality) -->
    <div class="bottom-sheet-overlay" id="bs-overlay" onclick="window.tutupFilterKategori()"></div>
    <div class="bottom-sheet-content" id="bs-content">
        <div class="bs-header">Filter Berdasarkan Kategori</div>

        <div class="bs-search">
             <div class="search-wrap" style="background: #f8f9fa; border: 1px solid #eee;">
                <span class="material-icons-outlined" style="left: 10px;">search</span>
                <input type="text" id="bs-search-input" placeholder="Cari Kategori" 
                    oninput="window.checkSearchInput(this)"
                    onkeyup="window.filterKategoriDiModal(this)"
                    style="background: transparent; border:none; padding-left: 35px; height: 36px; padding-right: 30px;">
                <span class="material-icons-outlined search-clear" onclick="window.clearCategorySearch(this)">close</span>
            </div>
        </div>

        <div class="bs-list" id="bs-category-list">
             <!-- Populated by JS -->
        </div>

        <div class="bs-footer">
            <button class="btn-kelola" onclick="window.kelolaKategoriDariFilter()">
                <span class="material-icons-outlined">category</span> Kelola Kategori
            </button>
        </div>
    </div>

    <!-- PAGE TAMBAH BARANG V6 -->
    <div id="page-tambah-barang-v6" class="page hidden">
        <div class="standard-header sticky-header">
            <div class="back-button" onclick="goBack()">
                <span class="material-icons-outlined">arrow_back</span>
            </div>
            <h2>Tambah Barang Baru</h2>
        </div>

        <div class="content">
            <div class="input-group">
                <input type="text" class="input-box-v6" id="nama_barang" placeholder=" " autofocus
                    oninput="window.validateFormSave()">
                <label class="floating-label" for="nama_barang">Nama Barang</label>
            </div>
            
            <div class="input-group select-wrapper" onclick="bukaPanelKategori()">
                <input type="text" class="input-box-v6" id="kategori" placeholder=" " readonly>
                <label class="floating-label" for="kategori">Kategori</label>
                <span class="material-icons-outlined chevron">chevron_right</span>
            </div>
            
            <div class="input-group select-wrapper" onclick="bukaPanelSatuanCompact()">
                <input type="text" class="input-box-v6" id="satuan" placeholder=" " readonly>
                <label class="floating-label" for="satuan">Satuan</label>
                <span class="material-icons-outlined chevron">chevron_right</span>
            </div>

            <div class="tabs" id="dynamic-tabs"></div>

            <div id="section-offline" class="tab-content-section">
                <div class="flex-row" style="position: relative; z-index: 10;">
                    <div class="input-group w-80">
                        <input type="number" id="harga_beli" class="input-box-v6" placeholder=" " inputmode="numeric"
                            onkeypress="return (event.charCode >= 48 && event.charCode <= 57)" min="0">
                        <label class="floating-label" for="harga_beli">Harga Beli</label>
                    </div>
                    <div class="custom-select-container w-20" id="unitDropdownContainer">
                        <div class="select-trigger" onclick="toggleUnitDropdown(this)">
                            <span id="selectedUnitText" class="unit-display-target" style="font-weight:700; color:var(--green)"></span>
                            <span class="material-icons-outlined" style="font-size:16px;">expand_more</span>
                        </div>
                        <div class="select-options" id="dropdownUnitList"></div>
                        <input type="hidden" id="satuan_beli_terpilih">
                    </div>
                </div>
                <div id="multi-unit-container" style="margin-top: 20px;"></div>
            </div>

            <div id="section-online" class="tab-content-section" style="display:none;">
                <div class="input-group-v6" style="margin-bottom: 25px;">
                    <div class="switch-toggle" style="background: #f1f3f5; padding: 4px; border-radius: 12px; gap: 4px; display: flex; height: 52px; align-items: center;">
                        <div id="btn-sub-suplayer" class="switch-btn active" onclick="window.switchSubTab('suplayer')" style="flex:1; height:100%; display:flex; align-items:center; justify-content:center; gap:8px; font-size:14px; font-weight:600; cursor:pointer; border-radius:10px; transition:0.3s;">
                            <span class="material-icons-outlined" style="font-size:20px;">inventory_2</span>Suplayer
                        </div>
                        <div id="btn-sub-marketplace" class="switch-btn" onclick="window.switchSubTab('marketplace')" style="flex:1; height:100%; display:flex; align-items:center; justify-content:center; gap:8px; font-size:14px; font-weight:600; cursor:pointer; border-radius:10px; transition:0.3s;">
                            <span class="material-icons-outlined" style="font-size:20px;">storefront</span>Marketplace
                        </div>
                    </div>
                </div>
                <div id="sub-section-suplayer" class="sub-online-section">
                    <div id="list-suplayer-container"></div>
                    <button type="button" class="btn-tambah-tier green" onclick="window.tambahBarisSuplayer()" style="margin-bottom: 12px;">
                        <span class="material-icons-outlined">add_circle_outline</span>
                        Tambah Data Suplayer
                    </button>
                </div>
                <div id="sub-section-marketplace" class="sub-online-section" style="display:none;">
                    <div id="list-marketplace-container"></div>
                    <button type="button" class="btn-tambah-tier" onclick="window.tambahBarisMarketplace()" style="border-color: #f39c12; color: #f39c12; background: #fffaf0; margin-bottom: 12px;">
                        <span class="material-icons-outlined">add_circle_outline</span>
                        Tambah Data Marketplace
                    </button>
                </div>
            </div>

            <div id="section-tambahan" class="tab-content-section" style="display:none;">
                <div class="flex-row" id="stokAwalContainer" style="position: relative; z-index: 9; margin-bottom: 15px;">
                    <div class="input-group w-80">
                        <input type="number" id="stok_awal" class="input-box-v6" placeholder=" " inputmode="numeric">
                        <label class="floating-label">Stok Awal</label>
                    </div>
                    <div class="custom-select-container w-20">
                        <div class="select-trigger" onclick="toggleUnitDropdown(this)">
                            <span id="displayUnitStokAwal" class="unit-display-target" style="font-weight:700; color:var(--green)"></span>
                            <span class="material-icons-outlined" style="font-size:16px;">expand_more</span>
                        </div>
                        <div class="select-options"></div>
                        <input type="hidden" id="satuan_stok_awal">
                    </div>
                </div>

                <div class="flex-row" style="position: relative; z-index: 8; margin-bottom: 15px;">
                    <div class="input-group w-80">
                        <input type="number" id="stok_min" class="input-box-v6" placeholder=" " inputmode="numeric">
                        <label class="floating-label">Min. Stok (Peringatan)</label>
                    </div>
                    <div class="custom-select-container w-20">
                        <div class="select-trigger" onclick="toggleUnitDropdown(this)">
                            <span id="displayUnitStokMin" class="unit-display-target" style="font-weight:700; color:var(--green)"></span>
                            <span class="material-icons-outlined" style="font-size:16px;">expand_more</span>
                        </div>
                        <div class="select-options"></div>
                        <input type="hidden" id="satuan_stok_min">
                    </div>
                </div>

                <div class="input-group" style="margin-bottom: 15px;">
                    <input type="text" id="lokasi_barang" class="input-box-v6" placeholder=" ">
                    <label class="floating-label">Lokasi Barang (Rak/Etalase)</label>
                </div>

                <div class="input-group" style="margin-bottom: 20px;">
                    <textarea id="catatan_barang" class="input-box-v6" placeholder=" " style="height: 80px; padding-top: 15px; resize: none;"></textarea>
                    <label class="floating-label">Catatan Tambahan</label>
                </div>
            </div>
        </div>
        <div class="bottom-btn-container">
            <button class="btn-full" id="btnSimpan" disabled>
                <span class="material-icons-outlined">save</span>
                Simpan
            </button>
        </div>
    </div>

    <!-- PANELS & MODALS -->
    <div id="panelKategori" class="pilih-panel">
        <div class="standard-header">
            <div class="back-button" onclick="goBack()">
                <span class="material-icons-outlined">arrow_back</span>
            </div>
            <h2>Pilih Kategori</h2>
        </div>
        <div class="search-area">
            <div class="search-wrap">
                <span class="material-icons-outlined">search</span>
                <input type="text" id="searchKategori" placeholder="Cari kategori..."
                    onkeyup="filterKategori(this); window.checkSearchInput(this)">
                <span class="material-icons-outlined search-clear" onclick="window.clearSearch(this)">close</span>
            </div>
        </div>
        <div class="list-container" id="listKategori"></div>
    </div>

    <div id="panelSatuanCompact" class="pilih-panel">
        <div class="standard-header">
            <div class="back-button" onclick="goBack()">
                <span class="material-icons-outlined">arrow_back</span>
            </div>
            <h2>Atur Satuan</h2>
            <div style="margin-left:auto;">
                <span id="btn-reset-satuan-draft" class="material-icons-outlined" onclick="window.resetSatuanDraft()"
                    style="color:var(--red); cursor:pointer;">restart_alt</span>
            </div>
        </div>
        <div class="panel-content-scrollable">
            <div class="section-title-v6">Satuan Dasar (Terkecil)</div>
            <div class="input-group select-wrapper" onclick="window.bukaPanelPilihSatuan('utama')">
                <input type="text" class="input-box-v6" id="inputSatuanUtama" placeholder=" " readonly>
                <label class="floating-label" for="inputSatuanUtama">Satuan Dasar</label>
                <span class="material-icons-outlined chevron">chevron_right</span>
            </div>
            <div class="info-text">
                <span class="material-icons-outlined">info</span>
                <span>Contoh: Pcs, Gram, Butir (Unit stok terkecil)</span>
            </div>
            <div id="areaKonversi" style="display: none;">
                <hr class="section-divider">
                <div class="section-title-v6">Konversi Satuan Besar</div>
                <div id="listKonversiContainer" class="conversion-list"></div>
                <div class="btn-add-unit green" onclick="window.bukaPanelPilihSatuan('tambahan')">
                    <span class="material-icons-outlined" style="color:var(--green)">add_circle</span>
                    <span style="color:var(--green)">Tambah Satuan Besar</span>
                </div>
            </div>
        </div>
        <div class="bottom-btn-container">
            <button class="btn-full" id="btnSimpanSatuanCompact" onclick="window.simpanSatuanCompact()" disabled>
                <span class="material-icons-outlined">save</span>
                Simpan Pengaturan
            </button>
        </div>
    </div>

    <div id="panelSatuan" class="pilih-panel">
        <div class="standard-header">
            <div class="back-button" onclick="goBack()">
                <span class="material-icons-outlined">arrow_back</span>
            </div>
            <h2>Pilih Satuan</h2>
        </div>
        <div class="search-area">
            <div class="search-wrap">
                <span class="material-icons-outlined">search</span>
                <input type="text" id="searchSatuan" placeholder="Cari satuan..."
                    onkeyup="window.filterSatuan(this); window.checkSearchInput(this)">
                <span class="material-icons-outlined search-clear" onclick="window.clearSearch(this)">close</span>
            </div>
        </div>
        <div class="list-container" id="listSatuan"></div>
    </div>

    <div id="formSatuan" class="form-modal">
        <div class="standard-header">
            <div class="back-button" onclick="goBack()">
                <span class="material-icons-outlined">arrow_back</span>
            </div>
            <h2>Tambah Satuan Baru</h2>
        </div>
        <div class="form-content">
            <div>
                <label class="form-label">Nama Satuan</label>
                <input type="text" id="namaSatuanBaru" class="form-input" placeholder="Contoh: Gram/Kilogram"
                    style="border:1px solid var(--green)">
            </div>
            <div>
                <label class="form-label">Kode Satuan (Maks 5 karakter)</label>
                <input type="text" id="kodeSatuanBaru" class="form-input" placeholder="100GR" maxlength="5"
                    oninput="this.value = this.value.toUpperCase()">
            </div>
            <div style="color:var(--gray); font-size:12px; margin-top:15px;">
                <span class="material-icons-outlined" style="font-size:16px; vertical-align:middle;">info</span>
                Satuan akan langsung tersedia untuk dipilih
            </div>
        </div>
        <div class="bottom-btn-container">
            <button id="btnSimpanSatuan" class="btn-full" onclick="window.simpanSatuanBaru()" disabled>
                <span class="material-icons-outlined">save</span>
                Simpan Satuan
            </button>
        </div>
    </div>

    <div id="panelPilihPihak" class="pilih-panel">
        <div class="standard-header">
            <div class="back-button" onclick="goBack()"><span class="material-icons-outlined">arrow_back</span></div>
            <h2 id="titlePanelPihak">Pilih Suplayer</h2>
        </div>
        <div class="search-area">
            <div class="search-wrap">
                <span class="material-icons-outlined">search</span>
                <input type="text" id="searchPihakOnline" placeholder="Cari nama..."
                    onkeyup="window.filterPihakOnline(this); window.checkSearchInput(this)">
                <span class="material-icons-outlined search-clear" onclick="window.clearSearch(this)">close</span>
            </div>
        </div>
        <div class="list-container" id="listPihakOnline"></div>
        <div class="bottom-btn-container">
            <button class="btn-full" id="btnTambahPihakBaru" onclick="window.tambahPihakBaru()">
                <span class="material-icons-outlined">add</span>
                Tambah Baru
            </button>
        </div>
    </div>

    <div id="modalDiscardTambahBarang" class="modal-confirm-overlay-tb"
        onclick="if(event.target === this) tutupModalDiscard()"
        style="display: none; position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 99999 !important; background: rgba(0,0,0,0.5) !important; align-items: center !important; justify-content: center !important; padding: 0 !important; margin: 0 !important;">
        <div class="modal-confirm-card-tb"
            style="position: relative !important; width: 85% !important; max-width: 300px !important; margin: 0 auto !important; background: white !important; border-radius: 16px !important; padding: 25px 20px !important; text-align: center !important; box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important; animation: popUpTb 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;">
            <div class="icon-circle-tb" style="margin: 0 auto 15px auto !important;">
                <span class="material-icons-outlined" style="font-size: 28px;">question_mark</span>
            </div>
            <div class="modal-confirm-title-tb" style="margin-bottom: 10px; font-weight: 700;">Buang Perubahan?</div>
            <div class="modal-confirm-text-tb" style="margin-bottom: 25px; color: #666; font-size: 14px; line-height: 1.5;">
                Anda memiliki perubahan data barang yang belum disimpan. Apakah Anda yakin ingin menghapusnya?
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="btn-continue-tb" onclick="tutupModalDiscard()" style="width: 100%; margin: 0; padding: 12px; border-radius: 8px;">
                    Lanjutkan Mengedit
                </button>
                <button class="btn-discard-tb" onclick="konfirmasiBuang()" style="width: 100%; margin: 0; padding: 12px; border-radius: 8px; background: white; color: #333; border: none; font-weight: 600; box-shadow: none;">
                    Ya, Buang
                </button>
            </div>
        </div>
    </div>
`;
