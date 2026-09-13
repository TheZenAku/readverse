// =====================================================
//  READVERSE WIKI — Auth Module
//  Gerencia login, registro, sessão e permissões
// =====================================================

import { auth, db, storage, ADMIN_EMAIL } from './firebase-config.js';

// Estado global do usuário
let currentUser = null;
let currentUserData = null;

// ─── Listeners de Auth ───────────────────────────────

/**
 * Observa mudanças de estado de autenticação.
 * Chame isso em cada página para reagir ao estado de login.
 */
function onAuthChange(callback) {
  return auth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      currentUser = firebaseUser;
      // Carrega dados extras do Firestore
      try {
        const snap = await db.collection('users').doc(firebaseUser.uid).get();
        if (snap.exists) {
          currentUserData = { id: snap.id, ...snap.data() };
        } else {
          // Cria documento do usuário se não existir
          currentUserData = await createUserDocument(firebaseUser);
        }
      } catch (e) {
        console.error('Erro ao carregar dados do usuário:', e);
        currentUserData = null;
      }
    } else {
      currentUser = null;
      currentUserData = null;
    }
    callback(currentUser, currentUserData);
  });
}

// ─── Registro ────────────────────────────────────────

async function register(email, password, displayName) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  await cred.user.updateProfile({ displayName });
  await createUserDocument(cred.user, displayName);
  return cred.user;
}

async function createUserDocument(firebaseUser, displayName) {
  const isAdmin = firebaseUser.email === ADMIN_EMAIL;
  const data = {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: displayName || firebaseUser.displayName || 'Usuário',
    photoURL: firebaseUser.photoURL || null,
    role: isAdmin ? 'admin' : 'member',
    joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
    bio: '',
    editorPermission: isAdmin,
  };
  await db.collection('users').doc(firebaseUser.uid).set(data);
  currentUserData = { id: firebaseUser.uid, ...data };
  return currentUserData;
}

// ─── Login ────────────────────────────────────────────

async function login(email, password) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  return cred.user;
}

// ─── Logout ───────────────────────────────────────────

async function logout() {
  await auth.signOut();
  window.location.href = '/index.html';
}

// ─── Permissões ───────────────────────────────────────

function isLoggedIn() {
  return currentUser !== null;
}

function isAdmin() {
  return currentUserData?.role === 'admin';
}

function canEdit() {
  return currentUserData?.role === 'admin' || currentUserData?.editorPermission === true;
}

function getRole() {
  if (!currentUserData) return 'visitor';
  return currentUserData.role || 'member';
}

function getRoleBadge(role) {
  const badges = {
    admin:  { label: 'Admin',   cls: 'badge-gold' },
    editor: { label: 'Editor',  cls: 'badge-purple' },
    member: { label: 'Membro',  cls: 'badge-gray' },
  };
  return badges[role] || badges.member;
}

// ─── Upload de avatar ─────────────────────────────────

async function uploadAvatar(file) {
  if (!currentUser) throw new Error('Não autenticado');
  const ref = storage.ref(`avatars/${currentUser.uid}`);
  await ref.put(file);
  const url = await ref.getDownloadURL();
  await currentUser.updateProfile({ photoURL: url });
  await db.collection('users').doc(currentUser.uid).update({ photoURL: url });
  if (currentUserData) currentUserData.photoURL = url;
  return url;
}

// ─── Utilitários ──────────────────────────────────────

/**
 * Gera iniciais do nome para o avatar placeholder
 */
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

/**
 * Gera cor determinística a partir do uid (para avatars sem foto)
 */
function getAvatarColor(uid) {
  const colors = [
    ['#7c3aed', '#4f46e5'],
    ['#db2777', '#9d174d'],
    ['#0891b2', '#0e7490'],
    ['#059669', '#047857'],
    ['#d97706', '#b45309'],
    ['#dc2626', '#b91c1c'],
  ];
  const idx = (uid?.charCodeAt(0) || 0) % colors.length;
  return colors[idx];
}

/**
 * Renderiza um avatar (com foto ou iniciais)
 */
function renderAvatar(userData, sizeClass = 'avatar-md') {
  if (!userData) {
    return `<div class="avatar-placeholder ${sizeClass}" style="background:linear-gradient(135deg,#7c3aed,#4f46e5)">?</div>`;
  }
  if (userData.photoURL) {
    return `<img src="${userData.photoURL}" class="avatar ${sizeClass}" alt="${userData.displayName}" onerror="this.outerHTML='${renderAvatarPlaceholder(userData, sizeClass)}'">`;
  }
  return renderAvatarPlaceholder(userData, sizeClass);
}

function renderAvatarPlaceholder(userData, sizeClass) {
  const [c1, c2] = getAvatarColor(userData.uid || userData.id);
  const initials = getInitials(userData.displayName);
  return `<div class="avatar-placeholder ${sizeClass}" style="background:linear-gradient(135deg,${c1},${c2})">${initials}</div>`;
}

/**
 * Protege página que requer login
 */
function requireLogin(redirectUrl = 'login.html') {
  return new Promise((resolve) => {
    const unsub = auth.onAuthStateChanged(user => {
      unsub();
      if (!user) {
        window.location.href = redirectUrl;
      } else {
        resolve(user);
      }
    });
  });
}

/**
 * Protege página que requer permissão de admin
 */
function requireAdmin() {
  return new Promise((resolve, reject) => {
    const unsub = auth.onAuthStateChanged(async user => {
      unsub();
      if (!user) { window.location.href = 'login.html'; return; }
      const snap = await db.collection('users').doc(user.uid).get();
      const data = snap.data();
      if (data?.role !== 'admin') {
        window.location.href = 'index.html';
        reject('Acesso negado');
      } else {
        resolve(user);
      }
    });
  });
}

// ─── UI Helpers ───────────────────────────────────────

/**
 * Atualiza a topbar com o estado do usuário
 */
function updateTopbarUser(userData) {
  const container = document.getElementById('topbar-user');
  if (!container) return;

  if (userData) {
    container.innerHTML = `
      <a href="profile.html?uid=${userData.uid || userData.id}" class="btn btn-ghost btn-sm" style="gap:8px">
        ${renderAvatar(userData, 'avatar-sm')}
        <span style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${userData.displayName}</span>
      </a>
      ${canEdit() ? `<a href="editor.html" class="btn btn-primary btn-sm"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Novo</a>` : ''}
      ${isAdmin() ? `<a href="admin.html" class="btn btn-gold btn-sm">Admin</a>` : ''}
      <button onclick="authModule.logout()" class="btn btn-ghost btn-sm">Sair</button>
    `;
  } else {
    container.innerHTML = `
      <a href="login.html" class="btn btn-ghost btn-sm">Entrar</a>
      <a href="login.html?tab=register" class="btn btn-primary btn-sm">Criar conta</a>
    `;
  }
}

// Export
window.authModule = {
  onAuthChange, register, login, logout,
  isLoggedIn, isAdmin, canEdit, getRole, getRoleBadge,
  uploadAvatar, getInitials, getAvatarColor,
  renderAvatar, renderAvatarPlaceholder,
  requireLogin, requireAdmin,
  updateTopbarUser,
  get currentUser() { return currentUser; },
  get currentUserData() { return currentUserData; },
};
