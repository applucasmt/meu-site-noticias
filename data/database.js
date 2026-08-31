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
  // CARREGAR DADOS DO GOOGLE SHEETS
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
      console.log(`👤 ${Object.keys(this.cache.users).length} usuários`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados do Google Sheets:', error);
      console.log('⚠️ Verifique se o Web App está publicado corretamente');
      
      // Mostrar erro na tela para debug
      document.body.innerHTML = `
        <div style="text-align:center; padding:4rem 2rem; font-family: Arial, sans-serif;">
          <h1 style="color:#e74c3c;">⚠️ Erro ao carregar dados</h1>
          <p style="color:#6b7a8f; font-size:1.1rem;">Não foi possível conectar ao banco de dados.</p>
          <p style="color:#95a5a6; font-size:0.9rem; margin-top:0.5rem;">
            Erro: ${error.message}
          </p>
          <p style="color:#95a5a6; font-size:0.8rem; margin-top:0.5rem;">
            Verifique se o Web App do Google Sheets está publicado e a URL está correta.
          </p>
          <div style="margin-top:1.5rem; background:#f8f9fa; padding:1rem; border-radius:8px; text-align:left; max-width:600px; margin-left:auto; margin-right:auto;">
            <p style="font-size:0.8rem; color:#6b7a8f;">
              <strong>URL configurada:</strong><br>
              ${this.config.webAppUrl}
            </p>
            <p style="font-size:0.8rem; color:#6b7a8f; margin-top:0.5rem;">
              <strong>Como corrigir:</strong><br>
              1. Acesse script.google.com<br>
              2. Publique o Web App novamente<br>
              3. Copie a nova URL<br>
              4. Atualize no database.js
            </p>
          </div>
          <div style="margin-top:1.5rem;">
            <button onclick="location.reload()" style="background:#3498db; color:white; border:none; padding:0.6rem 1.5rem; border-radius:6px; font-size:1rem; cursor:pointer;">
              🔄 Tentar novamente
            </button>
          </div>
        </div>
      `;
      
      return false;
    }
  },

  // ============================================================
  // SALVAR NO GOOGLE SHEETS
  // ============================================================
  async save() {
    try {
      console.log('💾 Salvando dados no Google Sheets...');
      
      const response = await fetch(this.config.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateSettings',
          settings: this.cache.settings
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Dados salvos no Google Sheets!');
        return true;
      } else {
        throw new Error(result.error || 'Erro ao salvar');
      }
      
    } catch (error) {
      console.error('❌ Erro ao salvar no Google Sheets:', error);
      return false;
    }
  },

  // ============================================================
  // GETTERS
  // ============================================================
  getSettings() {
    return this.cache.settings || {};
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
    return this.cache.users || {};
  },

  getHistory() {
    return this.cache.history || [];
  },

  // ============================================================
  // MÉTODOS - CATEGORIAS
  // ============================================================
  async addCategory(name, icon = 'fa-tag') {
    try {
      const response = await fetch(this.config.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addCategory',
          name: name,
          icon: icon
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await this.load(); // Recarregar dados
        return result;
      }
      throw new Error(result.error);
      
    } catch (error) {
      console.error('❌ Erro ao adicionar categoria:', error);
      return { success: false, error: error.message };
    }
  },

  async editCategory(id, data) {
    try {
      const response = await fetch(this.config.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'editCategory',
          id: id,
          data: data
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await this.load();
        return result;
      }
      throw new Error(result.error);
      
    } catch (error) {
      console.error('❌ Erro ao editar categoria:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteCategory(id) {
    // Soft delete - desativa
    return this.editCategory(id, { active: false });
  },

  async reorderCategories(orderedIds) {
    try {
      // Atualizar ordem de cada categoria
      for (let i = 0; i < orderedIds.length; i++) {
        await this.editCategory(orderedIds[i], { order: i + 1 });
      }
      await this.load();
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao reordenar categorias:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================
  // MÉTODOS - MATÉRIAS
  // ============================================================
  async addMateria(data) {
    try {
      const response = await fetch(this.config.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addMateria',
          data: data
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await this.load();
        return result;
      }
      throw new Error(result.error);
      
    } catch (error) {
      console.error('❌ Erro ao adicionar matéria:', error);
      return { success: false, error: error.message };
    }
  },

  async editMateria(id, data) {
    try {
      const response = await fetch(this.config.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'editMateria',
          id: id,
          data: data
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await this.load();
        return result;
      }
      throw new Error(result.error);
      
    } catch (error) {
      console.error('❌ Erro ao editar matéria:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteMateria(id) {
    try {
      const response = await fetch(this.config.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteMateria',
          id: id
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await this.load();
        return result;
      }
      throw new Error(result.error);
      
    } catch (error) {
      console.error('❌ Erro ao excluir matéria:', error);
      return { success: false, error: error.message };
    }
  },

  async incrementViews(id) {
    try {
      const response = await fetch(this.config.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'incrementViews',
          id: id
        })
      });
      
      return await response.json();
      
    } catch (error) {
      console.error('❌ Erro ao incrementar views:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================
  // MÉTODOS - USUÁRIOS
  // ============================================================
  async addUser(username, password, level, name) {
    try {
      const response = await fetch(this.config.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addUser',
          username: username,
          password: password,
          level: level,
          name: name
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await this.load();
        return result;
      }
      throw new Error(result.error);
      
    } catch (error) {
      console.error('❌ Erro ao adicionar usuário:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteUser(username) {
    try {
      const response = await fetch(this.config.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteUser',
          username: username
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await this.load();
        return result;
      }
      throw new Error(result.error);
      
    } catch (error) {
      console.error('❌ Erro ao remover usuário:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================
  // MÉTODOS - CONFIGURAÇÕES
  // ============================================================
  async updateSettings(newSettings) {
    try {
      const response = await fetch(this.config.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateSettings',
          settings: newSettings
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await this.load();
        return result;
      }
      throw new Error(result.error);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar configurações:', error);
      return { success: false, error: error.message };
    }
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
  console.log('📰 Database inicializado com Google Sheets!');
})();

window.Database = Database;
window.Database = Database;
