// GRUPOS OFICIALES SEGÚN PLANILLA 2026
        const GROUPS_DATA = {
            "A": { name: "Grupo A", teams: ["MEX", "RSA", "KOR", "CZE"] },
            "B": { name: "Grupo B", teams: ["CAN", "BIH", "QAT", "SUI"] },
            "C": { name: "Grupo C", teams: ["BRA", "MAR", "HAI", "SCO"] },
            "D": { name: "Grupo D", teams: ["USA", "PAR", "AUS", "TUR"] },
            "E": { name: "Grupo E", teams: ["GER", "CUW", "CIV", "ECU"] },
            "F": { name: "Grupo F", teams: ["NED", "JPN", "SWE", "TUN"] },
            "G": { name: "Grupo G", teams: ["BEL", "EGY", "IRN", "NZL"] },
            "H": { name: "Grupo H", teams: ["ESP", "CPV", "KSA", "URU"] },
            "I": { name: "Grupo I", teams: ["FRA", "SEN", "IRQ", "NOR"] },
            "J": { name: "Grupo J", teams: ["ARG", "ALG", "AUT", "JOR"] },
            "K": { name: "Grupo K", teams: ["POR", "COD", "UZB", "COL"] },
            "L": { name: "Grupo L", teams: ["ENG", "CRO", "GHA", "PAN"] }
        };

        // LISTADO DETALLADO DE PAÍSES
        const TEAMS_MAP = {
            "MEX": { name: "México", flag: "🇲🇽" },
            "RSA": { name: "Sudáfrica", flag: "🇿🇦" },
            "KOR": { name: "Corea del Sur", flag: "🇰🇷" },
            "CZE": { name: "Rep. Checa", flag: "🇨🇿" },
            "CAN": { name: "Canadá", flag: "🇨🇦" },
            "BIH": { name: "Bosnia y H.", flag: "🇧🇦" },
            "QAT": { name: "Catar", flag: "🇶🇦" },
            "SUI": { name: "Suiza", flag: "🇨🇭" },
            "BRA": { name: "Brasil", flag: "🇧🇷" },
            "MAR": { name: "Marruecos", flag: "🇲🇦" },
            "HAI": { name: "Haití", flag: "🇭🇹" },
            "SCO": { name: "Escocia", flag: "🏴" },
            "USA": { name: "EE. UU.", flag: "🇺🇸" },
            "PAR": { name: "Paraguay", flag: "🇵🇾" },
            "AUS": { name: "Australia", flag: "🇦🇺" },
            "TUR": { name: "Turquía", flag: "🇹🇷" },
            "GER": { name: "Alemania", flag: "🇩🇪" },
            "CUW": { name: "Curazao", flag: "🇨🇼" },
            "CIV": { name: "Costa de Marfil", flag: "🇨🇮" },
            "ECU": { name: "Ecuador", flag: "🇪🇨" },
            "NED": { name: "Países Bajos", flag: "🇳🇱" },
            "JPN": { name: "Japón", flag: "🇯🇵" },
            "SWE": { name: "Suecia", flag: "🇸🇪" },
            "TUN": { name: "Túnez", flag: "🇹🇳" },
            "BEL": { name: "Bélgica", flag: "🇧🇪" },
            "EGY": { name: "Egipto", flag: "🇪🇬" },
            "IRN": { name: "Irán", flag: "🇮🇷" },
            "NZL": { name: "Nueva Zelanda", flag: "🇳🇿" },
            "ESP": { name: "España", flag: "🇪🇸" },
            "CPV": { name: "Cabo Verde", flag: "🇨🇻" },
            "KSA": { name: "Arabia Saudita", flag: "🇸🇦" },
            "URU": { name: "Uruguay", flag: "🇺🇾" },
            "FRA": { name: "Francia", flag: "🇫🇷" },
            "SEN": { name: "Senegal", flag: "🇸🇳" },
            "IRQ": { name: "Irak", flag: "🇮🇶" },
            "NOR": { name: "Noruega", flag: "🇳🇴" },
            "ARG": { name: "Argentina", flag: "🇦🇷" },
            "ALG": { name: "Argelia", flag: "🇩🇿" },
            "AUT": { name: "Austria", flag: "🇦🇹" },
            "JOR": { name: "Jordania", flag: "🇯🇴" },
            "POR": { name: "Portugal", flag: "🇵🇹" },
            "COD": { name: "R.D. Congo", flag: "🇨🇩" },
            "UZB": { name: "Uzbekistán", flag: "🇺🇿" },
            "COL": { name: "Colombia", flag: "🇨🇴" },
            "ENG": { name: "Inglaterra", flag: "🏴" },
            "CRO": { name: "Croacia", flag: "🇭🇷" },
            "GHA": { name: "Ghana", flag: "🇬🇭" },
            "PAN": { name: "Panamá", flag: "🇵🇦" }
        };

        const SPECIAL_SECTIONS = {
            "FWC": { name: "Estadios y Leyendas", flag: "🏆", subtitle: "Especiales Panini (00, FWC 1-19)" },
            "CC": { name: "Coca-Cola Specials", flag: "🥤", subtitle: "Láminas de Oro (CC1-CC14)" }
        };

        const GRAND_TOTAL_STICKERS = 994;

        // Estado Global de la aplicación
        let collection = {};
        let currentSectionId = "FWC";
        let activeFilter = "all";
        let dashboardSortType = "groups"; // "groups" | "az" | "progress"
        let selectedStickers = [];
        let pressTimer = null;

        // Inicialización y carga de eventos seguros
        document.addEventListener('DOMContentLoaded', () => {
            // Verificar Tema
            if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

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
            return 20;
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
            return `${secId}-${index}`;
        }

        function getStickerDisplayName(secId, index) {
            if (secId === "FWC") {
                if (index === 1) return "FWC 00";
                return `FWC ${index - 1}`;
            }
            if (secId === "CC") {
                return `CC ${index}`;
            }
            return `${secId} ${index}`;
        }

        function getStickerMetadata(secId, index) {
            if (secId === "FWC") {
                return { label: "Especial 🏆", isSpecial: true, category: "specials", emoji: "🏆" };
            }
            if (secId === "CC") {
                return { label: "Coca-Cola ✨", isSpecial: true, category: "specials", emoji: "🥤" };
            }
            if (index === 1) {
                return { label: "Escudo 🛡️", isSpecial: true, category: "shields", emoji: "🛡️" };
            }
            if (index === 13) {
                return { label: "Equipo 👥", isSpecial: true, category: "teams", emoji: "👥" };
            }
            return { label: "Jugador 👤", isSpecial: false, category: "players", emoji: "👤" };
        }

        // Estadísticas y progreso de las tres categorías clave
        function getCategoryStats() {
            let shieldsOwned = 0;
            let teamsOwned = 0;
            let playersOwned = 0;

            for (const secId in TEAMS_MAP) {
                // Escudo (Lámina 1)
                const sId = `${secId}-1`;
                if ((collection[sId] || 0) > 0) shieldsOwned++;

                // Equipo (Lámina 13)
                const tId = `${secId}-13`;
                if ((collection[tId] || 0) > 0) teamsOwned++;

                // Jugadores (2-12 y 14-20)
                for (let i = 1; i <= 20; i++) {
                    if (i !== 1 && i !== 13) {
                        const pId = `${secId}-${i}`;
                        if ((collection[pId] || 0) > 0) playersOwned++;
                    }
                }
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

            // Grupo Especial Unificado "1 - FWC - CC"
            const fwcStat = getSectionStatus("FWC");
            const ccStat = getSectionStatus("CC");
            const specialOwned = fwcStat.owned + ccStat.owned;
            const specialTotal = 20 + 14;
            const specialPct = ((specialOwned / specialTotal) * 100).toFixed(0);

            const specialCard = document.createElement('div');
            specialCard.className = "bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex flex-col justify-between";
            specialCard.innerHTML = `
                <div class="flex justify-between items-center mb-2 border-b border-slate-150 dark:border-slate-800 pb-1">
                    <span class="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1">🏆 1 - FWC - CC</span>
                    <span class="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded">${specialPct}%</span>
                </div>
                <div class="grid grid-cols-2 gap-1.5 mb-2">
                    <button onclick="goToSectionAndSticker('FWC')" class="w-full flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 transition text-left">
                        <span class="text-[10px] font-black text-slate-700 dark:text-slate-300">🏆 FWC</span>
                        <span class="text-[10px] font-black">${fwcStat.owned}/20</span>
                    </button>
                    <button onclick="goToSectionAndSticker('CC')" class="w-full flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 transition text-left">
                        <span class="text-[10px] font-black text-slate-700 dark:text-slate-300">🥤 CC</span>
                        <span class="text-[10px] font-black">${ccStat.owned}/14</span>
                    </button>
                </div>
                <div class="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700 mt-1">
                    <div class="bg-emerald-500 h-full" style="width: ${specialPct}%"></div>
                </div>
            `;
            container.appendChild(specialCard);

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
                // Modo Por Grupos tradicional
                for (const groupKey in GROUPS_DATA) {
                    const group = GROUPS_DATA[groupKey];
                    const card = document.createElement('div');
                    card.className = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl shadow-sm flex flex-col justify-between hover:border-emerald-500 hover:shadow-md transition-all";

                    let countriesHTML = "";
                    group.teams.forEach(teamId => {
                        const country = TEAMS_MAP[teamId];
                        const stats = getSectionStatus(teamId);
                        const isCompleted = stats.owned === stats.total;

                        countriesHTML += `
                            <button onclick="goToSectionAndSticker('${teamId}')" class="w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border border-slate-150 dark:border-slate-800 rounded-lg p-2 transition text-center">
                                <span class="text-base sm:text-lg leading-none">${country.flag}</span>
                                <span class="text-[10px] sm:text-[11px] font-black text-slate-800 dark:text-slate-200 mt-0.5">${teamId}</span>
                                <span class="text-[9px] sm:text-[10px] font-bold ${isCompleted ? 'text-emerald-600' : 'text-slate-500'} mt-1">${stats.owned}/${stats.total}</span>
                            </button>
                        `;
                    });

                    card.innerHTML = `
                        <div class="flex items-center justify-between mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
                            <span class="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">${group.name}</span>
                            <span class="text-[10px] font-black text-emerald-600 dark:text-emerald-400">GP ${groupKey}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-1">
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
            // Países
            for (const teamId in TEAMS_MAP) {
                for (let i = 1; i <= 20; i++) {
                    const id = getStickerId(teamId, i);
                    const qty = collection[id] || 0;
                    if (qty > 0) { totalOwned++; if (qty > 1) totalRepeats += (qty - 1); }
                }
            }

            const missing = GRAND_TOTAL_STICKERS - totalOwned;
            const pct = ((totalOwned / GRAND_TOTAL_STICKERS) * 100).toFixed(1);

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

            // Shields Progress
            const catShieldsProgress = document.getElementById('cat-progress-shields');
            const catShieldsBar = document.getElementById('cat-bar-shields');
            const catShieldsMissing = document.getElementById('cat-missing-shields');
            if (catShieldsProgress) catShieldsProgress.innerText = `${cat.shields} / 48`;
            if (catShieldsBar) catShieldsBar.style.width = `${(cat.shields / 48) * 100}%`;
            if (catShieldsMissing) catShieldsMissing.innerText = `Faltan ${48 - cat.shields}`;

            // Teams Progress
            const catTeamsProgress = document.getElementById('cat-progress-teams');
            const catTeamsBar = document.getElementById('cat-bar-teams');
            const catTeamsMissing = document.getElementById('cat-missing-teams');
            if (catTeamsProgress) catTeamsProgress.innerText = `${cat.teams} / 48`;
            if (catTeamsBar) catTeamsBar.style.width = `${(cat.teams / 48) * 100}%`;
            if (catTeamsMissing) catTeamsMissing.innerText = `Faltan ${48 - cat.teams}`;

            // Players Progress
            const catPlayersProgress = document.getElementById('cat-progress-players');
            const catPlayersBar = document.getElementById('cat-bar-players');
            const catPlayersMissing = document.getElementById('cat-missing-players');
            if (catPlayersProgress) catPlayersProgress.innerText = `${cat.players} / 864`;
            if (catPlayersBar) catPlayersBar.style.width = `${(cat.players / 864) * 100}%`;
            if (catPlayersMissing) catPlayersMissing.innerText = `Faltan ${864 - cat.players}`;

            // Actualizar contadores dinámicos del Dashboard
            const groupRatioFwc = document.getElementById('group-ratio-FWC');
            const groupRatioCc = document.getElementById('group-ratio-CC');
            if (groupRatioFwc) groupRatioFwc.innerText = `${fwcStat.owned} / 20`;
            if (groupRatioCc) groupRatioCc.innerText = `${ccStat.owned} / 14`;
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
                countText.innerText = `${selectedStickers.length} seleccionadas`;

                // Botones dinámicos para operaciones colectivas
                actionsContainer.innerHTML = `
                    <button onclick="applyBatchAction('add')" class="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-black transition flex items-center justify-center gap-1 text-[10px] shadow-sm">
                        <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Obtener (${selectedStickers.length})
                    </button>
                    <button onclick="applyBatchAction('remove')" class="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg font-black transition flex items-center justify-center gap-1 text-[10px] shadow-sm">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Quitar (${selectedStickers.length})
                    </button>
                    <button onclick="applyBatchAction('repeat')" class="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg font-black transition flex items-center justify-center gap-1 text-[10px] shadow-sm">
                        <i data-lucide="plus" class="w-3.5 h-3.5"></i> Repe (+1)
                    </button>
                `;
            } else {
                bar.classList.add('hidden');
                actionsContainer.innerHTML = `
                    <button onclick="bulkMarkCurrentSection(true)" class="flex-1 sm:flex-none bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 text-[10px]">
                        <i data-lucide="check-square" class="w-3.5 h-3.5"></i> Tener Todos
                    </button>
                    <button onclick="bulkMarkCurrentSection(false)" class="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 text-[10px]">
                        <i data-lucide="square" class="w-3.5 h-3.5"></i> Resetear
                    </button>
                `;
            }
            lucide.createIcons();
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

            for (let i = 1; i <= maxStickers; i++) {
                const id = getStickerId(currentSectionId, i);
                const displayCode = getStickerDisplayName(currentSectionId, i);
                const qty = collection[id] || 0;
                const metadata = getStickerMetadata(currentSectionId, i);

                // Filtro global de estado
                if (activeFilter === "missing" && qty > 0) continue;
                if (activeFilter === "owned" && qty === 0) continue;
                if (activeFilter === "repeats" && qty <= 1) continue;

                cardCount++;

                const hasLamin = qty > 0;
                const isCurrentlySelected = selectedStickers.includes(id);

                // Color VERDE CLARO PLANO para todas las láminas obtenidas
                let bgStyleClass = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800";
                if (hasLamin) {
                    bgStyleClass = "bg-[#4ade80] dark:bg-emerald-500 border-emerald-500 text-emerald-950 dark:text-emerald-50 shadow-sm";
                }

                const numberText = displayCode.split(' ')[1] || displayCode;

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
                            // Toque normal: alternar estado inmediato (Tengo / Falta)
                            const currentQty = collection[id] || 0;
                            if (currentQty === 0) {
                                collection[id] = 1;
                                showToast(`Lámina pegada: ${id.replace('-', ' ')}`, 'success');
                            } else {
                                collection[id] = 0;
                                showToast(`Lámina removida: ${id.replace('-', ' ')}`, 'info');
                            }
                            saveLocalStorage();
                            updateStats();
                            buildHorizontalCapsuleBar();
                            renderActiveSection();
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
                    <span class="text-[9px] sm:text-[10px] font-black tracking-tight mb-0.5 truncate max-w-full uppercase">
                        ${currentSectionId} ${numberText}
                    </span>
                `;

                grid.appendChild(card);
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

        // CARGA RÁPIDA DE SOBRES
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
                const matchGeneral = clean.match(/^([A-Z]{3})([0-9]{1,2})$/);

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
                            if (num >= 1 && num <= 20) {
                                const id = `${code}-${num}`;
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
                    list.push(`${randomSec}${randomNum}`);
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