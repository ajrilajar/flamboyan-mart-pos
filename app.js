// SPA/app.js - Router & State Manager

// Global activeListener storage
window.activeListener = null;

// DEBUG: Confirm SPA is Loading
console.log("SPA Engine Loaded");
// setTimeout(() => alert("SPA Version Loaded!"), 500);

// ============ FUNGSI UTAMA: Stop Listener ============
window.stopActiveListener = function () {
    if (window.activeListener) {
        console.log("[AUDIT] Mematikan listener aktif...");
        if (typeof window.activeListener === 'function') {
            window.activeListener(); // Unsubscribe
        }
        window.activeListener = null;
    } else {
        console.log("[AUDIT] Tidak ada listener aktif untuk dimatikan.");
    }
};

// ============ FUNGSI NAVIGASI ============
window.navigasi = async function (pageName) {
    console.log(`[NAVIGASI] Menuju: ${pageName}`);

    // 1. Matikan Listener Sebelumnya (WAJIB)
    window.stopActiveListener();

    // 2. Update UI Navigasi (Aktifkan Icon)
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    // Cari tombol nav yg sesuai (logic simple)
    const activeNav = document.querySelector(`.nav-item[onclick*="'${pageName}'"]`) ||
        document.querySelector(`.nav-item[onclick*='"${pageName}"']`);
    if (activeNav) activeNav.classList.add('active');

    // 3. Reset Container Utama
    const appContainer = document.getElementById('app-container');
    // Bersihkan isinya agar tidak tumpuk (Simple SPA approach)
    // ATAU gunakan container terpisah jika ingin cache DOM (Advanced), 
    // tapi untuk Smart-Listener Basic, kita clear & reload to ensure listener safety.
    // appContainer.innerHTML = ''; 
    // TAPI, struktur index.html kita punya app-container yang menampung module view.

    // Loading State
    appContainer.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:50vh; color:#888;">
            <span class="material-icons-outlined" style="font-size:40px; animation:spin 1s linear infinite;">autorenew</span>
            <div style="margin-top:10px;">Memuat Halaman...</div>
        </div>
        <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
    `;

    // 4. Load Module Logic
    try {
        switch (pageName) {
            case 'loadInventaris': // Match onclick name in index.html
            case 'inventaris':
                await loadModuleInventaris(appContainer);
                break;

            case 'loadDashboard':
            case 'beranda':
                // Dynamic Import Dashboard
                const modDash = await import('./modules/dashboard.js');
                appContainer.innerHTML = modDash.view;
                if (modDash.init) modDash.init();
                break;

            case 'loadKasir': // Placeholder
            case 'kasir':
                appContainer.innerHTML = '<div style="padding:20px;text-align:center;"><h3>Kasir Placeholder</h3></div>';
                break;

            default:
                appContainer.innerHTML = `<div style="padding:20px;text-align:center;">Halaman '${pageName}' belum siap.</div>`;
        }
    } catch (e) {
        console.error("Gagal memuat modul:", e);
        appContainer.innerHTML = `<div style="color:red; padding:20px; text-align:center;">Error: ${e.message}</div>`;
    }
};

// ============ MODULE LOADERS ============

async function loadModuleInventaris(container) {
    // Dynamic Import
    const module = await import('./modules/inventaris.js');

    // Render View
    container.innerHTML = module.view;

    // Init Logic
    if (module.init) {
        module.init();
    }
}

// Start Up
document.addEventListener('DOMContentLoaded', () => {
    // Navigate based on logic or default
    // Check global variables or just start at dashboard
    window.navigasi('inventaris'); // Default to target task for testing
});
