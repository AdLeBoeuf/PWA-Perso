import { getApp, getApps, initializeApp } from 'firebase/app'
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Replace these values with the Firebase Web App credentials from your project.
const firebaseConfig = {
  apiKey: "AIzaSyAwQYABBgPYcheGmu7lIBizmS5SlOaF1iI",
  authDomain: "appli-muscu-bd52c.firebaseapp.com",
  projectId: "appli-muscu-bd52c",
  storageBucket: "appli-muscu-bd52c.firebasestorage.app",
  messagingSenderId: "66295939479",
  appId: "1:66295939479:web:ee1f2995e41c53246e44d2",
  measurementId: "G-BQD6D3QX0D"
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const authPersistenceReady = setPersistence(auth, browserLocalPersistence)
export const db = getFirestore(app)
