// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBMu-XR_mx5sxtS8sbwswCDWkyafiVsxX0",
  authDomain: "errorloganalysis-54df4.firebaseapp.com",
  projectId: "errorloganalysis-54df4",
  storageBucket: "errorloganalysis-54df4.firebasestorage.app",
  messagingSenderId: "1067180139691",
  appId: "1:1067180139691:web:8f6fce2386facfed2043ee",
  measurementId: "G-N2TWYB4VN1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, db, storage };

// Local storage fallback utilities
export const localStorageUtils = {
  setItem: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  
  getItem: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
};

// Analysis history storage utility
export const saveAnalysisToStorage = async (analysisId: string, analysisData: any) => {
  try {
    // Try to save to Firebase first
    const { doc, setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, 'analyses', analysisId), {
      ...analysisData,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Firebase save failed, falling back to localStorage:', error);
    // Fallback to localStorage
    const existingAnalyses = localStorageUtils.getItem('errorAnalyses') || [];
    const updatedAnalyses = [
      ...existingAnalyses,
      {
        id: analysisId,
        ...analysisData,
        createdAt: new Date().toISOString(),
      }
    ];
    localStorageUtils.setItem('errorAnalyses', updatedAnalyses);
  }
};

export const getAnalysisFromStorage = async (analysisId: string) => {
  try {
    // Try to get from Firebase first
    const { doc, getDoc } = await import('firebase/firestore');
    const docSnap = await getDoc(doc(db, 'analyses', analysisId));
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (error) {
    console.error('Firebase read failed, falling back to localStorage:', error);
  }
  
  // Fallback to localStorage
  const analyses = localStorageUtils.getItem('errorAnalyses') || [];
  return analyses.find((analysis: any) => analysis.id === analysisId);
};