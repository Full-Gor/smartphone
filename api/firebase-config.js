// firebase-config.js

// Configuration Firebase avec les valeurs explicites (pour l'approche avec balises script)
const firebaseConfig = {
    apiKey: "AIzaSyBfGHTKgn7I0Hle0fgiH2mad9ec4-fYVD4",
    authDomain: "smart-45c1e.firebaseapp.com",
    projectId: "smart-45c1e",
    storageBucket: "smart-45c1e.firebasestorage.app",
    messagingSenderId: "743406614132",
    appId: "1:743406614132:web:4c44c5e51bb95a51804321",
    measurementId: "G-42TBRJ0BYV"
  };
  
  // Initialiser Firebase (avec l'API compat)
  firebase.initializeApp(firebaseConfig);
  
  // Exporter les objets Firebase pour un accès global
  const db = firebase.firestore();
  const auth = firebase.auth();
  
  // Pour rendre ces objets disponibles globalement
  window.db = db;
  window.auth = auth;