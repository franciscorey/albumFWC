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

async function initApp() {
    try {
        const response = await fetch(JSON_FILE);
        if (!response.ok) throw new Error("No se pudo cargar el archivo JSON");
        albumData = await response.json();
        calculateStats();
        renderDashboard();
        buildNavigation();
        renderSection('A');
        updateProgress();
    } catch (error) {
        console.error("Error cargando JSON:", error);
        mainContainer.innerHTML = '<div class="error-msg"><h2>⚠️ Error de carga</h2><p>Revisa la consola (F12) o asegúrate de usar un servidor local.</p></div>';
    }
}

function calculateStats() {
    stats.groups = Object.keys(albumData.groups).length;
    stats.specials = Object.keys(albumData.specials).length;
    stats.total = 0;
    stats.countries = 0;
    Object.values(albumData.groups).forEach(group => {
        stats.countries += group.length;
        group.forEach(country => stats.total += country.stickers.length);
    });
    Object.values(albumData.specials).forEach(special => stats.total += special.length);
}

function renderDashboard() {
    const uniqueOwned = Object.keys(inventory).filter(id => inventory[id] > 0).length;
    dashboard.innerHTML = `
        <div class="stat-card"><span class="stat-value">${stats.total}</span><span class="stat-label">Total</span></div>
        <div class="stat-card"><span class="stat-value">${stats.countries}</span><span class="stat-label">Países</span></div>
        <div class="stat-card"><span class="stat-value">${stats.groups}</span><span class="stat-label">Grupos</span></div>
        <div class="stat-card highlight"><span class="stat-value" id="dash-owned">${uniqueOwned}</span><span class="stat-label">Tengo</span></div>
    `;
}

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

btnMode.addEventListener('click', () => {
    isAddMode = !isAddMode;
    btnMode.textContent = isAddMode ? '➕ Sumar' : '➖ Quitar';
    btnMode.className = isAddMode ? 'brutal-btn mode-add' : 'brutal-btn mode-sub';
});

function handleStickerClick(id, element) {
    let currentCount = inventory[id] || 0;
    if (isAddMode) inventory[id] = currentCount + 1;
    else if (currentCount > 0) inventory[id] = currentCount - 1;
    if (inventory[id] === 0) delete inventory[id];
    updateStickerVisual(id, element);
    saveInventory();
}

function updateStickerVisual(id, element) {
    const count = inventory[id] || 0;
    element.className = 'sticker-item'; 
    element.innerHTML = element.dataset.originalHtml; 
    if (count === 1) element.classList.add('owned');
    else if (count > 1) {
        element.classList.add('repeated');
        element.innerHTML += `<div class="repeated-badge">+${count - 1}</div>`;
    }
}

function createStickerElement(sticker, prefixToRemove) {
    const el = document.createElement('div');
    el.dataset.originalHtml = `<div>${sticker.id.replace(prefixToRemove, '')}</div><div class="sticker-name">${sticker.name || ''}</div>`;
    el.innerHTML = el.dataset.originalHtml;
    el.dataset.searchable = `${sticker.id.toLowerCase()} ${sticker.name ? sticker.name.toLowerCase() : ''}`;
    updateStickerVisual(sticker.id, el);
    el.onclick = () => handleStickerClick(sticker.id, el);
    return el;
}

function buildNavigation() {
    navContainer.innerHTML = '';
    Object.keys(albumData.groups).forEach(group => {
        const btn = document.createElement('button');
        btn.className = 'brutal-btn';
        btn.textContent = `Grupo ${group}`;
        btn.onclick = () => renderSection(group, btn);
        navContainer.appendChild(btn);
    });
    Object.keys(albumData.specials).forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'brutal-btn';
        btn.textContent = key.replace('_', ' ').toUpperCase();
        btn.onclick = () => renderSpecial(key, btn);
        navContainer.appendChild(btn);
    });
}

function renderSection(groupKey, btnElement = null) {
    if (!btnElement) btnElement = navContainer.firstChild;
    document.querySelectorAll('.scroll-nav .brutal-btn').forEach(b => b.classList.remove('active-nav'));
    btnElement.classList.add('active-nav');
    mainContainer.innerHTML = '';
    albumData.groups[groupKey].forEach(countryData => {
        const section = document.createElement('section');
        section.className = 'country-section';
        section.innerHTML = `<div class="country-header">${countryData.flag || ''} ${countryData.country}</div><div class="sticker-grid"></div>`;
        mainContainer.appendChild(section);
        const grid = section.querySelector('.sticker-grid');
        countryData.stickers.forEach(s => grid.appendChild(createStickerElement(s, countryData.team.substring(0,3).toUpperCase())));
    });
}

function renderSpecial(specialKey, btnElement) {
    document.querySelectorAll('.scroll-nav .brutal-btn').forEach(b => b.classList.remove('active-nav'));
    btnElement.classList.add('active-nav');
    mainContainer.innerHTML = '';
    const section = document.createElement('section');
    section.className = 'country-section';
    section.innerHTML = `<div class="country-header">⭐ ${specialKey.replace('_', ' ').toUpperCase()}</div><div class="sticker-grid"></div>`;
    mainContainer.appendChild(section);
    const grid = section.querySelector('.sticker-grid');
    albumData.specials[specialKey].forEach(s => grid.appendChild(createStickerElement(s, '')));
}

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.sticker-item').forEach(el => el.classList.toggle('hidden', !el.dataset.searchable.includes(term)));
    document.querySelectorAll('.country-section').forEach(section => {
        section.style.display = section.querySelectorAll('.sticker-item:not(.hidden)').length === 0 ? 'none' : 'block';
    });
});

document.getElementById('btn-export').addEventListener('click', () => {
    const printContent = document.getElementById('print-content');
    printContent.innerHTML = '';
    let html = '';
    Object.keys(albumData.groups).forEach(g => {
        albumData.groups[g].forEach(c => {
            let items = c.stickers.filter(s => !inventory[s.id]).map(s => `<div class="print-missing-item">${s.id} - ${s.name}</div>`).join('');
            if (items) html += `<div class="print-section-title">${c.country}</div>${items}`;
        });
    });
    printContent.innerHTML = html || '<p>¡Álbum completo!</p>';
    window.print();
});

document.addEventListener('DOMContentLoaded', initApp);
