// =====================================================
//  READVERSE WIKI — Database Module
//  CRUD operations for Firestore
// =====================================================

import { db, storage } from './firebase-config.js';

// ─── ARTICLES ─────────────────────────────────────────

/**
 * Cria ou atualiza um artigo
 */
async function saveArticle(data, id = null) {
  const user = authModule.currentUser;
  if (!user) throw new Error('Não autenticado');

  const payload = {
    ...data,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: user.uid,
    updatedByName: authModule.currentUserData?.displayName || user.displayName,
  };

  if (id) {
    await db.collection('articles').doc(id).update(payload);
    return id;
  } else {
    payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    payload.createdBy = user.uid;
    payload.createdByName = authModule.currentUserData?.displayName || user.displayName;
    payload.views = 0;
    const ref = await db.collection('articles').add(payload);
    return ref.id;
  }
}

async function getArticle(id) {
  const snap = await db.collection('articles').doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

async function getArticles({ category = null, type = null, limit = 20, after = null } = {}) {
  let q = db.collection('articles').orderBy('createdAt', 'desc');
  if (category) q = q.where('category', '==', category);
  if (type)     q = q.where('type', '==', type);
  if (after)    q = q.startAfter(after);
  q = q.limit(limit);
  const snap = await q.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function deleteArticle(id) {
  await db.collection('articles').doc(id).delete();
}

async function incrementViews(id) {
  await db.collection('articles').doc(id).update({
    views: firebase.firestore.FieldValue.increment(1)
  });
}

// ─── CHARACTERS ───────────────────────────────────────

async function saveCharacter(data, id = null) {
  const user = authModule.currentUser;
  if (!user) throw new Error('Não autenticado');

  const payload = {
    ...data,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: user.uid,
    updatedByName: authModule.currentUserData?.displayName || user.displayName,
  };

  if (id) {
    await db.collection('characters').doc(id).update(payload);
    return id;
  } else {
    payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    payload.createdBy = user.uid;
    payload.createdByName = authModule.currentUserData?.displayName || user.displayName;
    const ref = await db.collection('characters').add(payload);
    return ref.id;
  }
}

async function getCharacter(id) {
  const snap = await db.collection('characters').doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

async function getCharacters({ limit = 30, after = null } = {}) {
  let q = db.collection('characters').orderBy('name', 'asc');
  if (after) q = q.startAfter(after);
  q = q.limit(limit);
  const snap = await q.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function deleteCharacter(id) {
  await db.collection('characters').doc(id).delete();
}

// ─── CATEGORIES ───────────────────────────────────────

async function getCategories() {
  const snap = await db.collection('categories').orderBy('name').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function saveCategory(name) {
  const existing = await db.collection('categories').where('slug', '==', slugify(name)).get();
  if (!existing.empty) return existing.docs[0].id;
  const ref = await db.collection('categories').add({ name, slug: slugify(name) });
  return ref.id;
}

// ─── USERS / MEMBERS ──────────────────────────────────

async function getMembers({ limit = 50, after = null } = {}) {
  let q = db.collection('users').orderBy('joinedAt', 'asc');
  if (after) q = q.startAfter(after);
  q = q.limit(limit);
  const snap = await q.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getMember(uid) {
  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

async function updateMemberPermission(uid, editorPermission) {
  await db.collection('users').doc(uid).update({ editorPermission });
}

async function updateMemberRole(uid, role) {
  await db.collection('users').doc(uid).update({ role });
}

async function updateProfile(uid, data) {
  await db.collection('users').doc(uid).update(data);
}

// ─── IMAGE UPLOAD ──────────────────────────────────────

/**
 * Faz upload de uma imagem e retorna a URL pública
 */
async function uploadImage(file, path) {
  const ref = storage.ref(path);
  await ref.put(file);
  return await ref.getDownloadURL();
}

async function uploadCharacterImage(file, characterId) {
  const ext = file.name.split('.').pop();
  return uploadImage(file, `characters/${characterId || 'new'}_${Date.now()}.${ext}`);
}

async function uploadArticleImage(file, articleId) {
  const ext = file.name.split('.').pop();
  return uploadImage(file, `articles/${articleId || 'new'}_${Date.now()}.${ext}`);
}

// ─── SEARCH ───────────────────────────────────────────

/**
 * Busca simples por prefixo no título
 * (para busca avançada, use Algolia ou Firebase Extension)
 */
async function search(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();

  const [articles, characters] = await Promise.all([
    db.collection('articles')
      .orderBy('title')
      .startAt(q)
      .endAt(q + '\uf8ff')
      .limit(5)
      .get(),
    db.collection('characters')
      .orderBy('name')
      .startAt(q.charAt(0).toUpperCase() + q.slice(1))
      .endAt(q.charAt(0).toUpperCase() + q.slice(1) + '\uf8ff')
      .limit(5)
      .get(),
  ]);

  return [
    ...articles.docs.map(d => ({ id: d.id, type: 'article', title: d.data().title, url: `article.html?id=${d.id}` })),
    ...characters.docs.map(d => ({ id: d.id, type: 'character', title: d.data().name, url: `character.html?id=${d.id}` })),
  ];
}

// ─── UTILS ────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-');
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff/60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h atrás`;
  if (diff < 2592000) return `${Math.floor(diff/86400)}d atrás`;
  return formatDate(timestamp);
}

// Export
window.dbModule = {
  saveArticle, getArticle, getArticles, deleteArticle, incrementViews,
  saveCharacter, getCharacter, getCharacters, deleteCharacter,
  getCategories, saveCategory,
  getMembers, getMember, updateMemberPermission, updateMemberRole, updateProfile,
  uploadImage, uploadCharacterImage, uploadArticleImage,
  search, slugify, formatDate, timeAgo,
};
