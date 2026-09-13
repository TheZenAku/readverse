// =====================================================
//  READVERSE WIKI — Firebase Configuration
//  Preencha com as suas credenciais do Firebase
//  Siga o guia SETUP.md para criar o projeto
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyC6I6LqeKov1LOej2PRl9K67SxsLp4zNq0",
  authDomain: "readverse-c9f4e.firebaseapp.com",
  projectId: "readverse-c9f4e",
  storageBucket: "readverse-c9f4e.firebasestorage.app",
  messagingSenderId: "473733162398",
  appId: "1:473733162398:web:7a670dae87f36f4e06228f",
  measurementId: "G-YT3LX1B46X"
};

// Admin email — defina o email que você usará como administrador
const ADMIN_EMAIL = "admin@readverse.com"; // Troque pelo seu email

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Configurações de cache offline do Firestore
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence: múltiplas abas abertas');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence não suportado neste browser');
  }
});

export { auth, db, storage, ADMIN_EMAIL };
