/* ─── STRATOS WEATHER DASHBOARD ─────────────────────────────── */

const API_KEY = 'bd5e378503939ddaee76f12ad7a97608';
const BASE = 'https://api.openweathermap.org/data/2.5';
const TILE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OWM_TILE = 'https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid=' + API_KEY;

/* ─── STATE ──────────────────────────────────────────────────── */
let state = {
    unit: 'metric',        // metric | imperial
    unitSym: 'C',
    city: null,
    lat: null,
    lon: null,
    currentData: null,
    forecastData: null,
    timezone: 0,
    map: null,
    mapLayer: null,
    currentTileLayer: null,
    recentSearches: JSON.parse(localStorage.getItem('stratos_recent') || '[]'),
};

/* ─── POPULAR CITIES ─────────────────────────────────────────── */
const CITIES = [
    { name: 'London', country: 'GB' }, { name: 'New York', country: 'US' },
    { name: 'Paris', country: 'FR' }, { name: 'Tokyo', country: 'JP' },
    { name: 'Dubai', country: 'AE' }, { name: 'Singapore', country: 'SG' },
    { name: 'Sydney', country: 'AU' }, { name: 'Mumbai', country: 'IN' },
    { name: 'Karachi', country: 'PK' }, { name: 'Lahore', country: 'PK' },
    { name: 'Islamabad', country: 'PK' }, { name: 'Peshawar', country: 'PK' },
    { name: 'Beijing', country: 'CN' }, { name: 'Moscow', country: 'RU' },
    { name: 'Istanbul', country: 'TR' }, { name: 'Cairo', country: 'EG' },
    { name: 'Bangkok', country: 'TH' }, { name: 'Seoul', country: 'KR' },
    { name: 'Toronto', country: 'CA' }, { name: 'Berlin', country: 'DE' },
    { name: 'Rome', country: 'IT' }, { name: 'Madrid', country: 'ES' },
    { name: 'Amsterdam', country: 'NL' }, { name: 'Stockholm', country: 'SE' },
    { name: 'Lagos', country: 'NG' }, { name: 'Nairobi', country: 'KE' },
    { name: 'São Paulo', country: 'BR' }, { name: 'Buenos Aires', country: 'AR' },
    { name: 'Mexico City', country: 'MX' }, { name: 'Chicago', country: 'US' },
    { name: 'Los Angeles', country: 'US' }, { name: 'Hong Kong', country: 'HK' },
    { name: 'Faisalabad', country: 'PK' }, { name: 'Quetta', country: 'PK' },
    { name: 'Jakarta', country: 'ID' }, { name: 'Manila', country: 'PH' },
    { name: 'Cape Town', country: 'ZA' }, { name: 'Vancouver', country: 'CA' },
    { name: 'Zurich', country: 'CH' }, { name: 'Vienna', country: 'AT' },
];

/* ─── ICONS ──────────────────────────────────────────────────── */
const ICONS = {
    clear: '☀️', clouds: '☁️', rain: '🌧️', drizzle: '🌦️',
    thunderstorm: '⛈️', snow: '❄️', mist: '🌫️', fog: '🌫️',
    haze: '🌫️', smoke: '🌫️', dust: '🌪️', sand: '🌪️',
    ash: '🌋', squall: '💨', tornado: '🌪️',
};

function getIcon(cond) {
    return ICONS[cond?.toLowerCase()] || '🌤️';
}

/* ─── DIRS ───────────────────────────────────────────────────── */
const DIRS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
function degToDir(d) { return DIRS[Math.round(d / 22.5) % 16]; }

/* ─── UNIT HELPERS ───────────────────────────────────────────── */
function convertTemp(k, fromKelvin = false) {
    // API returns Celsius in metric, Fahrenheit in imperial
    return Math.round(k);
}

function windUnit() { return state.unit === 'metric' ? 'km/h' : 'mph'; }

/* ─── DOM REFS ───────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const searchBox = $('searchBox');
const suggestions = $('suggestions');
const recentList = $('recentList');

/* ─── CLOCK ──────────────────────────────────────────────────── */
function tick() {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const local = new Date(utc + state.timezone * 1000);

    const hh = local.getHours().toString().padStart(2, '0');
    const mm = local.getMinutes().toString().padStart(2, '0');
    $('sidebarTime').textContent = `${hh}:${mm}`;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    $('heroDate').textContent =
        `${days[local.getDay()]}, ${months[local.getMonth()]} ${local.getDate()} ${local.getFullYear()} · ${hh}:${mm}`;
}

setInterval(tick, 1000);
tick();

/* ─── SEARCH / SUGGESTIONS ───────────────────────────────────── */
let suggs = [], suggIdx = -1;

searchBox.addEventListener('input', () => {
    const q = searchBox.value.trim().toLowerCase();
    if (q.length < 2) { hideSugg(); return; }

    suggs = CITIES.filter(c =>
        c.name.toLowerCase().includes(q) || c.country.toLowerCase() === q
    ).slice(0, 7);

    // prepend matching recents
    const recMatches = state.recentSearches.filter(r =>
        r.toLowerCase().includes(q) && !suggs.find(s => s.name === r)
    );
    suggs = [
        ...recMatches.map(r => ({ name: r, country: '↺', recent: true })),
        ...suggs,
    ].slice(0, 7);

    renderSugg();
});

searchBox.addEventListener('keydown', e => {
    const items = suggestions.querySelectorAll('.suggestion-item');
    if (e.key === 'ArrowDown') { e.preventDefault(); suggIdx = Math.min(suggIdx + 1, items.length - 1); highlightSugg(items); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); suggIdx = Math.max(suggIdx - 1, -1); highlightSugg(items); }
    else if (e.key === 'Enter') {
        e.preventDefault();
        if (suggIdx >= 0 && items[suggIdx]) pickSugg(suggs[suggIdx]);
        else if (searchBox.value.trim()) search(searchBox.value.trim());
    }
    else if (e.key === 'Escape') hideSugg();
});

document.addEventListener('click', e => {
    if (!e.target.closest('.search-section')) hideSugg();
});

searchBox.addEventListener('focus', () => {
    if (searchBox.value.length >= 2) renderSugg();
});

function renderSugg() {
    if (!suggs.length) { hideSugg(); return; }
    suggestions.innerHTML = suggs.map((c, i) => `
        <div class="suggestion-item" data-idx="${i}">
            <span>${c.name}</span>
            <span class="sug-country">${c.country}</span>
        </div>
    `).join('');
    suggestions.querySelectorAll('.suggestion-item').forEach((el, i) => {
        el.addEventListener('click', () => pickSugg(suggs[i]));
    });
    suggestions.classList.add('open');
    suggIdx = -1;
}

function highlightSugg(items) {
    items.forEach((el, i) => el.classList.toggle('selected', i === suggIdx));
}

function hideSugg() {
    suggestions.classList.remove('open');
    suggestions.innerHTML = '';
    suggIdx = -1;
}

function pickSugg(c) {
    searchBox.value = c.name;
    hideSugg();
    search(c.name);
}

/* ─── RECENT ─────────────────────────────────────────────────── */
function addRecent(city) {
    state.recentSearches = [city, ...state.recentSearches.filter(r => r !== city)].slice(0, 6);
    localStorage.setItem('stratos_recent', JSON.stringify(state.recentSearches));
    renderRecent();
}

function renderRecent() {
    recentList.innerHTML = state.recentSearches.map(r =>
        `<div class="recent-item" data-city="${r}">${r}</div>`
    ).join('');
    recentList.querySelectorAll('.recent-item').forEach(el => {
        el.addEventListener('click', () => search(el.dataset.city));
    });
}

renderRecent();

/* ─── UNIT TOGGLE ────────────────────────────────────────────── */
$('celsiusBtn').addEventListener('click', () => setUnit('metric'));
$('fahrenheitBtn').addEventListener('click', () => setUnit('imperial'));

function setUnit(u) {
    state.unit = u;
    state.unitSym = u === 'metric' ? 'C' : 'F';
    $('celsiusBtn').classList.toggle('active', u === 'metric');
    $('fahrenheitBtn').classList.toggle('active', u === 'imperial');
    if (state.city) search(state.city);
}

/* ─── PANEL NAV ──────────────────────────────────────────────── */
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const panel = $(`panel-${btn.dataset.panel}`);
        if (panel) panel.classList.add('active');
        if (btn.dataset.panel === 'map') initMap();
    });
});

/* ─── LOCATION BTN ───────────────────────────────────────────── */
$('locationBtn').addEventListener('click', () => {
    if (!navigator.geolocation) { toast('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
        pos => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
        () => toast('Location access denied')
    );
});

/* ─── MAIN SEARCH ────────────────────────────────────────────── */
async function search(city) {
    if (!city) return;
    state.city = city;
    setLoading(true);
    try {
        await Promise.all([fetchCurrent(city), fetchForecast(city)]);
        addRecent(city);
    } catch (e) {
        toast(e.message || 'City not found');
    } finally {
        setLoading(false);
    }
}

async function fetchByCoords(lat, lon) {
    setLoading(true);
    try {
        const [cur, fore] = await Promise.all([
            apiFetch(`${BASE}/weather?lat=${lat}&lon=${lon}&units=${state.unit}&appid=${API_KEY}`),
            apiFetch(`${BASE}/forecast?lat=${lat}&lon=${lon}&units=${state.unit}&cnt=40&appid=${API_KEY}`),
        ]);
        state.currentData = cur;
        state.forecastData = fore;
        state.lat = lat; state.lon = lon;
        state.city = cur.name;
        searchBox.value = cur.name;
        addRecent(cur.name);
        renderAll();
    } catch (e) {
        toast(e.message);
    } finally {
        setLoading(false);
    }
}

async function fetchCurrent(city) {
    const data = await apiFetch(`${BASE}/weather?q=${encodeURIComponent(city)}&units=${state.unit}&appid=${API_KEY}`);
    state.currentData = data;
    state.lat = data.coord.lat;
    state.lon = data.coord.lon;
    state.timezone = data.timezone;
    renderCurrent(data);
}

async function fetchForecast(city) {
    const data = await apiFetch(`${BASE}/forecast?q=${encodeURIComponent(city)}&units=${state.unit}&cnt=40&appid=${API_KEY}`);
    state.forecastData = data;
    renderForecast(data);
    renderHourly(data);
}

async function apiFetch(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error('City not found');
    return r.json();
}

/* ─── RENDER CURRENT ─────────────────────────────────────────── */
function renderCurrent(d) {
    const cond = d.weather[0].main;
    const icon = getIcon(cond);
    const sym = state.unitSym;

    // Hero
    $('heroCity').textContent = d.name;
    $('heroCountry').textContent = d.sys.country;
    $('heroCondition').textContent = d.weather[0].description;

    // Temp card
    flash($('mainIcon'), icon);
    flash($('mainTemp'), Math.round(d.main.temp));
    flash($('feelsLike'), `${Math.round(d.main.feels_like)}°${sym}`);
    flash($('hiLo'), `${Math.round(d.main.temp_max)}° / ${Math.round(d.main.temp_min)}°`);

    // Dew point approx
    const dp = Math.round(d.main.temp - ((100 - d.main.humidity) / 5));
    flash($('dewPoint'), `${dp}°${sym}`);

    // Alert strip (simulate for thunderstorm)
    const alertStrip = $('alertStrip');
    if (cond.toLowerCase() === 'thunderstorm') {
        alertStrip.style.display = 'flex';
        $('alertText').textContent = 'Thunderstorm in progress — stay indoors';
    } else {
        alertStrip.style.display = 'none';
    }

    // Sun card
    const tz = d.timezone;
    const sunriseDate = new Date((d.sys.sunrise + tz) * 1000);
    const sunsetDate = new Date((d.sys.sunset + tz) * 1000);
    const srH = sunriseDate.getUTCHours().toString().padStart(2, '0');
    const srM = sunriseDate.getUTCMinutes().toString().padStart(2, '0');
    const ssH = sunsetDate.getUTCHours().toString().padStart(2, '0');
    const ssM = sunsetDate.getUTCMinutes().toString().padStart(2, '0');
    $('sunrise').textContent = `${srH}:${srM}`;
    $('sunset').textContent = `${ssH}:${ssM}`;

    const dayLen = d.sys.sunset - d.sys.sunrise;
    const dh = Math.floor(dayLen / 3600);
    const dm = Math.floor((dayLen % 3600) / 60);
    $('sunDuration').textContent = `${dh}h ${dm}m daylight`;

    // Sun arc animation
    const nowUtc = Date.now() / 1000;
    const progress = Math.max(0, Math.min(1,
        (nowUtc - d.sys.sunrise) / (d.sys.sunset - d.sys.sunrise)
    ));
    const arcLen = 283;
    const dashOffset = arcLen - arcLen * progress;
    const sunProgressEl = document.querySelector('.sun-progress');
    const sunDotEl = document.querySelector('.sun-dot');
    if (sunProgressEl) sunProgressEl.style.strokeDashoffset = dashOffset;

    // Position dot on arc
    if (sunDotEl && progress >= 0 && progress <= 1) {
        const angle = Math.PI * progress; // 0 = left, PI = right
        const cx = 10 + 180 * progress;
        const cy = 100 - Math.sin(angle) * 90;
        sunDotEl.setAttribute('cx', cx.toFixed(1));
        sunDotEl.setAttribute('cy', cy.toFixed(1));
    }

    // Wind card
    flash($('windSpeed'), `${Math.round(d.wind.speed)} ${windUnit()}`);
    flash($('windGust'), d.wind.gust ? `${Math.round(d.wind.gust)} ${windUnit()}` : 'N/A');
    flash($('windDir'), degToDir(d.wind.deg || 0));

    // Compass needle
    const needle = $('compassNeedle');
    if (needle) needle.style.transform = `rotate(${d.wind.deg || 0}deg)`;

    // Atmosphere
    const humCirc = 150.8;
    const humPct = d.main.humidity / 100;
    const cloudPct = d.clouds.all / 100;
    $('humidityVal').textContent = `${d.main.humidity}%`;
    $('cloudinessVal').textContent = `${d.clouds.all}%`;
    $('pressureVal').textContent = d.main.pressure;
    $('visibilityVal').textContent = (d.visibility / 1000).toFixed(1);

    const hGauge = document.querySelector('.humidity-gauge');
    const cGauge = document.querySelector('.cloud-gauge');
    if (hGauge) hGauge.style.strokeDashoffset = humCirc - humCirc * humPct;
    if (cGauge) cGauge.style.strokeDashoffset = humCirc - humCirc * cloudPct;

    // Update map if visible
    if (state.map) updateMapCity();

    tick();
}

/* ─── RENDER FORECAST ────────────────────────────────────────── */
function renderForecast(data) {
    const days = groupByDay(data.list);
    const sym = state.unitSym;

    // Forecast strip (overview panel)
    const strip = $('forecastStrip');
    strip.innerHTML = days.slice(0, 5).map(day => {
        const icon = getIcon(day.cond);
        const dayLabel = new Date(day.dt * 1000).toLocaleDateString('en', { weekday: 'short' });
        return `
            <div class="forecast-day">
                <span class="fd-day">${dayLabel}</span>
                <span class="fd-icon">${icon}</span>
                <div class="fd-temps">
                    <div class="fd-hi">${Math.round(day.hi)}°</div>
                    <div class="fd-lo">${Math.round(day.lo)}°</div>
                </div>
            </div>
        `;
    }).join('');

    // Forecast detail panel
    const grid = $('forecastDetailGrid');
    grid.innerHTML = days.slice(0, 5).map(day => {
        const icon = getIcon(day.cond);
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en', { weekday: 'long' });
        const dateStr = date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
        return `
            <div class="forecast-detail-card">
                <div class="fdc-day">${dayName}</div>
                <div class="fdc-date">${dateStr}</div>
                <div class="fdc-icon">${icon}</div>
                <div class="fdc-hi">${Math.round(day.hi)}°${sym}</div>
                <div class="fdc-lo">${Math.round(day.lo)}°${sym}</div>
                <div class="fdc-desc">${day.desc}</div>
                <div class="fdc-details">
                    <div class="fdc-detail-row">
                        <span class="fdc-detail-label">HUMIDITY</span>
                        <span class="fdc-detail-val">${day.humidity}%</span>
                    </div>
                    <div class="fdc-detail-row">
                        <span class="fdc-detail-label">WIND</span>
                        <span class="fdc-detail-val">${Math.round(day.wind)} ${windUnit()}</span>
                    </div>
                    <div class="fdc-detail-row">
                        <span class="fdc-detail-label">CLOUDS</span>
                        <span class="fdc-detail-val">${day.clouds}%</span>
                    </div>
                    <div class="fdc-detail-row">
                        <span class="fdc-detail-label">RAIN</span>
                        <span class="fdc-detail-val">${day.pop}%</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/* ─── RENDER HOURLY ──────────────────────────────────────────── */
let hourlyChartInstance = null;

function renderHourly(data) {
    const items = data.list.slice(0, 24);
    const sym = state.unitSym;

    // Chart
    const ctx = $('hourlyChart').getContext('2d');
    if (hourlyChartInstance) hourlyChartInstance.destroy();

    const labels = items.map(item => {
        const d = new Date((item.dt + state.timezone) * 1000);
        return d.getUTCHours().toString().padStart(2, '0') + ':00';
    });

    const temps = items.map(item => Math.round(item.main.temp));

    hourlyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data: temps,
                borderColor: '#e8c97a',
                backgroundColor: (ctx) => {
                    const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
                    g.addColorStop(0, 'rgba(232,201,122,0.3)');
                    g.addColorStop(1, 'rgba(232,201,122,0)');
                    return g;
                },
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: '#e8c97a',
                tension: 0.4,
                fill: true,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    ticks: { color: 'rgba(232,232,240,0.45)', font: { family: 'DM Mono', size: 10 }, maxRotation: 0 },
                    grid: { color: 'rgba(255,255,255,0.04)' },
                },
                y: {
                    ticks: {
                        color: 'rgba(232,232,240,0.45)',
                        font: { family: 'DM Mono', size: 10 },
                        callback: v => `${v}°${sym}`,
                    },
                    grid: { color: 'rgba(255,255,255,0.04)' },
                },
            },
        },
    });

    // Hourly grid cards (first 16)
    const grid = $('hourlyGrid');
    grid.innerHTML = items.slice(0, 16).map(item => {
        const d = new Date((item.dt + state.timezone) * 1000);
        const hh = d.getUTCHours().toString().padStart(2, '0');
        const icon = getIcon(item.weather[0].main);
        const rain = item.pop ? Math.round(item.pop * 100) : 0;
        return `
            <div class="hourly-item">
                <span class="hi-time">${hh}:00</span>
                <span class="hi-icon">${icon}</span>
                <span class="hi-temp">${Math.round(item.main.temp)}°${sym}</span>
                ${rain > 10 ? `<span class="hi-rain">💧${rain}%</span>` : ''}
            </div>
        `;
    }).join('');
}

/* ─── GROUP FORECAST BY DAY ──────────────────────────────────── */
function groupByDay(list) {
    const map = {};
    list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString('en');
        if (!map[date]) {
            map[date] = {
                dt: item.dt,
                hi: item.main.temp_max,
                lo: item.main.temp_min,
                cond: item.weather[0].main,
                desc: item.weather[0].description,
                humidity: item.main.humidity,
                wind: item.wind.speed,
                clouds: item.clouds.all,
                pop: Math.round((item.pop || 0) * 100),
            };
        } else {
            map[date].hi = Math.max(map[date].hi, item.main.temp_max);
            map[date].lo = Math.min(map[date].lo, item.main.temp_min);
        }
    });
    return Object.values(map);
}

/* ─── MAP ────────────────────────────────────────────────────── */
function initMap() {
    if (state.map) { updateMapCity(); return; }

    // Load Leaflet dynamically
    if (!window.L) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);

        const js = document.createElement('script');
        js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        js.onload = () => buildMap();
        document.head.appendChild(js);
    } else {
        buildMap();
    }
}

function buildMap() {
    const lat = state.lat || 51.5;
    const lon = state.lon || -0.1;

    state.map = L.map('weatherMap', { zoomControl: true }).setView([lat, lon], 6);

    // Dark base tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        subdomains: 'abcd', maxZoom: 19,
    }).addTo(state.map);

    // OWM layer
    state.currentTileLayer = L.tileLayer(OWM_TILE.replace('{layer}', 'temp_new'), {
        opacity: 0.6, maxZoom: 19,
    }).addTo(state.map);

    // City marker
    if (state.lat) {
        L.circleMarker([state.lat, state.lon], {
            radius: 8, color: '#e8c97a', fillColor: '#e8c97a', fillOpacity: 1,
        }).addTo(state.map).bindPopup(state.city);
        $('mapCityMarker').style.display = 'block';
        $('mapCityName').textContent = `◉ ${state.city}`;
    }

    // Layer buttons
    document.querySelectorAll('.layer-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (state.currentTileLayer) state.map.removeLayer(state.currentTileLayer);
            state.currentTileLayer = L.tileLayer(OWM_TILE.replace('{layer}', btn.dataset.layer), {
                opacity: 0.6, maxZoom: 19,
            }).addTo(state.map);
        });
    });
}

function updateMapCity() {
    if (!state.map || !state.lat) return;
    state.map.setView([state.lat, state.lon], 7);
    $('mapCityMarker').style.display = 'block';
    $('mapCityName').textContent = `◉ ${state.city}`;
}

/* ─── RENDER ALL (after unit switch) ────────────────────────── */
function renderAll() {
    if (state.currentData) renderCurrent(state.currentData);
    if (state.forecastData) {
        renderForecast(state.forecastData);
        renderHourly(state.forecastData);
    }
}

/* ─── HELPERS ────────────────────────────────────────────────── */
function flash(el, val) {
    if (!el) return;
    el.textContent = val;
    el.classList.remove('value-updated');
    void el.offsetWidth;
    el.classList.add('value-updated');
}

function setLoading(v) {
    $('mainTemp').classList.toggle('loading', v);
    $('mainIcon').classList.toggle('loading', v);
    if (v) { $('mainIcon').textContent = '⏳'; $('mainTemp').textContent = '--'; }
}

let toastTimer;
function toast(msg) {
    let el = $('toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'toast';
        document.body.appendChild(el);
    }
    el.textContent = '⚠ ' + msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 4000);
}

/* ─── INIT ───────────────────────────────────────────────────── */
window.addEventListener('load', () => {
    search('London');
});