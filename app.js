/**
 * FWC 2026 Album Tracker - Aplicación para gestionar el álbum Panini
 * Características: Registro de láminas, filtro por país/grupo, exportación PDF
 */

const CONFIG = {
    JSON_FILE: 'panini_world_cup_2026.json',
    STORAGE_KEY: 'fwc2026_inventory_v2',
    TOAST_DURATION: 2500
};

// Estado global de la aplicación
const AppState = {
    albumData: null,
    inventory: {},
    stats: { total: 0, groups: 0, countries: 0, specials: 0 },
    isAddMode: true,
    activeGroup: null,
    activeCountry: null,
    allCountries: []
};

// Referencias DOM cacheadas
const DOM = {};

/**
 * Inicializa la aplicación cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', () => {
    cacheDOM();
    loadInventory();
    initApp();
});

/**
 * Cachea todas las referencias DOM para mejor rendimiento
 */
function cacheDOM() {
    DOM.navContainer = document.getElementById('nav-groups');
    DOM.mainContainer = document.getElementById('app-main');
    DOM.searchInput = document.getElementById('search-input');
    DOM.btnMode = document.getElementById('btn-mode');
    DOM.btnExport = document.getElementById('btn-export');
    DOM.dashboard = document.getElementById('dashboard');
    DOM.progressBarFill = document.getElementById('progress-bar-fill');
    DOM.progressPercentage = document.getElementById('progress-percentage');
    DOM.progressCount = document.getElementById('progress-count');
    DOM.uniqueOwned = document.getElementById('unique-owned');
    DOM.totalRepeated = document.getElementById('total-repeated');
    DOM.countryFilterPanel = document.getElementById('country-filter-panel');
    DOM.countryList = document.getElementById('country-list');
    DOM.btnFilterCountry = document.getElementById('btn-filter-country');
    DOM.btnCloseFilter = document.getElementById('btn-close-filter');
    DOM.toast = document.getElementById('toast');
}

/**
 * Carga el inventario desde localStorage
 */
function loadInventory() {
    try {
        AppState.inventory = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY)) || {};
    } catch (e) {
        console.error('Error cargando inventario:', e);
        AppState.inventory = {};
    }
}

/**
 * Guarda el inventario en localStorage
 */
function saveInventory() {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(AppState.inventory));
}

/**
 * Inicializa la aplicación cargando datos y configurando eventos
 */
async function initApp() {
    try {
        await loadAlbumData();
        calculateStats();
        renderDashboard();
        buildNavigation();
        buildCountryFilter();
        renderSection('A');
        updateProgress();
        setupEventListeners();
    } catch (error) {
        console.error('Error inicializando app:', error);
        showError('No se pudo cargar el álbum. Verifica tu conexión o usa un servidor local.');
    }
}

/**
 * Carga los datos del álbum desde JSON
 */
async function loadAlbumData() {
    const response = await fetch(CONFIG.JSON_FILE);
    if (!response.ok) throw new Error('No se pudo cargar el JSON');
    AppState.albumData = await response.json();
}

/**
 * Calcula estadísticas del álbum
 */
function calculateStats() {
    AppState.stats.groups = Object.keys(AppState.albumData.groups).length;
    AppState.stats.specials = Object.keys(AppState.albumData.specials).length;
    AppState.stats.total = 0;
    AppState.stats.countries = 0;
    
    // Recopilar todos los países para el filtro
    AppState.allCountries = [];
    
    Object.values(AppState.albumData.groups).forEach(group => {
        AppState.stats.countries += group.length;
        group.forEach(country => {
            AppState.stats.total += country.stickers.length;
            AppState.allCountries.push({
                name: country.country,
                flag: country.flag || '',
                group: Object.keys(AppState.albumData.groups).find(g => 
                    AppState.albumData.groups[g].some(c => c.country === country.country)
                )
            });
        });
    });
    
    // Añadir especiales
    Object.values(AppState.albumData.specials).forEach(special => {
        AppState.stats.total += special.length;
    });
}

/**
 * Renderiza el dashboard con estadísticas
 */
function renderDashboard() {
    const uniqueOwned = getUniqueOwnedCount();
    const totalRepeated = getTotalRepeatedCount();
    
    DOM.dashboard.innerHTML = `
        <div class="stat-card">
            <span class="stat-value">${AppState.stats.total}</span>
            <span class="stat-label">Total Láminas</span>
        </div>
        <div class="stat-card">
            <span class="stat-value">${AppState.stats.countries}</span>
            <span class="stat-label">Países</span>
        </div>
        <div class="stat-card">
            <span class="stat-value">${AppState.stats.groups}</span>
            <span class="stat-label">Grupos</span>
        </div>
        <div class="stat-card highlight">
            <span class="stat-value" id="dash-owned">${uniqueOwned}</span>
            <span class="stat-label">Completadas</span>
        </div>
    `;
}

/**
 * Obtiene count de láminas únicas obtenidas
 */
function getUniqueOwnedCount() {
    return Object.keys(AppState.inventory).filter(id => AppState.inventory[id] > 0).length;
}

/**
 * Obtiene total de láminas repetidas
 */
function getTotalRepeatedCount() {
    return Object.values(AppState.inventory).reduce((sum, count) => sum + Math.max(0, count - 1), 0);
}

/**
 * Actualiza la barra de progreso y estadísticas
 */
function updateProgress() {
    const uniqueOwned = getUniqueOwnedCount();
    const totalRepeated = getTotalRepeatedCount();
    const percentage = AppState.stats.total > 0 
        ? ((uniqueOwned / AppState.stats.total) * 100).toFixed(1) 
        : 0;
    
    DOM.progressPercentage.textContent = `${percentage}%`;
    DOM.progressBarFill.style.width = `${percentage}%`;
    DOM.progressCount.textContent = `${uniqueOwned}/${AppState.stats.total}`;
    DOM.uniqueOwned.textContent = uniqueOwned;
    DOM.totalRepeated.textContent = totalRepeated;
    
    // Actualizar dashboard si existe
    const dashOwned = document.getElementById('dash-owned');
    if (dashOwned) dashOwned.textContent = uniqueOwned;
}

/**
 * Configura todos los event listeners
 */
function setupEventListeners() {
    // Botón modo añadir/quitar
    DOM.btnMode.addEventListener('click', toggleMode);
    
    // Botón exportar PDF
    DOM.btnExport.addEventListener('click', exportToPDF);
    
    // Búsqueda
    DOM.searchInput.addEventListener('input', handleSearch);
    
    // Filtro por país
    DOM.btnFilterCountry.addEventListener('click', toggleCountryFilter);
    DOM.btnCloseFilter.addEventListener('click', () => {
        DOM.countryFilterPanel.classList.remove('open');
        DOM.btnFilterCountry.classList.remove('active');
    });
    
    // Tecla Escape para cerrar filtros
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            DOM.countryFilterPanel.classList.remove('open');
            DOM.btnFilterCountry.classList.remove('active');
        }
    });
}

/**
 * Alterna entre modo añadir y quitar
 */
function toggleMode() {
    AppState.isAddMode = !AppState.isAddMode;
    DOM.btnMode.className = `action-btn ${AppState.isAddMode ? 'mode-add' : 'mode-sub'}`;
    DOM.btnMode.querySelector('.btn-icon').textContent = AppState.isAddMode ? '➕' : '➖';
    DOM.btnMode.querySelector('.btn-text').textContent = AppState.isAddMode ? 'Sumar' : 'Quitar';
    showToast(AppState.isAddMode ? 'Modo: Añadir láminas' : 'Modo: Quitar láminas');
}

/**
 * Maneja el click en una lámina
 */
function handleStickerClick(stickerId, element) {
    const currentCount = AppState.inventory[stickerId] || 0;
    
    if (AppState.isAddMode) {
        AppState.inventory[stickerId] = currentCount + 1;
    } else if (currentCount > 0) {
        AppState.inventory[stickerId] = currentCount - 1;
    }
    
    if (AppState.inventory[stickerId] === 0) {
        delete AppState.inventory[stickerId];
    }
    
    updateStickerVisual(element);
    saveInventory();
    updateProgress();
}

/**
 * Actualiza el aspecto visual de una lámina
 */
function updateStickerVisual(element) {
    const stickerId = element.dataset.id;
    const count = AppState.inventory[stickerId] || 0;
    
    element.className = 'sticker-item';
    element.innerHTML = element.dataset.originalHtml;
    
    if (count === 1) {
        element.classList.add('owned');
    } else if (count > 1) {
        element.classList.add('repeated');
        element.innerHTML += `<div class="repeated-badge">+${count - 1}</div>`;
    }
}

/**
 * Crea un elemento de lámina
 */
function createStickerElement(sticker, prefixToRemove = '') {
    const el = document.createElement('div');
    const displayId = sticker.id.replace(prefixToRemove, '');
    const name = sticker.name || '';
    
    el.dataset.id = sticker.id;
    el.dataset.originalHtml = `
        <div class="sticker-id">${displayId}</div>
        <div class="sticker-name">${name}</div>
    `;
    el.dataset.searchable = `${sticker.id.toLowerCase()} ${name.toLowerCase()}`;
    
    updateStickerVisual(el);
    el.onclick = () => handleStickerClick(sticker.id, el);
    
    return el;
}

/**
 * Construye la navegación por grupos
 */
function buildNavigation() {
    DOM.navContainer.innerHTML = '';
    
    // Botones de grupos
    Object.keys(AppState.albumData.groups).forEach(group => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.textContent = `Grupo ${group}`;
        btn.dataset.group = group;
        btn.onclick = () => {
            setActiveNavButton(btn);
            renderSection(group);
        };
        DOM.navContainer.appendChild(btn);
    });
    
    // Botones de especiales
    Object.keys(AppState.albumData.specials).forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.textContent = key.replace('_', ' ').toUpperCase();
        btn.dataset.special = key;
        btn.onclick = () => {
            setActiveNavButton(btn);
            renderSpecial(key);
        };
        DOM.navContainer.appendChild(btn);
    });
}

/**
 * Establece el botón de navegación activo
 */
function setActiveNavButton(activeBtn) {
    DOM.navContainer.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
    AppState.activeGroup = activeBtn.dataset.group || null;
}

/**
 * Construye el panel de filtro por país
 */
function buildCountryFilter() {
    DOM.countryList.innerHTML = '';
    
    AppState.allCountries.forEach(country => {
        const chip = document.createElement('div');
        chip.className = 'country-chip';
        chip.dataset.country = country.name;
        chip.innerHTML = `<span>${country.flag}</span><span>${country.name}</span>`;
        chip.onclick = () => filterByCountry(country.name, chip);
        DOM.countryList.appendChild(chip);
    });
}

/**
 * Muestra/oculta el panel de filtro por país
 */
function toggleCountryFilter() {
    DOM.countryFilterPanel.classList.toggle('open');
    DOM.btnFilterCountry.classList.toggle('active');
}

/**
 * Filtra láminas por país
 */
function filterByCountry(countryName, chipElement) {
    // Toggle selección
    const isActive = chipElement.classList.contains('active');
    
    DOM.countryList.querySelectorAll('.country-chip').forEach(c => c.classList.remove('active'));
    
    if (!isActive) {
        chipElement.classList.add('active');
        AppState.activeCountry = countryName;
        searchAndDisplayCountry(countryName);
        showToast(`Filtrando: ${countryName}`);
    } else {
        AppState.activeCountry = null;
        if (AppState.activeGroup) {
            renderSection(AppState.activeGroup);
        }
        showToast('Filtro removido');
    }
}

/**
 * Busca y muestra un país específico
 */
function searchAndDisplayCountry(countryName) {
    DOM.mainContainer.innerHTML = '';
    
    // Buscar el país en todos los grupos
    for (const [groupName, countries] of Object.entries(AppState.albumData.groups)) {
        const countryData = countries.find(c => c.country === countryName);
        if (countryData) {
            const section = createCountrySection(countryData);
            DOM.mainContainer.appendChild(section);
            
            // Scroll suave hacia la sección
            setTimeout(() => {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
            break;
        }
    }
}

/**
 * Renderiza una sección de grupo
 */
function renderSection(groupKey) {
    DOM.mainContainer.innerHTML = '';
    AppState.activeGroup = groupKey;
    AppState.activeCountry = null;
    
    // Resetear filtro de país
    DOM.countryList.querySelectorAll('.country-chip').forEach(c => c.classList.remove('active'));
    
    AppState.albumData.groups[groupKey].forEach(countryData => {
        const section = createCountrySection(countryData);
        DOM.mainContainer.appendChild(section);
    });
}

/**
 * Crea una sección de país con su grilla de láminas
 */
function createCountrySection(countryData) {
    const section = document.createElement('section');
    section.className = 'country-section';
    section.dataset.country = countryData.country;
    
    const prefix = countryData.team ? countryData.team.substring(0, 3).toUpperCase() : '';
    
    section.innerHTML = `
        <div class="country-header">
            <span>${countryData.flag || '🏳️'}</span>
            <span>${countryData.country}</span>
        </div>
        <div class="sticker-grid"></div>
    `;
    
    const grid = section.querySelector('.sticker-grid');
    countryData.stickers.forEach(sticker => {
        grid.appendChild(createStickerElement(sticker, prefix));
    });
    
    return section;
}

/**
 * Renderiza una sección especial
 */
function renderSpecial(specialKey) {
    DOM.mainContainer.innerHTML = '';
    AppState.activeCountry = null;
    
    const section = document.createElement('section');
    section.className = 'country-section';
    section.innerHTML = `
        <div class="country-header">
            <span>⭐</span>
            <span>${specialKey.replace('_', ' ').toUpperCase()}</span>
        </div>
        <div class="sticker-grid"></div>
    `;
    
    DOM.mainContainer.appendChild(section);
    const grid = section.querySelector('.sticker-grid');
    
    AppState.albumData.specials[specialKey].forEach(sticker => {
        grid.appendChild(createStickerElement(sticker, ''));
    });
}

/**
 * Maneja la búsqueda de láminas
 */
function handleSearch(e) {
    const term = e.target.value.toLowerCase().trim();
    
    DOM.mainContainer.querySelectorAll('.sticker-item').forEach(el => {
        const searchable = el.dataset.searchable || '';
        el.classList.toggle('hidden', !searchable.includes(term));
    });
    
    // Ocultar secciones vacías
    DOM.mainContainer.querySelectorAll('.country-section').forEach(section => {
        const visibleStickers = section.querySelectorAll('.sticker-item:not(.hidden)').length;
        section.style.display = visibleStickers === 0 ? 'none' : 'block';
    });
}

/**
 * Exporta láminas faltantes a PDF (una página)
 */
function exportToPDF() {
    const printContent = document.getElementById('print-content');
    const printDate = document.getElementById('print-date');
    const printTotalMissing = document.getElementById('print-total-missing');
    const printTotal = document.getElementById('print-total');
    
    printDate.textContent = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    let html = '';
    let missingCount = 0;
    
    // Grupos regulares
    Object.entries(AppState.albumData.groups).forEach(([groupName, countries]) => {
        countries.forEach(country => {
            const missing = country.stickers.filter(s => !AppState.inventory[s.id] || AppState.inventory[s.id] === 0);
            
            if (missing.length > 0) {
                missingCount += missing.length;
                const items = missing.map(s => 
                    `<div class="print-missing-item">${s.id} - ${s.name || ''}</div>`
                ).join('');
                
                html += `<div class="print-section-title">${country.flag || ''} ${country.country} (${missing.length})</div>${items}`;
            }
        });
    });
    
    // Especiales
    Object.entries(AppState.albumData.specials).forEach(([key, stickers]) => {
        const missing = stickers.filter(s => !AppState.inventory[s.id] || AppState.inventory[s.id] === 0);
        
        if (missing.length > 0) {
            missingCount += missing.length;
            const items = missing.map(s => 
                `<div class="print-missing-item">${s.id} - ${s.name || ''}</div>`
            ).join('');
            
            html += `<div class="print-section-title">⭐ ${key.replace('_', ' ').toUpperCase()} (${missing.length})</div>${items}`;
        }
    });
    
    printContent.innerHTML = html || '<p style="text-align:center;padding:2rem;">¡🎉 Álbum completado!</p>';
    printTotalMissing.textContent = missingCount;
    printTotal.textContent = AppState.stats.total;
    
    // Mostrar toast y abrir diálogo de impresión
    showToast('Abriendo vista de impresión...', 'success');
    setTimeout(() => window.print(), 500);
}

/**
 * Muestra notificación toast
 */
function showToast(message, type = 'info') {
    DOM.toast.textContent = message;
    DOM.toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        DOM.toast.classList.remove('show');
    }, CONFIG.TOAST_DURATION);
}

/**
 * Muestra mensaje de error
 */
function showError(message) {
    DOM.mainContainer.innerHTML = `
        <div class="error-msg">
            <h2>⚠️ Error de carga</h2>
            <p>${message}</p>
        </div>
    `;
    showToast('Error al cargar datos', 'error');
}
