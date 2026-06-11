/**
 * FWC 2026 Album Tracker - Versión Optimizada y Corregida
 */

const CONFIG = {
    JSON_FILE: 'panini_world_cup_2026.json',
    STORAGE_KEY: 'fwc2026_inventory_v2',
    TOAST_DURATION: 2500
};

const AppState = {
    albumData: null,
    inventory: {},
    stats: { total: 0, groups: 0, countries: 0, specials: 0 },
    modeState: 0, // 0 = Solo Vista (Seguro), 1 = Sumar (+), 2 = Quitar (-)
    activeSection: 'A', // Guarda la sección activa para restaurarla al borrar la búsqueda
    isSpecial: false,
    viewMode: 'all',
    listMode: false
};

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
    
    // Elementos del Dropdown de Exportación
    DOM.dropdownBtn = document.getElementById('dropdown-export-btn');
    DOM.dropdownContent = document.getElementById('dropdown-export-content');
    DOM.btnExport = document.getElementById('btn-export');
    DOM.btnWhatsapp = document.getElementById('btn-whatsapp');
    DOM.btnWhatsappDup = document.getElementById('btn-whatsapp-dup');
    
    // Cuadro de mandos y progreso
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
        AppState.inventory = {};
    }
}

function saveInventory() {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(AppState.inventory));
}

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
        updateModeButton(); 
        setupEventListeners();
    } catch (error) {
        console.error(error);
        if (DOM.mainContainer) DOM.mainContainer.innerHTML = '<div class="error-msg">Error cargando los datos.</div>';
    }
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
            AppState.allCountries.push({ name: country.country, flag: country.flag || '🏳️' });
        });
    });
    
    Object.values(AppState.albumData.specials).forEach(special => {
        AppState.stats.total += special.length;
    });
}

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
}

function setupEventListeners() {
    // Manejo del botón de Modos Operativos (Ciclo Seguro)
    if (DOM.btnModeSwitch) {
        DOM.btnModeSwitch.addEventListener('click', (e) => {
            e.preventDefault();
            AppState.modeState = (AppState.modeState + 1) % 3;
            updateModeButton();
        });
    }
    
    // Desplegar / Ocultar Menú de Exportación
    if (DOM.dropdownBtn) {
        DOM.dropdownBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            DOM.dropdownContent.classList.toggle('show');
        });
    }

    // Cerrar menú si se hace clic en el documento exterior
    document.addEventListener('click', () => {
        if (DOM.dropdownContent) DOM.dropdownContent.classList.remove('show');
    });

    // Eventos internos del menú desplegable de exportación
    if (DOM.btnExport) DOM.btnExport.addEventListener('click', () => { exportToPDF(); });
    if (DOM.btnWhatsapp) DOM.btnWhatsapp.addEventListener('click', () => { shareToWhatsApp(); });
    if (DOM.btnWhatsappDup) DOM.btnWhatsappDup.addEventListener('click', () => { shareDuplicatesToWhatsApp(); });
    
    // Búsqueda en tiempo real
    if (DOM.searchInput) DOM.searchInput.addEventListener('input', handleGlobalSearch);
    
    // Paneles auxiliares y filtros visuales
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
    
    // Sincronizar clases con el body para cambiar el cursor de la app completa
    document.body.classList.remove('cursor-safe', 'cursor-add', 'cursor-remove');
    const bodyCursors = ['cursor-safe', 'cursor-add', 'cursor-remove'];
    document.body.classList.add(bodyCursors[AppState.modeState]);

    showToast(`Cambiado a: ${texts[AppState.modeState]}`);
}

/**
 * BÚSQUEDA GLOBAL REAL: Escanea todo el JSON inmediatamente y renderiza los bloques
 */
function handleGlobalSearch(e) {
    const query = e.target.value.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    if (query === '') {
        // Restaurar la sección donde estaba el usuario antes de buscar
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
        <div class="country-header"><span>🔍</span> Resultados de Búsqueda Global</div>
        <div class="sticker-grid" id="search-results-grid"></div>
    `;
    DOM.mainContainer.appendChild(searchSection);
    const grid = document.getElementById('search-results-grid');
    
    let totalMatches = 0;

    // 1. Buscar en grupos de países
    Object.values(AppState.albumData.groups).flat().forEach(country => {
        const prefix = country.stickers[0] ? country.stickers[0].id.match(/^[A-Z]+/)[0] : '';
        country.stickers.forEach(sticker => {
            const stickerName = (sticker.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (sticker.id.toLowerCase().includes(query) || stickerName.includes(query)) {
                grid.appendChild(createStickerElement(sticker, prefix, country));
                totalMatches++;
            }
        });
    });
    
    // 2. Buscar en secciones especiales
    Object.entries(AppState.albumData.specials).forEach(([key, stickers]) => {
        stickers.forEach(sticker => {
            const stickerName = (sticker.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (sticker.id.toLowerCase().includes(query) || stickerName.includes(query)) {
                grid.appendChild(createStickerElement(sticker, '', null, key));
                totalMatches++;
            }
        });
    });

    if (totalMatches === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; padding: 20px; text-align: center; color: var(--text-secondary);">No se encontraron láminas coordinadas con la búsqueda.</div>';
    }

    applyViewFilters();
    setListView(AppState.listMode);
}

function handleStickerClick(stickerId, element, name) {
    if (AppState.modeState === 0) {
        // Evita errores: Solo muestra información en modo seguro sin alterar datos
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

function createStickerElement(sticker, prefixToRemove = '', countryData = null, specialKey = null) {
    const el = document.createElement('div');
    const displayId = sticker.id.replace(prefixToRemove, '');
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

function setActiveNavButton(activeBtn) {
    DOM.navContainer.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
    if(DOM.searchInput) DOM.searchInput.value = ''; // Limpiar buscador al cambiar de pestaña
}

function renderSection(groupKey, clearSearch = false) {
    if(clearSearch && DOM.searchInput) DOM.searchInput.value = '';
    DOM.mainContainer.innerHTML = '';
    
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

function toggleCountryFilter() {
    DOM.countryFilterPanel.classList.toggle('open');
    DOM.btnFilterCountry.classList.toggle('active');
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
    let html = `
        <div style="font-family:'Space Grotesk', sans-serif; padding:20px; color:#1a1a2e;">
            <h1 style="border-bottom:4px solid #1a1a2e; padding-bottom:10px; margin-bottom:20px;">🏆 MIS FALTANTES FWC 2026</h1>
            <p>Generado el: ${new Date().toLocaleDateString('es-CH')}</p>
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap:10px; margin-top:20px;">
    `;
    
    let missingCount = 0;
    
    // Recorrer grupos normales
    Object.values(AppState.albumData.groups).flat().forEach(c => {
        c.stickers.forEach(s => {
            if (!AppState.inventory[s.id]) {
                html += `<div style="padding:8px; border:2px solid #1a1a2e; background:#fff; font-weight:bold;">❌ ${s.id}</div>`;
                missingCount++;
            }
        });
    });

    // Recorrer especiales
    Object.values(AppState.albumData.specials).flat().forEach(s => {
        if (!AppState.inventory[s.id]) {
            html += `<div style="padding:8px; border:2px solid #1a1a2e; background:#fff; font-weight:bold;">⭐ ${s.id}</div>`;
            missingCount++;
        }
    });
    
    html += `</div></div>`;
    
    if (missingCount === 0) {
        showToast('¡Felicidades! Tienes el álbum completo.', 'success');
        return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html><head><title>Faltantes FWC 2026</title></head><body onload="window.print()">${html}</body></html>`);
    printWindow.document.close();
}

function shareToWhatsApp() {
    let missing = [];
    Object.values(AppState.albumData.groups).flat().forEach(c => {
        c.stickers.forEach(s => { if (!AppState.inventory[s.id]) missing.push(s.id); });
    });
    Object.values(AppState.albumData.specials).flat().forEach(s => {
        if (!AppState.inventory[s.id]) missing.push(s.id);
    });

    if(missing.length === 0) { showToast('¡No tienes láminas faltantes! 😎', 'success'); return; }
    
    let message = `🏆 *MIS FALTANTES FWC 2026 (${missing.length}):*\n${missing.join(', ')}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
}

function shareDuplicatesToWhatsApp() {
    let dups = [];
    Object.values(AppState.albumData.groups).flat().forEach(c => {
        c.stickers.forEach(s => { if (AppState.inventory[s.id] > 1) dups.push(`${s.id}(x${AppState.inventory[s.id]-1})`); });
    });
    Object.values(AppState.albumData.specials).flat().forEach(s => {
        if (AppState.inventory[s.id] > 1) dups.push(`${s.id}(x${AppState.inventory[s.id]-1})`);
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
