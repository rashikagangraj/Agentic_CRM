import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { Firestore, initializeFirestore, persistentLocalCache, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey.trim() !== '' &&
    firebaseConfig.apiKey !== 'undefined' &&
    firebaseConfig.apiKey !== 'your-api-key' &&
    firebaseConfig.projectId
);

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let db: Firestore | undefined = undefined;

// Only initialize Firebase on the client side when configuration is present
if (typeof window !== 'undefined' && isFirebaseConfigured) {
    try {
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);

        // Initialize Firestore with offline persistence
        if (getApps().length === 1) {
            db = initializeFirestore(app, {
                localCache: persistentLocalCache({
                    cacheSizeBytes: CACHE_SIZE_UNLIMITED
                })
            });
        } else {
            // If app already exists, get existing Firestore instance
            const { getFirestore } = require('firebase/firestore');
            db = getFirestore(app);
        }

        console.log("Firebase Configured for Project:", firebaseConfig.projectId);
    } catch (error) {
        console.error("Error initializing Firebase:", error);
    }
}

export { auth, db, app as default };

