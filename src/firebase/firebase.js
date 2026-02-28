import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyAv8mfvtzW0-5VxpKsvi8sHtd5w1-9jYZg",
    authDomain: "smart-mds.firebaseapp.com",
    databaseURL: "https://smart-mds-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "smart-mds",
    storageBucket: "smart-mds.firebasestorage.app",
    messagingSenderId: "965346284021",
    appId: "1:965346284021:web:edb6128a5c5b02ad73d0bc",
    measurementId: "G-H25ECF7LH2"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
export default app;
