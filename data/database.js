// ============================================================
// BANCO DE DADOS COM GOOGLE SHEETS
// ============================================================

const Database = {
  // ============================================================
  // CONFIGURAÇÕES
  // ============================================================
  config: {
    // COLOQUE A URL DO SEU WEB APP AQUI
    webAppUrl: 'https://script.google.com/macros/s/AKfycbzdzU573JpmwMARvW4tOZl1yTAT18EaRnmRCUD7CVW0t_TsvJc9nNPzqv6Q1AR1gwOcaA/exec',
    spreadsheetId: '1SGCgIuSa6Yi0ICJFX6hoWflwX1B2JVfWb6BrYdECq0w'
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
  // CARREGAR DADOS DO GOOGLE SHEETS
  // ============================================================
  async load() {
    try {
      console.log('📡 Carregando dados do Google Sheets...');
      
      const response = await fetch(`${this.config.webAppUrl}?action=getAllData`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success === false) {
        throw new Error(data.error || 'Erro ao carregar dados');
      }
      
      this.cache.settings = data.settings || this.getDefaultSettings();
      this.cache.categories = data.categories || this.getDefaultCategories();
      this.cache.materias = data.materias || this.getDefaultMaterias();
      this.cache.users = data.users || this.getDefaultUsers();
      this.cache.history = data.history || [];
      this.cache.loaded = true;
      
      console.log('✅ Dados carregados do Google Sheets!');
      console.log(`📂 ${this.cache.categories.length} categorias`);
      console.log(`📄 ${this.cache.materias.length} matérias`);
      console.log(`👤 ${Object.keys(this.cache.users).length} usuários`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados do Google Sheets:', error);
      return this.loadFromLocalStorage();
    }
  },

  // ============================================================
  // LOCALSTORAGE (FALLBACK)
  // ============================================================
  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('newsportal_db');
      if (saved) {
        const data = JSON.parse(saved);
        this.cache.settings = data.settings || this.getDefaultSettings();
        this.cache.categories = data.categories || this.getDefaultCategories();
        this.cache.materias = data.materias || this.getDefaultMaterias();
        this.cache.users = data.users || this.getDefaultUsers();
        this.cache.history = data.history || [];
        this.cache.loaded = true;
        console.log('📦 Dados carregados do localStorage (fallback)');
        return true;
      }
    } catch (e) {
      console.warn('Erro ao carregar localStorage:', e);
    }
    return false;
  },

  saveToLocalStorage() {
    try {
      localStorage.setItem('newsportal_db', JSON.stringify({
        settings: this.cache.settings,
        categories: this.cache.categories,
        materias: this.cache.materias,
        users: this.cache.users,
        history: this.cache.history
      }));
      console.log('💾 Dados salvos no localStorage');
    } catch (e) {
      console.warn('Erro ao salvar localStorage:', e);
    }
  },

  // ============================================================
  // SALVAR NO GOOGLE SHEETS
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
  async addCategory(name, icon = 'fa-tag') {
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
    await this.save();
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
      this.addHistory(`Editou
