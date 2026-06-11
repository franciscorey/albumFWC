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
    allCountries: [],
    viewMode: 'all', // all, missing, owned, repeated
    listMode: false // false = grid, true = list
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
    DOM.btnWhatsapp = document.getElementById('btn-whatsapp');
    DOM.btnWhatsappDup = document.getElementById('btn-whatsapp-dup');
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
    DOM.viewModeSelect = document.getElementById('view-mode-select');
    DOM.btnViewGrid = document.getElementById('btn-view-grid');
    DOM.btnViewList = document.getElementById('btn-view-list');
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
    
    // Botón WhatsApp - Faltantes
    DOM.btnWhatsapp.addEventListener('click', shareToWhatsApp);
    
    // Botón WhatsApp - Repetidas
    if (DOM.btnWhatsappDup) {
        DOM.btnWhatsappDup.addEventListener('click', shareDuplicatesToWhatsApp);
    }
    
    // Búsqueda - mejorada para buscar por nombre de jugador
    DOM.searchInput.addEventListener('input', handleSearch);
    
    // Filtro por país
    DOM.btnFilterCountry.addEventListener('click', toggleCountryFilter);
    DOM.btnCloseFilter.addEventListener('click', () => {
        DOM.countryFilterPanel.classList.remove('open');
        DOM.btnFilterCountry.classList.remove('active');
    });
    
    // Filtro por tipo de lámina (faltantes, repetidas, etc.)
    DOM.viewModeSelect.addEventListener('change', (e) => {
        AppState.viewMode = e.target.value;
        applyViewFilters();
    });
    
    // Cambiar vista grilla/lista
    DOM.btnViewGrid.addEventListener('click', () => setListView(false));
    DOM.btnViewList.addEventListener('click', () => setListView(true));
    
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
    
    // Verificar si debe estar oculto por filtro de vista
    const isHiddenByFilter = shouldHideByFilter(count);
    
    element.className = 'sticker-item';
    if (isHiddenByFilter) {
        element.classList.add('filter-hidden');
    }
    element.innerHTML = element.dataset.originalHtml;
    
    if (count === 1) {
        element.classList.add('owned');
    } else if (count > 1) {
        element.classList.add('repeated');
        element.innerHTML += `<div class="repeated-badge">+${count - 1}</div>`;
    }
}

/**
 * Determina si una lámina debe ocultarse según el filtro activo
 */
function shouldHideByFilter(count) {
    switch (AppState.viewMode) {
        case 'missing':
            return count !== 0;
        case 'owned':
            return count !== 1;
        case 'repeated':
            return count <= 1;
        default:
            return false;
    }
}

/**
 * Crea un elemento de lámina con emoji según tipo
 */
function createStickerElement(sticker, prefixToRemove = '', countryData = null, specialKey = null) {
    const el = document.createElement('div');
    const displayId = sticker.id.replace(prefixToRemove, '');
    const name = sticker.name || '';
    
    // Determinar emoji según tipo de lámina
    let emoji = '';
    let displayName = name;
    
    if (countryData) {
        // Láminas de países
        const idNum = parseInt(sticker.id.replace(/^[A-Z]+/, ''));
        if (sticker.type === 'ESCUDO' || idNum === 1) {
            emoji = '🛡️';
        } else if (sticker.type === 'EQUIPO' || idNum === 13) {
            emoji = '👥';
        } else {
            emoji = '👤';
        }
        // Mostrar sigla + nombre
        displayName = `${displayId} ${name}`;
    } else if (specialKey) {
        // Láminas especiales
        if (specialKey === 'fwc_panini') {
            emoji = '⚽';
        } else if (specialKey === 'fwc_champions') {
            emoji = '🏆';
        } else if (specialKey === 'coca_cola') {
            emoji = '🥤';
        }
        displayName = `${displayId} ${name}`;
    }
    
    el.dataset.id = sticker.id;
    el.dataset.originalHtml = `
        <div class="sticker-emoji">${emoji}</div>
        <div class="sticker-id">${displayId}</div>
        <div class="sticker-name">${displayName}</div>
    `;
    // Mejora: búsqueda incluye ID, nombre y país
    el.dataset.searchable = `${sticker.id.toLowerCase()} ${name.toLowerCase()}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    el.dataset.stickerName = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    el.dataset.stickerId = sticker.id.toLowerCase();
    
    // Guardar referencia al grupo/país/especial para navegación
    if (countryData) {
        el.dataset.country = countryData.country;
        el.dataset.group = Object.keys(AppState.albumData.groups).find(g => 
            AppState.albumData.groups[g].some(c => c.country === countryData.country)
        );
    }
    if (specialKey) {
        el.dataset.special = specialKey;
    }
    
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
 * Busca y muestra un país específico manteniendo el modo de vista
 */
function searchAndDisplayCountry(countryName) {
    DOM.mainContainer.innerHTML = '';
    
    // Buscar el país en todos los grupos
    for (const [groupName, countries] of Object.entries(AppState.albumData.groups)) {
        const countryData = countries.find(c => c.country === countryName);
        if (countryData) {
            const section = createCountrySection(countryData);
            DOM.mainContainer.appendChild(section);
            
            // Aplicar filtros de vista y modo lista/grilla
            applyViewFilters();
            setListView(AppState.listMode);
            
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
    
    // Aplicar filtros de vista y modo lista/grilla
    applyViewFilters();
    setListView(AppState.listMode);
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
        grid.appendChild(createStickerElement(sticker, prefix, countryData));
    });
    
    return section;
}

/**
 * Renderiza una sección especial manteniendo el modo de vista
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
        grid.appendChild(createStickerElement(sticker, '', null, specialKey));
    });
    
    // Aplicar filtros de vista y modo lista/grilla
    applyViewFilters();
    setListView(AppState.listMode);
}

/**
 * Maneja la búsqueda de láminas - mejorada para buscar por nombre
 */
/**
 * Maneja la búsqueda global de láminas - busca en todo el álbum y muestra resultados clickeables
 */
function handleSearch(e) {
    const term = e.target.value.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Si el término está vacío, restaurar vista normal
    if (term === '') {
        DOM.mainContainer.innerHTML = '';
        if (AppState.activeGroup) {
            renderSection(AppState.activeGroup);
        } else {
            renderDashboard();
        }
        applyViewFilters();
        setListView(AppState.listMode);
        return;
    }
    
    // Búsqueda global en todos los grupos y especiales
    const results = [];
    
    // Buscar en grupos regulares
    Object.entries(AppState.albumData.groups).forEach(([groupName, countries]) => {
        countries.forEach(countryData => {
            countryData.stickers.forEach(sticker => {
                const searchable = `${sticker.id} ${sticker.name}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                if (searchable.includes(term)) {
                    results.push({
                        sticker,
                        country: countryData.country,
                        flag: countryData.flag || '🏳️',
                        group: groupName,
                        type: 'country'
                    });
                }
            });
        });
    });
    
    // Buscar en especiales
    Object.entries(AppState.albumData.specials).forEach(([specialKey, stickers]) => {
        stickers.forEach(sticker => {
            const searchable = `${sticker.id} ${sticker.name}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (searchable.includes(term)) {
                results.push({
                    sticker,
                    special: specialKey,
                    specialName: specialKey.replace('_', ' ').toUpperCase(),
                    type: 'special'
                });
            }
        });
    });
    
    // Mostrar resultados en un contenedor especial
    displaySearchResults(results, term);
}

/**
 * Muestra los resultados de búsqueda global con navegación al hacer click
 */
function displaySearchResults(results, term) {
    DOM.mainContainer.innerHTML = '';
    
    const section = document.createElement('section');
    section.className = 'country-section';
    section.innerHTML = `
        <div class="country-header">
            <span>🔍</span>
            <span>Resultados para "${term}" (${results.length})</span>
        </div>
        <div class="sticker-grid"></div>
    `;
    
    DOM.mainContainer.appendChild(section);
    const grid = section.querySelector('.sticker-grid');
    
    results.forEach(result => {
        let stickerElement;
        if (result.type === 'country') {
            const prefix = result.sticker.id.match(/^[A-Z]+/)[0];
            stickerElement = createStickerElement(result.sticker, prefix, { country: result.country, flag: result.flag });
        } else {
            stickerElement = createStickerElement(result.sticker, '', null, result.special);
        }
        
        // Añadir evento click para navegar al grupo/país
        stickerElement.addEventListener('click', () => {
            if (result.type === 'country') {
                // Navegar al grupo y mostrar el país específico
                AppState.activeGroup = result.group;
                setActiveNavButtonByGroup(result.group);
                searchAndDisplayCountry(result.country);
                DOM.searchInput.value = '';
            } else {
                // Navegar a la sección especial
                AppState.activeGroup = null;
                const specialBtn = Array.from(DOM.navContainer.querySelectorAll('.nav-btn'))
                    .find(btn => btn.dataset.special === result.special);
                if (specialBtn) {
                    setActiveNavButton(specialBtn);
                }
                renderSpecial(result.special);
                DOM.searchInput.value = '';
            }
            // Mantener el modo de vista actual
            setListView(AppState.listMode);
        });
        
        grid.appendChild(stickerElement);
    });
    
    if (results.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-secondary);">No se encontraron resultados</div>';
    }
    
    applyViewFilters();
    setListView(AppState.listMode);
}

/**
 * Establece el botón de navegación activo por nombre de grupo
 */
function setActiveNavButtonByGroup(groupName) {
    DOM.navContainer.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const btn = Array.from(DOM.navContainer.querySelectorAll('.nav-btn'))
        .find(b => b.dataset.group === groupName);
    if (btn) {
        btn.classList.add('active');
    }
}

/**
 * Aplica filtros por tipo de lámina (faltantes, repetidas, etc.)
 */
function applyViewFilters() {
    DOM.mainContainer.querySelectorAll('.sticker-item').forEach(el => {
        const stickerId = el.dataset.id;
        const count = AppState.inventory[stickerId] || 0;
        let show = true;
        
        switch (AppState.viewMode) {
            case 'missing':
                show = count === 0;
                break;
            case 'owned':
                show = count === 1;
                break;
            case 'repeated':
                show = count > 1;
                break;
            case 'all':
            default:
                show = true;
        }
        
        el.classList.toggle('filter-hidden', !show);
    });
    
    // Actualizar visibilidad de secciones
    DOM.mainContainer.querySelectorAll('.country-section').forEach(section => {
        const visibleStickers = section.querySelectorAll('.sticker-item:not(.hidden):not(.filter-hidden)').length;
        section.style.display = visibleStickers === 0 ? 'none' : 'block';
    });
}

/**
 * Cambia entre vista grilla y lista
 */
function setListView(isList) {
    AppState.listMode = isList;
    
    DOM.btnViewGrid.classList.toggle('active', !isList);
    DOM.btnViewList.classList.toggle('active', isList);
    
    DOM.mainContainer.querySelectorAll('.sticker-grid').forEach(grid => {
        grid.classList.toggle('list-view', isList);
    });
    
    showToast(isList ? 'Vista: Lista' : 'Vista: Grilla');
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
 * Comparte lista de faltantes por WhatsApp (Soporta Grupos y Especiales de forma segura)
 */
/**
 * Comparte lista de faltantes por WhatsApp (Formato compacto y limpio)
 */
function shareToWhatsApp() {
    const missing = [];

    // 1. Recorrer grupos regulares (A, B, C...)
    if (AppState.albumData.groups) {
        Object.keys(AppState.albumData.groups).forEach(groupKey => {
            AppState.albumData.groups[groupKey].forEach(countryData => {
                countryData.stickers.forEach(s => {
                    if (!AppState.inventory[s.id] || AppState.inventory[s.id] === 0) {
                        missing.push({ 
                            id: s.id, 
                            sectionName: countryData.country, 
                            flag: countryData.flag || '🏳️'
                        });
                    }
                });
            });
        });
    }

    // 2. Recorrer secciones especiales (Coca-Cola, Leyendas, etc.)
    if (AppState.albumData.specials) {
        Object.keys(AppState.albumData.specials).forEach(specialKey => {
            AppState.albumData.specials[specialKey].forEach(s => {
                if (!AppState.inventory[s.id] || AppState.inventory[s.id] === 0) {
                    missing.push({ 
                        id: s.id, 
                        sectionName: specialKey.replace('_', ' ').toUpperCase(), 
                        flag: '⭐'
                    });
                }
            });
        });
    }

    if (missing.length === 0) {
        showToast('¡No tienes láminas faltantes! 😎', 'success');
        return;
    }

    // 3. Agrupar los IDs encontrados por País o Sección Especial
    const bySection = {};
    missing.forEach(s => {
        if (!bySection[s.sectionName]) {
            bySection[s.sectionName] = {
                flag: s.flag,
                ids: []
            };
        }
        bySection[s.sectionName].ids.push(s.id);
    });

    // 4. Construir el mensaje formateado para WhatsApp
    let message = `🏆 *FWC 2026 - LÁMINAS FALTANTES*\n`;
    message += `Total por conseguir: *${missing.length}*\n\n`;
    
    Object.keys(bySection).sort().forEach(section => {
        const sectionData = bySection[section];
        const idsString = sectionData.ids.join(', ');
        message += `${sectionData.flag} *${section}*: ${idsString}\n`;
    });
    
    message += `\n¿Quién tiene algunas para intercambiar? 🙏`;

    // 5. Abrir la ventana de WhatsApp Web/App
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
}

/**
 * Comparte lista de repetidas por WhatsApp (Formato compacto y limpio)
 */
function shareDuplicatesToWhatsApp() {
    const duplicates = [];

    // 1. Recorrer grupos regulares buscando repetidas
    if (AppState.albumData.groups) {
        Object.keys(AppState.albumData.groups).forEach(groupKey => {
            AppState.albumData.groups[groupKey].forEach(countryData => {
                countryData.stickers.forEach(s => {
                    const count = AppState.inventory[s.id] || 0;
                    if (count > 1) {
                        duplicates.push({ 
                            id: s.id, 
                            sectionName: countryData.country, 
                            flag: countryData.flag || '🏳️',
                            count: count
                        });
                    }
                });
            });
        });
    }

    // 2. Recorrer secciones especiales buscando repetidas
    if (AppState.albumData.specials) {
        Object.keys(AppState.albumData.specials).forEach(specialKey => {
            AppState.albumData.specials[specialKey].forEach(s => {
                const count = AppState.inventory[s.id] || 0;
                if (count > 1) {
                    duplicates.push({ 
                        id: s.id, 
                        sectionName: specialKey.replace('_', ' ').toUpperCase(), 
                        flag: '⭐',
                        count: count
                    });
                }
            });
        });
    }

    if (duplicates.length === 0) {
        showToast('¡No tienes láminas repetidas para cambiar! 🔄', 'info');
        return;
    }

    // 3. Agrupar las repetidas por Sección
    const bySection = {};
    duplicates.forEach(s => {
        if (!bySection[s.sectionName]) {
            bySection[s.sectionName] = {
                flag: s.flag,
                items: []
            };
        }
        // Si tienes más de 1 repetida de la misma lámina, añade el multiplicador: ej. MEX02(x2)
        const displayId = s.count > 2 ? `${s.id}(x${s.count - 1})` : s.id;
        bySection[s.sectionName].items.push(displayId);
    });

    // 4. Construir el mensaje
    let message = `🔄 *FWC 2026 - LÁMINAS REPETIDAS*\n`;
    message += `¡Tengo estas disponibles para cambio! 🤝\n\n`;
    
    Object.keys(bySection).sort().forEach(section => {
        const sectionData = bySection[section];
        const idsString = sectionData.items.join(', ');
        message += `${sectionData.flag} *${section}*: ${idsString}\n`;
    });
    
    message += `\n¿A quién le sirven? ¡Hablemos por interno! 📝`;

    // 5. Abrir WhatsApp
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
}


/**
 * Obtiene la bandera emoji para un código de país
 */
function getCountryFlag(countryCode) {
    // Mapa de códigos de país a emojis de banderas
    const flagMap = {
        'ARG': '🇦🇷', 'AUS': '🇦🇺', 'BEL': '🇧🇪', 'BRA': '🇧🇷', 'CMR': '🇨🇲',
        'CAN': '🇨🇦', 'CHI': '🇨🇱', 'CHN': '🇨🇳', 'COL': '🇨🇴', 'CRC': '🇨🇷',
        'CRO': '🇭🇷', 'CZE': '🇨🇿', 'DEN': '🇩🇰', 'ECU': '🇪🇨', 'EGY': '🇪🇬',
        'ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'FRA': '🇫🇷', 'GER': '🇩🇪', 'GHA': '🇬🇭', 'GRE': '🇬🇷',
        'IRN': '🇮🇷', 'ITA': '🇮🇹', 'JPN': '🇯🇵', 'KOR': '🇰🇷', 'MAR': '🇲🇦',
        'MEX': '🇲🇽', 'NED': '🇳🇱', 'NGA': '🇳🇬', 'NOR': '🇳🇴', 'POL': '🇵🇱',
        'POR': '🇵🇹', 'QAT': '🇶🇦', 'KSA': '🇸🇦', 'SEN': '🇸🇳', 'SRB': '🇷🇸',
        'ESP': '🇪🇸', 'SWE': '🇸🇪', 'SUI': '🇨🇭', 'TUN': '🇹🇳', 'TUR': '🇹🇷',
        'UKR': '🇺🇦', 'URU': '🇺🇾', 'USA': '🇺🇸', 'WAL': '🏴󠁧󠁢󠁷󠁬󠁳󠁿'
    };
    return flagMap[countryCode] || '🏳️';
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
