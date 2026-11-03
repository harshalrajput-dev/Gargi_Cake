import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD7doy7n1o438FQqpSZUu-Z--sUETV99PI",
  authDomain: "gargicake-c9f1f.firebaseapp.com",
  projectId: "gargicake-c9f1f",
  storageBucket: "gargicake-c9f1f.firebasestorage.app",
  messagingSenderId: "1078614516451",
  appId: "1:1078614516451:web:87104b99a483b23178dbd6",
  measurementId: "G-3WD0ND7JYN",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export { collection, deleteDoc, doc, getDocs, onAuthStateChanged, updateDoc };

export async function saveWhatsAppOrder(orderData) {
  try {
    const docRef = await addDoc(collection(db, "orders"), {
      ...orderData,
      status: "WhatsApp Opened",
      confirmed: false,
      orderChannel: "WhatsApp",
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("WhatsApp order log failed:", error);
    throw error;
  }
}

export async function adminLogin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logoutAdmin() {
  return signOut(auth);
}
