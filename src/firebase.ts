import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCLclKDppxXoOSKWVLHAnp1GA0J9WKxNRQ",
  authDomain: "zichanguanli-30b0c.firebaseapp.com",
  projectId: "zichanguanli-30b0c",
  storageBucket: "zichanguanli-30b0c.firebasestorage.app",
  messagingSenderId: "190738609251",
  appId: "1:190738609251:web:399d5360e4de2a8a617456"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
