import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyD_UdOMyKpUGAfR-676ssdiseNSzYEDUhk",
  authDomain: "nettools-2424c.firebaseapp.com",
  projectId: "nettools-2424c",
  storageBucket: "nettools-2424c.firebasestorage.app",
  messagingSenderId: "909318744007",
  appId: "1:909318744007:web:f03f6528f95abbd19c9be2",
  measurementId: "G-64REKMHFTD"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)

// Persist user session in browser (no-op on server)
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch(() => {})
}

export { app, auth }
