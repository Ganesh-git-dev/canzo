import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBSNknLdlF1R9j9xplhD6IDBhoIHNwuFo4",
  authDomain: "canzo-459ad.firebaseapp.com",
  projectId: "canzo-459ad",
  storageBucket: "canzo-459ad.firebasestorage.app",
  messagingSenderId: "414887751172",
  appId: "1:414887751172:web:76749a21c1547183fe4f51"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
