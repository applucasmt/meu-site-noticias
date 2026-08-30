// ============================================================
// ADMIN - PAINEL COMPLETO
// ============================================================

(function() {
  'use strict';

  let editingMateriaId = null;

  // ============================================================
  // UTILITÁRIOS
  // ============================================================
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ============================================================
  // TABS
  // ============================================================
  window.switchTab = function(tab) {
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.admin-tabs button').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`panel-${tab}`).classList.add('active');
    document.querySelector(`.admin-tabs button[onclick*="${tab}"]`).classList.add('active');
    
    // Atualizar dados ao mudar de aba
    if (tab === 'dashboard') updateDashboard();
    if (tab === 'categories') renderCategories();
    if (tab === 'materias') renderMateriasAdmin();
    if (tab === 'users') renderUsers();
    if (tab === 'history') renderHistory();
  };

  // ============================================================
  // DASHBOARD
  // ============================================================
  function updateDashboard() {
    const materias = DB.getAllMaterias();
    const published = materias.filter(m => m.status === 'published');
    const categories = DB.getCategories();
    const totalViews = materias.reduce((sum, m) => sum + (m.views || 0), 0);

    document.getElementById('totalMaterias').textContent = published.length;
    document.getElementById('totalCategories').textContent = categories.length;
    document.getElementById('totalViews').textContent = totalViews;

    const lastList = document.getElementById('lastMaterias');
    lastList.innerHTML = published.slice(0, 5).map(m => `
      <div class="materia-item">
        <div class="materia-info">
          <h4>${m.title}</h4>
          <div class="materia-meta">
            <span class="status-published">Publicado</span>
            ${m.category} · ${formatDate(m.date)} · ${m.views || 0} views
          </div>
        </div>
        <div class="materia-actions">
          <button class="btn-edit" onclick="editMateria(${m.id})"><i class="fas fa-edit"></i></button>
        </div>
      </div>
    `).join('');
  }

  // ============================================================
  // CATEGORIAS
  // ============================================================
  function renderCategories() {
    const tbody = document.getElementById('categoriesBody');
    const categories = DB.getCategories();
    
    tbody.innerHTML = categories.map((cat, index) => `
      <tr data-id="${cat.id}" draggable="true">
        <td><span class="drag-handle"><i class="fas fa-grip-vertical"></i></span></td>
        <td>
          <input type="text" value="${cat.name}" class="edit-cat-name" data-id="${cat.id}" style="border:1px solid transparent; background:transparent; padding:4px 6px; border-radius:4px; width:100%; font-weight:600;" onfocus="this.style.borderColor='#3498db'; this.style.background='white';" onblur="updateCategoryName(${cat.id}, this.value)">
        </td>
        <td>/${cat.slug}.html</td>
        <td><i class="fas ${cat.icon}"></i> ${cat.icon}</td>
        <td>
          <span class="status-badge ${cat.active ? 'active' : 'inactive'}">
            ${cat.active ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td style="text-align:right;">
          <button class="btn-icon btn-success" onclick="toggleCategoryStatus(${cat.id})" title="${cat.active ? 'Desativar' : 'Ativar'}">
            <i class="fas ${cat.active ? 'fa-eye' : 'fa-eye-slash'}"></i>
          </button>
          <button class="btn-icon btn-danger" onclick="deleteCategory(${cat.id})" title="Excluir">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    // Drag and drop para reordenar
    setupDragAndDrop();
  }

  function setupDragAndDrop() {
    const rows = document.querySelectorAll('#categoriesBody tr');
    let dragItem = null;

    rows.forEach(row => {
      row.addEventListener('dragstart', (e) => {
        dragItem = row;
        row.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
      });

      row.addEventListener('dragend', () => {
        row.style.opacity = '1';
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        const target = e.currentTarget;
        if (target !== dragItem) {
          const parent = target.parentNode;
          const allRows = Array.from(parent.children);
          const dragIndex = allRows.indexOf(dragItem);
          const targetIndex = allRows.indexOf(target);
          
          if (dragIndex < targetIndex) {
            parent.insertBefore(dragItem, target.nextSibling);
          } else {
            parent.insertBefore(dragItem, target);
          }
        }
      });
    });

    // Salvar ordem ao soltar
    document.addEventListener('dragend', () => {
      const rows = document.querySelectorAll('#categoriesBody tr');
      const orderedIds = Array.from(rows).map(row => parseInt(row.dataset.id));
      DB.reorderCategories(orderedIds);
      renderCategories();
    });
  }

  window.updateCategoryName = function(id, newName) {
    if (newName.trim()) {
      DB.editCategory(id, { name: newName.trim() });
      renderCategories();
    }
  };

  window.toggleCategoryStatus = function(id) {
    const cat = DB.categories.find(c => c.id === id);
    if (cat) {
      DB.editCategory(id, { active: !cat.active });
      renderCategories();
    }
  };

  window.deleteCategory = function(id) {
    if (confirm('Tem certeza que deseja desativar esta categoria?')) {
      DB.deleteCategory(id);
      renderCategories();
    }
  };

  // Formulário de nova categoria
  document.getElementById('categoryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('catName').value.trim();
    const icon = document.getElementById('catIcon').value.trim() || 'fa-tag';
    
    if (name) {
      DB.addCategory(name, icon);
      document.getElementById('catName').value = '';
      document.getElementById('catIcon').value = 'fa-tag';
      renderCategories();
    }
  });

  // ============================================================
  // MATÉRIAS
  // ============================================================
  function renderMateriasAdmin() {
    const list = document.getElementById('materiasListAdmin');
    const materias = DB.getAllMaterias();
    
    list.innerHTML = materias.map(m => `
      <div class="materia-item">
        <div class="materia-info">
          <h4>${m.title}</h4>
          <div class="materia-meta">
            <span class="${m.status === 'published' ? 'status-published' : 'status-draft'}">${m.status === 'published' ? 'Publicado' : 'Rascunho'}</span>
            ${m.category} · ${formatDate(m.date)} · ${m.views || 0} views
          </div>
        </div>
        <div class="materia-actions">
          <button class="btn-edit" onclick="editMateria(${m.id})"><i class="fas fa-edit"></i> Editar</button>
          <button class="btn-delete" onclick="deleteMateria(${m.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  }

  window.editMateria = function(id) {
    const materia = DB.materias.find(m => m.id === id);
    if (!materia) return;
    
    editingMateriaId = id;
    document.getElementById('editorTitle').textContent = `✎ Editando: ${materia.title}`;
    document.getElementById('editTitle').value = materia.title;
    document.getElementById('editImage').value = materia.image || '';
    document.getElementById('editContent').innerHTML = materia.content;
    document.getElementById('editorModal').style.display = 'flex';
    
    // Popular categorias
    populateCategorySelect(materia.category);
  };

  window.openEditor = function() {
    editingMateriaId = null;
    document.getElementById('editorTitle').textContent = '✏️ Nova Matéria';
    document.getElementById('editTitle').value = '';
    document.getElementById('editImage').value = '';
    document.getElementById('editContent').innerHTML = '<p>Digite o conteúdo aqui...</p>';
    document.getElementById('editorModal').style.display = 'flex';
    populateCategorySelect();
  };

  window.closeEditor = function() {
    document.getElementById('editorModal').style.display = 'none';
    editingMateriaId = null;
  };

  function populateCategorySelect(selected = null) {
    const select = document.getElementById('editCategory');
    const categories = DB.getCategories();
    select.innerHTML = categories.map(c => `
      <option value="${c.name}" ${c.name === selected ? 'selected' : ''}>${c.name}</option>
    `).join('');
  }

  window.formatText = function(command, value = null) {
    const content = document.getElementById('editContent');
    content.focus();
    if (command === 'foreColor') {
      document.execCommand('foreColor', false, value);
    } else {
      document.execCommand(command, false, null);
    }
  };

  window.saveMateria = function(status) {
    const title = document.getElementById('editTitle').value.trim();
    const category = document.getElementById('editCategory').value;
    const image = document.getElementById('editImage').value.trim();
    const content = document.getElementById('editContent').innerHTML;

    if (!title) {
      alert('⚠️ O título é obrigatório.');
      return;
    }

    const data = { title, category, image, content, status };

    if (editingMateriaId) {
      DB.editMateria(editingMateriaId, data);
    } else {
      DB.addMateria(data);
    }

    closeEditor();
    renderMateriasAdmin();
    alert(`✅ Matéria ${status === 'published' ? 'publicada' : 'salva como rascunho'} com sucesso!`);
  };

  window.deleteMateria = function(id) {
    if (confirm('Tem certeza que deseja excluir esta matéria?')) {
      DB.deleteMateria(id);
      renderMateriasAdmin();
    }
  };

  // ============================================================
  // USUÁRIOS
  // ============================================================
  function renderUsers() {
    const list = document.getElementById('usersList');
    list.innerHTML = Object.entries(DB.users).map(([username, data]) => `
      <div class="materia-item">
        <div>
          <strong>${username}</strong> (${data.name})
          <span style="background:#3498db; color:white; padding:0.1rem 0.6rem; border-radius:12px; font-size:0.7rem; margin-left:0.5rem;">${data.level}</span>
        </div>
        <div>
          <button class="btn-delete" onclick="deleteUser('${username}')" style="background:#e74c3c; color:white; border:none; padding:0.2rem 0.8rem; border-radius:4px; cursor:pointer;">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('userForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value.trim();
    const level = document.getElementById('newUserLevel').value;

    if (!username || !password) {
      alert('Preencha todos os campos.');
      return;
    }

    if (DB.users[username]) {
      alert('Usuário já existe!');
      return;
    }

    DB.users[username] = { password, level, name: username.charAt(0).toUpperCase() + username.slice(1) };
    DB.addHistory(`Adicionou usuário: ${username} (${level})`);
    DB.save();
    renderUsers();
    document.getElementById('userForm').reset();
    alert('✅ Usuário criado com sucesso!');
  });

  window.deleteUser = function(username) {
    if (username === 'admin') {
      alert('Não é possível remover o usuário admin.');
      return;
    }
    if (confirm(`Remover usuário "${username}"?`)) {
      delete DB.users[username];
      DB.addHistory(`Removeu usuário: ${username}`);
      DB.save();
      renderUsers();
    }
  };

  // ============================================================
  // HISTÓRICO
  // ============================================================
  function renderHistory() {
    const list = document.getElementById('historyListAdmin');
    list.innerHTML = DB.history.slice(0, 30).map(item => `
      <div class="history-item">
        <span><strong>${item.user}</strong> ${item.message}</span>
        <span class="h-time">${formatDate(item.time)}</span>
      </div>
    `).join('');
  }

  // ============================================================
  // LOGOUT
  // ============================================================
  window.logout = function() {
    if (confirm('Deseja sair do painel administrativo?')) {
      window.location.href = 'index.html';
    }
  };

  // ============================================================
  // INICIALIZAÇÃO
  // ============================================================
  document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
    renderCategories();
    renderMateriasAdmin();
    renderUsers();
    renderHistory();

    console.log('🔐 Painel Admin carregado!');
    console.log(`📂 ${DB.getCategories().length} categorias`);
    console.log(`📄 ${DB.getAllMaterias().length} matérias`);
  });

})();