// ============================================
// CONFIGURACIÓN Y ESTADO GLOBAL
// ============================================

let STICKER_DATA = {}; // Se cargará desde el JSON
let GROUPS_DATA = {};  // Se generará desde el JSON
let TEAMS_MAP = {};    // Se generará desde el JSON
let SPECIAL_SECTIONS = {
    "FWC": { name: "Estadios y Leyendas", flag: "🏆", subtitle: "Especiales Panini (00, FWC 1-19)" },
    "CC": { name: "Coca-Cola Specials", flag: "🥤", subtitle: "Láminas de Oro (CC1-CC14)" }
};

let collection = {};
let currentSectionId = "FWC";
let activeFilter = "all";
let dashboardSortType = "groups"; // "groups" | "az" | "progress"
let selectedStickers = [];
let pressTimer = null;
let GRAND_TOTAL_STICKERS = 0;

// ============================================
// CARGA DE DATOS DESDE JSON
// ============================================

async function loadStickerData() {
    try {
        const response = await fetch('panini_world_cup_2026.json');
        if (!response.ok) throw new Error('No se pudo cargar el archivo JSON');
        
        const data = await response.json();
        STICKER_DATA = data.groups;
        
        // Cargar secciones especiales desde el JSON
        SPECIAL_SECTIONS["FWC"].stickers = data.specials?.fwc || [];
        SPECIAL_SECTIONS["CC"].stickers = data.specials?.coca_cola || [];
        
        // Generar GROUPS_DATA y TEAMS_MAP desde el JSON
        GROUPS_DATA = {};
        TEAMS_MAP = {};
        
        for (const [groupKey, countries] of Object.entries(STICKER_DATA)) {
            GROUPS_DATA[groupKey] = { 
                name: `Grupo ${groupKey}`, 
                teams: [] 
            };
            
            countries.forEach(countryData => {
                const teamId = countryData.country.substring(0, 3).toUpperCase();
                // Crear un ID único basado en el nombre del país
                const shortId = getTeamShortId(countryData.country);
                
                GROUPS_DATA[groupKey].teams.push(shortId);
                TEAMS_MAP[shortId] = {
                    name: countryData.country,
                    flag: countryData.flag || "🏳️",
                    stickers: countryData.stickers
                };
            });
        }
        
        // Calcular el total de láminas
        calculateTotalStickers();
        
        console.log('Datos cargados exitosamente:', {
            grupos: Object.keys(GROUPS_DATA).length,
            equipos: Object.keys(TEAMS_MAP).length,
            fwc: SPECIAL_SECTIONS["FWC"].stickers.length,
            cc: SPECIAL_SECTIONS["CC"].stickers.length
        });
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        showToast('Error al cargar los datos del álbum', 'error');
    }
}

function getTeamShortId(countryName) {
    // Mapeo de nombres de país a IDs cortos
    const teamIdMap = {
        "MEXICO": "MEX",
        "SUDAFRICA": "RSA",
        "COREA DEL SUR": "KOR",
        "REPÚBLICA CHECA": "CZE",
        "CANADA": "CAN",
        "BOSNIA Y HERZEGOVINA": "BIH",
        "QATAR": "QAT",
        "SUIZA": "SUI",
        "BRASIL": "BRA",
        "MARRUECOS": "MAR",
        "HAITÍ": "HAI",
        "ESCOCIA": "SCO",
        "ESTADOS UNIDOS": "USA",
        "PARAGUAY": "PAR",
        "AUSTRALIA": "AUS",
        "TURQUÍA": "TUR",
        "ALEMANIA": "GER",
        "CURAZAO": "CUW",
        "COSTA DE MARFIL": "CIV",
        "ECUADOR": "ECU",
        "PAÍSES BAJOS": "NED",
        "JAPÓN": "JPN",
        "SUECIA": "SWE",
        "TÚNEZ": "TUN",
        "BÉLGICA": "BEL",
        "EGIPTO": "EGY",
        "IRÁN": "IRN",
        "NUEVA ZELANDA": "NZL",
        "ESPAÑA": "ESP",
        "CABO VERDE": "CPV",
        "ARABIA SAUDITA": "KSA",
        "URUGUAY": "URU",
        "FRANCIA": "FRA",
        "SENEGAL": "SEN",
        "IRAK": "IRQ",
        "NORUEGA": "NOR",
        "ARGENTINA": "ARG",
        "ARGELIA": "ALG",
        "AUSTRIA": "AUT",
        "JORDANIA": "JOR",
        "PORTUGAL": "POR",
        "R.D. CONGO": "COD",
        "UZBEKISTÁN": "UZB",
        "COLOMBIA": "COL",
        "INGLATERRA": "ENG",
        "CROACIA": "CRO",
        "GHANA": "GHA",
        "PANAMÁ": "PAN"
    };
    
    return teamIdMap[countryName] || countryName.substring(0, 3).toUpperCase();
}

function calculateTotalStickers() {
    let total = 0;
    
    // Contar láminas de todos los equipos
    for (const teamId in TEAMS_MAP) {
        const stickers = TEAMS_MAP[teamId].stickers;
        total += stickers.length;
    }
    
    // Añadir láminas especiales (FWC y CC)
    total += 20; // FWC: 00 + 1-19
    total += 14; // CC: 1-14
    
    GRAND_TOTAL_STICKERS = total;
}

// ============================================
// FUNCIONES AUXILIARES PARA OBTENER DATOS DE LÁMINAS
// ============================================

function getStickersForTeam(teamId) {
    return TEAMS_MAP[teamId]?.stickers || [];
}

function getStickerByIndex(teamId, index) {
    const stickers = getStickersForTeam(teamId);
    return stickers[index - 1] || null;
}

function getStickerInfo(teamId, index) {
    if (teamId === "FWC") {
        if (index === 1) return { id: "FWC-00", name: "FWC 00", type: "ESPECIAL", emoji: "🏆" };
        return { id: `FWC-${index - 1}`, name: `FWC ${index - 1}`, type: "ESPECIAL", emoji: "🏆" };
    }
    
    if (teamId === "CC") {
        return { id: `CC-${index}`, name: `CC ${index}`, type: "ESPECIAL", emoji: "🥤" };
    }
    
    const sticker = getStickerByIndex(teamId, index);
    if (!sticker) return { id: `${teamId}-${index}`, name: `${teamId} ${index}`, type: "DESCONOCIDO", emoji: "❓" };
    
    const typeEmoji = {
        "ESCUDO": "🛡️",
        "EQUIPO": "⚽",
        "NORMAL": "👤"
    };
    
    return {
        id: sticker.id,
        name: sticker.name,
        type: sticker.type,
        emoji: typeEmoji[sticker.type] || "👤"
    };
}

function getMaxStickersForTeam(teamId) {
    if (teamId === "FWC") return 20;
    if (teamId === "CC") return 14;
    return getStickersForTeam(teamId).length;
}

// ============================================
// INICIALIZACIÓN Y CARGA DE EVENTOS
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar Tema
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    // Cargar datos desde JSON primero
    await loadStickerData();
    
    // Luego cargar estado local y renderizar
    loadLocalStorage();
    renderDashboardGroups();
    buildHorizontalCapsuleBar();
    renderActiveSection();
    updateStats();
    lucide.createIcons();
});

        // Guardar/Cargar LocalStorage de forma persistente
        function saveLocalStorage() {
            localStorage.setItem('fifa2026_control_panini_v7', JSON.stringify(collection));
        }

        function loadLocalStorage() {
            const data = localStorage.getItem('fifa2026_control_panini_v7');
            if (data) {
                try {
                    collection = JSON.parse(data);
                } catch (e) {
                    collection = {};
                }
            } else {
                collection = {};
            }
        }

        // Obtener cantidad máxima de láminas por sección
        function getStickersCountForSection(secId) {
            if (secId === "FWC") return 20;
            if (secId === "CC") return 14;
            return getMaxStickersForTeam(secId);
        }

        // Formato para ID interno
        function getStickerId(secId, index) {
            if (secId === "FWC") {
                if (index === 1) return "FWC-00";
                return `FWC-${index - 1}`;
            }
            if (secId === "CC") {
                return `CC-${index}`;
            }
            // Usar el ID real del JSON
            const sticker = getStickerByIndex(secId, index);
            return sticker ? sticker.id : `${secId}-${index}`;
        }

        function getStickerDisplayName(secId, index) {
            if (secId === "FWC") {
                // Usar nombre del JSON para FWC
                const sticker = SPECIAL_SECTIONS["FWC"].stickers[index - 1];
                return sticker ? sticker.name : `FWC ${index - 1}`;
            }
            if (secId === "CC") {
                // Usar nombre del JSON para CC
                const sticker = SPECIAL_SECTIONS["CC"].stickers[index - 1];
                return sticker ? sticker.name : `CC ${index}`;
            }
            // Usar el nombre real del JSON para países
            const sticker = getStickerByIndex(secId, index);
            return sticker ? sticker.name : `${secId} ${index}`;
        }

        function getStickerMetadata(secId, index) {
            if (secId === "FWC") {
                const sticker = SPECIAL_SECTIONS["FWC"].stickers[index - 1];
                return { 
                    label: "Especial 🏆", 
                    isSpecial: true, 
                    category: "specials", 
                    emoji: "🏆",
                    name: sticker?.name || `FWC ${index - 1}`
                };
            }
            if (secId === "CC") {
                const sticker = SPECIAL_SECTIONS["CC"].stickers[index - 1];
                return { 
                    label: "Coca-Cola ✨", 
                    isSpecial: true, 
                    category: "specials", 
                    emoji: "🥤",
                    name: sticker?.name || `CC ${index}`
                };
            }
            
            // Obtener tipo desde el JSON
            const sticker = getStickerByIndex(secId, index);
            const type = sticker?.type || "NORMAL";
            
            if (type === "ESCUDO") {
                return { label: "Escudo 🛡️", isSpecial: true, category: "shields", emoji: "🛡️" };
            }
            if (type === "EQUIPO") {
                return { label: "Equipo ⚽", isSpecial: true, category: "teams", emoji: "⚽" };
            }
            return { label: "Jugador 👤", isSpecial: false, category: "players", emoji: "👤" };
        }

        // Estadísticas y progreso de las tres categorías clave
        function getCategoryStats() {
            let shieldsOwned = 0;
            let teamsOwned = 0;
            let playersOwned = 0;

            for (const secId in TEAMS_MAP) {
                const stickers = TEAMS_MAP[secId].stickers;
                
                stickers.forEach((sticker, idx) => {
                    const sId = sticker.id;
                    const qty = collection[sId] || 0;
                    
                    if (qty > 0) {
                        if (sticker.type === "ESCUDO") {
                            shieldsOwned++;
                        } else if (sticker.type === "EQUIPO") {
                            teamsOwned++;
                        } else {
                            playersOwned++;
                        }
                    }
                });
            }

            return {
                shields: shieldsOwned,
                teams: teamsOwned,
                players: playersOwned
            };
        }

        function getSectionStatus(secId) {
            const max = getStickersCountForSection(secId);
            let owned = 0;
            for (let i = 1; i <= max; i++) {
                const id = getStickerId(secId, i);
                if ((collection[id] || 0) > 0) owned++;
            }
            return { owned, total: max };
        }

        // Navegación directa desde Dashboard a país
        function goToSectionAndSticker(secId) {
            currentSectionId = secId;
            switchTab('album');
            setTimeout(() => {
                focusCapsuleInSlider(secId);
            }, 100);
        }

        // Cambiar el tipo de ordenación de Dashboard
        function changeDashboardSort(sortType) {
            dashboardSortType = sortType;

            // Actualizar clase del botón activo
            document.querySelectorAll('#sort-groups, #sort-az, #sort-progress').forEach(btn => {
                btn.className = "px-3 py-1 rounded-lg transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex-1 sm:flex-none";
            });
            const activeBtn = document.getElementById(`sort-${sortType}`);
            if (activeBtn) {
                activeBtn.className = "px-3 py-1 rounded-lg transition-all text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 shadow-sm flex-1 sm:flex-none";
            }

            renderDashboardGroups();
        }

        // Renderizado del Dashboard (Tarjetas de Grupos Interactivas y Ultra-Compactas)
        function renderDashboardGroups() {
            const container = document.getElementById('groups-dashboard-container');
            if (!container) return;
            container.innerHTML = '';

            // Tarjeta Especial FWC separada con estilo consistente y barra de progreso horizontal
            const fwcStat = getSectionStatus("FWC");
            const fwcPct = ((fwcStat.owned / 20) * 100).toFixed(0);

            const fwcCard = document.createElement('div');
            fwcCard.className = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-sm flex flex-col justify-between hover:border-emerald-500 hover:shadow-md transition-all";
            fwcCard.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">🏆 FWC</span>
                    <span class="text-[10px] bg-[#FFD700] text-slate-900 font-black px-2 py-1 rounded">${fwcPct}%</span>
                </div>
                <button onclick="goToSectionAndSticker('FWC')" class="w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border border-slate-150 dark:border-slate-800 rounded-lg p-2 transition text-center mb-2">
                    <span class="text-base sm:text-lg leading-none">🏆</span>
                    <span class="text-[10px] sm:text-[11px] font-black text-slate-800 dark:text-slate-200 mt-0.5">Estadios y Leyendas</span>
                    <span class="text-[9px] sm:text-[10px] font-bold ${fwcStat.owned === 20 ? 'text-emerald-600' : 'text-slate-500'} mt-1">${fwcStat.owned}/20</span>
                </button>
                <div class="relative w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
                    <div class="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" style="width: ${fwcPct}%"></div>
                </div>
            `;
            container.appendChild(fwcCard);

            // Tarjeta Especial CC separada con estilo consistente y barra de progreso horizontal
            const ccStat = getSectionStatus("CC");
            const ccPct = ((ccStat.owned / 14) * 100).toFixed(0);

            const ccCard = document.createElement('div');
            ccCard.className = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-sm flex flex-col justify-between hover:border-emerald-500 hover:shadow-md transition-all";
            ccCard.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">🥤 CC</span>
                    <span class="text-[10px] bg-[#FFD700] text-slate-900 font-black px-2 py-1 rounded">${ccPct}%</span>
                </div>
                <button onclick="goToSectionAndSticker('CC')" class="w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border border-slate-150 dark:border-slate-800 rounded-lg p-2 transition text-center mb-2">
                    <span class="text-base sm:text-lg leading-none">🥤</span>
                    <span class="text-[10px] sm:text-[11px] font-black text-slate-800 dark:text-slate-200 mt-0.5">Coca-Cola Specials</span>
                    <span class="text-[9px] sm:text-[10px] font-bold ${ccStat.owned === 14 ? 'text-emerald-600' : 'text-slate-500'} mt-1">${ccStat.owned}/14</span>
                </button>
                <div class="relative w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
                    <div class="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" style="width: ${ccPct}%"></div>
                </div>
            `;
            container.appendChild(ccCard);

            // Lista estructurada de países para ordenación dinámica
            let countriesList = [];
            for (const groupKey in GROUPS_DATA) {
                const group = GROUPS_DATA[groupKey];
                group.teams.forEach(teamId => {
                    const country = TEAMS_MAP[teamId];
                    const stats = getSectionStatus(teamId);
                    countriesList.push({
                        id: teamId,
                        name: country.name,
                        flag: country.flag,
                        groupKey: groupKey,
                        groupName: group.name,
                        owned: stats.owned,
                        total: stats.total,
                        pct: (stats.owned / stats.total) * 100
                    });
                });
            }

            // Aplicar ordenación seleccionada
            if (dashboardSortType === "az") {
                countriesList.sort((a, b) => a.name.localeCompare(b.name));
            } else if (dashboardSortType === "progress") {
                countriesList.sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name));
            }

            if (dashboardSortType === "groups") {
                // Modo Por Grupos tradicional con diseño de barras de progreso
                for (const groupKey in GROUPS_DATA) {
                    const group = GROUPS_DATA[groupKey];
                    const card = document.createElement('div');
                    card.className = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-sm flex flex-col justify-between hover:border-emerald-500 hover:shadow-md transition-all";

                    let countriesHTML = "";
                    group.teams.forEach(teamId => {
                        const country = TEAMS_MAP[teamId];
                        const stats = getSectionStatus(teamId);
                        const isCompleted = stats.owned === stats.total;
                        const pctRounded = ((stats.owned / stats.total) * 100).toFixed(0);

                        countriesHTML += `
                            <button onclick="goToSectionAndSticker('${teamId}')" class="w-full bg-slate-50 dark:bg-slate-950 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border border-slate-150 dark:border-slate-800 rounded-lg p-2 transition text-left">
                                <div class="flex items-center justify-between mb-1">
                                    <span class="text-xs font-black text-slate-800 dark:text-slate-200 truncate">${country.flag} ${teamId}</span>
                                    <span class="text-[9px] bg-[#FFD700] text-slate-900 font-black px-1.5 py-0.5 rounded">${pctRounded}%</span>
                                </div>
                                <div class="relative w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
                                    <div class="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" style="width: ${pctRounded}%"></div>
                                </div>
                                <span class="text-[9px] sm:text-[10px] font-bold ${isCompleted ? 'text-emerald-600' : 'text-slate-500'} mt-1 block text-center">${stats.owned}/${stats.total}</span>
                            </button>
                        `;
                    });

                    card.innerHTML = `
                        <div class="flex items-center justify-between mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
                            <span class="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">${group.name}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            ${countriesHTML}
                        </div>
                    `;
                    container.appendChild(card);
                }
            } else {
                // Modo A/Z o Progreso en tarjetas compactas lineales
                countriesList.forEach(item => {
                    const isCompleted = item.owned === item.total;
                    const pctRounded = item.pct.toFixed(0);

                    const card = document.createElement('button');
                    card.onclick = () => goToSectionAndSticker(item.id);
                    card.className = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl shadow-sm hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between gap-3 text-left w-full";

                    card.innerHTML = `
                        <div class="flex items-center gap-2.5 min-w-0">
                            <span class="text-2xl flex-shrink-0">${item.flag}</span>
                            <div class="truncate">
                                <span class="text-xs font-black text-slate-800 dark:text-white block leading-tight truncate">${item.name}</span>
                                <span class="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase">${item.id} • ${item.groupName}</span>
                            </div>
                        </div>
                        <div class="text-right flex-shrink-0">
                            <span class="text-xs font-black block ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}">${item.owned}/${item.total}</span>
                            <span class="text-[9px] font-bold text-slate-400 dark:text-slate-500 block">${pctRounded}%</span>
                        </div>
                    `;
                    container.appendChild(card);
                });
            }
        }

        // Actualizar estadísticas globales
        function updateStats() {
            let totalOwned = 0;
            let totalRepeats = 0;

            // FWC
            for (let i = 1; i <= 20; i++) {
                const id = getStickerId("FWC", i);
                const qty = collection[id] || 0;
                if (qty > 0) { totalOwned++; if (qty > 1) totalRepeats += (qty - 1); }
            }
            // CC
            for (let i = 1; i <= 14; i++) {
                const id = getStickerId("CC", i);
                const qty = collection[id] || 0;
                if (qty > 0) { totalOwned++; if (qty > 1) totalRepeats += (qty - 1); }
            }
            // Países - usando los datos reales del JSON
            for (const teamId in TEAMS_MAP) {
                const stickers = TEAMS_MAP[teamId].stickers;
                for (const sticker of stickers) {
                    const id = sticker.id;
                    const qty = collection[id] || 0;
                    if (qty > 0) { totalOwned++; if (qty > 1) totalRepeats += (qty - 1); }
                }
            }

            const missing = GRAND_TOTAL_STICKERS - totalOwned;
            const pct = GRAND_TOTAL_STICKERS > 0 ? ((totalOwned / GRAND_TOTAL_STICKERS) * 100).toFixed(1) : "0.0";

            // Actualizar textos de UI principal
            const statPctEl = document.getElementById('stat-progress-pct');
            const statBarEl = document.getElementById('stat-progress-bar');
            const statOwnedEl = document.getElementById('stat-owned');
            const statMissingEl = document.getElementById('stat-missing');
            const statRepeatsEl = document.getElementById('stat-repeats');

            if (statPctEl) statPctEl.innerText = `${pct}%`;
            if (statBarEl) statBarEl.style.width = `${pct}%`;
            if (statOwnedEl) statOwnedEl.innerText = totalOwned;
            if (statMissingEl) statMissingEl.innerText = missing;
            if (statRepeatsEl) statRepeatsEl.innerText = totalRepeats;

            // Categorías de Progreso Compactas con Barras
            const cat = getCategoryStats();

            // Calcular totales reales desde el JSON
            let totalShields = 0;
            let totalTeams = 0;
            let totalPlayers = 0;
            
            for (const teamId in TEAMS_MAP) {
                const stickers = TEAMS_MAP[teamId].stickers;
                stickers.forEach(sticker => {
                    if (sticker.type === "ESCUDO") totalShields++;
                    else if (sticker.type === "EQUIPO") totalTeams++;
                    else totalPlayers++;
                });
            }

            // Shields Progress
            const catShieldsProgress = document.getElementById('cat-progress-shields');
            const catShieldsBar = document.getElementById('cat-bar-shields');
            const catShieldsMissing = document.getElementById('cat-missing-shields');
            if (catShieldsProgress) catShieldsProgress.innerText = `${cat.shields} / ${totalShields}`;
            if (catShieldsBar) catShieldsBar.style.width = `${totalShields > 0 ? (cat.shields / totalShields) * 100 : 0}%`;
            if (catShieldsMissing) catShieldsMissing.innerText = `Faltan ${totalShields - cat.shields}`;

            // Teams Progress
            const catTeamsProgress = document.getElementById('cat-progress-teams');
            const catTeamsBar = document.getElementById('cat-bar-teams');
            const catTeamsMissing = document.getElementById('cat-missing-teams');
            if (catTeamsProgress) catTeamsProgress.innerText = `${cat.teams} / ${totalTeams}`;
            if (catTeamsBar) catTeamsBar.style.width = `${totalTeams > 0 ? (cat.teams / totalTeams) * 100 : 0}%`;
            if (catTeamsMissing) catTeamsMissing.innerText = `Faltan ${totalTeams - cat.teams}`;

            // Players Progress
            const catPlayersProgress = document.getElementById('cat-progress-players');
            const catPlayersBar = document.getElementById('cat-bar-players');
            const catPlayersMissing = document.getElementById('cat-missing-players');
            if (catPlayersProgress) catPlayersProgress.innerText = `${cat.players} / ${totalPlayers}`;
            if (catPlayersBar) catPlayersBar.style.width = `${totalPlayers > 0 ? (cat.players / totalPlayers) * 100 : 0}%`;
            if (catPlayersMissing) catPlayersMissing.innerText = `Faltan ${totalPlayers - cat.players}`;

            // Actualizar contadores dinámicos del Dashboard
            const groupRatioFwc = document.getElementById('group-ratio-FWC');
            const groupRatioCc = document.getElementById('group-ratio-CC');
            if (groupRatioFwc) groupRatioFwc.innerText = `${getSectionStatus("FWC").owned} / 20`;
            if (groupRatioCc) groupRatioCc.innerText = `${getSectionStatus("CC").owned} / 14`;
        }

        // Construir barra deslizadora de cápsulas (Horizontal)
        function buildHorizontalCapsuleBar() {
            const container = document.getElementById('horizontal-capsule-bar');
            if (!container) return;
            container.innerHTML = '';

            // 1. Especial FWC
            container.appendChild(createCapsuleItem("FWC", SPECIAL_SECTIONS["FWC"]));

            // 2. Todos los países por grupos ordenadamente
            for (const groupKey in GROUPS_DATA) {
                const group = GROUPS_DATA[groupKey];
                group.teams.forEach(teamId => {
                    const countryData = TEAMS_MAP[teamId];
                    container.appendChild(createCapsuleItem(teamId, countryData));
                });
            }

            // 3. Especial Coca-Cola
            container.appendChild(createCapsuleItem("CC", SPECIAL_SECTIONS["CC"]));
        }

        function createCapsuleItem(secId, info) {
            const stats = getSectionStatus(secId);
            const isSelected = secId === currentSectionId;
            const isCompleted = stats.owned === stats.total;

            const btn = document.createElement('button');
            btn.id = `capsule-${secId}`;
            btn.onclick = () => {
                currentSectionId = secId;
                buildHorizontalCapsuleBar();
                renderActiveSection();
                focusCapsuleInSlider(secId);
            };

            // Estilos para cápsulas
            let colorClasses = "bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800";
            if (isSelected) {
                colorClasses = "bg-emerald-600 border-emerald-600 text-white font-extrabold shadow-sm scale-105";
            } else if (isCompleted) {
                colorClasses = "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold";
            }

            btn.className = `flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] transition-all duration-150 ${colorClasses}`;
            btn.innerHTML = `
                <span>${info.flag || "🏆"}</span>
                <span class="font-black">${secId}</span>
                <span class="text-[9px] opacity-75">(${stats.owned}/${stats.total})</span>
            `;

            return btn;
        }

        function focusCapsuleInSlider(secId) {
            const targetEl = document.getElementById(`capsule-${secId}`);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }

        function jumpToGroupInSlider(groupKey) {
            if (groupKey === "FWC") {
                goToSectionAndSticker("FWC");
            } else if (groupKey === "CC") {
                goToSectionAndSticker("CC");
            } else {
                const firstTeam = GROUPS_DATA[groupKey]?.teams[0];
                if (firstTeam) {
                    goToSectionAndSticker(firstTeam);
                }
            }
        }

        // Navegación de Pestañas Principales
        function switchTab(tabId) {
            document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
            const targetTab = document.getElementById(`tab-${tabId}-content`);
            if (targetTab) targetTab.classList.remove('hidden');

            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.className = "tab-btn px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white justify-center flex-1 sm:flex-none";
            });

            const activeBtn = document.getElementById(`btn-${tabId}`);
            if (activeBtn) {
                activeBtn.className = "tab-btn px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 text-emerald-700 bg-white dark:bg-slate-700 dark:text-emerald-300 shadow-sm justify-center flex-1 sm:flex-none";
            }

            if (tabId === 'album') {
                buildHorizontalCapsuleBar();
                renderActiveSection();
                clearStickerSelection();
            } else if (tabId === 'repeats') {
                renderRepeatsView();
            } else if (tabId === 'dashboard') {
                renderDashboardGroups();
            }

            updateStats();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function setGlobalFilter(filter) {
            activeFilter = filter;
            document.querySelectorAll('#f-all, #f-missing, #f-owned, #f-repeats').forEach(btn => {
                btn.className = "px-2.5 py-0.5 rounded-md transition text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white";
            });
            const activeBtn = document.getElementById(`f-${filter}`);
            if (activeBtn) {
                activeBtn.className = "px-2.5 py-0.5 rounded-md transition bg-emerald-600 text-white shadow-sm";
            }
            renderActiveSection();
            clearStickerSelection();
        }

        // Estado para la vista del álbum (grid o lista)
        let albumViewMode = "grid"; // "grid" | "list"

        // GESTIÓN DE SELECCIÓN MÚLTIPLE DE LÁMINAS
        function toggleStickerSelection(id) {
            const index = selectedStickers.indexOf(id);
            if (index > -1) {
                selectedStickers.splice(index, 1);
            } else {
                selectedStickers.push(id);
            }
            updateSelectionBarUI();
        }

        function clearStickerSelection() {
            selectedStickers = [];
            updateSelectionBarUI();

            // Limpiar estilos visuales de selección
            document.querySelectorAll('.sticker-card-el').forEach(el => {
                el.classList.remove('ring-4', 'ring-emerald-500', 'scale-95');
            });
        }

        function updateSelectionBarUI() {
            const bar = document.getElementById('selection-indicator-bar');
            const countText = document.getElementById('selection-count-text');
            const actionsContainer = document.getElementById('album-actions-container');

            if (!bar || !countText || !actionsContainer) return;

            if (selectedStickers.length > 0) {
                bar.classList.remove('hidden');
                countText.innerText = `${selectedStickers.length} seleccionada${selectedStickers.length > 1 ? 's' : ''}`;

                // Botones dinámicos para operaciones colectivas - Menú flotante inferior
                actionsContainer.innerHTML = `
                    <button onclick="applyBatchAction('add')" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-black transition flex items-center justify-center gap-2 text-xs shadow-lg active:scale-95">
                        <i data-lucide="check-circle" class="w-4 h-4"></i> Obtener
                    </button>
                    <button onclick="applyBatchAction('remove')" class="flex-1 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl font-black transition flex items-center justify-center gap-2 text-xs shadow-lg active:scale-95">
                        <i data-lucide="trash-2" class="w-4 h-4"></i> Quitar
                    </button>
                    <button onclick="applyBatchAction('repeat')" class="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-black transition flex items-center justify-center gap-2 text-xs shadow-lg active:scale-95">
                        <i data-lucide="plus" class="w-4 h-4"></i> +1
                    </button>
                `;
            } else {
                bar.classList.add('hidden');
                actionsContainer.innerHTML = `
                    <div class="flex border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden w-full sm:w-auto">
                        <button onclick="setAlbumViewMode('grid')" class="px-4 py-2 ${albumViewMode === 'grid' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'} hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2 text-xs font-bold" title="Vista Grid">
                            <i data-lucide="layout-grid" class="w-4 h-4"></i>
                            <span class="hidden sm:inline">Grid</span>
                        </button>
                        <button onclick="setAlbumViewMode('list')" class="px-4 py-2 ${albumViewMode === 'list' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'} hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2 text-xs font-bold" title="Vista Lista">
                            <i data-lucide="list" class="w-4 h-4"></i>
                            <span class="hidden sm:inline">Lista</span>
                        </button>
                    </div>
                `;
            }
            lucide.createIcons();
        }

        // Cambiar modo de vista del álbum
        function setAlbumViewMode(mode) {
            albumViewMode = mode;
            const grid = document.getElementById('stickers-grid');
            if (grid) {
                if (mode === 'list') {
                    // En modo lista, quitar las clases de grid para que ocupe todo el ancho
                    grid.className = 'block w-full';
                } else {
                    // En modo grid, restaurar las clases originales
                    grid.className = 'grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2';
                }
            }
            renderActiveSection();
            updateSelectionBarUI();
        }

        // Aplicar acción en lote
        function applyBatchAction(action) {
            if (selectedStickers.length === 0) return;

            selectedStickers.forEach(id => {
                const currentQty = collection[id] || 0;
                if (action === 'add') {
                    if (currentQty === 0) collection[id] = 1;
                } else if (action === 'remove') {
                    collection[id] = 0;
                } else if (action === 'repeat') {
                    collection[id] = currentQty + 1;
                }
            });

            const count = selectedStickers.length;
            clearStickerSelection();
            saveLocalStorage();
            updateStats();
            buildHorizontalCapsuleBar();
            renderActiveSection();

            if (action === 'add') {
                showToast(`Se marcaron ${count} láminas como obtenidas`, 'success');
            } else if (action === 'remove') {
                showToast(`Se eliminaron ${count} láminas del álbum`, 'info');
            } else if (action === 'repeat') {
                showToast(`Se agregó duplicado a las ${count} seleccionadas`, 'warning');
            }
        }

        // RENDERIZAR SECCIÓN ACTIVA EN ÁLBUM (Ultra Simplificada)
        function renderActiveSection() {
            const grid = document.getElementById('stickers-grid');
            if (!grid) return;
            grid.innerHTML = '';

            const isSpecialSec = SPECIAL_SECTIONS[currentSectionId];
            const secName = isSpecialSec ? isSpecialSec.name : TEAMS_MAP[currentSectionId]?.name;
            const secFlag = isSpecialSec ? isSpecialSec.flag : TEAMS_MAP[currentSectionId]?.flag;
            const secSubtitle = isSpecialSec ? isSpecialSec.subtitle : `Fútbol de ${secName}`;

            const activeSecFlagEl = document.getElementById('active-sec-flag');
            const activeSecNameEl = document.getElementById('active-sec-name');
            const activeSecInfoEl = document.getElementById('active-sec-info');
            const activeSecRatioEl = document.getElementById('active-sec-ratio');
            const activeSecPctEl = document.getElementById('active-sec-pct');

            if (activeSecFlagEl) activeSecFlagEl.innerText = secFlag || "🏆";
            if (activeSecNameEl) activeSecNameEl.innerText = secName || "";
            if (activeSecInfoEl) activeSecInfoEl.innerText = secSubtitle;

            const maxStickers = getStickersCountForSection(currentSectionId);
            const stats = getSectionStatus(currentSectionId);
            if (activeSecRatioEl) activeSecRatioEl.innerText = `${stats.owned} / ${stats.total}`;
            const pct = ((stats.owned / stats.total) * 100).toFixed(0);
            if (activeSecPctEl) activeSecPctEl.innerText = `${pct}%`;

            let cardCount = 0;

            // Renderizar según el modo de vista seleccionado
            if (albumViewMode === "grid") {
                // MODO GRID: Vista actual con emoji y sigla (solo ID corto)
                for (let i = 1; i <= maxStickers; i++) {
                    const id = getStickerId(currentSectionId, i);
                    const qty = collection[id] || 0;
                    const metadata = getStickerMetadata(currentSectionId, i);

                    // Filtro global de estado
                    if (activeFilter === "missing" && qty > 0) continue;
                    if (activeFilter === "owned" && qty === 0) continue;
                    if (activeFilter === "repeats" && qty <= 1) continue;

                    cardCount++;

                    const hasLamin = qty > 0;
                    const isCurrentlySelected = selectedStickers.includes(id);

                    // Color TURQUESA VIBRANTE (#40E0D0) para láminas pegadas
                    let bgStyleClass = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800";
                    if (hasLamin) {
                        bgStyleClass = "bg-[#40E0D0] dark:bg-[#40E0D0] border-[#40E0D0] text-slate-900 dark:text-slate-900 shadow-sm font-bold";
                    }

                    // Formato corto: MEX-01 (solo sigla y número)
                    const shortId = `${currentSectionId}-${String(i).padStart(2, '0')}`;

                    const card = document.createElement('div');
                    card.id = `card-sticker-${id}`;
                    card.className = `sticker-card-el relative aspect-square flex flex-col items-center justify-between p-2 rounded-xl border cursor-pointer select-none transition-all duration-150 shadow-sm ${bgStyleClass} ${isCurrentlySelected ? 'ring-4 ring-emerald-500 scale-95' : ''
                        }`;

                    // Simulación limpia de click rápido e hold (Long Press) para lotes
                    let longPressTriggered = false;

                    const startPress = () => {
                        longPressTriggered = false;
                        pressTimer = setTimeout(() => {
                            longPressTriggered = true;
                            toggleStickerSelection(id);
                            card.classList.toggle('ring-4');
                            card.classList.toggle('ring-emerald-500');
                            card.classList.toggle('scale-95');
                        }, 550);
                    };

                    const endPress = (e) => {
                        if (pressTimer) clearTimeout(pressTimer);

                        if (!longPressTriggered) {
                            if (selectedStickers.length > 0) {
                                toggleStickerSelection(id);
                                card.classList.toggle('ring-4');
                                card.classList.toggle('ring-emerald-500');
                                card.classList.toggle('scale-95');
                            } else {
                                // Toque normal: solo seleccionar, no marcar como pegada
                                toggleStickerSelection(id);
                                card.classList.add('ring-4', 'ring-emerald-500', 'scale-95');
                            }
                        }
                    };

                    // Eventos Mouse y Touch integrados
                    card.addEventListener('mousedown', startPress);
                    card.addEventListener('mouseup', endPress);
                    card.addEventListener('mouseleave', () => { if (pressTimer) clearTimeout(pressTimer); });
                    card.addEventListener('touchstart', (e) => { startPress(); });
                    card.addEventListener('touchend', (e) => { e.preventDefault(); endPress(e); });

                    let repeatsBadgeHTML = "";
                    if (qty > 1) {
                        repeatsBadgeHTML = `
                            <span class="absolute top-1.5 right-1.5 bg-amber-500 text-slate-950 font-black text-[9px] px-1 rounded-full leading-none py-0.5 shadow-sm">
                                +${qty - 1}
                            </span>
                        `;
                    }

                    card.innerHTML = `
                        ${repeatsBadgeHTML}
                        <span class="text-base sm:text-lg mt-1.5">${metadata.emoji}</span>
                        <span class="text-[9px] sm:text-[10px] font-black tracking-tight mb-0.5 truncate max-w-full uppercase bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded-md">
                            ${shortId}
                        </span>
                    `;

                    grid.appendChild(card);
                }
            } else {
                // MODO LISTA: Vista detallada con sigla, nombre completo, estado y repetidas
                const listContainer = document.createElement('div');
                listContainer.className = "w-full space-y-2";

                for (let i = 1; i <= maxStickers; i++) {
                    const id = getStickerId(currentSectionId, i);
                    const displayName = getStickerDisplayName(currentSectionId, i);
                    const qty = collection[id] || 0;
                    const metadata = getStickerMetadata(currentSectionId, i);

                    // Filtro global de estado
                    if (activeFilter === "missing" && qty > 0) continue;
                    if (activeFilter === "owned" && qty === 0) continue;
                    if (activeFilter === "repeats" && qty <= 1) continue;

                    cardCount++;

                    const hasLamin = qty > 0;
                    const isCurrentlySelected = selectedStickers.includes(id);
                    const statusText = hasLamin ? 'Pegada' : 'Vacía';
                    // Color TURQUESA VIBRANTE (#40E0D0) para láminas pegadas en vista lista
                    const rowBgClass = hasLamin ? 'bg-[#40E0D0] dark:bg-[#40E0D0] border-[#40E0D0] text-slate-900 dark:text-slate-900' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800';

                    const row = document.createElement('div');
                    row.id = `card-sticker-${id}`;
                    row.className = `sticker-card-el flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border cursor-pointer select-none transition-all duration-150 shadow-sm ${rowBgClass} ${isCurrentlySelected ? 'ring-2 ring-emerald-500 bg-emerald-100/50 dark:bg-emerald-900/30' : ''
                        } hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600`;

                    // Click handler para selección
                    row.addEventListener('click', () => {
                        if (selectedStickers.length > 0) {
                            toggleStickerSelection(id);
                            row.classList.toggle('ring-2');
                            row.classList.toggle('ring-emerald-500');
                            row.classList.toggle('bg-emerald-100/50');
                            row.classList.toggle('dark:bg-emerald-900/30');
                        } else {
                            toggleStickerSelection(id);
                            row.classList.add('ring-2', 'ring-emerald-500', 'bg-emerald-100/50', 'dark:bg-emerald-900/30');
                        }
                    });

                    let repeatsBadgeHTML = "";
                    if (qty > 1) {
                        repeatsBadgeHTML = `\n                            <span class="inline-flex items-center justify-center bg-amber-400 dark:bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-1 rounded-full leading-none shadow-sm min-w-[28px]">\n                                +${qty - 1}\n                            </span>\n                        `;
                    }

                    // Formato corto: MEX-01 (solo sigla y número, sin nombre)
                    const shortId = `${currentSectionId}-${String(i).padStart(2, '0')}`;

                    row.innerHTML = `
                        <div class="flex items-center gap-3 min-w-0 flex-1 w-full">
                            <span class="text-xl sm:text-2xl flex-shrink-0 w-10 text-center">${metadata.emoji}</span>
                            <div class="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                <div class="flex items-center gap-2 min-w-0 sm:w-auto">
                                    <span class="text-[10px] sm:text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wide bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded whitespace-nowrap">
                                        ${shortId}
                                    </span>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <span class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate block">
                                        ${displayName}
                                    </span>
                                </div>
                                <div class="flex items-center gap-2 sm:ml-auto">
                                    ${repeatsBadgeHTML}
                                    <span class="text-[10px] sm:text-[11px] font-bold whitespace-nowrap">
                                        ${statusText}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center flex-shrink-0 pl-2">
                            <i data-lucide="${isCurrentlySelected ? 'check-circle-2' : 'circle'}" class="w-5 h-5 ${isCurrentlySelected ? 'text-emerald-500 fill-emerald-100 dark:fill-emerald-900/50' : 'text-slate-300 dark:text-slate-700'}"></i>
                        </div>
                    `;

                    listContainer.appendChild(row);
                }

                grid.appendChild(listContainer);
            }

            if (cardCount === 0) {
                const empty = document.createElement('div');
                empty.className = "col-span-full py-10 text-center text-slate-400 text-xs font-semibold flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-900/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800";
                empty.innerHTML = `
                    <i data-lucide="search" class="w-5 h-5 text-slate-300"></i>
                    Ninguna lámina coincide con los filtros aplicados.
                `;
                grid.appendChild(empty);
            }

            updateSelectionBarUI();
            lucide.createIcons();
        }

        // TAB REPETIDAS
        function renderRepeatsView() {
            const grid = document.getElementById('repeats-grid');
            const emptyState = document.getElementById('repeats-empty');
            if (!grid || !emptyState) return;
            grid.innerHTML = '';

            let hasRepeats = false;

            // Recorrido ordenado
            const order = ["FWC", ...Object.keys(TEAMS_MAP), "CC"];

            order.forEach(secId => {
                const max = getStickersCountForSection(secId);
                const flag = secId === "FWC" ? "🏆" : (secId === "CC" ? "🥤" : TEAMS_MAP[secId]?.flag);
                const name = secId === "FWC" ? "Especiales FWC" : (secId === "CC" ? "Especiales CC" : TEAMS_MAP[secId]?.name);

                for (let i = 1; i <= max; i++) {
                    const id = getStickerId(secId, i);
                    const qty = collection[id] || 0;

                    if (qty > 1) {
                        hasRepeats = true;
                        const repQty = qty - 1;
                        const displayCode = getStickerDisplayName(secId, i);

                        const card = document.createElement('div');
                        card.className = "bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500 p-3 rounded-xl flex flex-col justify-between items-center text-center relative shadow-sm text-slate-800 dark:text-slate-100";
                        card.innerHTML = `
                            <span class="absolute top-1.5 right-1.5 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded">
                                x${repQty} repe
                            </span>
                            <span class="text-xl mt-1">${flag}</span>
                            <h4 class="font-black text-xs mt-1">${displayCode}</h4>
                            <p class="text-[9px] text-slate-400 font-bold uppercase mt-0.5">${name}</p>

                            <div class="flex gap-1 mt-2.5 w-full">
                                <button onclick="changeStickerQty('${id}', -1); renderRepeatsView();" class="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-1 rounded text-[10px] font-bold transition border border-slate-200 dark:border-slate-700">-</button>
                                <button onclick="changeStickerQty('${id}', 1); renderRepeatsView();" class="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-1 rounded text-[10px] font-bold transition border border-slate-200 dark:border-slate-700">+</button>
                            </div>
                        `;
                        grid.appendChild(card);
                    }
                }
            });

            if (hasRepeats) {
                emptyState.classList.add('hidden');
                grid.classList.remove('hidden');
            } else {
                emptyState.classList.remove('hidden');
                grid.classList.add('hidden');
            }
        }

        // WhatsApp Export
        function copyRepeatsToClipboard() {
            let list = [];
            let textValue = "";
            let count = 0;
            const order = ["FWC", ...Object.keys(TEAMS_MAP), "CC"];

            order.forEach(secId => {
                const max = getStickersCountForSection(secId);
                for (let i = 1; i <= max; i++) {
                    const id = getStickerId(secId, i);
                    const qty = collection[id] || 0;
                    if (qty > 1) {
                        const repQty = qty - 1;
                        const displayCode = getStickerDisplayName(secId, i);
                        list.push(`- *${displayCode}* (x${repQty})`);
                        count += repQty;
                    }
                }
            });

            if (list.length === 0) {
                showToast("Aún no tienes repetidas para compartir", "info");
                return;
            }

            textValue = "🏆 *MIS REPETIDAS DEL MUNDIAL PANINI 2026* 🏆\n_¿Cuáles te faltan? Escríbeme y cambiamos:_\n\n";
            textValue += list.join("\n");
            textValue += `\n\n*Total para cambio:* ${count} láminas.\n_Generado automáticamente con Album Fifa 2026_`;

            const el = document.createElement('textarea');
            el.value = textValue;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);

            showToast("Lista copiada al portapapeles. ¡Lista para WhatsApp!", "success");
        }

        // CARGA RÁPIDA DE SOBRES - Actualizado para usar IDs del JSON
        function submitBulkCodes(isAdding) {
            const txt = document.getElementById('bulk-text').value;
            if (!txt.trim()) {
                showToast("Ingresa algunos códigos para procesar", "info");
                return;
            }

            const parsedArray = txt.toUpperCase().split(/[\s,;\n]+/);
            let updated = 0;

            parsedArray.forEach(token => {
                if (!token) return;
                const clean = token.replace(/-/g, "").trim();

                const matchCC = clean.match(/^CC([0-9]{1,2})$/);
                const matchGeneral = clean.match(/^([A-Z]{3,4})([0-9]{1,2})$/);

                if (matchCC) {
                    const num = parseInt(matchCC[1], 10);
                    if (num >= 1 && num <= 14) {
                        const id = `CC-${num}`;
                        const currentVal = collection[id] || 0;
                        collection[id] = isAdding ? (currentVal + 1) : Math.max(0, currentVal - 1);
                        updated++;
                    }
                } else if (matchGeneral) {
                    const code = matchGeneral[1];
                    const num = parseInt(matchGeneral[2], 10);

                    if (SPECIAL_SECTIONS[code] || TEAMS_MAP[code]) {
                        if (code === "FWC") {
                            if (num === 0) {
                                const id = "FWC-00";
                                const currentVal = collection[id] || 0;
                                collection[id] = isAdding ? (currentVal + 1) : Math.max(0, currentVal - 1);
                                updated++;
                            } else if (num >= 1 && num <= 19) {
                                const id = `FWC-${num}`;
                                const currentVal = collection[id] || 0;
                                collection[id] = isAdding ? (currentVal + 1) : Math.max(0, currentVal - 1);
                                updated++;
                            }
                        } else {
                            // Usar el ID real desde el JSON basado en el número
                            const sticker = getStickerByIndex(code, num);
                            if (sticker) {
                                const id = sticker.id;
                                const currentVal = collection[id] || 0;
                                collection[id] = isAdding ? (currentVal + 1) : Math.max(0, currentVal - 1);
                                updated++;
                            }
                        }
                    }
                }
            });

            if (updated > 0) {
                saveLocalStorage();
                updateStats();
                document.getElementById('bulk-text').value = '';
                showToast(`Se actualizaron ${updated} láminas exitosamente.`, 'success');
            } else {
                showToast("No se encontraron códigos válidos.", "error");
            }
        }

        function generateRandomPack() {
            const list = [];
            const sectionsKeys = ["FWC", ...Object.keys(TEAMS_MAP), "CC"];

            for (let i = 0; i < 5; i++) {
                const randomSec = sectionsKeys[Math.floor(Math.random() * sectionsKeys.length)];
                const max = getStickersCountForSection(randomSec);
                const randomNum = Math.floor(Math.random() * max) + 1;

                if (randomSec === "FWC") {
                    if (randomNum === 1) list.push("FWC00");
                    else list.push(`FWC${randomNum - 1}`);
                } else if (randomSec === "CC") {
                    list.push(`CC${randomNum}`);
                } else {
                    // Usar el ID real desde el JSON
                    const sticker = getStickerByIndex(randomSec, randomNum);
                    if (sticker) {
                        // Extraer solo la parte alfabética del ID (ej: MEX01 -> MEX01)
                        list.push(sticker.id.replace('-', ''));
                    } else {
                        list.push(`${randomSec}${randomNum}`);
                    }
                }
            }

            const bulkTextEl = document.getElementById('bulk-text');
            if (bulkTextEl) bulkTextEl.value = list.join(', ');
            showToast("Sobre sorpresa listo en el cuadro. Haz clic en 'Pegar'.", "success");
        }

        function exportCollectionJSON() {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(collection));
            const download = document.createElement('a');
            download.setAttribute("href", dataStr);
            download.setAttribute("download", "album_control_fifa_2026.json");
            document.body.appendChild(download);
            download.click();
            download.remove();
            showToast("Descarga completada", "success");
        }

        function importCollectionJSON(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const parsed = JSON.parse(e.target.result);
                    if (typeof parsed === "object") {
                        collection = parsed;
                        saveLocalStorage();
                        updateStats();
                        showToast("¡Progreso restaurado con éxito!", "success");
                        switchTab('dashboard');
                    } else {
                        showToast("El archivo no contiene un formato de álbum válido.", "error");
                    }
                } catch (err) {
                    showToast("Error de lectura JSON", "error");
                }
            };
            reader.readAsText(file);
        }

        function resetAllData() {
            if (confirm("¿Estás completamente seguro de borrar tu planilla? Perderás todo tu progreso y tus repetidas.")) {
                collection = {};
                saveLocalStorage();
                updateStats();
                buildHorizontalCapsuleBar();
                renderActiveSection();
                showToast("Planilla vaciada por completo", "info");
            }
        }

        function loadDemoProgress() {
            collection = {};
            const order = ["FWC", ...Object.keys(TEAMS_MAP), "CC"];

            order.forEach(secId => {
                const max = getStickersCountForSection(secId);
                for (let i = 1; i <= max; i++) {
                    const id = getStickerId(secId, i);
                    const rand = Math.random();
                    if (rand > 0.45) {
                        collection[id] = 1;
                        if (rand > 0.88) {
                            collection[id] = Math.floor(Math.random() * 3) + 2;
                        }
                    }
                }
            });

            saveLocalStorage();
            updateStats();
            buildHorizontalCapsuleBar();
            renderActiveSection();
            showToast("¡Progreso demo cargado al 55%!", "success");
            switchTab('dashboard');
        }

        function bulkMarkCurrentSection(gotAll) {
            const max = getStickersCountForSection(currentSectionId);
            for (let i = 1; i <= max; i++) {
                const id = getStickerId(currentSectionId, i);
                collection[id] = gotAll ? 1 : 0;
            }
            saveLocalStorage();
            updateStats();
            buildHorizontalCapsuleBar();
            renderActiveSection();
            showToast(gotAll ? "¡Sección completada!" : "Sección restablecida de cero", gotAll ? "success" : "info");
        }

        function changeStickerQty(id, diff) {
            const current = collection[id] || 0;
            let target = current + diff;
            if (target < 0) target = 0;
            collection[id] = target;
            saveLocalStorage();
            updateStats();
        }

        // CONTROL DE TEMA DE MANERA COMPATIBLE
        function toggleTheme() {
            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            }
        }

        // Toasts
        function showToast(message, type = 'info') {
            const toast = document.getElementById('toast');
            const msgEl = document.getElementById('toast-message');
            const icon = document.getElementById('toast-icon');

            if (!toast || !msgEl || !icon) return;

            msgEl.innerText = message;

            if (type === 'success') {
                toast.className = "fixed bottom-5 right-5 z-50 transform translate-y-0 opacity-100 transition-all duration-300 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold border border-emerald-500/30";
                icon.className = "w-4 h-4 text-emerald-400";
                icon.setAttribute("data-lucide", "check-circle");
            } else if (type === 'warning') {
                toast.className = "fixed bottom-5 right-5 z-50 transform translate-y-0 opacity-100 transition-all duration-300 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold border border-amber-500/30";
                icon.className = "w-4 h-4 text-amber-400";
                icon.setAttribute("data-lucide", "copy");
            } else if (type === 'error') {
                toast.className = "fixed bottom-5 right-5 z-50 transform translate-y-0 opacity-100 transition-all duration-300 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold border border-red-500/30";
                icon.className = "w-4 h-4 text-red-400";
                icon.setAttribute("data-lucide", "alert-circle");
            } else {
                toast.className = "fixed bottom-5 right-5 z-50 transform translate-y-0 opacity-100 transition-all duration-300 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold border border-blue-500/30";
                icon.className = "w-4 h-4 text-blue-400";
                icon.setAttribute("data-lucide", "info");
            }

            lucide.createIcons();

            if (window.toastTimeout) clearTimeout(window.toastTimeout);

            window.toastTimeout = setTimeout(() => {
                toast.className = "fixed bottom-5 right-5 z-50 transform translate-y-20 opacity-0 transition-all duration-300 pointer-events-none flex items-center gap-2.5 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold border border-slate-800";
            }, 3000);
        }