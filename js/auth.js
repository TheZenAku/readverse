// js/auth.js
// Adaptado para usar API PHP local (substitui o Firebase)

const authModule = {
  currentUser: null,
  authListeners: [],

  // Chama a API PHP
  async apiCall(endpoint, action, method = 'POST', data = null) {
    const url = `api/${endpoint}.php?action=${action}`;
    const options = { method };
    if (data) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(data);
    }
    const res = await fetch(url, options);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erro desconhecido na API');
    return json;
  },

  async init() {
    try {
      const res = await this.apiCall('auth', 'session', 'GET');
      this.currentUser = res.user;
    } catch (e) {
      console.error('Erro de sessão:', e);
      this.currentUser = null;
    }
    this._notifyListeners();
  },

  async register(email, password, displayName) {
    const res = await this.apiCall('auth', 'register', 'POST', { name: displayName, email, password });
    this.currentUser = res.user;
    this._notifyListeners();
    return res.user;
  },

  async login(email, password) {
    const res = await this.apiCall('auth', 'login', 'POST', { email, password });
    this.currentUser = res.user;
    this._notifyListeners();
    return res.user;
  },

  async logout() {
    await this.apiCall('auth', 'logout', 'POST');
    this.currentUser = null;
    this._notifyListeners();
    window.location.href = 'index.html';
  },

  onAuthChange(callback) {
    this.authListeners.push(callback);
    // Chama imediatamente com o estado atual (útil porque a sessão já é carregada no init)
    if (this.currentUser !== undefined) {
        callback(this.currentUser, this.currentUser);
    }
  },

  _notifyListeners() {
    this.authListeners.forEach(cb => cb(this.currentUser, this.currentUser));
  },

  canEdit() {
    return this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.editorPermission === true);
  },

  getRoleBadge(role) {
    if (role === 'admin') return { label: 'Admin', cls: 'badge-gold' };
    if (role === 'editor') return { label: 'Editor', cls: 'badge-purple' };
    return { label: 'Membro', cls: 'badge-gray' };
  },

  renderAvatar(user, sizeClass = 'avatar-sm') {
    if (user?.photoURL) {
      return `<img src="${user.photoURL}" class="${sizeClass}" style="border-radius:50%;object-fit:cover">`;
    }
    const letter = (user?.displayName || 'U').charAt(0).toUpperCase();
    return `<div class="${sizeClass}" style="border-radius:50%;background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;color:var(--text-muted);border:1px solid var(--border-light)">${letter}</div>`;
  },

  updateTopbarUser(user) {
    const el = document.getElementById('topbar-user');
    if (!el) return;
    if (user) {
      const isAdmin = user.role === 'admin';
      el.innerHTML = `
        <a href="${isAdmin ? 'admin.html' : 'profile.html?uid=' + user.uid}" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:var(--text-primary)">
          ${this.renderAvatar(user, 'avatar-sm')}
          <span style="font-size:0.875rem;font-weight:600">${user.displayName.split(' ')[0]}</span>
        </a>
      `;
    } else {
      el.innerHTML = `
        <a href="login.html" class="btn btn-ghost btn-sm">Entrar</a>
        <a href="login.html?tab=register" class="btn btn-primary btn-sm">Criar conta</a>
      `;
    }
  },

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'avatar');

    const res = await fetch('api/upload.php', { method: 'POST', body: formData });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erro no upload');
    
    // Atualiza BD via endpoint db.php
    await this.apiCall('db', 'updateProfile', 'POST', { uid: this.currentUser.uid, photoURL: json.url });
    return json.url;
  }
};

// Auto-init ao carregar o script
authModule.init();

window.authModule = authModule;
