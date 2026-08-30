// ============================================================
// BANCO DE DADOS REAL - PERSISTENTE (LocalStorage)
// ============================================================

const Database = {
  // ============================================================
  // CONFIGURAÇÕES PADRÃO (NUNCA SOBRESCREVEM AS DO USUÁRIO)
  // ============================================================
  defaults: {
    settings: {
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
    },
    categories: [
      { id: 1, name: 'Política', slug: 'politica', icon: 'fa-gavel', active: true, order: 1 },
      { id: 2, name: 'Economia', slug: 'economia', icon: 'fa-chart-line', active: true, order: 2 },
      { id: 3, name: 'Tecnologia', slug: 'tecnologia', icon: 'fa-microchip', active: true, order: 3 },
      { id: 4, name: 'Saúde', slug: 'saude', icon: 'fa-heartbeat', active: true, order: 4 },
      { id: 5, name: 'Cultura', slug: 'cultura', icon: 'fa-film', active: true, order: 5 },
      { id: 6, name: 'Esportes', slug: 'esportes', icon: 'fa-futbol', active: true, order: 6 },
      { id: 7, name: 'Internacional', slug: 'internacional', icon: 'fa-globe-americas', active: true, order: 7 }
    ],
    materias: [
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
        content: '<p>O Ibovespa fechou o dia em alta de 1,2% impulsionado por dados positivos dos EUA. Investidores aguardam decisões do Fed.</p>',
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
        content: '<p>Pesquisadores da Unicamp desenvolveram um novo chip que reduz o consumo de energia em até 40%. Tecnologia utiliza materiais sustentáveis.</p>',
        image: '',
        status: 'published',
        author: 'admin',
        date: new Date(Date.now() - 7200000).toISOString(),
        views: 2100
      }
    ],
    users: {
      'admin': { password: 'admin123', level: 'admin', name: 'Administrador' },
      'editor': { password: 'editor123', level: 'editor', name: 'Editor' }
    },
    history: [],
    nextId: 4
  },

  // ============================================================
  // DADOS REAIS (CARREGADOS DO LOCALSTORAGE)
  // ============================================================
  data: null,

  // ============================================================
  // INICIALIZAÇÃO - CARREGA DADOS REAIS
  // ============================================================
  init() {
    // Tentar carregar do localStorage
    const saved = localStorage.getItem('newsportal_db');
    
    if (saved) {
      try {
        this.data = JSON.parse(saved);
        console.log('📦 Dados REAIS carregados do localStorage');
        console.log(`📂 ${this.getCategories().length} categorias`);
        console.log(`📄 ${this.getAllMaterias().length} matérias`);
        console.log(`👤 ${Object.keys(this.getUsers()).length} usuários`);
        return this;
      } catch (e) {
        console.warn('Erro ao carregar dados, usando padrão:', e);
      }
    }

    // Primeira execução - criar dados padrão REAIS
    console.log('📦 Criando dados REAIS pela primeira vez');
    this.data = JSON.parse(JSON.stringify(this.defaults));
    this.save();
    return this;
  },

  // ============================================================
  // PERSISTÊNCIA REAL
  // ============================================================
  save() {
    try {
      localStorage.setItem('newsportal_db', JSON.stringify(this.data));
      console.log('💾 Dados REAIS salvos no localStorage');
      return true;
    } catch (e) {
      console.error('❌ Erro ao salvar dados:', e);
      return false;
    }
  },

  // ============================================================
  // GETTERS - ACESSO AOS DADOS REAIS
  // ============================================================
  getSettings() {
    return this.data.settings;
  },

  getCategories() {
    return this.data.categories.filter(c => c.active).sort((a, b) => a.order - b.order);
  },

  getAllCategories() {
    return this.data.categories.sort((a, b) => a.order - b.order);
  },

  getCategoryBySlug(slug) {
    return this.data.categories.find(c => c.slug === slug && c.active);
  },

  getMaterias(categorySlug = null) {
    let result = this.data.materias.filter(m => m.status === 'published');
    if (categorySlug) {
      const cat = this.getCategoryBySlug(categorySlug);
      if (cat) {
        result = result.filter(m => m.category === cat.name);
      }
    }
    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getAllMaterias() {
    return this.data.materias.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getUsers() {
    return this.data.users;
  },

  getHistory() {
    return this.data.history || [];
  },

  // ============================================================
  // MÉTODOS REAIS - CATEGORIAS
  // ============================================================
  addCategory(name, icon = 'fa-tag') {
    const slug = this.generateSlug(name);
    const maxOrder = Math.max(...this.data.categories.map(c => c.order), 0);
    const newCategory = {
      id: this.data.nextId++,
      name: name.trim(),
      slug,
      icon: icon.trim() || 'fa-tag',
      active: true,
      order: maxOrder + 1
    };
    this.data.categories.push(newCategory);
    this.addHistory(`Criou categoria: ${name}`);
    this.save();
    return newCategory;
  },

  editCategory(id, data) {
    const cat = this.data.categories.find(c => c.id === id);
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
    const cat = this.data.categories.find(c => c.id === id);
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
      const cat = this.data.categories.find(c => c.id === id);
      if (cat) cat.order = index + 1;
    });
    this.addHistory('Reordenou categorias');
    this.save();
  },

  // ============================================================
  // MÉTODOS REAIS - MATÉRIAS
  // ============================================================
  addMateria(data) {
    const newMateria = {
      id: this.data.nextId++,
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
    this.data.materias.push(newMateria);
    this.addHistory(`Publicou matéria: ${data.title}`);
    this.save();
    return newMateria;
  },

  editMateria(id, data) {
    const mat = this.data.materias.find(m => m.id === id);
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
    const idx = this.data.materias.findIndex(m => m.id === id);
    if (idx > -1) {
      const title = this.data.materias[idx].title;
      this.data.materias.splice(idx, 1);
      this.addHistory(`Excluiu matéria: ${title}`);
      this.save();
      return true;
    }
    return false;
  },

  // ============================================================
  // MÉTODOS REAIS - USUÁRIOS
  // ============================================================
  addUser(username, password, level, name) {
    if (this.data.users[username]) {
      return false;
    }
    this.data.users[username] = {
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
    delete this.data.users[username];
    this.addHistory(`Removeu usuário: ${username}`);
    this.save();
    return true;
  },

  // ============================================================
  // MÉTODOS REAIS - CONFIGURAÇÕES
  // ============================================================
  updateSettings(newSettings) {
    // Atualizar apenas as configurações que foram enviadas
    Object.keys(newSettings).forEach(key => {
      if (this.data.settings[key] !== undefined) {
        this.data.settings[key] = newSettings[key];
      }
    });
    this.addHistory('Atualizou configurações do site');
    this.save();
    return this.data.settings;
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
    if (!this.data.history) this.data.history = [];
    this.data.history.unshift({
      message,
      user: user || 'admin',
      time: new Date().toISOString()
    });
    // Manter apenas os últimos 100 registros
    if (this.data.history.length > 100) {
      this.data.history = this.data.history.slice(0, 100);
    }
  },

  // ============================================================
  // RESETAR PARA DADOS REAIS PADRÃO
  // ============================================================
  resetToDefaults() {
    this.data = JSON.parse(JSON.stringify(this.defaults));
    this.save();
    console.log('🔄 Dados resetados para o padrão');
    return this.data;
  },

  // ============================================================
  // EXPORTAR DADOS (para backup)
  // ============================================================
  exportData() {
    return JSON.stringify(this.data, null, 2);
  },

  // ============================================================
  // IMPORTAR DADOS (para restore)
  // ============================================================
  importData(jsonData) {
    try {
      const parsed = JSON.parse(jsonData);
      this.data = parsed;
      this.save();
      console.log('📥 Dados importados com sucesso!');
      return true;
    } catch (e) {
      console.error('❌ Erro ao importar dados:', e);
      return false;
    }
  }
};

// ============================================================
// INICIALIZAR E EXPORTAR
// ============================================================
const DB = Database.init();

// Disponibilizar globalmente
window.DB = DB;

console.log('📰 Database REAL inicializado com sucesso!');
console.log(`📂 ${DB.getCategories().length} categorias ativas`);
console.log(`📄 ${DB.getMaterias().length} matérias publicadas`);
console.log(`👤 ${Object.keys(DB.getUsers()).length} usuários`);
console.log('💾 Todos os dados são REAIS e persistentes no LocalStorage');
