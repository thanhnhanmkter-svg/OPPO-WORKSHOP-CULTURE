// firebase.js — đặt ở thư mục GỐC (cùng cấp với package.json)
// ⚠️  Thay thế toàn bộ object firebaseConfig bằng thông tin Firebase project của bạn
import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDRoQRCV7fr-1yN071g8Vdi2u1sOvEtHBA",
  authDomain: "workshop-culture.firebaseapp.com",
  projectId: "workshop-culture",
  storageBucket: "workshop-culture.firebasestorage.app",
  messagingSenderId: "741916433991",
  appId: "1:741916433991:web:b401d078c3446d591f9b62",
  measurementId: "G-9QSHBP1GJV"
};

// Tránh khởi tạo nhiều lần trong Next.js dev mode
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getDatabase(app);
