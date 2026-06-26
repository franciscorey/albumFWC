/**
 * ============================================================================
 * FWC 2026 Album Tracker - Versión Definitiva con Progreso por Sección
 * ============================================================================
 */

// --- CONFIGURACIÓN GLOBAL ---
const CONFIG = {
    JSON_FILE: 'panini_world_cup_2026.json',
    STORAGE_KEY: 'fwc2026_inventory_v2',
    TOAST_DURATION: 2500
};

// --- ESTADO GENERAL DE LA APLICACIÓN ---
const AppState = {
    albumData: null,
    inventory: {},
    stats: { total: 0, groups: 0, countries: 0, specials: 0 },
    modeState: 0, // 0 = Solo Vista (Seguro), 1 = Sumar (+), 2 = Quitar (-)
    activeSection: 'A',
    isSpecial: false,
    viewMode: 'all',
    listMode: false,
    username: ''
};

// --- CONTENEDOR DE REFERENCIAS AL DOM ---
const DOM = {};


/**
 * ============================================================================
 * INICIALIZACIÓN Y FLUJO PRINCIPAL
 * ============================================================================
 */

// Orquestador de arranque al cargar el documento
document.addEventListener('DOMContentLoaded', () => {
    cacheDOM();
    loadInventory();
    initApp();
});

// Cachea las referencias del DOM para optimizar el rendimiento y evitar búsquedas repetitivas
function cacheDOM() {
    DOM.navContainer = document.getElementById('nav-groups');
    DOM.mainContainer = document.getElementById('app-main');
    DOM.searchInput = document.getElementById('search-input');
    DOM.btnModeSwitch = document.getElementById('btn-mode'); 
    
    // NUEVO: Captura el botón de configuración del header
    DOM.btnConfigToggle = document.getElementById('btn-config-toggle');
    
    DOM.dropdownBtn = document.getElementById('dropdown-export-btn');
    DOM.dropdownContent = document.getElementById('dropdown-export-content');
    
    DOM.btnExport = document.getElementById('btn-export');
    DOM.btnExportDup = document.getElementById('btn-export-dup');
    DOM.btnWhatsapp = document.getElementById('btn-whatsapp');
    DOM.btnWhatsappDup = document.getElementById('btn-whatsapp-dup');
    DOM.importFileInput = document.getElementById('import-file-input'); 
    
    DOM.printView = document.getElementById('print-view');
    DOM.printContent = document.getElementById('print-content');
    DOM.printDate = document.getElementById('print-date');
    DOM.printTotalMissing = document.getElementById('print-total-missing');
    DOM.printTotal = document.getElementById('print-total');

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

// Carga los datos guardados en el almacenamiento local del navegador
function loadInventory() {
    try {
        AppState.inventory = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY)) || {};
        // NUEVO: Cargar el nombre guardado (por defecto vacío si no existe)
        AppState.username = localStorage.getItem(CONFIG.STORAGE_KEY + '_user') || '';
    } catch (e) {
        AppState.inventory = {};
        AppState.username = '';
    }
}

// Guarda de forma persistente el inventario actual en formato JSON
function saveInventory() {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(AppState.inventory));
    // NUEVO: Guardar el nombre de forma independiente
    localStorage.setItem(CONFIG.STORAGE_KEY + '_user', AppState.username);
}

// Carga el archivo JSON base del álbum y levanta los componentes iniciales de la UI
async function initApp() {
    try {
        const response = await fetch(CONFIG.JSON_FILE);
        AppState.albumData = await response.json();
        
        calculateStats();
        renderDashboard();
        buildNavigation();
        buildCountryFilter();
        renderSection('A', false);
        updateProgress();
        setupModeButton(); 
        setupEventListeners();
    } catch (error) {
        console.error(error);
        if (DOM.mainContainer) DOM.mainContainer.innerHTML = '<div class="error-msg">Error cargando los datos.</div>';
    }
}


/**
 * ============================================================================
 * PROCESAMIENTO DE ESTADÍSTICAS Y MÁTRICES
 * ============================================================================
 */

// Escanea el JSON base para calcular totales absolutos, países y secciones especiales
function calculateStats() {
    AppState.stats.groups = Object.keys(AppState.albumData.groups).length;
    AppState.stats.specials = Object.keys(AppState.albumData.specials).length;
    AppState.stats.total = 0;
    AppState.stats.countries = 0;
    AppState.allCountries = [];
    
    Object.values(AppState.albumData.groups).forEach(group => {
        AppState.stats.countries += group.length;
        group.forEach(country => {
            AppState.stats.total += country.stickers.length;
            AppState.allCountries.push({ name: country.country, flag: country.flag || '🏳️' });
        });
    });
    
    Object.values(AppState.albumData.specials).forEach(special => {
        AppState.stats.total += special.length;
    });
}


/**
 * ============================================================================
 * GESTIÓN DE PROGRESO Y CONTADORES DINÁMICOS
 * ============================================================================
 */

// Inyecta la metadata inicial en las tarjetas estáticas superiores del Dashboard
function renderDashboard() {
    const uniqueOwned = Object.keys(AppState.inventory).filter(id => AppState.inventory[id] > 0).length;
    if (!DOM.dashboard) return;
    DOM.dashboard.innerHTML = `
        <div class="stat-card"><span class="stat-value">${AppState.stats.total}</span><span class="stat-label">Total Láminas</span></div>
        <div class="stat-card"><span class="stat-value">${AppState.stats.countries}</span><span class="stat-label">Países</span></div>
        <div class="stat-card"><span class="stat-value">${AppState.stats.groups}</span><span class="stat-label">Grupos</span></div>
        <div class="stat-card highlight"><span class="stat-value" id="dash-owned">${uniqueOwned}</span><span class="stat-label">Obtenidas</span></div>
    `;
}

// Recalcula y actualiza las barras e indicadores globales de progreso general de la app
function updateProgress() {
    const uniqueOwned = Object.keys(AppState.inventory).filter(id => AppState.inventory[id] > 0).length;
    const totalRepeated = Object.values(AppState.inventory).reduce((sum, count) => sum + Math.max(0, count - 1), 0);
    const percentage = AppState.stats.total > 0 ? ((uniqueOwned / AppState.stats.total) * 100).toFixed(1) : 0;
    
    if(DOM.progressPercentage) DOM.progressPercentage.textContent = `${percentage}%`;
    if(DOM.progressBarFill) DOM.progressBarFill.style.width = `${percentage}%`;
    if(DOM.progressCount) DOM.progressCount.textContent = `${uniqueOwned}/${AppState.stats.total}`;
    if(DOM.uniqueOwned) DOM.uniqueOwned.textContent = uniqueOwned;
    if(DOM.totalRepeated) DOM.totalRepeated.textContent = totalRepeated;
    
    const dashOwned = document.getElementById('dash-owned');
    if (dashOwned) dashOwned.textContent = uniqueOwned;

    // --- NUEVO: Actualizar el título con el nombre del usuario ---
    const labelEl = document.querySelector('.progress-label');
    if (labelEl) {
        if (AppState.username && AppState.username.trim() !== '') {
            // Inyectamos el nombre destacado con una clase CSS personalizada
            labelEl.innerHTML = `Progreso del Álbum de <span class="user-name-highlight">${AppState.username.toUpperCase()}</span>`;
        } else {
            labelEl.textContent = 'Progreso del álbum';
        }
    }

    updateSectionProgressBars();
}

// Actualiza de manera aislada los miniprogresos correspondientes a cada caja/sección cargada en pantalla
function updateSectionProgressBars() {
    DOM.mainContainer.querySelectorAll('.country-section').forEach(section => {
        const stickers = section.querySelectorAll('.sticker-item');
        if (stickers.length === 0) return;

        let ownedInSection = 0;
        stickers.forEach(el => {
            if (AppState.inventory[el.dataset.id] > 0) ownedInSection++;
        });

        const totalInSection = stickers.length;
        const pct = totalInSection > 0 ? (ownedInSection / totalInSection) * 100 : 0;

        const fillEl = section.querySelector('.sec-progress-fill');
        const textEl = section.querySelector('.sec-progress-text');

        if (fillEl) fillEl.style.width = `${pct}%`;
        if (textEl) textEl.textContent = `${ownedInSection}/${totalInSection}`;
    });
}


/**
 * ============================================================================
 * INTERRUPTORES DE MODO DE INTERACCIÓN (LOCK / PLUS / MINUS)
 * ============================================================================
 */

// Inicializa las clases de cursor por defecto en el elemento raíz del body
function setupModeButton() {
    document.body.classList.remove('cursor-safe', 'cursor-add', 'cursor-remove');
    document.body.classList.add('cursor-safe');
}

// Modifica la interfaz, estilos, toasts y cursores según el estado secuencial de edición seleccionado
function updateModeButton() {
    if (!DOM.btnModeSwitch) return;
    
    const icons = ['🔒', '➕', '➖'];
    const texts = ['Selección', 'Modo Añadir', 'Modo Quitar'];
    const classes = ['mode-safe', 'mode-adding', 'mode-removing'];
    
    DOM.btnModeSwitch.className = 'action-btn ' + classes[AppState.modeState];
    
    const iconEl = DOM.btnModeSwitch.querySelector('.btn-icon');
    const textEl = DOM.btnModeSwitch.querySelector('.btn-text');
    
    if (iconEl) iconEl.textContent = icons[AppState.modeState];
    if (textEl) textEl.textContent = texts[AppState.modeState];
    
    document.body.classList.remove('cursor-safe', 'cursor-add', 'cursor-remove');
    const bodyCursors = ['cursor-safe', 'cursor-add', 'cursor-remove'];
    document.body.classList.add(bodyCursors[AppState.modeState]);

    showToast(`Cambiado a: ${texts[AppState.modeState]}`);
}


/**
 * ============================================================================
 * RENDERIZADO DE COMPONENTES INTERNOS Y VISTAS
 * ============================================================================
 */

// Crea y retorna la estructura del nodo DOM correspondiente a una lámina individual
function createStickerElement(sticker, countryData = null, specialKey = null) {
    const el = document.createElement('div');
    const name = sticker.name || 'Lámina';
    
    let emoji = '👤';
    if (countryData) {
        const idNum = parseInt(sticker.id.replace(/^[A-Z]+/, ''));
        if (sticker.type === 'ESCUDO' || idNum === 1) emoji = '🛡️';
        else if (sticker.type === 'EQUIPO' || idNum === 13) emoji = '👥';
    } else if (specialKey) {
        if (specialKey === 'fwc_panini') emoji = '⚽';
        else if (specialKey === 'fwc_champions') emoji = '🏆';
        else if (specialKey === 'coca_cola') emoji = '🥤';
    }
    
    el.dataset.id = sticker.id;
    el.dataset.originalHtml = `
        <div class="sticker-emoji">${emoji}</div>
        <div class="sticker-id">${sticker.id}</div>
        <div class="sticker-name">${name}</div>
    `;
    
    updateStickerVisual(el);
    el.onclick = () => handleStickerClick(sticker.id, el, name);
    
    return el;
}

// Aplica o remueve estilos CSS de estados (obtenido/repetido) sobre las tarjetas visuales de láminas
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

// Construye dinámicamente los botones de las pestañas superiores de la barra de navegación
function buildNavigation() {
    if (!DOM.navContainer) return;
    DOM.navContainer.innerHTML = '';
    
    // 1. Botones de Grupos Tradicionales
    Object.keys(AppState.albumData.groups).forEach(group => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        if(group === AppState.activeSection && !AppState.isSpecial) btn.classList.add('active');
        btn.textContent = `Grupo ${group}`;
        btn.onclick = () => { 
            setActiveNavButton(btn); 
            AppState.isSpecial = false;
            AppState.activeSection = group;
            renderSection(group, true); 
        };
        DOM.navContainer.appendChild(btn);
    });
    
    // 2. Botones de Secciones Especiales
    Object.keys(AppState.albumData.specials).forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.textContent = key.replace('_', ' ').toUpperCase();
        btn.onclick = () => { 
            setActiveNavButton(btn); 
            AppState.isSpecial = true;
            AppState.activeSection = key;
            renderSpecial(key); 
        };
        DOM.navContainer.appendChild(btn);
    });

    // 3. Pestaña Fija de Configuración Avanzada (Al final del scroll horizontal)
    const configBtn = document.createElement('button');
    configBtn.className = 'nav-btn config-nav-item'; // Clase única para identificarla
    configBtn.innerHTML = '⚙️ Configuración';
    configBtn.onclick = () => {
        setActiveNavButton(configBtn);
        renderConfigPanel();
    };
    DOM.navContainer.appendChild(configBtn);
}

// Marca como activa la pestaña cliqueada y restablece los inputs de búsqueda secundaria
function setActiveNavButton(activeBtn) {
    DOM.navContainer.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
    if(DOM.searchInput) DOM.searchInput.value = '';
}

// Vacía el contenedor e inyecta los bloques de países asignados al grupo seleccionado
function renderSection(groupKey, clearSearch = false) {
    if(clearSearch && DOM.searchInput) DOM.searchInput.value = '';
    DOM.mainContainer.innerHTML = '';
    
    AppState.albumData.groups[groupKey].forEach(countryData => {
        DOM.mainContainer.appendChild(createCountrySection(countryData));
    });
    applyViewFilters();
    setListView(AppState.listMode);
    updateSectionProgressBars();
}

// Genera el componente contenedor estructural (Caja de Sección) para los países tradicionales
function createCountrySection(countryData) {
    const section = document.createElement('section');
    section.className = 'country-section';
    
    section.innerHTML = `
        <div class="country-header">
            <div class="country-title-side">
                <span>${countryData.flag || '🏳️'}</span>
                <span>${countryData.country}</span>
            </div>
            <div class="section-progress-container">
                <div class="sec-progress-bar"><div class="sec-progress-fill"></div></div>
                <span class="sec-progress-text">0/0</span>
            </div>
        </div>
        <div class="sticker-grid"></div>
    `;
    
    const grid = section.querySelector('.sticker-grid');
    countryData.stickers.forEach(sticker => {
        grid.appendChild(createStickerElement(sticker, countryData));
    });
    return section;
}

// Genera e inyecta el layout para las secciones especiales (ej: Coca Cola, FWC Panini)
function renderSpecial(specialKey) {
    DOM.mainContainer.innerHTML = '';
    const section = document.createElement('section');
    section.className = 'country-section';
    section.innerHTML = `
        <div class="country-header">
            <div class="country-title-side">
                <span>⭐</span> <span>${specialKey.replace('_', ' ').toUpperCase()}</span>
            </div>
            <div class="section-progress-container">
                <div class="sec-progress-bar"><div class="sec-progress-fill"></div></div>
                <span class="sec-progress-text">0/0</span>
            </div>
        </div>
        <div class="sticker-grid"></div>
    `;
    
    DOM.mainContainer.appendChild(section);
    const grid = section.querySelector('.sticker-grid');
    
    AppState.albumData.specials[specialKey].forEach(sticker => {
        grid.appendChild(createStickerElement(sticker, null, specialKey));
    });
    applyViewFilters();
    setListView(AppState.listMode);
    updateSectionProgressBars();
}


/**
 * ============================================================================
 * SISTEMAS DE FILTRADO, BÚSQUEDAS Y ALTERNADORES DE VISTA
 * ============================================================================
 */

// Construye dinámicamente el listado interno de fichas rápidas del panel lateral de países
function buildCountryFilter() {
    if (!DOM.countryList) return;
    DOM.countryList.innerHTML = '';
    
    AppState.allCountries.forEach(country => {
        const chip = document.createElement('div');
        chip.className = 'country-chip';
        chip.innerHTML = `<span>${country.flag}</span> <span>${country.name}</span>`;
        chip.onclick = () => {
            DOM.countryList.querySelectorAll('.country-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            if(DOM.searchInput) DOM.searchInput.value = country.name;
            handleGlobalSearch({ target: { value: country.name } });
            DOM.countryFilterPanel.classList.remove('open');
            DOM.btnFilterCountry.classList.remove('active');
        };
        DOM.countryList.appendChild(chip);
    });
}

// Despliega o repliega visualmente la barra o panel lateral para filtrados rápidos de países
function toggleCountryFilter() {
    DOM.countryFilterPanel.classList.toggle('open');
    DOM.btnFilterCountry.classList.toggle('active');
}

// Filtro en tiempo real: Muestra elementos si coinciden con el ID, el nombre de la lámina, o el nombre del país
function handleGlobalSearch(e) {
    const query = e.target.value.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    if (query === '') {
        if (AppState.isSpecial) {
            renderSpecial(AppState.activeSection);
        } else {
            renderSection(AppState.activeSection, false);
        }
        return;
    }
    
    DOM.mainContainer.innerHTML = '';
    
    const searchSection = document.createElement('section');
    searchSection.className = 'country-section';
    searchSection.innerHTML = `
        <div class="country-header">
            <div class="country-title-side">
                <span>🔍</span> Resultados de Búsqueda Global
            </div>
            <div class="section-progress-container">
                <div class="sec-progress-bar"><div class="sec-progress-fill" style="width: 0%"></div></div>
                <span class="sec-progress-text">0/0</span>
            </div>
        </div>
        <div class="sticker-grid" id="search-results-grid"></div>
    `;
    DOM.mainContainer.appendChild(searchSection);
    const grid = document.getElementById('search-results-grid');
    
    let totalMatches = 0;

    // 1. Búsqueda en Grupos / Países
    Object.values(AppState.albumData.groups).flat().forEach(country => {
        // Normalizamos el nombre del país para la comparación (ej: "Marruecos" -> "marruecos")
        const countryName = (country.country || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const isCountryMatch = countryName.includes(query);

        country.stickers.forEach(sticker => {
            const stickerName = (sticker.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            
            // CORRECCIÓN: Si coincide el país, o el ID, o el nombre del sticker, se agrega al resultado
            if (isCountryMatch || sticker.id.toLowerCase().includes(query) || stickerName.includes(query)) {
                grid.appendChild(createStickerElement(sticker, country));
                totalMatches++;
            }
        });
    });
    
    // 2. Búsqueda en Secciones Especiales
    Object.entries(AppState.albumData.specials).forEach(([key, stickers]) => {
        const specialKeyName = key.toLowerCase().replace('_', ' ');
        const isSpecialKeyMatch = specialKeyName.includes(query);

        stickers.forEach(sticker => {
            const stickerName = (sticker.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            
            if (isSpecialKeyMatch || sticker.id.toLowerCase().includes(query) || stickerName.includes(query)) {
                grid.appendChild(createStickerElement(sticker, null, key));
                totalMatches++;
            }
        });
    });

    if (totalMatches === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; padding: 20px; text-align: center; color: var(--text-secondary);">No se encontraron láminas coordinadas con la búsqueda.</div>';
    }

    applyViewFilters();
    setListView(AppState.listMode);
    updateSectionProgressBars();
}

// Filtra la visibilidad en base al selector de condiciones (Todas / Faltantes / Obtenidas / Repetidas)
function applyViewFilters() {
    DOM.mainContainer.querySelectorAll('.sticker-item').forEach(el => {
        const stickerId = el.dataset.id;
        const count = AppState.inventory[stickerId] || 0;
        let show = true;
        
        switch (AppState.viewMode) {
            case 'missing': show = count === 0; break;
            case 'owned': show = count === 1; break;
            case 'repeated': show = count > 1; break;
        }
        el.classList.toggle('filter-hidden', !show);
    });
}

// Alterna la visualización del contenedor principal entre estructura Grid (mosaicos) o Lista compacta
function setListView(isList) {
    AppState.listMode = isList;
    if (DOM.btnViewGrid) DOM.btnViewGrid.classList.toggle('active', !isList);
    if (DOM.btnViewList) DOM.btnViewList.classList.toggle('active', isList);
    DOM.mainContainer.querySelectorAll('.sticker-grid').forEach(grid => {
        grid.classList.toggle('list-view', isList);
    });
}


/**
 * ============================================================================
 * MANEJADORES DE EVENTOS DE USUARIO (CLICK / INPUT / SELECT)
 * ============================================================================
 */

// Registra y rutea todas las acciones de eventos capturadas de los elementos interactivos
function setupEventListeners() {
    if (DOM.btnModeSwitch) {
        DOM.btnModeSwitch.addEventListener('click', (e) => {
            e.preventDefault();
            AppState.modeState = (AppState.modeState + 1) % 3;
            updateModeButton();
        });
    }

    // NUEVO: Al hacer clic en el engranaje, renderiza el panel avanzado en la zona principal
    if (DOM.btnConfigToggle) {
        DOM.btnConfigToggle.addEventListener('click', (e) => {
            e.preventDefault();
            // Desmarcar pestañas activas de grupos si las hay
            if (DOM.navContainer) {
                DOM.navContainer.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            }
            renderConfigPanel();
        });
    }
    
    if (DOM.dropdownBtn && DOM.dropdownContent) {
        DOM.dropdownBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            DOM.dropdownContent.classList.toggle('show');
        });
    }

    document.addEventListener('click', () => {
        if (DOM.dropdownContent) DOM.dropdownContent.classList.remove('show');
    });

    if (DOM.btnExport) DOM.btnExport.addEventListener('click', () => { exportToPDF(); });
    if (DOM.btnExportDup) DOM.btnExportDup.addEventListener('click', () => { exportDuplicatesToPDF(); }); 
    if (DOM.btnWhatsapp) DOM.btnWhatsapp.addEventListener('click', () => { shareToWhatsApp(); });
    if (DOM.btnWhatsappDup) DOM.btnWhatsappDup.addEventListener('click', () => { shareDuplicatesToWhatsApp(); });
    
    if (DOM.searchInput) DOM.searchInput.addEventListener('input', handleGlobalSearch);
    if (DOM.btnFilterCountry) DOM.btnFilterCountry.addEventListener('click', toggleCountryFilter);
    if (DOM.btnCloseFilter) {
        DOM.btnCloseFilter.addEventListener('click', () => {
            DOM.countryFilterPanel.classList.remove('open');
            DOM.btnFilterCountry.classList.remove('active');
        });
    }
    
    if (DOM.viewModeSelect) {
        DOM.viewModeSelect.addEventListener('change', (e) => {
            AppState.viewMode = e.target.value;
            applyViewFilters();
        });
    }
    
    if (DOM.btnViewGrid) DOM.btnViewGrid.addEventListener('click', () => setListView(false));
    if (DOM.btnViewList) DOM.btnViewList.addEventListener('click', () => setListView(true));

    if (DOM.importFileInput) {
        DOM.importFileInput.addEventListener('change', handleImportFile);
    }
}

// Administra el clic sobre una lámina individual ejecutando sumas o restas según el modo activo
function handleStickerClick(stickerId, element, name) {
    if (AppState.modeState === 0) {
        showToast(`📌 [${stickerId}] - ${name}`, 'info');
        return;
    }
    
    const currentCount = AppState.inventory[stickerId] || 0;
    
    if (AppState.modeState === 1) {
        AppState.inventory[stickerId] = currentCount + 1;
    } else if (AppState.modeState === 2 && currentCount > 0) {
        AppState.inventory[stickerId] = currentCount - 1;
    }
    
    if (AppState.inventory[stickerId] === 0) {
        delete AppState.inventory[stickerId];
    }
    
    saveInventory();
    updateStickerVisual(element);
    updateProgress();
}


// ============================================================================
// REPORTES DE IMPRESIÓN (PDF)
// ============================================================================

// RESTAURADO: Tu formato original detallado para las láminas FALTANTES
function exportToPDF() {
    if (!DOM.printView || !DOM.printContent) return;

    if (DOM.printDate) DOM.printDate.textContent = new Date().toLocaleDateString();
    
    const titleEl = DOM.printView.querySelector('h1');
    if (titleEl) titleEl.textContent = AppState.username ? `📋 Láminas Faltantes - Álbum de ${AppState.username.toUpperCase()}` : '📋 Láminas Faltantes - FWC 2026';

    let totalMissing = 0;
    let htmlContent = '';

    // Mapear Grupos
    Object.values(AppState.albumData.groups).flat().forEach(c => {
        const missingStickers = c.stickers.filter(s => (AppState.inventory[s.id] || 0) === 0);
        
        if (missingStickers.length > 0) {
            totalMissing += missingStickers.length;
            const flag = getCountryFlag(c.country);
            
            htmlContent += `
                <div class="print-country-block">
                    <h3>${flag} ${c.country.toUpperCase()}</h3>
                    <table class="print-table-detailed">
                        <thead>
                            <tr>
                                <th style="width: 25%">Código</th>
                                <th style="width: 75%">Descripción / Jugador</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${missingStickers.map(s => `
                                <tr>
                                    <td><strong>${formatStickerId(s.id)}</strong></td>
                                    <td>${s.name || 'Lámina estándar'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    });

    // Mapear Especiales
    Object.entries(AppState.albumData.specials).forEach(([key, stickers]) => {
        const missingStickers = stickers.filter(s => (AppState.inventory[s.id] || 0) === 0);
        
        if (missingStickers.length > 0) {
            totalMissing += missingStickers.length;
            htmlContent += `
                <div class="print-country-block">
                    <h3>✨ ${key.replace('_', ' ').toUpperCase()}</h3>
                    <table class="print-table-detailed">
                        <thead>
                            <tr>
                                <th style="width: 25%">Código</th>
                                <th style="width: 75%">Descripción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${missingStickers.map(s => `
                                <tr>
                                    <td><strong>${formatStickerId(s.id)}</strong></td>
                                    <td>${s.name || 'Sección Especial'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    });

    if (DOM.printTotalMissing) DOM.printTotalMissing.textContent = totalMissing;
    if (DOM.printTotal) DOM.printTotal.textContent = AppState.stats.total;

    if (totalMissing === 0) {
        DOM.printContent.innerHTML = '<p style="text-align:center; padding: 20px;">¡Álbum completo! No tienes láminas faltantes. 🎉</p>';
    } else {
        DOM.printContent.innerHTML = htmlContent;
    }

    window.print();
}

// OPTIMIZADO: Formato ultra resumido, en línea y sin nombres para las REPETIDAS
function exportDuplicatesToPDF() {
    if (!DOM.printView || !DOM.printContent) return;

    if (DOM.printDate) DOM.printDate.textContent = new Date().toLocaleDateString();
    
    const titleEl = DOM.printView.querySelector('h1');
    if (titleEl) titleEl.textContent = AppState.username ? `🔄 Repetidas: ${AppState.username.toUpperCase()}` : '🔄 Lista de Repetidas';

    let totalDups = 0;
    let htmlContent = '<div class="print-dense-container">';

    // Mapear Grupos
    Object.values(AppState.albumData.groups).flat().forEach(c => {
        const dupStickers = c.stickers.filter(s => (AppState.inventory[s.id] || 0) > 1);
        
        if (dupStickers.length > 0) {
            const flag = getCountryFlag(c.country);
            const stickersLine = dupStickers.map(s => {
                const amount = AppState.inventory[s.id] - 1;
                totalDups += amount;
                return `<strong>${formatStickerId(s.id)}</strong>${amount > 1 ? `(x${amount})` : ''}`;
            }).join(', ');

            htmlContent += `
                <div class="print-row-dense">
                    <span class="print-country-label">${flag} ${c.country.toUpperCase()}:</span>
                    <span class="print-inline-list">${stickersLine}</span>
                </div>
            `;
        }
    });

    // Mapear Especiales
    Object.entries(AppState.albumData.specials).forEach(([key, stickers]) => {
        const dupStickers = stickers.filter(s => (AppState.inventory[s.id] || 0) > 1);
        
        if (dupStickers.length > 0) {
            const stickersLine = dupStickers.map(s => {
                const amount = AppState.inventory[s.id] - 1;
                totalDups += amount;
                return `<strong>${formatStickerId(s.id)}</strong>${amount > 1 ? `(x${amount})` : ''}`;
            }).join(', ');

            htmlContent += `
                <div class="print-row-dense">
                    <span class="print-country-label">🔄 ${key.replace('_', ' ').toUpperCase()}:</span>
                    <span class="print-inline-list">${stickersLine}</span>
                </div>
            `;
        }
    });

    htmlContent += '</div>';

    const summaryEl = DOM.printView.querySelector('.print-summary');
    if (summaryEl) summaryEl.innerHTML = `Total repetidas: <strong>${totalDups}</strong>`;

    if (totalDups === 0) {
        DOM.printContent.innerHTML = '<p style="text-align:center; padding: 20px;">No tienes láminas repetidas registradas aún. 🔄</p>';
    } else {
        DOM.printContent.innerHTML = htmlContent;
    }

    window.print();
}


/**
 * ============================================================================
 * MÓDULO DE EXPORTACIÓN EXTERNA (WHATSAPP ORIGINAL FORMAT)
 * ============================================================================
 */

// Helper para obtener el emoji de la bandera desde los datos del país
function getCountryFlag(countryName) {
    const found = AppState.allCountries.find(c => c.name.toLowerCase() === countryName.toLowerCase());
    return found ? found.flag : '🏴';
}

// Helper para formatear el ID (de MEX03 a MEX-03)
function formatStickerId(id) {
    // Separa las letras de los números usando una expresión regular
    return id.replace(/^([A-Z]+)(\d+)$/, '$1-$2');
}

function shareToWhatsApp() {
    const missing = [];
    let totalMissingCount = 0;

    Object.values(AppState.albumData.groups).flat().forEach(c => {
        const countryMissing = c.stickers
            .filter(s => (AppState.inventory[s.id] || 0) === 0)
            .map(s => formatStickerId(s.id));
            
        if(countryMissing.length > 0) {
            totalMissingCount += countryMissing.length;
            const flag = getCountryFlag(c.country);
            missing.push(`${flag} *${c.country.toUpperCase()}:* ${countryMissing.join(', ')}`);
        }
    });

    Object.entries(AppState.albumData.specials).forEach(([key, stickers]) => {
        const specialMissing = stickers
            .filter(s => (AppState.inventory[s.id] || 0) === 0)
            .map(s => formatStickerId(s.id));
            
        if(specialMissing.length > 0) {
            totalMissingCount += specialMissing.length;
            missing.push(`✨ *${key.replace('_',' ').toUpperCase()}:* ${specialMissing.join(', ')}`);
        }
    });

    if (missing.length === 0) {
        showToast('¡Felicitaciones! No tienes láminas faltantes. 🏆', 'success');
        return;
    }

    const message = `📋 *MIS FALTANTES PANINI FWC 2026 (${totalMissingCount})*\n\n${missing.join('\n')}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
}

function shareDuplicatesToWhatsApp() {
    const dups = [];
    let totalDupsCount = 0;

    Object.values(AppState.albumData.groups).flat().forEach(c => {
        const countryDups = c.stickers
            .filter(s => (AppState.inventory[s.id] || 0) > 1)
            .map(s => {
                const count = AppState.inventory[s.id] - 1;
                totalDupsCount += count;
                return `${formatStickerId(s.id)}${count > 1 ? ` (x${count})` : ''}`;
            });
            
        if(countryDups.length > 0) {
            const flag = getCountryFlag(c.country);
            dups.push(`${flag} *${c.country.toUpperCase()}:* ${countryDups.join(', ')}`);
        }
    });

    Object.entries(AppState.albumData.specials).forEach(([key, stickers]) => {
        const specialDups = stickers
            .filter(s => (AppState.inventory[s.id] || 0) > 1)
            .map(s => {
                const count = AppState.inventory[s.id] - 1;
                totalDupsCount += count;
                return `${formatStickerId(s.id)}${count > 1 ? ` (x${count})` : ''}`;
            });
            
        if(specialDups.length > 0) {
            dups.push(`🔄 *${key.replace('_',' ').toUpperCase()}:* ${specialDups.join(', ')}`);
        }
    });

    if (dups.length === 0) {
        showToast('No tienes láminas repetidas para compartir aún. 🔄', 'info');
        return;
    }

    const message = `🔄 *MIS REPETIDAS PANINI FWC 2026 (${totalDupsCount})*\n\n${dups.join('\n')}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
}

/**
 * ============================================================================
 * PANEL DE CONFIGURACIÓN Y SISTEMA DE RESPALDO JSON
 * ============================================================================
 */

// Renders el panel completo de configuración y utilidades de base de datos
function renderConfigPanel() {
    if(DOM.searchInput) DOM.searchInput.value = '';
    DOM.mainContainer.innerHTML = '';

    const configSection = document.createElement('div');
    configSection.className = 'config-container';

    configSection.innerHTML = `
        <div class="config-card">
            <h2>👤 Personalización del Álbum</h2>
            <p>Escribe tu nombre para personalizar esta App.</p>
            <div class="search-box" style="margin-top: 10px;">
                <input type="text" id="input-username" class="search-input" placeholder="Ej: Tu Nombre..." value="${AppState.username}" style="width: 100%; border: 2px solid var(--text-primary);">
            </div>
        </div>
        
        <div class="config-card">
            <h2>💾 Copias de Seguridad</h2>
            <p>Descarga un archivo local con tu progreso guardado para transferirlo a otro navegador o tener un respaldo seguro.</p>
            <div class="config-buttons-grid">
                <button class="panel-btn btn-accent-blue" id="panel-export-json">📤 Guardar Respaldo (.json)</button>
                <button class="panel-btn" id="panel-import-json">📥 Cargar Respaldo desde archivo</button>
            </div>
        </div>

        <div class="config-card">
            <h2>📄 Guardar listados en PDF</h2>
            <p>Genera un documento listo de tus laminas faltantes o repetidas para guardar o imprimir de forma fácil.</p>
            <div class="config-buttons-grid">
                <button class="panel-btn" id="panel-export-pdf-missing">📄 Láminas Faltantes (PDF)</button>
                <button class="panel-btn" id="panel-export-pdf-dup">🔄 Láminas Repetidas (PDF)</button>
            </div>
        </div>

        <div class="config-card">
            <h2>💬 Intercambio por Mensaje Whatsapp</h2>
            <p>Genera listas compactas formateadas para enviarlas directamente a tus grupos de intercambio.</p>
            <div class="config-buttons-grid">
                <button class="panel-btn" id="panel-share-wa-missing">💬 Enviar Faltantes (WhatsApp)</button>
                <button class="panel-btn" id="panel-share-wa-dup">🔁 Enviar Repetidas (WhatsApp)</button>
            </div>
        </div>
    `;

    DOM.mainContainer.appendChild(configSection);

    // Escucha de cambios en el input del nombre en tiempo real
    const inputUser = document.getElementById('input-username');
    if (inputUser) {
        inputUser.addEventListener('input', (e) => {
            AppState.username = e.target.value;
            saveInventory(); // Guarda el nombre de inmediato
            updateProgress(); // Refresca la barra superior en tiempo real
        });
    }

    // Mapear los eventos de los botones internos una vez inyectados en el contenedor
    document.getElementById('panel-export-json').onclick = exportInventoryToJSON;
    document.getElementById('panel-import-json').onclick = () => DOM.importFileInput.click();
    document.getElementById('panel-export-pdf-missing').onclick = exportToPDF;
    document.getElementById('panel-export-pdf-dup').onclick = exportDuplicatesToPDF;
    document.getElementById('panel-share-wa-missing').onclick = shareToWhatsApp;
    document.getElementById('panel-share-wa-dup').onclick = shareDuplicatesToWhatsApp;
}

// EXPORTAR JSON: Transforma el inventario actual en un archivo de texto plano descargable
function exportInventoryToJSON() {
    if (Object.keys(AppState.inventory).length === 0) {
        showToast('No tienes láminas registradas para respaldar aún.', 'info');
        return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(AppState.inventory, null, 2));
    const downloadAnchor = document.createElement('a');
    
    const dateStr = new Date().toISOString().slice(0,10);
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `album_fwc2026_backup_${dateStr}.json`);
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('¡Archivo de respaldo generado! 💾', 'success');
}

// IMPORTAR JSON: Lee el archivo seleccionado por el usuario, valida y actualiza el almacenamiento
function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const parsedInventory = JSON.parse(event.target.result);
            
            if (typeof parsedInventory !== 'object' || parsedInventory === null) {
                throw new Error("Formato inválido");
            }

            if (confirm("¿Deseas importar este respaldo? Esto reemplazará tu progreso actual.")) {
                AppState.inventory = parsedInventory;
                saveInventory();
                updateProgress();
                showToast('¡Progreso restaurado! 📥', 'success');
                
                // Redirigir al primer grupo para refrescar la vista
                const firstNavBtn = DOM.navContainer.querySelector('.nav-btn');
                if(firstNavBtn) firstNavBtn.click();
            }
        } catch (err) {
            alert("Error: El archivo no es un respaldo válido.");
            console.error(err);
        }
        DOM.importFileInput.value = '';
    };
    reader.readAsText(file);
}

/**
 * ============================================================================
 * COMPONENTES DE FEEDBACK VISUAL (TOASTS)
 * ============================================================================
 */

// Despliega barras de alerta o burbujas informativas autolimpiables en el pie del layout
function showToast(message, type = 'info') {
    if (!DOM.toast) return;
    DOM.toast.textContent = message;
    DOM.toast.className = `toast ${type} show`;
    setTimeout(() => DOM.toast.classList.remove('show'), CONFIG.TOAST_DURATION);
}
