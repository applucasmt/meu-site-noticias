// ============================================================
// BANCO DE DADOS - SIMULAÇÃO (LocalStorage persistente)
// ============================================================

const Database = {
  // ============================================================
  // CONFIGURAÇÕES DO SITE (Personalização)
  // ============================================================
  settings: {
    // Cores
    primaryColor: '#d32f2f',
    secondaryColor: '#1e2a3a',
    backgroundColor: '#f4f6f9',
    textColor: '#1e2a3a',
    headerBg: '#ffffff',
    footerBg: '#1e2a3a',
    footerText: '#ffffff',
    
    // Fontes
    fontFamily: 'Segoe UI, Roboto, system-ui, sans-serif',
    headingFont: 'Segoe UI, Roboto, system-ui, sans-serif',
    
    // Logo
    logoText: 'NewsPortal',
    logoSubtext: '· 2026',
    logoIcon: 'fa-newspaper',
    
    // Layout
    containerMaxWidth: '1280px',
    borderRadius: '1.5rem',
    boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
    
    // Outros
    favicon: '',
    metaDescription: 'Seu portal de notícias confiável e atualizado',
    metaKeywords: 'notícias, jornal, portal, informação',
    
    // Categorias padrão (usadas se não houver no banco)
    defaultCategories: [
      { id: 1, name: 'Política', slug: 'politica', icon: 'fa-gavel', active: true, order: 1 },
      { id: 2, name: 'Economia', slug: 'economia', icon: 'fa-chart-line', active: true, order: 2 },
      { id: 3, name: 'Tecnologia', slug: 'tecnologia', icon: 'fa-microchip', active: true, order: 3 },
      { id: 4, name: 'Saúde', slug: 'saude', icon: 'fa-heartbeat', active: true, order: 4 },
      { id: 5, name: 'Cultura', slug: 'cultura', icon: 'fa-film', active: true, order: 5 },
      { id: 6, name: 'Esportes', slug: 'esportes', icon: 'fa-futbol', active: true, order: 6 },
      { id: 7, name: 'Internacional', slug: 'internacional', icon: 'fa-globe-americas', active: true, order: 7 }
    ]
  },

  // ============================================================
  // CATEGORIAS
  // ============================================================
  categories: [],

  // ============================================================
  // MATÉRIAS
  // ============================================================
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

  // ============================================================
  // USUÁRIOS
  // ============================================================
  users: {
    'admin': { password: 'admin123', level: 'admin', name: 'Administrador' },
    'editor': { password: 'editor123', level: 'editor', name: 'Editor' },
    'journalist': { password: 'journalist123', level: 'journalist', name: 'Jornalista' }
  },

  // ============================================================
  // HISTÓRICO
  // ============================================================
  history: [],

  // ============================================================
  // CONTADOR DE IDs
  // ============================================================
  nextId: 4,

  // ============================================================
  // MÉTODOS PARA CONFIGURAÇÕES
  // ============================================================
  getSettings() {
    return this.settings;
  },

  updateSettings(newSettings) {
    Object.assign(this.settings, newSettings);
    this.addHistory('Atualizou configurações do site');
    this.save();
    return this.settings;
  },

  // ============================================================
  // MÉTODOS PARA CATEGORIAS
  // ============================================================
  getCategories() {
    if (this.categories.length === 0) {
      // Carregar categorias padrão
      this.categories = JSON.parse(JSON.stringify(this.settings.defaultCategories));
      this.save();
    }
    return this.categories.filter(c => c.active).sort((a, b) => a.order - b.order);
  },

  getCategoryBySlug(slug) {
    return this.categories.find(c => c.slug === slug && c.active);
  },

  addCategory(name, icon = 'fa-tag') {
    const slug = this.generateSlug(name);
    const maxOrder = Math.max(...this.categories.map(c => c.order), 0);
    const newCategory = {
      id: this.nextId++,
      name,
      slug,
      icon,
      active: true,
      order: maxOrder + 1
    };
    this.categories.push(newCategory);
    this.addHistory(`Criou categoria: ${name}`);
    this.save();
    return newCategory;
  },

  editCategory(id, data) {
    const cat = this.categories.find(c => c.id === id);
    if (cat) {
      if (data.name) {
        cat.name = data.name;
        cat.slug = this.generateSlug(data.name);
      }
      if (data.icon) cat.icon = data.icon;
      if (data.active !== undefined) cat.active = data.active;
      this.addHistory(`Editou categoria: ${cat.name}`);
      this.save();
      return true;
    }
    return false;
  },

  deleteCategory(id) {
    const cat = this.categories.find(c => c.id === id);
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
      const cat = this.categories.find(c => c.id === id);
      if (cat) cat.order = index + 1;
    });
    this.addHistory('Reordenou categorias');
    this.save();
  },

  // ============================================================
  // MÉTODOS PARA MATÉRIAS
  // ============================================================
  getMaterias(categorySlug = null) {
    let result = this.materias.filter(m => m.status === 'published');
    if (categorySlug) {
      const cat = this.getCategoryBySlug(categorySlug);
      if (cat) {
        result = result.filter(m => m.category === cat.name);
      }
    }
    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getAllMaterias() {
    return this.materias.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  addMateria(data) {
    const newMateria = {
      id: this.nextId++,
      title: data.title,
      category: data.category,
      slug: this.generateSlug(data.title),
      content: data.content || '',
      image: data.image || '',
      status: data.status || 'draft',
      author: data.author || 'admin',
      date: new Date().toISOString(),
      views: 0
    };
    this.materias.push(newMateria);
    this.addHistory(`Publicou matéria: ${data.title}`);
    this.save();
    return newMateria;
  },

  editMateria(id, data) {
    const mat = this.materias.find(m => m.id === id);
    if (mat) {
      if (data.title) {
        mat.title = data.title;
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
    const idx = this.materias.findIndex(m => m.id === id);
    if (idx > -1) {
      const title = this.materias[idx].title;
      this.materias.splice(idx, 1);
      this.addHistory(`Excluiu matéria: ${title}`);
      this.save();
      return true;
    }
    return false;
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

  addHistory(message) {
    this.history.unshift({
      message,
      user: 'admin',
      time: new Date().toISOString()
    });
  },

  // ============================================================
  // PERSISTÊNCIA (LocalStorage)
  // ============================================================
  save() {
    try {
      localStorage.setItem('newsportal_db', JSON.stringify({
        settings: this.settings,
        categories: this.categories,
        materias: this.materias,
        users: this.users,
        history: this.history,
        nextId: this.nextId
      }));
    } catch (e) {
      console.warn('Não foi possível salvar no localStorage:', e);
    }
  },

  load() {
    try {
      const data = localStorage.getItem('newsportal_db');
      if (data) {
        const parsed = JSON.parse(data);
        this.settings = parsed.settings || this.settings;
        this.categories = parsed.categories || this.settings.defaultCategories;
        this.materias = parsed.materias || this.materias;
        this.users = parsed.users || this.users;
        this.history = parsed.history || this.history;
        this.nextId = parsed.nextId || this.nextId;
      } else {
        // Primeira execução - criar categorias padrão
        this.categories = JSON.parse(JSON.stringify(this.settings.defaultCategories));
        this.save();
      }
    } catch (e) {
      console.warn('Não foi possível carregar do localStorage:', e);
      this.categories = JSON.parse(JSON.stringify(this.settings.defaultCategories));
    }
  }
};

// Inicializar
Database.load();

// Exportar para uso global
window.DB = Database;