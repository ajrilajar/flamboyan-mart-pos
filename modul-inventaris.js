// MODUL INVENTARIS - SIMPLIFIED VERSION
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { db } from "./firebase-config.js";
import * as SetingInv from "./modul-pengaturan-inventaris.js";

let databaseBarang = {}, dataKategori = {}, dataSatuan = {};
let currentEditId = null, multiUnits = [], lastOrigin = 'view-list', pickerTargetIndex = null;
const desktopWidth = "max-w-4xl";

console.log('✅ modul-inventaris.js LOADED');

// RENDER FUNCTION
export function renderInventaris() {
    console.log('🔄 renderInventaris called');
    document.getElementById('main-content').innerHTML = `
        <div class="p-4">
            <h1 class="text-2xl font-bold">Inventaris</h1>
            <p class="text-gray-600">Modul inventaris berhasil dimuat</p>
        </div>
    `;
}

// SIMPLE FUNCTIONS
window.switchView = (v) => { 
    console.log('switchView:', v);
};

window.bukaHalamanEdit = () => {
    console.log('bukaHalamanEdit');
};

window.batalEdit = () => {
    console.log('batalEdit');
};

// END OF FILE - CLEAN