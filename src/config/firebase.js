import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAp7HMQtYmwd9CFIevP3oHmN2z_rMonbNY",
  authDomain: "mussas.firebaseapp.com",
  projectId: "mussas",
  storageBucket: "mussas.firebasestorage.app",
  messagingSenderId: "213929277247",
  appId: "1:213929277247:web:86a2d1d8fc7c436aa3c58a",
  measurementId: "G-2KTC484LJ3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
