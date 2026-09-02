// ============================================================
// BANCO DE DADOS COM LOCALFORAGE E RECUPERAÇÃO DE FALHAS
// ============================================================

const Database = {
  config: {
    // ATENÇÃO: COLOQUE AQUI A NOVA URL GERADA APÓS O ÚLTIMO DEPLOY DO GOOGLE APPS SCRIPT!
    webAppUrl: 'https://script.google.com/macros/s/AKfycbzAv4_IaHzlZV7mZ4XYpeUZbFBoOFoyssTW1QNSx6NqcZY12pRSZgc9Y6_4cyY9M8HX/exec'
  },

  currentUser: null,

  cache: { 
    settings: null, 
    categories: [], 
    materias: [], 
    users: {}, 
    history: [], 
    loaded: false 
  },

  getDefaultSettings() {
    return { 
      primaryColor: '#d32f2f', 
      secondaryColor: '#1e2a3a', 
      backgroundColor: '#f4f6f9', 
      textColor: '#1e2a3a', 
      fontFamily: 'Segoe UI, Roboto, sans-serif', 
      headingFont: 'Segoe UI, Roboto, sans-serif', 
      logoText: 'NewsPortal', 
      logoSubtext: '· 2026', 
      logoIcon: 'fa-newspaper', 
      containerMaxWidth: '1280px', 
      borderRadius: '1.5rem' 
    };
  },

  async loadLocal() {
    try {
      if (typeof localforage === 'undefined') return false;
      const saved = await localforage.getItem('newsportal_db');
      if (saved && saved.categories && saved.materias) {
        this.cache = saved;
        this.cache.loaded = true;
        console.log('⚡ Cache LocalForage carregado (Abertura 0 segundos)!');
        return true;
      }
    } catch (e) { 
      console.warn('Erro ao ler cache:', e); 
    }
    return false;
  },

  async load() {
    try {
      console.log('📡 Buscando dados do Sheets...');
      if (!this.config.webAppUrl) throw new Error("URL do Web App ausente");

      const response = await fetch(`${this.config.webAppUrl}?action=getAllData`);
      if (!response.ok) throw new Error(`Erro no servidor: ${response.status}`);
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Formato de dados inválido");
      
      this.cache.settings = data.settings || this.getDefaultSettings();
      this.cache.categories = data.categories || [];
      this.cache.materias = data.materias || [];
      this.cache.users = data.users || {};
      this.cache.history = data.history || [];
      this.cache.loaded = true;
      
      await this.saveToLocal();
      console.log('✅ Dados sincronizados com o Google Sheets!');
      return true;
    } catch (error) {
      console.warn('⚠️ Erro de rede/API:', error.message);
      if (!this.cache.loaded) {
        await this.loadFromFallback();
      }
      return false;
    }
  },

  async loadFromFallback() {
    this.cache.settings = this.getDefaultSettings();
    this.cache.categories = [];
    this.cache.materias = [];
    this.cache.users = {};
    this.cache.history = [];
    this.cache.loaded = true;
    await this.saveToLocal();
    return true;
  },

  async saveToLocal() {
    try { 
      if (typeof localforage !== 'undefined') {
        await localforage.setItem('newsportal_db', this.cache); 
      }
    } catch (e) { 
      console.warn('Erro ao salvar no LocalForage:', e); 
    }
  },

  async syncWithBackend(action, payload = {}) {
    if (!this.config.webAppUrl) return;
    try {
      fetch(this.config.webAppUrl, {
        method: 'POST', 
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...payload })
      }).then(res => res.json()).then(data => {
        if(!data.success) console.error(`❌ Planilha recusou (${action}):`, data.error);
      }).catch(err => console.error(`❌ Falha de rede (${action}):`, err));
    } catch (e) { 
      console.error('Erro na sync:', e); 
    }
  },

  async login(username, password) {
    try {
      const res = await fetch(this.config.webAppUrl, {
        method: 'POST', 
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'login', username, password })
      });
      const data = await res.json();
      return data;
    } catch(e) { 
      return { success: false, error: 'Erro de conexão com a planilha' }; 
    }
  },

  async uploadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        try {
          const res = await fetch(this.config.webAppUrl, {
            method: 'POST', 
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'uploadImage', base64: base64, filename: file.name, mimeType: file.type })
          });
          resolve(await res.json());
        } catch(e) { 
          reject(e); 
        }
      };
      reader.readAsDataURL(file);
    });
  },

  async subscribe(email) {
    this.syncWithBackend('addSubscriber', { email });
  },

  save() { 
    this.saveToLocal(); 
  },

  getSettings() {
    const def = this.getDefaultSettings();
    const cur = (this.cache && this.cache.settings) ? this.cache.settings : {};
    return { ...def, ...cur };
  },

  getCategories() { 
    return (this.cache && this.cache.categories ? this.cache.categories : []).filter(c => c.active).sort((a, b) => a.order - b.order); 
  },
  
  getAllCategories() { 
    return (this.cache && this.cache.categories ? this.cache.categories : []).sort((a, b) => a.order - b.order); 
  },
  
  getCategoryBySlug(slug) { 
    return this.getCategories().find(c => c.slug === slug); 
  },
  
  getMaterias(categorySlug = null) {
    let result = (this.cache && this.cache.materias ? this.cache.materias : []).filter(m => m.status === 'published');
    if (categorySlug) {
      const cat = this.getCategoryBySlug(categorySlug);
      if (cat) result = result.filter(m => m.category === cat.name);
    }
    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  },
  
  getAllMaterias() { 
    return (this.cache && this.cache.materias ? this.cache.materias : []).sort((a, b) => new Date(b.date) - new Date(a.date)); 
  },
  
  getMateriaById(id) { 
    return (this.cache && this.cache.materias ? this.cache.materias : []).find(m => m.id === id); 
  },
  
  getUsers() { 
    return this.cache && this.cache.users ? this.cache.users : {}; 
  },
  
  getHistory() { 
    return this.cache && this.cache.history ? this.cache.history : []; 
  },

  addCategory(name, icon = 'fa-tag') {
    const slug = this.generateSlug(name);
    const maxOrder = Math.max(...this.cache.categories.map(c => c.order), 0);
    const newCategory = { id: this.cache.categories.length + 1, name: name.trim(), slug, icon: icon.trim() || 'fa-tag', active: true, order: maxOrder + 1 };
    
    this.cache.categories.push(newCategory);
    this.saveToLocal();
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
      
      this.saveToLocal();
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
      this.saveToLocal(); 
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
    this.saveToLocal(); 
    this.addHistory('Reordenou categorias');
  },

  addMateria(data) {
    const maxId = this.cache.materias.reduce((max, m) => Math.max(max, m.id || 0), 0);
    const newMateria = { 
      id: maxId + 1, 
      title: data.title.trim(), 
      category: data.category, 
      slug: this.generateSlug(data.title), 
      content: data.content || '', 
      image: data.image || '', 
      status: data.status || 'draft', 
      author: data.author || this.currentUser || 'admin', 
      date: new Date().toISOString(), 
      views: 0, 
      tags: data.tags || ''
    };
    
    this.cache.materias.push(newMateria);
    this.saveToLocal();
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
      if (data.tags !== undefined) mat.tags = data.tags;
      
      this.saveToLocal();
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
      
      this.saveToLocal();
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
      this.saveToLocal(); 
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
    
    this.saveToLocal();
    this.syncWithBackend('updateSettings', { settings: this.getSettings() }); 
    this.addHistory('Atualizou configurações do site');
    return this.getSettings();
  },

  addHistory(message, user) {
    const activeUser = user || this.currentUser || 'admin';
    if (!this.cache.history) this.cache.history = [];
    
    this.cache.history.unshift({ message, user: activeUser, time: new Date().toISOString() });
    if (this.cache.history.length > 100) {
      this.cache.history = this.cache.history.slice(0, 100);
    }
    
    this.syncWithBackend('addHistory', { message, user: activeUser }); 
  },

  generateSlug(text) { 
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-'); 
  },

  async init() {
    try {
      const hasLocalData = await this.loadLocal();
      const isAdmin = window.location.pathname.includes('admin');
      const urlParams = new URLSearchParams(window.location.search);
      const noticiaId = parseInt(urlParams.get('id'));
      
      let isMissingArticle = false;
      if (noticiaId && hasLocalData) {
         isMissingArticle = !this.cache.materias.find(m => m.id === noticiaId);
      }

      // Baixa os dados do Sheets caso: não tenha dados locais, seja o painel admin, ou seja um link de matéria não salva.
      if (!hasLocalData || isAdmin || isMissingArticle) {
        const success = await this.load();
        
        // Se a internet/api falhou e não tinha dado local, força o fallback
        if (!success && !hasLocalData) {
          await this.loadFromFallback();
        }
      } else {
        // Se já tem dados locais, atualiza no background de forma invisível
        this.load().catch(e => console.warn('Erro sync background', e));
      }
    } catch (e) {
      console.error('Erro crítico no Init do Banco de dados:', e);
      await this.loadFromFallback();
    }
    return this;
  }
};

window.Database = Database;
