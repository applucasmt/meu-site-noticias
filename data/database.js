// ============================================================
// BANCO DE DADOS COM GOOGLE SHEETS
// ============================================================

const Database = {
  // ============================================================
  // CONFIGURAÇÕES
  // ============================================================
  config: {
    // COLOQUE A URL DO SEU WEB APP AQUI
    webAppUrl: 'https://script.google.com/macros/s/AKfycbyK_ZkP_lreozQ8CEvogmjk8gqCIgs00PoSSpidoJevAwJc3pgwiq6I-jod1_FVTBV0GQ/exec',
    spreadsheetId: '1JDcxZ8HOnLu-7WMpr6Y7edERSt5NuLJBS0b9FExtA7U'
   },

  // ============================================================
  // DADOS EM CACHE
  // ============================================================
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
        content: '<p>Medidas incluem crédito para startups e renovação da frota de veículos elétricos. Expectativa é gerar 50 mil empregos até 2027.</p>',
        image: '',
        status: 'published',
        author: 'admin',
        date: new Date().toISOString(),
        views: 1250
      },
      {
        id: 2,
        title: 'Bolsa fecha em alta com otimismo no exterior',
        category: 'Economia',
        slug: 'bolsa-fecha-em-alta',
        content: '<p>O Ibovespa fechou o dia em alta de 1,2% impulsionado por dados positivos dos EUA.</p>',
        image: '',
        status: 'published',
        author: 'admin',
        date: new Date(Date.now() - 3600000).toISOString(),
        views: 980
      },
      {
        id: 3,
        title: 'Novo chip brasileiro promete eficiência energética',
        category: 'Tecnologia',
        slug: 'novo-chip-brasileiro',
        content: '<p>Pesquisadores da Unicamp desenvolveram um novo chip que reduz o consumo de energia em até 40%.</p>',
        image: '',
        status: 'published',
        author: 'admin',
        date: new Date(Date.now() - 7200000).toISOString(),
        views: 2100
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
  // CARREGAR DADOS DO GOOGLE SHEETS (COM FALLBACK)
  // ============================================================
  async load() {
    try {
      console.log('📡 Carregando dados do Google Sheets...');
      console.log('🔗 URL:', this.config.webAppUrl);
      
      const response = await fetch(`${this.config.webAppUrl}?action=getAllData`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success === false) {
        throw new Error(data.error || 'Erro ao carregar dados');
      }
      
      if (!data.settings || !data.categories) {
        throw new Error('Dados incompletos da planilha');
      }
      
      this.cache.settings = data.settings;
      this.cache.categories = data.categories;
      this.cache.materias = data.materias || [];
      this.cache.users = data.users || {};
      this.cache.history = data.history || [];
      this.cache.loaded = true;
      
      console.log('✅ Dados carregados do Google Sheets!');
      console.log(`📂 ${this.cache.categories.length} categorias`);
      console.log(`📄 ${this.cache.materias.length} matérias`);
      
      return true;
      
    } catch (error) {
      console.warn('⚠️ Erro ao carregar do Google Sheets, usando fallback:', error.message);
      return this.loadFromFallback();
    }
  },

  // ============================================================
  // FALLBACK - DADOS LOCAIS
  // ============================================================
  loadFromFallback() {
    console.log('📦 Usando dados padrão (fallback)');
    
    this.cache.settings = this.getDefaultSettings();
    this.cache.categories = this.getDefaultCategories();
    this.cache.materias = this.getDefaultMaterias();
    this.cache.users = this.getDefaultUsers();
    this.cache.history = [];
    this.cache.loaded = true;
    
    // Salvar no localStorage para persistência
    this.saveToLocalStorage();
    
    console.log(`📂 ${this.cache.categories.length} categorias (fallback)`);
    console.log(`📄 ${this.cache.materias.length} matérias (fallback)`);
    
    return true;
  },

  // ============================================================
  // SALVAR NO LOCALSTORAGE (FALLBACK)
  // ============================================================
  saveToLocalStorage() {
    try {
      localStorage.setItem('newsportal_db', JSON.stringify({
        settings: this.cache.settings,
        categories: this.cache.categories,
        materias: this.cache.materias,
        users: this.cache.users,
        history: this.cache.history
      }));
      console.log('💾 Dados salvos no localStorage (fallback)');
    } catch (e) {
      console.warn('Erro ao salvar localStorage:', e);
    }
  },

  // ============================================================
  // SALVAR (TENTA GOOGLE SHEETS, MAS USA LOCALSTORAGE)
  // ============================================================
  async save() {
    try {
      this.saveToLocalStorage();
      
      const response = await fetch(this.config.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateSettings',
          settings: this.cache.settings
        })
      });
      
      if (response.ok) {
        console.log('✅ Dados salvos no Google Sheets!');
        return true;
      }
      return true;
      
    } catch (error) {
      console.warn('⚠️ Erro ao salvar no Google Sheets:', error);
      return true;
    }
  },

  // ============================================================
  // GETTERS
  // ============================================================
  getSettings() {
    return this.cache.settings || this.getDefaultSettings();
  },

  getCategories() {
    return (this.cache.categories || []).filter(c => c.active).sort((a, b) => a.order - b.order);
  },

  getAllCategories() {
    return (this.cache.categories || []).sort((a, b) => a.order - b.order);
  },

  getCategoryBySlug(slug) {
    return (this.cache.categories || []).find(c => c.slug === slug && c.active);
  },

  getMaterias(categorySlug = null) {
    let result = (this.cache.materias || []).filter(m => m.status === 'published');
    if (categorySlug) {
      const cat = this.getCategoryBySlug(categorySlug);
      if (cat) {
        result = result.filter(m => m.category === cat.name);
      }
    }
    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getAllMaterias() {
    return (this.cache.materias || []).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getMateriaById(id) {
    return (this.cache.materias || []).find(m => m.id === id);
  },

  getUsers() {
    return this.cache.users || this.getDefaultUsers();
  },

  getHistory() {
    return this.cache.history || [];
  },

  // ============================================================
  // MÉTODOS - CATEGORIAS
  // ============================================================
  addCategory(name, icon = 'fa-tag') {
    const slug = this.generateSlug(name);
    const maxOrder = Math.max(...this.cache.categories.map(c => c.order), 0);
    const newCategory = {
      id: this.cache.categories.length + 1,
      name: name.trim(),
      slug,
      icon: icon.trim() || 'fa-tag',
      active: true,
      order: maxOrder + 1
    };
    this.cache.categories.push(newCategory);
    this.addHistory(`Criou categoria: ${name}`);
    this.save();
    return newCategory;
  },

  editCategory(id, data) {
    const cat = this.cache.categories.find(c => c.id === id);
    if (cat) {
      if (data.name) {
        cat.name = data.name.trim();
        cat.slug = this.generateSlug(data.name);
      }
      if (data.icon) cat.icon = data.icon.trim();
      if (data.active !== undefined) cat.active = data.active;
      this.addHistory(`Editou categoria: ${cat.name}`);
      this.save();
      return true;
    }
    return false;
  },

  deleteCategory(id) {
    const cat = this.cache.categories.find(c => c.id === id);
    if (cat) {
      cat.active = false;
      this.addHistory(`Desativou categoria: ${cat.name}`);
      this.save();
      return true;
    }
    return false;
  },

  reorderCategories(orderedIds) {
    orderedIds.forEach((id, index) => {
      const cat = this.cache.categories.find(c => c.id === id);
      if (cat) cat.order = index + 1;
    });
    this.addHistory('Reordenou categorias');
    this.save();
  },

  // ============================================================
  // MÉTODOS - MATÉRIAS
  // ============================================================
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
      author: data.author || 'admin',
      date: new Date().toISOString(),
      views: 0
    };
    this.cache.materias.push(newMateria);
    this.addHistory(`Criou matéria: ${data.title}`);
    this.save();
    return newMateria;
  },

  editMateria(id, data) {
    const mat = this.cache.materias.find(m => m.id === id);
    if (mat) {
      if (data.title) {
        mat.title = data.title.trim();
        mat.slug = this.generateSlug(data.title);
      }
      if (data.category) mat.category = data.category;
      if (data.content) mat.content = data.content;
      if (data.image !== undefined) mat.image = data.image;
      if (data.status) mat.status = data.status;
      this.addHistory(`Editou matéria: ${mat.title}`);
      this.save();
      return true;
    }
    return false;
  },

  deleteMateria(id) {
    const idx = this.cache.materias.findIndex(m => m.id === id);
    if (idx > -1) {
      const title = this.cache.materias[idx].title;
      this.cache.materias.splice(idx, 1);
      this.addHistory(`Excluiu matéria: ${title}`);
      this.save();
      return true;
    }
    return false;
  },

  // ============================================================
  // MÉTODOS - USUÁRIOS
  // ============================================================
  addUser(username, password, level, name) {
    if (this.cache.users[username]) {
      return false;
    }
    this.cache.users[username] = {
      password: password,
      level: level || 'editor',
      name: name || username.charAt(0).toUpperCase() + username.slice(1)
    };
    this.addHistory(`Adicionou usuário: ${username} (${level})`);
    this.save();
    return true;
  },

  deleteUser(username) {
    if (username === 'admin') return false;
    delete this.cache.users[username];
    this.addHistory(`Removeu usuário: ${username}`);
    this.save();
    return true;
  },

  // ============================================================
  // MÉTODOS - CONFIGURAÇÕES
  // ============================================================
  updateSettings(newSettings) {
    Object.keys(newSettings).forEach(key => {
      if (this.cache.settings[key] !== undefined) {
        this.cache.settings[key] = newSettings[key];
      }
    });
    this.addHistory('Atualizou configurações do site');
    this.save();
    return this.cache.settings;
  },

  // ============================================================
  // UTILITÁRIOS
  // ============================================================
  generateSlug(text) {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  },

  addHistory(message, user = 'admin') {
    if (!this.cache.history) this.cache.history = [];
    this.cache.history.unshift({
      message,
      user: user || 'admin',
      time: new Date().toISOString()
    });
    if (this.cache.history.length > 100) {
      this.cache.history = this.cache.history.slice(0, 100);
    }
  },

  // ============================================================
  // INICIALIZAÇÃO
  // ============================================================
  async init() {
    await this.load();
    return this;
  }
};

// ============================================================
// INICIALIZAR
// ============================================================
let DB = null;

(async function initDatabase() {
  DB = await Database.init();
  window.DB = DB;
  console.log('📰 Database inicializado!');
})();

window.Database = Database;
