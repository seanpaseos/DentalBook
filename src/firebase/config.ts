import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBdWkcAunpYX6sDvbuhqKUmRoi6GwcLyMo",
  authDomain: "dental-c6edd.firebaseapp.com",
  projectId: "dental-c6edd",
  storageBucket: "dental-c6edd.firebasestorage.app",
  messagingSenderId: "666720045450",
  appId: "1:666720045450:web:368a5eedc6285153f6e073",
  measurementId: "G-7PE10994N6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;