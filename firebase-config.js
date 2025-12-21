// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getDatabase, ref, onValue, push, update, remove } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDL9F1DOnjrCCtDZ13aXL-yX4oAyQfUu9Y",
    databaseURL: "https://gen-lang-client-0116140691-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "gen-lang-client-0116140691",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Ekspor agar bisa digunakan di file lain
export { db, ref, onValue, push, update, remove };