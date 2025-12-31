// SPA/modules/dashboard.js

export const view = `
    <div class="dashboard-container">
        <!-- Section 1: Banner -->
        <div class="banner">
            <div class="banner-text">
                <h3>Versi Web Kini Tersedia</h3>
                <p>Kelola toko jadi lebih mudah dan cepat.</p>
            </div>
            <div class="banner-icon">🚀</div>
        </div>

        <!-- Section 2: Financial Scorecards -->
        <div class="scorecard-grid">
            <div class="card-db card-green">
                <div class="card-label">Terima (Income)</div>
                <div class="card-value" id="val-income">Rp 0</div>
            </div>
            <div class="card-db card-red">
                <div class="card-label">Bayar (Expense)</div>
                <div class="card-value" id="val-expense">Rp 0</div>
            </div>
        </div>

        <div class="summary-grid">
            <div class="sum-item">
                <div class="sum-label">Penjualan</div>
                <div class="sum-val" id="val-sales">Rp 0</div>
                <div class="sum-count" id="count-sales">0 Trx</div>
            </div>
            <div class="sum-item">
                <div class="sum-label">Pembelian</div>
                <div class="sum-val" id="val-purchase">Rp 0</div>
            </div>
            <div class="sum-item">
                <div class="sum-label">Pengeluaran</div>
                <div class="sum-val" id="val-operational">Rp 0</div>
            </div>
            <div class="sum-item highlight">
                <div class="sum-label">Total Saldo</div>
                <div class="sum-val" id="val-balance">Rp 0</div>
            </div>
        </div>

        <!-- Section 3: Main Actions -->
        <div class="section-title-db">Jelajahi Aplikasi</div>
        <div class="action-grid">
            <div class="action-card" onclick="alert('Fitur Entri Cepat segera hadir')">
                <div class="icon-circle bg-blue"><span class="material-icons-outlined">calculate</span></div>
                <div class="action-name">Entri Cepat</div>
            </div>
            <div class="action-card" onclick="window.navigasi('loadKasir')"> 
                <!-- Updated to use SPA navigation -->
                <div class="icon-circle bg-primary"><span class="material-icons-outlined">point_of_sale</span></div>
                <div class="action-name">POS Cepat</div>
            </div>
            <div class="action-card" onclick="alert('Fitur Laporan Lengkap segera hadir')">
                <div class="icon-circle bg-orange"><span class="material-icons-outlined">analytics</span></div>
                <div class="action-name">Laporan</div>
            </div>
        </div>

        <!-- Section 4: Shortcuts -->
        <div class="section-title-db">Pintasan</div>
        <div class="shortcut-grid">
            <div class="shortcut-item">
                <div class="s-icon"><span class="material-icons-outlined">person_add</span></div>
                <div class="s-name">Pihak</div>
            </div>
            <div class="shortcut-item">
                <div class="s-icon"><span class="material-icons-outlined">receipt_long</span></div>
                <div class="s-name">Faktur</div>
            </div>
            <div class="shortcut-item">
                <div class="s-icon"><span class="material-icons-outlined">attach_money</span></div>
                <div class="s-name">Uang Masuk</div>
            </div>
            <div class="shortcut-item">
                <div class="s-icon"><span class="material-icons-outlined">money_off</span></div>
                <div class="s-name">Uang Keluar</div>
            </div>
        </div>
    </div>
`;

export function init() {
    console.log("Dashboard Loaded");
    // Placeholder logic - bisa ditambahkan fetch real data di sini nanti
    // Untuk sekarang hanya static view agar user senang tampilannya "mirip"
}
