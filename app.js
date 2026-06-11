/**
 * FWC 2026 Album Tracker - Aplicación para gestionar el álbum Panini
 * Características: Registro de láminas, filtro por país/grupo, exportación PDF y menús dinámicos
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
    modeState: 0, // 0 = Solo Vista/Bloqueado (Seguro), 1 = Añadir (+), 2 = Quitar (-)
    activeGroup: null,
    activeCountry: null,
    allCountries: [],
    viewMode: 'all', // all, missing, owned, repeated
    listMode: false // false = grid, true = list
};

// Referencias DOM cacheadas
const DOM = {};

document.addEventListener('DOMContentLoaded', () => {
    cacheDOM();
    loadInventory();
    initApp();
});

function cacheDOM() {
    DOM.navContainer = document.getElementById('nav-groups');
    DOM.mainContainer = document.getElementById('app-main');
    DOM.searchInput = document.getElementById('search-input');
    DOM.btnModeSwitch = document.getElementById('btn-mode'); 
    
    // Elementos del nuevo menú desplegable
    DOM.dropdownBtn = document.getElementById('dropdown-export-btn');
    DOM.dropdownContent = document.getElementById('dropdown-export-content');
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

function loadInventory() {
    try {
        AppState.inventory = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY)) || {};
    } catch (e) {
        console.error('Error cargando inventario:', e);
        AppState.inventory = {};
    }
}

function saveInventory() {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(AppState.inventory));
}

async function initApp() {
    try {
        await loadAlbumData();
        calculateStats();
        renderDashboard();
        buildNavigation();
        buildCountryFilter();
        renderSection('A');
        updateProgress();
        updateModeButton(); 
        setupEventListeners();
    } catch (error) {
        console.error('Error inicializando app:', error);
        showError('No se pudo cargar el álbum. Verifica tu conexión.');
    }
}

async function loadAlbumData() {
    const response = await fetch(CONFIG.JSON_FILE);
    if (!response.ok) throw new Error('No se pudo cargar el JSON');
    AppState.albumData = await response.json();
}

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
            AppState.allCountries.push({
                name: country.country,
                flag: country.flag || '🏳️',
                group: Object.keys(AppState.albumData.groups).find(g => 
                    AppState.albumData.groups[g].some(c => c.country === country.country)
                )
            });
        });
    });
    
    Object.values(AppState.albumData.specials).forEach(special => {
        AppState.stats.total += special.length;
    });
}

function renderDashboard() {
    const uniqueOwned = getUniqueOwnedCount();
    DOM.dashboard.innerHTML = `
        <div class="stat-card"><span class="stat-value">${AppState.stats.total}</span><span class="stat-label">Total Láminas</span></div>
        <div class="stat-card"><span class="stat-value">${AppState.stats.countries}</span><span class="stat-label">Países</span></div>
        <div class="stat-card"><span class="stat-value">${AppState.stats.groups}</span><span class="stat-label">Grupos</span></div>
        <div class="stat-card highlight"><span class="stat-value" id="dash-owned">${uniqueOwned}</span><span class="stat-label">Completadas</span></div>
    `;
}

function getUniqueOwnedCount() {
    return Object.keys(AppState.inventory).filter(id => AppState.inventory[id] > 0).length;
}

function getTotalRepeatedCount() {
    return Object.values(AppState.inventory).reduce((sum, count) => sum + Math.max(0, count - 1), 0);
}

function updateProgress() {
    const uniqueOwned = getUniqueOwnedCount();
    const totalRepeated = getTotalRepeatedCount();
    const percentage = AppState.stats.total > 0 ? ((uniqueOwned / AppState.stats.total) * 100).toFixed(1) : 0;
    
    if(DOM.progressPercentage) DOM.progressPercentage.textContent = `${percentage}%`;
    if(DOM.progressBarFill) DOM.progressBarFill.style.width = `${percentage}%`;
    if(DOM.progressCount) DOM.progressCount.textContent = `${uniqueOwned}/${AppState.stats.total}`;
    if(DOM.uniqueOwned) DOM.uniqueOwned.textContent = uniqueOwned;
    if(DOM.totalRepeated) DOM.totalRepeated.textContent = totalRepeated;
    
    const dashOwned = document.getElementById('dash-owned');
    if (dashOwned) dashOwned.textContent = uniqueOwned;
}

function setupEventListeners() {
    // Interactividad del Botón de 3 Modos Seguros
    if (DOM.btnModeSwitch) {
        DOM.btnModeSwitch.addEventListener('click', (e) => {
            e.preventDefault();
            cycleMode();
        });
    }
    
    // Toggle para el menú desplegable de Exportación
    if (DOM.dropdownBtn) {
        DOM.dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            DOM.dropdownContent.classList.toggle('show');
        });
    }

    // Cerrar el menú flotante si se hace clic fuera de él
    document.addEventListener('click', () => {
        if (DOM.dropdownContent) DOM.dropdownContent.classList.remove('show');
    });

    if (DOM.btnExport) DOM.btnExport.addEventListener('click', () => { exportToPDF(); });
    if (DOM.btnWhatsapp) DOM.btnWhatsapp.addEventListener('click', () => { shareToWhatsApp(); });
    if (DOM.btnWhatsappDup) DOM.btnWhatsappDup.addEventListener('click', () => { shareDuplicatesToWhatsApp(); });
    
    if (DOM.searchInput) DOM.searchInput.addEventListener('input', handleSearch);
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

function cycleMode() {
    AppState.modeState = (AppState.modeState + 1) % 3;
    
    // Cambiar clases del body para control visual y cursores personalizados
    document.body.classList.remove('mode-safe', 'mode-adding', 'mode-removing');
    
    const modeNames = ['Solo Vista 🔒', 'Añadir Láminas ➕', 'Quitar Láminas ➖'];
    let toastType = 'info';

    if (AppState.modeState === 0) {
        document.body.classList.add('mode-safe');
    } else if (AppState.modeState === 1) {
        document.body.classList.add('mode-adding');
        toastType = 'success';
    } else if (AppState.modeState === 2) {
        document.body.classList.add('mode-removing');
        toastType = 'error';
    }
    
    updateModeButton();
    showToast(`Modo: ${modeNames[AppState.modeState]}`, toastType);
}

function updateModeButton() {
    if (!DOM.btnModeSwitch) return;
    const icons = ['🔒', '➕', '➖'];
    const texts = ['Vista', 'Sumar', 'Quitar'];
    const classes = ['mode-none', 'mode-add', 'mode-sub'];
    
    DOM.btnModeSwitch.className = 'action-btn ' + classes[AppState.modeState];
    const iconEl = DOM.btnModeSwitch.querySelector('.btn-icon');
    const textEl = DOM.btnModeSwitch.querySelector('.btn-text');
    
    if (iconEl) iconEl.textContent = icons[AppState.modeState];
    if (textEl) textEl.textContent = texts[AppState.modeState];
}

function handleStickerClick(stickerId, element, name) {
    if (AppState.modeState === 0) {
        // En modo seguro/bloqueado, el clic muestra información detallada sin modificar el inventario
        showToast(`Lámina: ${stickerId} - ${name}`, 'info');
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

function updateStickerVisual(element) {
    const stickerId = element.dataset.id;
    const count = AppState.inventory[stickerId] || 0;
    const isHiddenByFilter = shouldHideByFilter(count);
    
    element.className = 'sticker-item';
    if (isHiddenByFilter) element.classList.add('filter-hidden');
    element.innerHTML = element.dataset.originalHtml;
    
    if (count === 1) {
        element.classList.add('owned');
    } else if (count > 1) {
        element.classList.add('repeated');
        element.innerHTML += `<div class="repeated-badge">+${count - 1}</div>`;
    }
}

function shouldHideByFilter(count) {
    switch (AppState.viewMode) {
        case 'missing': return count !== 0;
        case 'owned': return count !== 1;
        case 'repeated': return count <= 1;
        default: return false;
    }
}

function createStickerElement(sticker, prefixToRemove = '', countryData = null, specialKey = null) {
    const el = document.createElement('div');
    const displayId = sticker.id.replace(prefixToRemove, '');
    const name = sticker.name || 'Lámina Especial';
    
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
        <div class="sticker-id">${displayId}</div>
        <div class="sticker-name">${name}</div>
    `;
    
    updateStickerVisual(el);
    el.onclick = () => handleStickerClick(sticker.id, el, name);
    
    return el;
}

function buildNavigation() {
    if (!DOM.navContainer) return;
    DOM.navContainer.innerHTML = '';
    
    Object.keys(AppState.albumData.groups).forEach(group => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.textContent = `Grupo ${group}`;
        btn.onclick = () => { setActiveNavButton(btn); renderSection(group); };
        DOM.navContainer.appendChild(btn);
    });
    
    Object.keys(AppState.albumData.specials).forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.textContent = key.replace('_', ' ').toUpperCase();
        btn.onclick = () => { setActiveNavButton(btn); renderSpecial(key); };
        DOM.navContainer.appendChild(btn);
    });
}

function setActiveNavButton(activeBtn) {
    DOM.navContainer.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
}

function buildCountryFilter() {
    if (!DOM.countryList) return;
    DOM.countryList.innerHTML = '';
    AppState.allCountries.forEach(country => {
        const chip = document.createElement('div');
        chip.className = 'country-chip';
        chip.innerHTML = `<span>${country.flag}</span> <span>${country.name}</span>`;
        chip.onclick = () => filterByCountry(country.name, chip);
        DOM.countryList.appendChild(chip);
    });
}

function toggleCountryFilter() {
    DOM.countryFilterPanel.classList.toggle('open');
    DOM.btnFilterCountry.classList.toggle('active');
}

function filterByCountry(countryName, chipElement) {
    const isActive = chipElement.classList.contains('active');
    DOM.countryList.querySelectorAll('.country-chip').forEach(c => c.classList.remove('active'));
    
    if (!isActive) {
        chipElement.classList.add('active');
        searchAndDisplayCountry(countryName);
    } else {
        if (AppState.activeGroup) renderSection(AppState.activeGroup);
    }
}

function searchAndDisplayCountry(countryName) {
    DOM.mainContainer.innerHTML = '';
    for (const [groupName, countries] of Object.entries(AppState.albumData.groups)) {
        const countryData = countries.find(c => c.country === countryName);
        if (countryData) {
            DOM.mainContainer.appendChild(createCountrySection(countryData));
            applyViewFilters();
            setListView(AppState.listMode);
            break;
        }
    }
}

function renderSection(groupKey) {
    DOM.mainContainer.innerHTML = '';
    AppState.activeGroup = groupKey;
    
    AppState.albumData.groups[groupKey].forEach(countryData => {
        DOM.mainContainer.appendChild(createCountrySection(countryData));
    });
    
    applyViewFilters();
    setListView(AppState.listMode);
}

function createCountrySection(countryData) {
    const section = document.createElement('section');
    section.className = 'country-section';
    const prefix = countryData.stickers[0] ? countryData.stickers[0].id.match(/^[A-Z]+/)[0] : '';
    
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

function renderSpecial(specialKey) {
    DOM.mainContainer.innerHTML = '';
    AppState.activeGroup = null;
    
    const section = document.createElement('section');
    section.className = 'country-section';
    section.innerHTML = `
        <div class="country-header"><span>⭐</span> <span>${specialKey.replace('_', ' ').toUpperCase()}</span></div>
        <div class="sticker-grid"></div>
    `;
    
    DOM.mainContainer.appendChild(section);
    const grid = section.querySelector('.sticker-grid');
    
    AppState.albumData.specials[specialKey].forEach(sticker => {
        grid.appendChild(createStickerElement(sticker, '', null, specialKey));
    });
    
    applyViewFilters();
    setListView(AppState.listMode);
}

/**
 * Búsqueda global mejorada (Grupos + Especiales en simultáneo)
 */
function handleSearch(e) {
    const term = e.target.value.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    if (term === '') {
        if (AppState.activeGroup) renderSection(AppState.activeGroup);
        else renderSection('A');
        return;
    }
    
    DOM.mainContainer.innerHTML = '';
    
    const section = document.createElement('section');
    section.className = 'country-section';
    section.innerHTML = `
        <div class="country-header"><span>🔍</span> Resultadados Globales</div>
        <div class="sticker-grid"></div>
    `;
    DOM.mainContainer.appendChild(section);
    const grid = section.querySelector('.sticker-grid');
    
    // 1. Buscar en países / grupos
    Object.values(AppState.albumData.groups).flat().forEach(country => {
        country.stickers.forEach(s => {
            const matchName = (s.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (s.id.toLowerCase().includes(term) || matchName.includes(term)) {
                grid.appendChild(createStickerElement(s, '', country));
            }
        });
    });
    
    // 2. Buscar en las categorías especiales
    Object.entries(AppState.albumData.specials).forEach(([key, stickers]) => {
        stickers.forEach(s => {
            const matchName = (s.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (s.id.toLowerCase().includes(term) || matchName.includes(term)) {
                grid.appendChild(createStickerElement(s, '', null, key));
            }
        });
    });
    
    applyViewFilters();
    setListView(AppState.listMode);
}

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

function setListView(isList) {
    AppState.listMode = isList;
    if (DOM.btnViewGrid) DOM.btnViewGrid.classList.toggle('active', !isList);
    if (DOM.btnViewList) DOM.btnViewList.classList.toggle('active', isList);
    DOM.mainContainer.querySelectorAll('.sticker-grid').forEach(grid => {
        grid.classList.toggle('list-view', isList);
    });
}

function exportToPDF() {
    const printContent = document.getElementById('print-content');
    if (!printContent) return;
    
    let html = '';
    let missingCount = 0;
    
    Object.values(AppState.albumData.groups).flat().forEach(c => {
        const missing = c.stickers.filter(s => !AppState.inventory[s.id]);
        if (missing.length > 0) {
            missingCount += missing.length;
            html += `<div class="print-section-title">${c.flag || ''} ${c.country}</div>`;
            html += missing.map(s => `<div class="print-missing-item">${s.id} - ${s.name}</div>`).join('');
        }
    });
    
    printContent.innerHTML = html || '<p>¡Álbum Completado! 🏆</p>';
    setTimeout(() => window.print(), 300);
}

function shareToWhatsApp() {
    let missing = [];
    Object.values(AppState.albumData.groups).flat().forEach(c => {
        c.stickers.forEach(s => { if (!AppState.inventory[s.id]) missing.push(s.id); });
    });
    if(missing.length === 0) { showToast('¡No tienes láminas faltantes! 😎', 'success'); return; }
    
    let message = `🏆 *MIS FALTANTES FWC 2026:*\n${missing.join(', ')}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
}

function shareDuplicatesToWhatsApp() {
    let dups = [];
    Object.values(AppState.albumData.groups).flat().forEach(c => {
        c.stickers.forEach(s => { if (AppState.inventory[s.id] > 1) dups.push(`${s.id}(x${AppState.inventory[s.id]-1})`); });
    });
    if(dups.length === 0) { showToast('No tienes repetidas aún 🔄', 'info'); return; }
    
    let message = `🔄 *MIS REPETIDAS FWC 2026:*\n${dups.join(', ')}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
}

function showToast(message, type = 'info') {
    if (!DOM.toast) return;
    DOM.toast.textContent = message;
    DOM.toast.className = `toast ${type} show`;
    setTimeout(() => DOM.toast.classList.remove('show'), CONFIG.TOAST_DURATION);
}

function showError(message) {
    if (DOM.mainContainer) DOM.mainContainer.innerHTML = `<div class="error-msg">⚠️ ${message}</div>`;
}
