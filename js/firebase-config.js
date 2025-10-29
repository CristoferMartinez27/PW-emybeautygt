
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyDBzyPTO14_fm_3EBxEVNR8ob5Qq9xVsCE",
    authDomain: "emybeauty-gt.firebaseapp.com",
    projectId: "emybeauty-gt",
    storageBucket: "emybeauty-gt.firebasestorage.app",
    messagingSenderId: "806050800897",
    appId: "1:806050800897:web:59873bdfba2936242be700",
    measurementId: "G-6HGTXW3W4K"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };