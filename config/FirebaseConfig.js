// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getAuth,  GoogleAuthProvider} from "firebase/auth";
import { getFirestore } from "firebase/firestore";



// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyALU3nVvuES-ewe3CW--nBQYqN6kEKRlJ0",
  authDomain: "journal-fad89.firebaseapp.com",
  projectId: "journal-fad89",
  storageBucket: "journal-fad89.firebasestorage.app",
  messagingSenderId: "1044986194774",
  appId: "1:1044986194774:web:aa405eb4469768aae644f7",
  measurementId: "G-X0Z8H43XK3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();