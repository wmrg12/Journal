// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIRREBASE_API_KEY,
  authDomain: "journalapp-aafb5.firebaseapp.com",
  projectId: "journalapp-aafb5",
  storageBucket: "journalapp-aafb5.firebasestorage.app",
  messagingSenderId: "1060143274395",
  appId: "1:1060143274395:web:c2a7a085878038f50da93e",
  measurementId: "G-61JLKHXJDS"
};

// Iicializar Firebase
const app = initializeApp(firebaseConfig);
export const db=getFirestore(app);
//const analytics = getAnalytics(app);