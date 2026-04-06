/* ─── STRATOS WEATHER DASHBOARD ─────────────────────────────── */

const API_KEY = 'bd5e378503939ddaee76f12ad7a97608';
const BASE    = 'https://api.openweathermap.org/data/2.5';
const OWM_TILE= 'https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid=' + API_KEY;

/* ─── STATE ──────────────────────────────────────────────────── */
let state = {
    unit: 'metric',
    unitSym: 'C',
    city: null,
    lat: null,
    lon: null,
    currentData: null,
    forecastData: null,
    timezone: 0,          // seconds offset from UTC
    map: null,
    currentTileLayer: null,
    markerLayer: null,
    recentSearches: JSON.parse(localStorage.getItem('stratos_recent') || '[]'),
};

/* ─── POPULAR CITIES ─────────────────────────────────────────── */
const CITIES = [
    { name:'London',country:'GB' },{ name:'New York',country:'US' },
    { name:'Paris',country:'FR' },{ name:'Tokyo',country:'JP' },
    { name:'Dubai',country:'AE' },{ name:'Singapore',country:'SG' },
    { name:'Sydney',country:'AU' },{ name:'Mumbai',country:'IN' },
    { name:'Karachi',country:'PK' },{ name:'Lahore',country:'PK' },
    { name:'Islamabad',country:'PK' },{ name:'Peshawar',country:'PK' },
    { name:'Faisalabad',country:'PK' },{ name:'Quetta',country:'PK' },
    { name:'Beijing',country:'CN' },{ name:'Moscow',country:'RU' },
    { name:'Istanbul',country:'TR' },{ name:'Cairo',country:'EG' },
    { name:'Bangkok',country:'TH' },{ name:'Seoul',country:'KR' },
    { name:'Toronto',country:'CA' },{ name:'Berlin',country:'DE' },
    { name:'Rome',country:'IT' },{ name:'Madrid',country:'ES' },
    { name:'Amsterdam',country:'NL' },{ name:'Stockholm',country:'SE' },
    { name:'Lagos',country:'NG' },{ name:'Nairobi',country:'KE' },
    { name:'São Paulo',country:'BR' },{ name:'Buenos Aires',country:'AR' },
    { name:'Mexico City',country:'MX' },{ name:'Chicago',country:'US' },
    { name:'Los Angeles',country:'US' },{ name:'Hong Kong',country:'HK' },
    { name:'Jakarta',country:'ID' },{ name:'Manila',country:'PH' },
    { name:'Cape Town',country:'ZA' },{ name:'Vancouver',country:'CA' },
    { name:'Zurich',country:'CH' },{ name:'Vienna',country:'AT' },
    { name:'Dhaka',country:'BD' },{ name:'Riyadh',country:'SA' },
    { name:'Kabul',country:'AF' },{ name:'Tehran',country:'IR' },
];

/* ─── WEATHER ICON MAP (OWM condition main field) ────────────── */
const ICONS = {
    clear:'☀️', clouds:'☁️', rain:'🌧️', drizzle:'🌦️',
    thunderstorm:'⛈️', snow:'❄️', mist:'🌫️', fog:'🌫️',
    haze:'🌫️', smoke:'🌫️', dust:'🌪️', sand:'🌪️',
    ash:'🌋', squall:'💨', tornado:'🌪️',
};
function getIcon(cond) { return ICONS[cond?.toLowerCase()] || '🌤️'; }

/* ─── COMPASS DIRECTIONS ─────────────────────────────────────── */
const DIRS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
function degToDir(d) { return DIRS[Math.round((d ?? 0) / 22.5) % 16]; }

/* ─── WIND UNIT LABEL ────────────────────────────────────────── */
// OWM metric = m/s, imperial = mph
// We convert m/s → km/h ourselves when metric
function windLabel(mps) {
    if (state.unit === 'imperial') return `${Math.round(mps)} mph`;
    return `${Math.round(mps * 3.6)} km/h`;   // m/s × 3.6 = km/h
}

/* ─── DOM HELPER ─────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

/* ─── CLOCK (city-local time via OWM timezone offset) ───────── */
function tick() {
    const nowMs  = Date.now();
    const utcMs  = nowMs + (new Date().getTimezoneOffset() * 60000);
    const cityMs = utcMs + (state.timezone * 1000);   // state.timezone is seconds
    const local  = new Date(cityMs);

    const hh = local.getUTCHours().toString().padStart(2,'0');
    const mm = local.getUTCMinutes().toString().padStart(2,'0');
    $('sidebarTime').textContent = `${hh}:${mm}`;

    const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    $('heroDate').textContent =
        `${DAYS[local.getUTCDay()]}, ${MONTHS[local.getUTCMonth()]} ${local.getUTCDate()} ${local.getUTCFullYear()} · ${hh}:${mm}`;
}
setInterval(tick, 1000);
tick();

/* ─── SEARCH SUGGESTIONS ─────────────────────────────────────── */
const searchBox   = $('searchBox');
const suggestions = $('suggestions');
let suggs = [], suggIdx = -1;

searchBox.addEventListener('input', () => {
    const q = searchBox.value.trim().toLowerCase();
    if (q.length < 2) { hideSugg(); return; }

    const cityMatches = CITIES.filter(c =>
        c.name.toLowerCase().includes(q) || c.country.toLowerCase() === q
    ).slice(0, 6);

    const recMatches = state.recentSearches
        .filter(r => r.toLowerCase().includes(q) && !cityMatches.find(s => s.name === r))
        .slice(0, 3)
        .map(r => ({ name: r, country: '↺', recent: true }));

    suggs = [...recMatches, ...cityMatches].slice(0, 7);
    renderSugg();
});

searchBox.addEventListener('keydown', e => {
    const items = suggestions.querySelectorAll('.suggestion-item');
    if (e.key === 'ArrowDown')  { e.preventDefault(); suggIdx = Math.min(suggIdx+1, items.length-1); highlightSugg(items); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); suggIdx = Math.max(suggIdx-1, -1); highlightSugg(items); }
    else if (e.key === 'Enter') {
        e.preventDefault();
        if (suggIdx >= 0 && items[suggIdx]) pickSugg(suggs[suggIdx]);
        else if (searchBox.value.trim()) search(searchBox.value.trim());
    }
    else if (e.key === 'Escape') hideSugg();
});

document.addEventListener('click', e => { if (!e.target.closest('.search-section')) hideSugg(); });
searchBox.addEventListener('focus', () => { if (searchBox.value.length >= 2) renderSugg(); });

function renderSugg() {
    if (!suggs.length) { hideSugg(); return; }
    suggestions.innerHTML = suggs.map((c, i) => `
        <div class="suggestion-item" data-idx="${i}">
            <span>${c.name}</span>
            <span class="sug-country">${c.country}</span>
        </div>`).join('');
    suggestions.querySelectorAll('.suggestion-item').forEach((el, i) =>
        el.addEventListener('click', () => pickSugg(suggs[i])));
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

/* ─── RECENT SEARCHES ────────────────────────────────────────── */
function addRecent(city) {
    state.recentSearches = [city, ...state.recentSearches.filter(r => r !== city)].slice(0, 6);
    localStorage.setItem('stratos_recent', JSON.stringify(state.recentSearches));
    renderRecent();
}

function renderRecent() {
    const list = $('recentList');
    list.innerHTML = state.recentSearches.map(r =>
        `<div class="recent-item" data-city="${r}">${r}</div>`).join('');
    list.querySelectorAll('.recent-item').forEach(el =>
        el.addEventListener('click', () => search(el.dataset.city)));
}
renderRecent();

/* ─── UNIT TOGGLE ────────────────────────────────────────────── */
$('celsiusBtn').addEventListener('click',    () => setUnit('metric'));
$('fahrenheitBtn').addEventListener('click', () => setUnit('imperial'));

function setUnit(u) {
    state.unit    = u;
    state.unitSym = u === 'metric' ? 'C' : 'F';
    $('celsiusBtn').classList.toggle('active',    u === 'metric');
    $('fahrenheitBtn').classList.toggle('active', u === 'imperial');
    if (state.city) search(state.city);   // re-fetch with new units
}

/* ─── PANEL NAVIGATION ───────────────────────────────────────── */
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

/* ─── GEOLOCATION ────────────────────────────────────────────── */
$('locationBtn').addEventListener('click', () => {
    if (!navigator.geolocation) { toast('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
        pos => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
        ()  => toast('Location access denied')
    );
});

/* ─── API FETCH WRAPPER ──────────────────────────────────────── */
async function apiFetch(url) {
    const r = await fetch(url);
    if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.message || `Error ${r.status}`);
    }
    return r.json();
}

/* ─── MAIN SEARCH ENTRY POINT ────────────────────────────────── */
async function search(city) {
    if (!city) return;
    state.city = city;
    setLoading(true);
    try {
        // Fetch both APIs in parallel
        const [cur, fore] = await Promise.all([
            apiFetch(`${BASE}/weather?q=${encodeURIComponent(city)}&units=${state.unit}&appid=${API_KEY}`),
            apiFetch(`${BASE}/forecast?q=${encodeURIComponent(city)}&units=${state.unit}&cnt=40&appid=${API_KEY}`),
        ]);
        state.currentData  = cur;
        state.forecastData = fore;
        state.lat      = cur.coord.lat;
        state.lon      = cur.coord.lon;
        state.timezone = cur.timezone;   // seconds offset from UTC
        state.city     = cur.name;
        searchBox.value = cur.name;
        addRecent(cur.name);
        renderCurrent(cur);
        renderForecast(fore);
        renderHourly(fore);
        if (state.map) updateMapCity();
    } catch(e) {
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
        state.currentData  = cur;
        state.forecastData = fore;
        state.lat      = cur.coord.lat;
        state.lon      = cur.coord.lon;
        state.timezone = cur.timezone;
        state.city     = cur.name;
        searchBox.value = cur.name;
        addRecent(cur.name);
        renderCurrent(cur);
        renderForecast(fore);
        renderHourly(fore);
        if (state.map) updateMapCity();
    } catch(e) {
        toast(e.message);
    } finally {
        setLoading(false);
    }
}

/* ═══════════════════════════════════════════════════════════════
   RENDER CURRENT WEATHER
   OWM /weather response fields used:
   - d.name, d.sys.country
   - d.weather[0].main, d.weather[0].description, d.weather[0].icon
   - d.main.temp, d.main.feels_like, d.main.temp_max, d.main.temp_min
   - d.main.humidity, d.main.pressure, d.main.sea_level / grnd_level
   - d.wind.speed (m/s in metric), d.wind.gust, d.wind.deg
   - d.clouds.all (%)
   - d.visibility (metres, max 10000)
   - d.sys.sunrise, d.sys.sunset (UTC unix timestamps)
   - d.timezone (seconds offset from UTC)
   - d.coord.lat, d.coord.lon
   - d.rain['1h'] / d.snow['1h'] (optional)
   ═══════════════════════════════════════════════════════════════ */
function renderCurrent(d) {
    const cond = d.weather[0].main;
    const sym  = state.unitSym;

    /* ── Hero bar ── */
    $('heroCity').textContent      = d.name;
    $('heroCountry').textContent   = d.sys.country;
    // Capitalise description
    $('heroCondition').textContent =
        d.weather[0].description.replace(/\b\w/g, c => c.toUpperCase());

    /* ── Temperature card ── */
    flash($('mainIcon'), getIcon(cond));
    flash($('mainTemp'), Math.round(d.main.temp));
    flash($('feelsLike'), `${Math.round(d.main.feels_like)}°${sym}`);
    flash($('hiLo'), `${Math.round(d.main.temp_max)}° / ${Math.round(d.main.temp_min)}°`);

    // Dew point: Magnus formula approximation
    // Td ≈ T - (100 - RH)/5  (valid within ~1°C for RH > 50%)
    const dewC = d.main.temp - ((100 - d.main.humidity) / 5);
    const dewDisplay = state.unit === 'imperial'
        ? Math.round(dewC * 9/5 + 32) : Math.round(dewC);
    flash($('dewPoint'), `${dewDisplay}°${sym}`);

    /* ── Alert strip ── */
    const alertStrip = $('alertStrip');
    const severeConditions = ['thunderstorm', 'tornado', 'squall'];
    if (severeConditions.includes(cond.toLowerCase())) {
        alertStrip.style.display = 'flex';
        const msgs = {
            thunderstorm: 'Thunderstorm active — seek shelter indoors',
            tornado:      'Tornado warning — take cover immediately',
            squall:       'Squall warning — strong sudden winds',
        };
        $('alertText').textContent = msgs[cond.toLowerCase()] || 'Severe weather alert';
    } else {
        alertStrip.style.display = 'none';
    }

    /* ── Sun card ── */
    // OWM gives sunrise/sunset as UTC unix seconds.
    // Add timezone offset to get local time, then read as UTC.
    const srLocal = new Date((d.sys.sunrise + d.timezone) * 1000);
    const ssLocal = new Date((d.sys.sunset  + d.timezone) * 1000);
    $('sunrise').textContent =
        `${srLocal.getUTCHours().toString().padStart(2,'0')}:${srLocal.getUTCMinutes().toString().padStart(2,'0')}`;
    $('sunset').textContent  =
        `${ssLocal.getUTCHours().toString().padStart(2,'0')}:${ssLocal.getUTCMinutes().toString().padStart(2,'0')}`;

    const dayLen = d.sys.sunset - d.sys.sunrise;
    $('sunDuration').textContent =
        `${Math.floor(dayLen/3600)}h ${Math.floor((dayLen%3600)/60)}m daylight`;

    // Arc progress — how far through the day are we right now?
    const nowSec  = Date.now() / 1000;
    const progress = Math.max(0, Math.min(1,
        (nowSec - d.sys.sunrise) / (d.sys.sunset - d.sys.sunrise)
    ));
    const arcLen = 283;
    const sunProgressEl = document.querySelector('.sun-progress');
    const sunDotEl      = document.querySelector('.sun-dot');
    if (sunProgressEl) sunProgressEl.style.strokeDashoffset = arcLen - arcLen * progress;
    if (sunDotEl) {
        // Arc goes from (10,100) to (190,100) with radius 90, centred at (100,100)
        const angle = Math.PI * progress;
        sunDotEl.setAttribute('cx', (10 + 180 * progress).toFixed(1));
        sunDotEl.setAttribute('cy', (100 - Math.sin(angle) * 90).toFixed(1));
    }

    /* ── Wind card ── */
    // OWM always returns speed in m/s for metric, mph for imperial
    flash($('windSpeed'), windLabel(d.wind.speed));
    flash($('windGust'),  d.wind.gust != null ? windLabel(d.wind.gust) : 'N/A');
    flash($('windDir'),   degToDir(d.wind.deg));
    const needle = $('compassNeedle');
    if (needle) needle.style.transform = `rotate(${d.wind.deg ?? 0}deg)`;

    /* ── Atmosphere card ── */
    const humCirc  = 150.8;                    // 2π × 24 (SVG circle circumference)
    const humPct   = d.main.humidity / 100;
    const cloudPct = d.clouds.all    / 100;

    flash($('humidityVal'),   `${d.main.humidity}%`);
    flash($('cloudinessVal'), `${d.clouds.all}%`);

    // Prefer sea_level pressure, fall back to ground-level, then surface pressure
    const pressure = d.main.sea_level ?? d.main.grnd_level ?? d.main.pressure;
    flash($('pressureVal'),   pressure);

    // visibility: OWM returns metres (max 10 000). Convert to km, cap at 10.
    const visKm = d.visibility != null ? (d.visibility / 1000).toFixed(1) : 'N/A';
    flash($('visibilityVal'), visKm);

    const hGauge = document.querySelector('.humidity-gauge');
    const cGauge = document.querySelector('.cloud-gauge');
    if (hGauge) hGauge.style.strokeDashoffset = humCirc - humCirc * humPct;
    if (cGauge) cGauge.style.strokeDashoffset = humCirc - humCirc * cloudPct;

    /* ── Extra: rain/snow last 1h if available ── */
    const rain1h = d.rain?.['1h'] ?? null;
    const snow1h = d.snow?.['1h'] ?? null;
    const precip = rain1h != null ? `Rain: ${rain1h} mm/h`
                 : snow1h != null ? `Snow: ${snow1h} mm/h`
                 : null;
    if (precip) $('heroCondition').textContent += ` · ${precip}`;

    tick();
}

/* ═══════════════════════════════════════════════════════════════
   RENDER 5-DAY FORECAST
   OWM /forecast returns a list of 3-hour snapshots (up to 40 = 5 days).
   Each item has: dt, main.*, weather[0], wind, clouds, pop (0–1), rain/snow
   We group by local DATE (using the city timezone offset).
   ═══════════════════════════════════════════════════════════════ */
function groupByDay(list) {
    const map = {};
    list.forEach(item => {
        // Use city-local date as key so days break at midnight locally, not UTC midnight
        const localMs  = (item.dt + state.timezone) * 1000;
        const localDate = new Date(localMs);
        const key = `${localDate.getUTCFullYear()}-${localDate.getUTCMonth()}-${localDate.getUTCDate()}`;

        if (!map[key]) {
            map[key] = {
                dt:       item.dt,
                hi:       item.main.temp_max,
                lo:       item.main.temp_min,
                cond:     item.weather[0].main,
                desc:     item.weather[0].description,
                humidity: item.main.humidity,
                wind:     item.wind.speed,   // m/s
                clouds:   item.clouds.all,
                pop:      Math.round((item.pop ?? 0) * 100),  // % chance of precip
                pressure: item.main.sea_level ?? item.main.pressure,
            };
        } else {
            // Keep the true daily hi/lo across all 3-hour slots
            map[key].hi  = Math.max(map[key].hi,  item.main.temp_max);
            map[key].lo  = Math.min(map[key].lo,  item.main.temp_min);
            // Use midday slot for representative condition (around 12:00 local)
            const h = new Date((item.dt + state.timezone) * 1000).getUTCHours();
            if (h >= 11 && h <= 14) {
                map[key].cond     = item.weather[0].main;
                map[key].desc     = item.weather[0].description;
                map[key].humidity = item.main.humidity;
                map[key].wind     = item.wind.speed;
            }
            // Keep max pop for the day
            map[key].pop = Math.max(map[key].pop, Math.round((item.pop ?? 0) * 100));
        }
    });
    return Object.values(map);
}

function renderForecast(data) {
    const days = groupByDay(data.list);
    const sym  = state.unitSym;

    /* ── Mini strip on overview panel ── */
    $('forecastStrip').innerHTML = days.slice(0, 5).map(day => {
        const icon     = getIcon(day.cond);
        const dayLabel = new Date((day.dt + state.timezone) * 1000)
            .toLocaleDateString('en', { weekday:'short', timeZone:'UTC' });
        return `
            <div class="forecast-day">
                <span class="fd-day">${dayLabel}</span>
                <span class="fd-icon">${icon}</span>
                <div class="fd-temps">
                    <div class="fd-hi">${Math.round(day.hi)}°</div>
                    <div class="fd-lo">${Math.round(day.lo)}°</div>
                </div>
            </div>`;
    }).join('');

    /* ── Full forecast detail cards ── */
    $('forecastDetailGrid').innerHTML = days.slice(0, 5).map(day => {
        const icon    = getIcon(day.cond);
        const localDt = new Date((day.dt + state.timezone) * 1000);
        const dayName = localDt.toLocaleDateString('en', { weekday:'long',  timeZone:'UTC' });
        const dateStr = localDt.toLocaleDateString('en', { month:'short', day:'numeric', timeZone:'UTC' });
        const desc    = day.desc.replace(/\b\w/g, c => c.toUpperCase());
        return `
            <div class="forecast-detail-card">
                <div class="fdc-day">${dayName}</div>
                <div class="fdc-date">${dateStr}</div>
                <div class="fdc-icon">${icon}</div>
                <div class="fdc-hi">${Math.round(day.hi)}°${sym}</div>
                <div class="fdc-lo">${Math.round(day.lo)}°${sym}</div>
                <div class="fdc-desc">${desc}</div>
                <div class="fdc-details">
                    <div class="fdc-detail-row">
                        <span class="fdc-detail-label">HUMIDITY</span>
                        <span class="fdc-detail-val">${day.humidity}%</span>
                    </div>
                    <div class="fdc-detail-row">
                        <span class="fdc-detail-label">WIND</span>
                        <span class="fdc-detail-val">${windLabel(day.wind)}</span>
                    </div>
                    <div class="fdc-detail-row">
                        <span class="fdc-detail-label">CLOUD COVER</span>
                        <span class="fdc-detail-val">${day.clouds}%</span>
                    </div>
                    <div class="fdc-detail-row">
                        <span class="fdc-detail-label">RAIN CHANCE</span>
                        <span class="fdc-detail-val">${day.pop}%</span>
                    </div>
                    <div class="fdc-detail-row">
                        <span class="fdc-detail-label">PRESSURE</span>
                        <span class="fdc-detail-val">${day.pressure} hPa</span>
                    </div>
                </div>
            </div>`;
    }).join('');
}

/* ═══════════════════════════════════════════════════════════════
   RENDER HOURLY (3-hour intervals from /forecast)
   Shows next 24 slots = 72 hours. Chart shows temperature line.
   Grid shows first 16 slots (48h) with time, icon, temp, rain%.
   ═══════════════════════════════════════════════════════════════ */
let hourlyChartInstance = null;

function renderHourly(data) {
    const items = data.list.slice(0, 24);
    const sym   = state.unitSym;

    /* ── Chart ── */
    const ctx = $('hourlyChart').getContext('2d');
    if (hourlyChartInstance) hourlyChartInstance.destroy();

    const labels = items.map(item => {
        // Convert each slot's UTC timestamp to city-local time
        const localH = new Date((item.dt + state.timezone) * 1000).getUTCHours();
        return localH.toString().padStart(2,'0') + ':00';
    });
    const temps = items.map(item => parseFloat(item.main.temp.toFixed(1)));

    hourlyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data: temps,
                borderColor: '#00d4b4',
                backgroundColor: ctx2 => {
                    const g = ctx2.chart.ctx.createLinearGradient(0, 0, 0, 200);
                    g.addColorStop(0, 'rgba(0,212,180,0.25)');
                    g.addColorStop(1, 'rgba(0,212,180,0)');
                    return g;
                },
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: '#00d4b4',
                tension: 0.4,
                fill: true,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false }, tooltip: {
                callbacks: { label: ctx3 => ` ${ctx3.raw}°${sym}` }
            }},
            scales: {
                x: {
                    ticks: { color: 'rgba(180,220,210,0.55)', font: { family: 'JetBrains Mono', size: 10 }, maxRotation: 0, maxTicksLimit: 12 },
                    grid:  { color: 'rgba(0,212,180,0.06)' },
                },
                y: {
                    ticks: {
                        color: 'rgba(180,220,210,0.55)',
                        font: { family: 'JetBrains Mono', size: 10 },
                        callback: v => `${v}°${sym}`,
                    },
                    grid: { color: 'rgba(0,212,180,0.06)' },
                },
            },
        },
    });

    /* ── Hourly grid cards ── */
    $('hourlyGrid').innerHTML = items.slice(0, 16).map(item => {
        const localH  = new Date((item.dt + state.timezone) * 1000).getUTCHours();
        const icon    = getIcon(item.weather[0].main);
        const pop     = Math.round((item.pop ?? 0) * 100);
        const desc    = item.weather[0].description.replace(/\b\w/g, c => c.toUpperCase());
        return `
            <div class="hourly-item" title="${desc}">
                <span class="hi-time">${localH.toString().padStart(2,'0')}:00</span>
                <span class="hi-icon">${icon}</span>
                <span class="hi-temp">${Math.round(item.main.temp)}°${sym}</span>
                ${pop >= 10 ? `<span class="hi-rain">💧 ${pop}%</span>` : ''}
            </div>`;
    }).join('');
}

/* ─── MAP (Leaflet + OWM tile layers) ────────────────────────── */
function initMap() {
    if (state.map) { updateMapCity(); return; }

    if (!window.L) {
        const css = document.createElement('link');
        css.rel   = 'stylesheet';
        css.href  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);

        const js   = document.createElement('script');
        js.src     = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        js.onload  = buildMap;
        document.head.appendChild(js);
    } else {
        buildMap();
    }
}

function buildMap() {
    const lat = state.lat ?? 30.0;
    const lon = state.lon ?? 70.0;

    state.map = L.map('weatherMap', { zoomControl: true }).setView([lat, lon], 5);

    // Dark base map from CartoDB
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
    }).addTo(state.map);

    // OWM weather overlay — correct endpoint: /map/{layer}/{z}/{x}/{y}.png?appid=KEY
    // Valid layers: temp_new, precipitation_new, clouds_new, wind_new, pressure_new
    state.currentTileLayer = L.tileLayer(
        OWM_TILE.replace('{layer}', 'temp_new'),
        { opacity: 0.55, maxZoom: 19 }
    ).addTo(state.map);

    // City marker
    if (state.lat) placeMapMarker();

    // Layer switcher buttons
    document.querySelectorAll('.layer-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (state.currentTileLayer) state.map.removeLayer(state.currentTileLayer);
            state.currentTileLayer = L.tileLayer(
                OWM_TILE.replace('{layer}', btn.dataset.layer),
                { opacity: 0.55, maxZoom: 19 }
            ).addTo(state.map);
        });
    });
}

function placeMapMarker() {
    if (!state.map || !state.lat) return;
    if (state.markerLayer) state.map.removeLayer(state.markerLayer);
    state.markerLayer = L.circleMarker([state.lat, state.lon], {
        radius: 8, color: '#00d4b4', fillColor: '#00d4b4', fillOpacity: 0.9, weight: 2,
    }).addTo(state.map)
      .bindPopup(`<b>${state.city}</b><br>${Math.round(state.currentData?.main?.temp ?? 0)}°${state.unitSym}`);

    $('mapCityMarker').style.display = 'block';
    $('mapCityName').textContent     = `◉ ${state.city}`;
}

function updateMapCity() {
    if (!state.map || !state.lat) return;
    state.map.setView([state.lat, state.lon], 6);
    placeMapMarker();
}

/* ─── UI HELPERS ─────────────────────────────────────────────── */
function flash(el, val) {
    if (!el) return;
    el.textContent = val;
    el.classList.remove('value-updated');
    void el.offsetWidth;   // force reflow to restart animation
    el.classList.add('value-updated');
}

function setLoading(v) {
    const icon = $('mainIcon');
    const temp = $('mainTemp');
    icon.classList.toggle('loading', v);
    temp.classList.toggle('loading', v);
    if (v) { icon.textContent = '⏳'; temp.textContent = '--'; }
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
    toastTimer = setTimeout(() => el.classList.remove('show'), 4500);
}

/* ─── BOOT ───────────────────────────────────────────────────── */
window.addEventListener('load', () => search('London'));
