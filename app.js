const JSON_FILE = 'panini_world_cup_2026.json';
const STORAGE_KEY = 'fwc2026_inventory';

let albumData = null;
let inventory = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
let stats = { total: 0, groups: 0, countries: 0, specials: 0 };
let isAddMode = true;

const navContainer = document.getElementById('nav-groups');
const mainContainer = document.getElementById('app-main');
const searchInput = document.getElementById('search-input');
const btnMode = document.getElementById('btn-mode');
const dashboard = document.getElementById('dashboard');

// 1. Iniciar aplicación
async function initApp() {
    try {
        const response = await fetch(JSON_FILE);
        if (!response.ok) throw new Error("No se pudo cargar el archivo JSON");
        
        albumData = await response.json();
        
        calculateStats();
        renderDashboard();
        buildNavigation();
        renderSection('A'); // Carga inicial del Grupo A
        updateProgress();
        
    } catch (error) {
        console.error("Error cargando JSON:", error);
        mainContainer.innerHTML = `
            <div class="error-msg">
                <h2>⚠️ ERROR DE CARGA</h2>
                <p>No se pudo acceder a "panini_world_cup_2026.json".</p>
                <p style="margin-top:1rem; font-size:0.8rem;">Recuerda que debes ejecutar esto en un servidor local (ej: Live Server en VS Code), no abriendo el HTML directamente.</p>
            </div>
        `;
    }
}

// 2. Extraer metadatos para las tarjetas
function calculateStats() {
    stats.groups = Object.keys(albumData.groups).length;
    stats.specials = Object.keys(albumData.specials).length;
    stats.total = 0;
    stats.countries = 0;
    
    Object.values(albumData.groups).forEach(group => {
        stats.countries += group.length;
        group.forEach(country => stats.total += country.stickers.length);
    });
    Object.values(albumData.specials).forEach(special => {
        stats.total += special.length;
    });
}

// 3. Renderizar tarjetas visuales de datos JSON
function renderDashboard() {
    const uniqueOwned = Object.keys(inventory).filter(id => inventory[id] > 0).length;
    
    dashboard.innerHTML = `
        <div class="stat-card">
            <span class="stat-value">${stats.total}</span>
            <span class="stat-label">Láminas Totales</span>
        </div>
        <div class="stat-card">
            <span class="stat-value">${stats.countries}</span>
            <span class="stat-label">Países</span>
        </div>
        <div class="stat-card">
            <span class="stat-value">${stats.groups}</span>
            <span class="stat-label">Grupos</span>
        </div>
        <div class="stat-card highlight">
            <span class="stat-value" id="dash-owned">${uniqueOwned}</span>
            <span class="stat-label">Conseguidas</span>
        </div>
    `;
}

// 4. Actualizar estado y progreso
function updateProgress() {
    const uniqueOwned = Object.keys(inventory).filter(id => inventory[id] > 0).length;
    const percentage = stats.total > 0 ? ((uniqueOwned / stats.total) * 100).toFixed(1) : 0;
    
    document.getElementById('progress-percentage').textContent = `${percentage}%`;
    document.getElementById('progress-bar-fill').style.width = `${percentage}%`;
    
    const dashOwned = document.getElementById('dash-owned');
    if (dashOwned) dashOwned.textContent = uniqueOwned;
}

function saveInventory() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
    updateProgress();
}

// 5. Cambiar modo Sumar/Restar
btnMode.addEventListener('click', () => {
    isAddMode = !isAddMode;
    if (isAddMode) {
        btnMode.textContent = '➕ Sumar';
        btnMode.className = 'brutal-btn mode-add';
    } else {
        btnMode.textContent = '➖ Quitar';
        btnMode.className = 'brutal-btn mode-sub';
    }
});

// 6. Lógica al tocar una lámina
function handleStickerClick(id, element) {
    let currentCount = inventory[id] || 0;

    if (isAddMode) {
        inventory[id] = currentCount + 1;
    } else {
        if (currentCount > 0) inventory[id] = currentCount - 1;
    }

    if (inventory[id] === 0) delete inventory[id];
    
    updateStickerVisual(id, element);
    saveInventory();
}

// 7. Estilos dinámicos basados en la cantidad
function updateStickerVisual(id, element) {
    const count = inventory[id] || 0;
    element.className = 'sticker-item'; 
    element.innerHTML = element.dataset.originalHtml; 

    if (count === 1) {
        element.classList.add('owned');
    } else if (count > 1) {
        element.classList.add('repeated');
        element.innerHTML += `<div class="repeated-badge">+${count - 1}</div>`;
    }
}

// 8. Generador de Nodos DOM para láminas
function createStickerElement(sticker, prefixToRemove) {
    const el = document.createElement('div');
    const shortId = sticker.id.replace(prefixToRemove, '');
    
    el.dataset.originalHtml = `
        <div>${shortId}</div>
        <div class="sticker-name">${sticker.name || ''}</div>
    `;
    el.innerHTML = el.dataset.originalHtml;
    el.dataset.searchable = `${sticker.id.toLowerCase()} ${sticker.name ? sticker.name.toLowerCase() : ''}`;
    
    updateStickerVisual(sticker.id, el);
    el.onclick = () => handleStickerClick(sticker.id, el);
    return el;
}

// 9. Menú de navegación principal
function buildNavigation() {
    navContainer.innerHTML = '';
    
    // Grupos
    Object.keys(albumData.groups).forEach(group => {
        const btn = document.createElement('button');
        btn.className = 'brutal-btn';
        btn.textContent = `Grupo ${group}`;
        btn.onclick = () => renderSection(group, btn);
        navContainer.appendChild(btn);
    });

    // Especiales
    Object.keys(albumData.specials).forEach(specialKey => {
        const btn = document.createElement('button');
        btn.className = 'brutal-btn';
        btn.textContent = specialKey.replace('_', ' ').toUpperCase();
        btn.onclick = () => renderSpecial(specialKey, btn);
        navContainer.appendChild(btn);
    });
}

// 10. Renderizar la grilla de un Grupo
function renderSection(groupKey, btnElement = null) {
    if (!btnElement) btnElement = navContainer.firstChild;
    document.querySelectorAll('.scroll-nav .brutal-btn').forEach(b => b.classList.remove('active-nav'));
    btnElement.classList.add('active-nav');
    
    mainContainer.innerHTML = '';
    const countries = albumData.groups[groupKey];

    countries.forEach(countryData => {
        const section = document.createElement('section');
        section.className = 'country-section';
        section.innerHTML = `
            <div class="country-header">${countryData.flag || ''} ${countryData.country}</div>
            <div class="sticker-grid"></div>
        `;
        mainContainer.appendChild(section);
        const grid = section.querySelector('.sticker-grid');

        countryData.stickers.forEach(sticker => {
            const prefix = countryData.team.substring(0,3).toUpperCase();
            grid.appendChild(createStickerElement(sticker, prefix));
        });
    });
}

// 11. Renderizar la grilla de una sección Especial
function renderSpecial(specialKey, btnElement) {
    document.querySelectorAll('.scroll-nav .brutal-btn').forEach(b => b.classList.remove('active-nav'));
    btnElement.classList.add('active-nav');
    mainContainer.innerHTML = '';
    
    const specialStickers = albumData.specials[specialKey];
    const section = document.createElement('section');
    section.className = 'country-section';
    section.innerHTML = `
        <div class="country-header">⭐ ${specialKey.replace('_', ' ').toUpperCase()}</div>
        <div class="sticker-grid"></div>
    `;
    mainContainer.appendChild(section);
    const grid = section.querySelector('.sticker-grid');

    specialStickers.forEach(sticker => {
        grid.appendChild(createStickerElement(sticker, ''));
    });
}

// 12. Búsqueda en tiempo real
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const allStickers = document.querySelectorAll('.sticker-item');
    const allSections = document.querySelectorAll('.country-section');

    allStickers.forEach(el => {
        if (el.dataset.searchable.includes(term)) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });

    allSections.forEach(section => {
        const visibleStickers = section.querySelectorAll('.sticker-item:not(.hidden)');
        section.style.display = visibleStickers.length === 0 ? 'none' : 'block';
    });
});

// 13. Lógica para exportar a PDF (Impresión nativa)
document.getElementById('btn-export').addEventListener('click', () => {
    const printContent = document.getElementById('print-content');
    printContent.innerHTML = ''; 
    let missingHTML = '';

    // Filtrar faltantes de los grupos
    Object.keys(albumData.groups).forEach(group => {
        albumData.groups[group].forEach(country => {
            let hasMissing = false;
            let countryMissingHTML = `<div class="print-section-title">${country.country}</div>`;
            
            country.stickers.forEach(sticker => {
                if (!inventory[sticker.id]) {
                    countryMissingHTML += `<div class="print-missing-item"><strong>${sticker.id}</strong> - ${sticker.name}</div>`;
                    hasMissing = true;
                }
            });
            if (hasMissing) missingHTML += countryMissingHTML;
        });
    });

    // Filtrar faltantes de las especiales
    Object.keys(albumData.specials).forEach(specialKey => {
        let hasMissing = false;
        let specialMissingHTML = `<div class="print-section-title">${specialKey.replace('_', ' ').toUpperCase()}</div>`;
        
        albumData.specials[specialKey].forEach(sticker => {
            if (!inventory[sticker.id]) {
                specialMissingHTML += `<div class="print-missing-item"><strong>${sticker.id}</strong> - ${sticker.name}</div>`;
