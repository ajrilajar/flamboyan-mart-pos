// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";

// 1. Import Firestore
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    runTransaction,
    writeBatch,
    increment
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 2. Import Firebase Storage (WAJIB DITAMBAHKAN UNTUK FOTO) - Tetap dummy komentar untuk sekarang
// import { getStorage, ref as storageRef, ... } from "..."

const firebaseConfig = {
    apiKey: "AIzaSyDL9F1DOnjrCCtDZ13aXL-yX4oAyQfUu9Y",
    projectId: "gen-lang-client-0116140691",
    storageBucket: "gen-lang-client-0116140691.appspot.com"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 3. Export Firestore Functions
export {
    db,
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    runTransaction,
    writeBatch,
    increment
};
