// js/db.js
// Adaptado para usar API PHP local (substitui o Firebase)

const dbModule = {
  
  async apiCall(action, method = 'GET', data = null) {
    let url = `api/db.php?action=${action}`;
    if (method === 'GET' && data) {
        const params = new URLSearchParams(data);
        url += '&' + params.toString();
    }
    const options = { method };
    if (method !== 'GET' && data) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(data);
    }
    const res = await fetch(url, options);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erro na API BD');
    return json;
  },

  slugify(text) {
    return text.toString().toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  },

  formatDate(dateString) {
    if (!dateString) return 'Desconhecido';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  timeAgo(dateString) {
    if (!dateString) return 'Recentemente';
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Agora mesmo';
    if (seconds < 3600) return `${Math.floor(seconds/60)}m atrás`;
    if (seconds < 86400) return `${Math.floor(seconds/3600)}h atrás`;
    if (seconds < 2592000) return `${Math.floor(seconds/86400)}d atrás`;
    return this.formatDate(dateString);
  },

  // ---- Articles ----
  async saveArticle(data, id = null) {
    const payload = { ...data, id };
    const res = await this.apiCall('saveArticle', 'POST', payload);
    return res.id;
  },
  async getArticles(filters = {}) {
    return await this.apiCall('getArticles', 'GET', filters);
  },
  async getArticle(id) {
    return await this.apiCall('getArticle', 'GET', { id });
  },
  async deleteArticle(id) {
    await this.apiCall('deleteArticle', 'GET', { id });
  },
  async incrementViews(id) {
    try { await this.apiCall('incrementViews', 'GET', { id }); } catch(e) {}
  },

  // ---- Characters ----
  async saveCharacter(data, id = null) {
    const payload = { ...data, id };
    const res = await this.apiCall('saveCharacter', 'POST', payload);
    return res.id;
  },
  async getCharacters(filters = {}) {
    return await this.apiCall('getCharacters', 'GET', filters);
  },
  async getCharacter(id) {
    return await this.apiCall('getCharacter', 'GET', { id });
  },
  async deleteCharacter(id) {
    await this.apiCall('deleteCharacter', 'GET', { id });
  },

  // ---- Categories ----
  async getCategories() {
    return await this.apiCall('getCategories', 'GET');
  },
  async saveCategory(name) {
    const slug = this.slugify(name);
    return await this.apiCall('saveCategory', 'POST', { name, slug });
  },

  // ---- Members / Profiles ----
  async getMembers(filters = {}) {
    return await this.apiCall('getMembers', 'GET', filters);
  },
  async getMember(uid) {
    return await this.apiCall('getMember', 'GET', { uid });
  },
  async updateMemberPermission(uid, editorPermission) {
    await this.apiCall('updateMemberPermission', 'POST', { uid, editorPermission });
  },
  async updateProfile(uid, data) {
    await this.apiCall('updateProfile', 'POST', { uid, ...data });
  },

  // ---- File Uploads ----
  async _uploadImageGeneric(file, type) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const res = await fetch('api/upload.php', { method: 'POST', body: formData });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erro no upload');
    return json.url;
  },
  async uploadArticleImage(file, articleId) {
    return this._uploadImageGeneric(file, 'article');
  },
  async uploadCharacterImage(file, charId) {
    return this._uploadImageGeneric(file, 'char');
  },
  async uploadImage(file, pathFolder) {
    return this._uploadImageGeneric(file, 'gallery');
  },

  // ---- Search ----
  async search(query) {
    return await this.apiCall('search', 'GET', { q: query });
  }
};

window.dbModule = dbModule;
