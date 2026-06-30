// ===============================
// firebase.js — الإصدار النهائي
// بدون أي خطأ — تشغيل Analytics بأمان
// ===============================

import { initializeApp } from "firebase/app";
import {
  getAuth,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
  addDoc,
  limit
} from "firebase/firestore";

import { getStorage } from "firebase/storage";

import {
  getAnalytics,
  isSupported
} from "firebase/analytics";

import { getFunctions } from "firebase/functions";

// -------------------------------------------
// إعدادات Firebase الخاصة بتطبيقك
// -------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyA7OIj8-Husi5Wwal_IYI3f9bMPqwQAvyo",
  authDomain: "ai51-b0064.firebaseapp.com",
  projectId: "ai51-b0064",
  storageBucket: "ai51-b0064.firebasestorage.app",
  messagingSenderId: "326872061533",
  appId: "1:326872061533:web:fd9ed24ba96cc718699fb4",
  measurementId: "G-M56ZJJCD3B"
};

// -------------------------------------------
// تشغيل Firebase
// -------------------------------------------
const app = initializeApp(firebaseConfig);

// -------------------------------------------
// تشغيل Analytics بدون أخطاء (بيئة متصفح فقط)
// -------------------------------------------
let analytics = null;

isSupported().then((supported) => {
  if (supported) {
    try {
      analytics = getAnalytics(app);
    } catch (err) {
      console.warn("Analytics disabled:", err);
    }
  }
});

// -------------------------------------------
// التصدير — جاهز للاستخدام
// -------------------------------------------
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// تصدير الدوال الإضافية من Firestore
export {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
  addDoc,
  limit
};

// إضافة التصدير لخاصية userId الجديد في المعاملات
export const getTransactionsByUserId = async (userId) => {
  try {
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("❌ خطأ في جلب المعاملات:", error);
    return [];
  }
};

// دالة مساعدة لجلب بيانات الأسهم
export const getStockData = async () => {
  try {
    const stockDoc = await getDoc(doc(db, "stock", "company"));
    if (stockDoc.exists()) {
      return stockDoc.data();
    }
    return null;
  } catch (error) {
    console.error("❌ خطأ في جلب بيانات الأسهم:", error);
    return null;
  }
};

// دالة مساعدة لجلب محفظة المستخدم
export const getUserPortfolio = async (userId) => {
  try {
    const portfolioDoc = await getDoc(doc(db, "users", userId, "shares", "portfolio"));
    if (portfolioDoc.exists()) {
      return portfolioDoc.data();
    }
    return null;
  } catch (error) {
    console.error("❌ خطأ في جلب المحفظة:", error);
    return null;
  }
};

// دالة مساعدة لجلب تاريخ أسعار الأسهم
export const getStockHistory = async (limitCount = 365) => {
  try {
    const historyQuery = query(
      collection(db, "stock_history"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(historyQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).reverse();
  } catch (error) {
    console.error("❌ خطأ في جلب تاريخ الأسهم:", error);
    return [];
  }
};

export { analytics };
export { sendPasswordResetEmail, signInWithPopup };
