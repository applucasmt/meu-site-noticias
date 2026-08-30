// ============================================================
// SITE PÚBLICO - CARREGA CATEGORIAS DINAMICAMENTE
// ============================================================

(function() {
  'use strict';

  // ============================================================
  // FUNÇÕES DE UTILITÁRIO
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

  function getCategoryIcon(icon) {
    return icon || 'fa-tag';
  }

  // ============================================================
  // RENDERIZAR MENUS (Categorias)
  // ============================================================
  function renderMenus() {
    const nav = document.getElementById('mainNav');
    if (!nav) return;

    const categories = DB.getCategories();
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop().replace('.html', '');
    
    // Determinar qual está ativo
    let activeSlug = 'index';
    if (currentPage !== 'index' && currentPage !== '') {
      activeSlug = currentPage;
    }

    let html = `<a href="index.html" class="${activeSlug === 'index' ? 'active' : ''}">Últimas</a>`;
    
    categories.forEach(cat => {
      const isActive = activeSlug === cat.slug;
      html += `<a href="${cat.slug}.html" class="${isActive ? 'active' : ''}">
        <i class="fas ${getCategoryIcon(cat.icon)}"></i> ${cat.name}
      </a>`;
    });

    nav.innerHTML = html;
  }

  // ============================================================
  // RENDERIZAR MATÉRIAS
  // ============================================================
  function renderMaterias() {
    const list = document.getElementById('materiasList');
    if (!list) return;

    // Descobrir categoria atual pela URL
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop().replace('.html', '');
    
    let categorySlug = null;
    if (currentPage !== 'index' && currentPage !== '') {
      categorySlug = currentPage;
    }

    const materias = DB.getMaterias(categorySlug);

    if (materias.length === 0) {
      list.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem 0; color: #6b7a8f;">
          <i class="fas fa-inbox" style="font-size: 2rem; display: block; margin-bottom: 1rem;"></i>
          Nenhuma matéria encontrada nesta categoria.
        </div>
      `;
      return;
    }

    list.innerHTML = materias.map(m => {
      const cat = DB.categories.find(c => c.name === m.category);
      const icon = cat ? getCategoryIcon(cat.icon) : 'fa-tag';
      return `
        <div class="news-card" data-id="${m.id}">
          <div class="card-img">
            ${m.image ? `<img src="${m.image}" alt="${m.title}">` : `<i class="fas ${icon}"></i>`}
          </div>
          <div class="card-content">
            <span class="tag">${m.category}</span>
            <h4>${m.title}</h4>
            <div class="mini-meta">
              <i class="far fa-clock"></i> ${formatDate(m.date)}
              <span style="margin-left: 0.5rem;"><i class="far fa-eye"></i> ${m.views || 0}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ============================================================
  // ATUALIZAR DESTAQUE (usar primeira matéria como destaque)
  // ============================================================
  function updateDestaque() {
    const destaque = document.querySelector('.destaque-principal');
    if (!destaque) return;

    const materias = DB.getMaterias();
    if (materias.length === 0) return;

    const top = materias[0];
    const cat = DB.categories.find(c => c.name === top.category);
    const icon = cat ? getCategoryIcon(cat.icon) : 'fa-tag';

    const imgEl = destaque.querySelector('.card-img');
    const bodyEl = destaque.querySelector('.card-body');
    const catEl = bodyEl.querySelector('.categoria');
    const titleEl = bodyEl.querySelector('h2');
    const resumoEl = bodyEl.querySelector('.resumo');
    const metaEl = bodyEl.querySelector('.meta');

    if (imgEl) {
      if (top.image) {
        imgEl.innerHTML = `<img src="${top.image}" alt="${top.title}" style="width:100%;height:100%;object-fit:cover;">`;
      } else {
        imgEl.innerHTML = `<i class="fas ${icon}" style="font-size:3.2rem;"></i>`;
      }
    }

    if (catEl) catEl.innerHTML = `<i class="fas fa-bolt"></i> ${top.category}`;
    if (titleEl) titleEl.textContent = top.title;
    if (resumoEl) {
      // Remove tags HTML para o resumo
      const temp = document.createElement('div');
      temp.innerHTML = top.content;
      resumoEl.textContent = temp.textContent.substring(0, 150) + '...';
    }
    if (metaEl) {
      metaEl.innerHTML = `
        <span><i class="far fa-clock"></i> ${formatDate(top.date)}</span>
        <span><i class="far fa-user"></i> ${top.author || 'NewsPortal'}</span>
        <span><i class="far fa-eye"></i> ${top.views || 0}</span>
      `;
    }
  }

  // ============================================================
  // CADEADO (Ctrl)
  // ============================================================
  let ctrlPressed = false;
  const lockIcon = document.getElementById('lockIcon');

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Control') {
      ctrlPressed = true;
      if (lockIcon) lockIcon.classList.add('visible');
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.key === 'Control') {
      ctrlPressed = false;
      setTimeout(() => {
        if (!ctrlPressed && lockIcon) {
          lockIcon.classList.remove('visible');
        }
      }, 300);
    }
  });

  if (lockIcon) {
    lockIcon.addEventListener('click', () => {
      window.location.href = 'admin.html';
    });
  }

  // ============================================================
  // INICIALIZAÇÃO
  // ============================================================
  document.addEventListener('DOMContentLoaded', () => {
    renderMenus();
    renderMaterias();
    updateDestaque();

    console.log('📰 NewsPortal carregado!');
    console.log(`📂 Categorias: ${DB.getCategories().map(c => c.name).join(', ')}`);
    console.log(`📄 Matérias: ${DB.getMaterias().length}`);
    console.log('🔑 Pressione Ctrl para acessar o painel admin');
  });

})();