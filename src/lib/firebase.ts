// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: "AIzaSyDjH7JeKJyp0EpttR7gMLtGiwQMnPmXzMo",
	authDomain: "nft-card-game-next.firebaseapp.com",
	projectId: "nft-card-game-next",
	storageBucket: "nft-card-game-next.firebasestorage.app",
	messagingSenderId: "466631109606",
	appId: "1:466631109606:web:11cd83f88c62e80abb8427",
	measurementId: "G-BPTP3CGXSP",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
