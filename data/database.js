// ============================================================
// BANCO DE DADOS COM GOOGLE SHEETS E CACHE INSTANTÂNEO
// ============================================================

const Database = {
  config: {
    // COLOQUE A URL DO SEU WEB APP AQUI
    webAppUrl: 'https://script.google.com/macros/s/AKfycbxjRL-yW22O7W0bIUvQFLTCJ1gbfmM6AAJaY9kDJWfe7dHYxiSR-sbOeF1I9Z95BK34/exec',
    spreadsheetId: '1Oqa-fRio2jjfM0SgeGsnvNuc5yFJXozNWxw0nYHyUHc'
  },

  currentUser: null, // Guarda quem está logado no painel

  cache: {
    settings: null,
    categories: [],
    materias: [],
    users: {},
    history: [],
    loaded: false
  },

  // ============================================================
  // DADOS PADRÃO (FALLBACK)
  // ============================================================
  getDefaultSettings() {
    return {
      primaryColor: '#d32f2f',
      secondaryColor: '#1e2a3a',
      backgroundColor: '#f4f6f9',
      textColor: '#1e2a3a',
      fontFamily: 'Segoe UI, Roboto, system-ui, sans-serif',
      headingFont: 'Segoe UI, Roboto, system-ui, sans-serif',
      logoText: 'NewsPortal',
      logoSubtext: '· 2026',
      logoIcon: 'fa-newspaper',
      containerMaxWidth: '1280px',
      borderRadius: '1.5rem'
    };
  },

  getDefaultCategories() {
    return [
      { id: 1, name: 'Política', slug: 'politica', icon: 'fa-gavel', active: true, order: 1 },
      { id: 2, name: 'Economia', slug: 'economia', icon: 'fa-chart-line', active: true, order: 2 },
      { id: 3, name: 'Tecnologia', slug: 'tecnologia', icon: 'fa-microchip', active: true, order: 3 },
      { id: 4, name: 'Saúde', slug: 'saude', icon: 'fa-heartbeat', active: true, order: 4 },
      { id: 5, name: 'Cultura', slug: 'cultura', icon: 'fa-film', active: true, order: 5 },
      { id: 6, name: 'Esportes', slug: 'esportes', icon: 'fa-futbol', active: true, order: 6 },
      { id: 7, name: 'Internacional', slug: 'internacional', icon: 'fa-globe-americas', active: true, order: 7 }
    ];
  },

  getDefaultMaterias() {
    return [
      {
        id: 1,
        title: 'Governo anuncia novo pacote de incentivo à tecnologia verde',
        category: 'Política',
        slug: 'governo-anuncia-novo-pacote',
        content: '<p>Medidas incluem crédito para startups e renovação da frota de veículos elétricos.</p>',
        image: '',
        status: 'published',
        author: 'admin',
        date: new Date().toISOString(),
        views: 1250
      }
    ];
  },

  getDefaultUsers() {
    return {
      'admin': { password: 'admin123', level: 'admin', name: 'Administrador' },
      'editor': { password: 'editor123', level: 'editor', name: 'Editor' }
    };
  },

  // ============================================================
  // CARREGAR CACHE LOCAL (INSTANTÂNEO)
  // ============================================================
  loadLocal() {
    try {
      const saved = localStorage.getItem('newsportal_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.categories && parsed.materias) {
          this.cache = parsed;
          this.cache.loaded = true;
          console.log('⚡ Dados carregados da memória local (Abertura 0 segundos)!');
          return true;
        }
      }
    } catch (e) {
      console.warn('Erro ao ler cache local:', e);
    }
    return false;
  },

  // ============================================================
  // CARREGAR DADOS DO GOOGLE SHEETS
  // ============================================================
  async load() {
    try {
      console.log('📡 Buscando dados recentes da Planilha...');
      const response = await fetch(`${this.config.webAppUrl}?action=getAllData`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (data.success === false) throw new Error(data.error || 'Erro ao carregar dados');
      
      this.cache.settings = data.settings;
      this.cache.categories = data.categories || [];
      this.cache.materias = data.materias || [];
      this.cache.users = data.users || {};
      this.cache.history = data.history || [];
      this.cache.loaded = true;
      
      this.saveToLocalStorage();
      console.log('✅ Dados da Planilha sincronizados com sucesso!');
      return true;
      
    } catch (error) {
      console.warn('⚠️ Erro de rede (usando dados locais):', error.message);
      if (!this.cache.loaded) return this.loadFromFallback();
      return false;
    }
  },

  loadFromFallback() {
    this.cache.settings = this.getDefaultSettings();
    this.cache.categories = this.getDefaultCategories();
    this.cache.materias = this.getDefaultMaterias();
    this.cache.users = this.getDefaultUsers();
    this.cache.history = [];
    this.cache.loaded = true;
    this.saveToLocalStorage();
    return true;
  },

  saveToLocalStorage() {
    try {
      localStorage.setItem('newsportal_db', JSON.stringify(this.cache));
    } catch (e) {
      console.warn('Erro no localStorage:', e);
    }
  },

  // ============================================================
  // SINCRONIZADOR BACKGROUND (ENVIAR PARA A PLANILHA)
  // ============================================================
  async syncWithBackend(action, payload = {}) {
    if (!this.config.webAppUrl) return;
    try {
      console.log(`⬆️ Enviando para a Planilha: [${action}]`);
      const body = { action, ...payload };
      
      fetch(this.config.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      })
      .then(res => res.json())
      .then(data => {
        if(data.success) {
          console.log(`✅ Salvo na Planilha! (${action})`);
        } else {
          console.error(`❌ Planilha recusou (${action}):`, data.error);
        }
      })
      .catch(err => console.error(`❌ Falha de rede ao salvar (${action}):`, err));
    } catch (e) {
      console.error('Erro na sincronização:', e);
    }
  },

  save() { this.saveToLocalStorage(); },

  // ============================================================
  // GETTERS (Leitura)
  // ============================================================
  getSettings() {
    const def = this.getDefaultSettings();
    const cur = this.cache.settings || {};
    return {
      primaryColor: cur.primaryColor || def.primaryColor,
      secondaryColor: cur.secondaryColor || def.secondaryColor,
      backgroundColor: cur.backgroundColor || def.backgroundColor,
      textColor: cur.textColor || def.textColor,
      fontFamily: cur.fontFamily || def.fontFamily,
      headingFont: cur.headingFont || def.headingFont,
      logoText: cur.logoText || def.logoText,
      logoSubtext: cur.logoSubtext !== undefined ? cur.logoSubtext : def.logoSubtext,
      logoIcon: cur.logoIcon || def.logoIcon,
      containerMaxWidth: cur.containerMaxWidth || def.containerMaxWidth,
      borderRadius: cur.borderRadius || def.borderRadius
    };
  },

  getCategories() { return (this.cache.categories || []).filter(c => c.active).sort((a, b) => a.order - b.order); },
  getAllCategories() { return (this.cache.categories || []).sort((a, b) => a.order - b.order); },
  getCategoryBySlug(slug) { return (this.cache.categories || []).find(c => c.slug === slug && c.active); },
  getMaterias(categorySlug = null) {
    let result = (this.cache.materias || []).filter(m => m.status === 'published');
    if (categorySlug) {
      const cat = this.getCategoryBySlug(categorySlug);
      if (cat) result = result.filter(m => m.category === cat.name);
    }
    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  },
  getAllMaterias() { return (this.cache.materias || []).sort((a, b) => new Date(b.date) - new Date(a.date)); },
  getMateriaById(id) { return (this.cache.materias || []).find(m => m.id === id); },
  getUsers() { return this.cache.users || this.getDefaultUsers(); },
  getHistory() { return this.cache.history || []; },

  // ============================================================
  // SETTERS (Escrita / Modificação)
  // ============================================================
  addCategory(name, icon = 'fa-tag') {
    const slug = this.generateSlug(name);
    const maxOrder = Math.max(...this.cache.categories.map(c => c.order), 0);
    const newCategory = { id: this.cache.categories.length + 1, name: name.trim(), slug, icon: icon.trim() || 'fa-tag', active: true, order: maxOrder + 1 };
    this.cache.categories.push(newCategory);
    this.saveToLocalStorage();
    
    this.syncWithBackend('addCategory', { name, icon }); 
    this.addHistory(`Criou categoria: ${name}`);
    return newCategory;
  },

  editCategory(id, data) {
    const cat = this.cache.categories.find(c => c.id === id);
    if (cat) {
      if (data.name) { cat.name = data.name.trim(); cat.slug = this.generateSlug(data.name); }
      if (data.icon) cat.icon = data.icon.trim();
      if (data.active !== undefined) cat.active = data.active;
      this.saveToLocalStorage();
      
      this.syncWithBackend('editCategory', { id, data }); 
      this.addHistory(`Editou categoria: ${cat.name}`);
      return true;
    }
    return false;
  },

  deleteCategory(id) {
    const cat = this.cache.categories.find(c => c.id === id);
    if (cat) { 
      cat.active = false; 
      this.saveToLocalStorage(); 
      this.syncWithBackend('editCategory', { id, data: { active: false } }); 
      this.addHistory(`Desativou categoria: ${cat.name}`);
      return true; 
    }
    return false;
  },

  reorderCategories(orderedIds) {
    orderedIds.forEach((id, index) => {
      const cat = this.cache.categories.find(c => c.id === id);
      if (cat) cat.order = index + 1;
    });
    this.saveToLocalStorage();
    this.addHistory('Reordenou categorias');
  },

  addMateria(data) {
    const maxId = this.cache.materias.reduce((max, m) => Math.max(max, m.id || 0), 0);
    const newMateria = { 
      id: maxId + 1, title: data.title.trim(), category: data.category, 
      slug: this.generateSlug(data.title), content: data.content || '', 
      image: data.image || '', status: data.status || 'draft', 
      author: data.author || this.currentUser || 'admin', date: new Date().toISOString(), views: 0 
    };
    this.cache.materias.push(newMateria);
    this.saveToLocalStorage();
    
    this.syncWithBackend('addMateria', { data: newMateria }); 
    this.addHistory(`Criou matéria: ${data.title}`);
    return newMateria;
  },

  editMateria(id, data) {
    const mat = this.cache.materias.find(m => m.id === id);
    if (mat) {
      if (data.title) { mat.title = data.title.trim(); mat.slug = this.generateSlug(data.title); }
      if (data.category) mat.category = data.category;
      if (data.content) mat.content = data.content;
      if (data.image !== undefined) mat.image = data.image;
      if (data.status) mat.status = data.status;
      this.saveToLocalStorage();
      
      this.syncWithBackend('editMateria', { id, data }); 
      this.addHistory(`Editou matéria: ${mat.title}`);
      return true;
    }
    return false;
  },

  deleteMateria(id) {
    const idx = this.cache.materias.findIndex(m => m.id === id);
    if (idx > -1) {
      const title = this.cache.materias[idx].title;
      this.cache.materias.splice(idx, 1);
      this.saveToLocalStorage();
      
      this.syncWithBackend('deleteMateria', { id }); 
      this.addHistory(`Excluiu matéria: ${title}`);
      return true;
    }
    return false;
  },

  incrementViews(id) {
    const mat = this.cache.materias.find(m => m.id === id);
    if (mat) {
      mat.views = (mat.views || 0) + 1;
      this.saveToLocalStorage();
      this.syncWithBackend('incrementViews', { id }); 
    }
  },

  updateSettings(newSettings) {
    if (!this.cache.settings) this.cache.settings = {};
    Object.keys(newSettings).forEach(key => {
      if (newSettings[key] !== undefined && newSettings[key] !== "") {
        this.cache.settings[key] = newSettings[key];
      }
    });
    this.saveToLocalStorage();
    
    this.syncWithBackend('updateSettings', { settings: this.getSettings() }); 
    this.addHistory('Atualizou configurações do site');
    return this.getSettings();
  },

  addUser(username, password, level, name) {
    if (this.cache.users[username]) return false;
    this.cache.users[username] = { password: password, level: level || 'editor', name: name || username.charAt(0).toUpperCase() + username.slice(1) };
    this.saveToLocalStorage();
    
    this.syncWithBackend('addUser', { username, password, level, name }); 
    this.addHistory(`Adicionou usuário: ${username}`);
    return true;
  },

  deleteUser(username) {
    if (username === 'admin') return false;
    delete this.cache.users[username];
    this.saveToLocalStorage();
    
    this.syncWithBackend('deleteUser', { username }); 
    this.addHistory(`Removeu usuário: ${username}`);
    return true;
  },

  addHistory(message, user) {
    const activeUser = user || this.currentUser || 'admin';
    if (!this.cache.history) this.cache.history = [];
    this.cache.history.unshift({ message, user: activeUser, time: new Date().toISOString() });
    if (this.cache.history.length > 100) this.cache.history = this.cache.history.slice(0, 100);
    
    this.syncWithBackend('addHistory', { message, user: activeUser }); 
  },

  generateSlug(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
  },

  async init() {
    const hasLocalData = this.loadLocal();
    const isAdmin = window.location.pathname.includes('admin');
    const urlParams = new URLSearchParams(window.location.search);
    const noticiaId = parseInt(urlParams.get('id'));
    
    let isMissingArticle = false;
    if (noticiaId && hasLocalData) {
      isMissingArticle = !this.cache.materias.find(m => m.id === noticiaId);
    }

    if (!hasLocalData || isAdmin || isMissingArticle) {
      await this.load();
    } else {
      this.load().catch(e => console.warn('Erro sync background', e));
    }
    
    return this;
  }
};

window.Database = Database;
