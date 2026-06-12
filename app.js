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
    listMode: false
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
    
    // Elementos del Dropdown de Exportación y Compartir
    DOM.dropdownBtn = document.getElementById('dropdown-export-btn');
    DOM.dropdownContent = document.getElementById('dropdown-export-content');
    DOM.btnExport = document.getElementById('btn-export');
    DOM.btnExportDup = document.getElementById('btn-export-dup'); // <-- Nuevo botón asignado en setupEventListeners
    DOM.btnWhatsapp = document.getElementById('btn-whatsapp');
    DOM.btnWhatsappDup = document.getElementById('btn-whatsapp-dup');
    
    // Contenedores para el sistema de Impresión Nativa (CSS Print)
    DOM.printView = document.getElementById('print-view');
    DOM.printContent = document.getElementById('print-content');
    DOM.printDate = document.getElementById('print-date');
    DOM.printTotalMissing = document.getElementById('print-total-missing');
    DOM.printTotal = document.getElementById('print-total');

    // Paneles de control, Contadores y Modales de Filtrado
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
    } catch (e) {
        AppState.inventory = {};
    }
}

// Guarda de forma persistente el inventario actual en formato JSON
function saveInventory() {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(AppState.inventory));
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
    const texts = ['Solo Vista', 'Modo Añadir', 'Modo Quitar'];
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
    
    Object.keys(AppState.albumData.groups).forEach(group => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        if(group === 'A') btn.classList.add('active');
        btn.textContent = `Grupo ${group}`;
        btn.onclick = () => { 
            setActiveNavButton(btn); 
            AppState.isSpecial = false;
            AppState.activeSection = group;
            renderSection(group, true); 
        };
        DOM.navContainer.appendChild(btn);
    });
    
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
        };
        DOM.countryList.appendChild(chip);
    });
}

// Despliega o repliega visualmente la barra o panel lateral para filtrados rápidos de países
function toggleCountryFilter() {
    DOM.countryFilterPanel.classList.toggle('open');
    DOM.btnFilterCountry.classList.toggle('active');
}

// Filtro en tiempo real: Oculta o muestra elementos según coincidan por ID o por nombre normalizado
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

    Object.values(AppState.albumData.groups).flat().forEach(country => {
        country.stickers.forEach(sticker => {
            const stickerName = (sticker.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (sticker.id.toLowerCase().includes(query) || stickerName.includes(query)) {
                grid.appendChild(createStickerElement(sticker, country));
                totalMatches++;
            }
        });
    });
    
    Object.entries(AppState.albumData.specials).forEach(([key, stickers]) => {
        stickers.forEach(sticker => {
            const stickerName = (sticker.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (sticker.id.toLowerCase().includes(query) || stickerName.includes(query)) {
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
    
    if (DOM.dropdownBtn) {
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
    if (DOM.btnExportDup) DOM.btnExportDup.addEventListener('click', () => { exportDuplicatesToPDF(); }); // <-- Evento de nuevo botón PDF repetidas
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


/**
 * ============================================================================
 * MÓDULO NATIVO DE EXPORTACIÓN (SISTEMA DE IMPRESIÓN PDF)
 * ============================================================================
 */

// Filtra las láminas faltantes, renderiza el HTML oculto de impresión y ejecuta el comando de guardado nativo
function exportToPDF() {
    if (!DOM.printContent) return;
    
    let html = '';
    let totalMissing = 0;
    
    Object.values(AppState.albumData.groups).flat().forEach(c => {
        const missingStickers = c.stickers.filter(s => !AppState.inventory[s.id]);
        if (missingStickers.length > 0) {
            totalMissing += missingStickers.length;
            html += `<div class="print-section-title">${c.flag || '🏳️'} ${c.country}</div>`;
            missingStickers.forEach(s => {
                html += `<div class="print-missing-item">${s.id} - ${s.name}</div>`;
            });
        }
    });

    Object.entries(AppState.albumData.specials).forEach(([key, stickers]) => {
        const missingStickers = stickers.filter(s => !AppState.inventory[s.id]);
        if (missingStickers.length > 0) {
            totalMissing += missingStickers.length;
            html += `<div class="print-section-title">⭐ ${key.replace('_', ' ').toUpperCase()}</div>`;
            missingStickers.forEach(s => {
                html += `<div class="print-missing-item">${s.id} - ${s.name}</div>`;
            });
        }
    });
    
    if (totalMissing === 0) {
        showToast('¡No tienes láminas faltantes! El álbum está completo. 🏆', 'success');
        return;
    }

    // Configura la cabecera estándar de láminas faltantes
    if (DOM.printView) {
        const titleEl = DOM.printView.querySelector('h1');
        const summaryEl = DOM.printView.querySelector('.print-summary');
        if (titleEl) titleEl.innerHTML = '🏆 Láminas Faltantes - FWC 2026';
        if (summaryEl) summaryEl.innerHTML = `Total faltantes: <span id="print-total-missing">${totalMissing}</span> de <span id="print-total">${AppState.stats.total}</span>`;
    }

    DOM.printContent.innerHTML = html;
    if (DOM.printDate) DOM.printDate.textContent = new Date().toLocaleDateString('es-CH');

    window.print();
}

// NUEVA FUNCIÓN: Filtra las láminas repetidas (>1), reestructura temporalmente la hoja oculta y lanza el PDF nativo
function exportDuplicatesToPDF() {
    if (!DOM.printContent) return;
    
    let html = '';
    let totalRepeated = 0;
    
    Object.values(AppState.albumData.groups).flat().forEach(c => {
        const repeatedStickers = c.stickers.filter(s => AppState.inventory[s.id] > 1);
        if (repeatedStickers.length > 0) {
            html += `<div class="print-section-title">${c.flag || '🏳️'} ${c.country}</div>`;
            repeatedStickers.forEach(s => {
                const count = AppState.inventory[s.id] - 1;
                totalRepeated += count;
                html += `<div class="print-missing-item">${s.id} - ${s.name} <strong>(x${count})</strong></div>`;
            });
        }
    });

    Object.entries(AppState.albumData.specials).forEach(([key, stickers]) => {
        const repeatedStickers = stickers.filter(s => AppState.inventory[s.id] > 1);
        if (repeatedStickers.length > 0) {
            html += `<div class="print-section-title">⭐ ${key.replace('_', ' ').toUpperCase()}</div>`;
            repeatedStickers.forEach(s => {
                const count = AppState.inventory[s.id] - 1;
                totalRepeated += count;
                html += `<div class="print-missing-item">${s.id} - ${s.name} <strong>(x${count})</strong></div>`;
            });
        }
    });
    
    if (totalRepeated === 0) {
        showToast('No tienes láminas repetidas para exportar. 🔄', 'info');
        return;
    }

    // Modifica dinámicamente la cabecera de la hoja oculta para que indique "Repetidas"
    if (DOM.printView) {
        const titleEl = DOM.printView.querySelector('h1');
        const summaryEl = DOM.printView.querySelector('.print-summary');
        if (titleEl) titleEl.innerHTML = '🔄 Láminas Repetidas - FWC 2026';
        if (summaryEl) summaryEl.innerHTML = `Total repetidas acumuladas: <strong>${totalRepeated}</strong>`;
    }

    DOM.printContent.innerHTML = html;
    if (DOM.printDate) DOM.printDate.textContent = new Date().toLocaleDateString('es-CH');

    window.print();
}


/**
 * ============================================================================
 * MÓDULO DE EXPORTACIÓN EXTERNA (WHATSAPP ORIGINAL FORMAT)
 * ============================================================================
 */

// Filtra las faltantes y abre un hilo directo de WhatsApp con la lista limpia y compacta original
function shareToWhatsApp() {
    const missing = [];
    
    Object.values(AppState.albumData.groups).flat().forEach(c => {
        const countryMissing = c.stickers.filter(s => !AppState.inventory[s.id]).map(s => s.id);
        if(countryMissing.length > 0) {
            missing.push(`*${c.country}:* ${countryMissing.join(', ')}`);
        }
    });
    
    Object.entries(AppState.albumData.specials).forEach(([key, stickers]) => {
        const specialMissing = stickers.filter(s => !AppState.inventory[s.id]).map(s => s.id);
        if(specialMissing.length > 0) {
            missing.push(`*${key.replace('_',' ').toUpperCase()}:* ${specialMissing.join(', ')}`);
        }
    });

    if (missing.length === 0) {
        showToast('¡No tienes láminas faltantes! 😎', 'success');
        return;
    }

    const totalMissing = Object.values(AppState.albumData.groups).flat().reduce((sum, c) => sum + c.stickers.filter(s => !AppState.inventory[s.id]).length, 0) +
                         Object.values(AppState.albumData.specials).flat().reduce((sum, s) => sum + (!AppState.inventory[s.id] ? 1 : 0), 0);

    const message = `🏆 *MIS FALTANTES PANINI FWC 2026 (${totalMissing})*\n\n${missing.join('\n')}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
}

// Filtra las repetidas (>1) y comparte por WhatsApp la lista formateada mostrando las cantidades sobrantes
function shareDuplicatesToWhatsApp() {
    const dups = [];
    
    Object.values(AppState.albumData.groups).flat().forEach(c => {
        const countryDups = c.stickers.filter(s => AppState.inventory[s.id] > 1).map(s => `${s.id} (x${AppState.inventory[s.id] - 1})`);
        if(countryDups.length > 0) {
            dups.push(`*${c.country}:* ${countryDups.join(', ')}`);
        }
    });
    
    Object.entries(AppState.albumData.specials).forEach(([key, stickers]) => {
        const specialDups = stickers.filter(s => AppState.inventory[s.id] > 1).map(s => `${s.id} (x${AppState.inventory[s.id] - 1})`);
        if(specialDups.length > 0) {
            dups.push(`*${key.replace('_',' ').toUpperCase()}:* ${specialDups.join(', ')}`);
        }
    });

    if (dups.length === 0) {
        showToast('No tienes láminas repetidas aún 🔄', 'info');
        return;
    }

    const message = `🔄 *MIS REPETIDAS PANINI FWC 2026*\n\n${dups.join('\n')}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
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
