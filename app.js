const JSON_FILE = 'panini_world_cup_2026.json';
const STORAGE_KEY = 'fwc2026_inventory';

let albumData = null;
// inventory guarda { "MEX01": 1, "MEX02": 3, ... }
let inventory = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
let totalStickersCount = 0;
let isAddMode = true; // true = sumar, false = restar

const navContainer = document.getElementById('nav-groups');
const mainContainer = document.getElementById('app-main');
const searchInput = document.getElementById('search-input');
const btnMode = document.getElementById('btn-mode');

async function initApp() {
    try {
        const response = await fetch(JSON_FILE);
        albumData = await response.json();
        calculateTotalStickers();
        buildNavigation();
        renderSection('A');
        updateProgress();
    } catch (error) {
        console.error("Error cargando JSON:", error);
    }
}

function calculateTotalStickers() {
    totalStickersCount = 0;
    Object.values(albumData.groups).forEach(group => {
        group.forEach(country => totalStickersCount += country.stickers.length);
    });
    Object.values(albumData.specials).forEach(special => {
        totalStickersCount += special.length;
    });
}

function saveInventory() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
    updateProgress();
}

function updateProgress() {
    const uniqueOwned = Object.keys(inventory).filter(id => inventory[id] > 0).length;
    const percentage = ((uniqueOwned / totalStickersCount) * 100).toFixed(1);
    
    document.getElementById('progress-percentage').textContent = `${percentage}%`;
    document.getElementById('progress-count').textContent = `${uniqueOwned}/${totalStickersCount}`;
    document.getElementById('progress-bar-fill').style.width = `${percentage}%`;
}

// Lógica de Modos (Sumar/Restar)
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

function handleStickerClick(id, element) {
    let currentCount = inventory[id] || 0;

    if (isAddMode) {
        inventory[id] = currentCount + 1;
    } else {
        if (currentCount > 0) inventory[id] = currentCount - 1;
    }

    if (inventory[id] === 0) delete inventory[id]; // Limpiar si es 0
    
    updateStickerVisual(id, element);
    saveInventory();
}

function updateStickerVisual(id, element) {
    const count = inventory[id] || 0;
    element.className = 'sticker-item'; // Reset
    element.innerHTML = element.dataset.originalHtml; // Restaurar HTML base

    if (count === 1) {
        element.classList.add('owned');
    } else if (count > 1) {
        element.classList.add('repeated');
        element.innerHTML += `<div class="repeated-badge">+${count - 1}</div>`;
    }
}

function createStickerElement(sticker, prefixToRemove) {
    const el = document.createElement('div');
    const shortId = sticker.id.replace(prefixToRemove, '');
    
    // Guardamos el HTML base para poder restaurarlo al actualizar el contador
    el.dataset.originalHtml = `
        <div>${shortId}</div>
        <div class="sticker-name">${sticker.name || ''}</div>
    `;
    el.innerHTML = el.dataset.originalHtml;
    
    // Guardamos metadata para el buscador
    el.dataset.searchable = `${sticker.id.toLowerCase()} ${sticker.name ? sticker.name.toLowerCase() : ''}`;
    
    updateStickerVisual(sticker.id, el);
    el.onclick = () => handleStickerClick(sticker.id, el);
    return el;
}

// ... (Las funciones buildNavigation() quedan igual que el código anterior)

function renderSection(groupKey, btnElement = null) {
    // Igual que antes, pero usando createStickerElement()
    if (!btnElement) btnElement = navContainer.firstChild;
    document.querySelectorAll('.scroll-nav .brutal-btn').forEach(b => b.classList.remove('active-nav'));
    btnElement.classList.add('active-nav');
    
    mainContainer.innerHTML = '';
    const countries = albumData.groups[groupKey];

    countries.forEach(countryData => {
        const section = document.createElement('section');
        section.className = 'country-section';
        section.innerHTML = `
            <div class="country-header"><h2>${countryData.flag || ''} ${countryData.country}</h2></div>
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

// Funcionalidad de Búsqueda
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

    // Ocultar secciones vacías durante la búsqueda
    allSections.forEach(section => {
        const visibleStickers = section.querySelectorAll('.sticker-item:not(.hidden)');
        section.style.display = visibleStickers.length === 0 ? 'none' : 'block';
    });
});

// ... (Exportación PDF idéntica adaptada a comprobar inventory[sticker.id])
document.getElementById('btn-export').addEventListener('click', () => {
    // Misma lógica iterando grupos, comprobando if (!inventory[sticker.id]) { ... }
    window.print();
});

document.addEventListener('DOMContentLoaded', initApp);
