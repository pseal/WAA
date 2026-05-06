// ─────────────────────────────────────────────
//  WeatherAPI key – visible in browser source.
//  Fine for personal/portfolio use; rotate if abused.
// ─────────────────────────────────────────────
const WEATHERAPI_KEY = "f5409efbd49e44e4897140104262704";
const WEATHERAPI_BASE = "https://api.weatherapi.com/v1/forecast.json";

let currentLang = "en";
let lastWeatherData = null;

// ─── TRANSLATIONS ─────────────────────────────
const LANG = {
    en: {
        todaySummary: "Today Summary",
        feelsLike: "Feels Like",
        humidity: "Humidity",
        wind: "Wind",
        rainChance: "Rain Chance",
        sunrise: "Sunrise",
        sunset: "Sunset",
        windDirection: "Wind Direction",
        uvIndex: "UV Index",
        tempTrend: "Temperature Trend (Next 12h)",
        rainTrend: "Rain Chance Trend (Next 12h)",
        next10Hours: "Next 10 Hours",
        next7Days: "Next 7 Days",
        searchPlaceholder: "Enter city name...",
        searchButton: "Search"
    },
    fi: {
        todaySummary: "Päivän yhteenveto",
        feelsLike: "Tuntuu kuin",
        humidity: "Kosteus",
        wind: "Tuuli",
        rainChance: "Sateen todennäköisyys",
        sunrise: "Auringonnousu",
        sunset: "Auringonlasku",
        windDirection: "Tuulen suunta",
        uvIndex: "UV-indeksi",
        tempTrend: "Lämpötilatrendi (12h)",
        rainTrend: "Sateen todennäköisyys (12h)",
        next10Hours: "Seuraavat 10 tuntia",
        next7Days: "Seuraavat 7 päivää",
        searchPlaceholder: "Syötä kaupungin nimi...",
        searchButton: "Hae"
    }
};

const CONDITION_FI = {
    "Sunny": "Aurinkoista",
    "Clear": "Selkeää",
    "Partly cloudy": "Puolipilvistä",
    "Cloudy": "Pilvistä",
    "Overcast": "Ylipilvistä",
    "Mist": "Utuista",
    "Fog": "Sumuista",
    "Patchy rain possible": "Mahdollisesti sadetta",
    "Light rain": "Kevyttä sadetta",
    "Moderate rain": "Kohtalaista sadetta",
    "Heavy rain": "Voimakasta sadetta",
    "Light snow": "Kevyttä lunta",
    "Moderate snow": "Kohtalaista lunta",
    "Heavy snow": "Voimakasta lunta",
    "Patchy snow possible": "Mahdollisesti lunta",
    "Thundery outbreaks possible": "Mahdollisia ukkoskuuroja",
    "Blizzard": "Lumimyrsky",
    "Freezing fog": "Jäätävää sumua",
    "Ice pellets": "Jäätihkua",
    "Light sleet": "Kevyttä räntää",
    "Moderate or heavy sleet": "Voimakasta räntää"
};

function translateCondition(text) {
    return currentLang === "fi" ? (CONDITION_FI[text] || text) : text;
}

// ─── LANGUAGE TOGGLE ──────────────────────────
function toggleLanguage() {
    currentLang = currentLang === "en" ? "fi" : "en";
    applyLanguage();

    if (lastWeatherData) {
        const hours = lastWeatherData.next12Hours;
        const current = hours[0];
        updateHero(lastWeatherData, current);
        updateNext2(hours.slice(1, 3));
        updateTodaySummary(current, lastWeatherData.astro);
        updateWindCompass(current.wind_dir);
        updateUV(lastWeatherData.location.localtime, current);
        updateTempChart(hours);
        updateRainChart(hours);
        updateNext10Cards(hours.slice(2, 12));
        updateWeekly(lastWeatherData.next7Days);
    }
}

function applyLanguage() {
    const t = LANG[currentLang];

    document.querySelector("h3").textContent = t.todaySummary;
    document.getElementById("sumFeels").previousElementSibling.textContent = t.feelsLike + ":";
    document.getElementById("sumHumidity").previousElementSibling.textContent = t.humidity + ":";
    document.getElementById("sumWind").previousElementSibling.textContent = t.wind + ":";
    document.getElementById("sumRain").previousElementSibling.textContent = t.rainChance + ":";
    document.getElementById("sumSunrise").previousElementSibling.textContent = t.sunrise + ":";
    document.getElementById("sumSunset").previousElementSibling.textContent = t.sunset + ":";

    document.querySelector(".summary-card h3:nth-of-type(2)").textContent = t.windDirection;
    document.querySelector(".summary-card h3:nth-of-type(3)").textContent = t.uvIndex;

    document.getElementById("cityInput").placeholder = t.searchPlaceholder;
    document.querySelector(".search-container button").textContent = t.searchButton;

    document.querySelectorAll(".chart-card h3")[0].textContent = t.tempTrend;
    document.querySelectorAll(".chart-card h3")[1].textContent = t.rainTrend;

    document.querySelectorAll(".section-title")[0].textContent = t.next10Hours;
    document.querySelectorAll(".section-title")[1].textContent = t.next7Days;
}

// ─── AUTO-DETECT LOCATION ─────────────────────
window.addEventListener("DOMContentLoaded", () => {
    applyLanguage();

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                await fetchAndRender(`${latitude},${longitude}`);
            },
            () => console.warn("Geolocation denied")
        );
    }
});

// ─── SEARCH ───────────────────────────────────
async function getWeather() {
    const city = document.getElementById("cityInput").value.trim();
    if (!city) return;
    await fetchAndRender(city);
}

// ─── FETCH + TRANSFORM + RENDER ───────────────
async function fetchAndRender(query) {
    try {
        const url = `${WEATHERAPI_BASE}?key=${WEATHERAPI_KEY}&q=${encodeURIComponent(query)}&days=7&aqi=no&alerts=no`;
        const response = await fetch(url);

        if (!response.ok) {
            console.error("WeatherAPI error:", response.status, await response.text());
            return;
        }

        const raw = await response.json();

        // ── Transform raw API response to the same shape the UI expects ──
        const location = {
            name: raw.location.name,
            country: raw.location.country,
            lat: raw.location.lat,
            lon: raw.location.lon,
            localtime: raw.location.localtime
        };

        const astro = {
            sunrise: raw.forecast.forecastday[0].astro.sunrise,
            sunset:  raw.forecast.forecastday[0].astro.sunset
        };

        // Combine today + tomorrow hours, then slice starting from "now"
        const allHours = [
            ...raw.forecast.forecastday[0].hour,
            ...raw.forecast.forecastday[1].hour
        ];

        const now = new Date(raw.location.localtime);
        const startIndex = allHours.findIndex(h => new Date(h.time) >= now);

        const next12Hours = allHours
            .slice(startIndex, startIndex + 12)
            .map(h => ({
                time:        h.time,
                temp:        h.temp_c,
                feels_like:  h.feelslike_c,
                condition:   h.condition.text,
                icon:        h.condition.icon,
                wind_kph:    h.wind_kph,
                wind_dir:    h.wind_dir,
                rain_chance: h.chance_of_rain,
                humidity:    h.humidity
            }));

        const next7Days = raw.forecast.forecastday.map(d => ({
            date:      d.date,
            min:       d.day.mintemp_c,
            max:       d.day.maxtemp_c,
            condition: d.day.condition.text,
            icon:      d.day.condition.icon
        }));

        const data = { location, next12Hours, next7Days, astro };
        lastWeatherData = data;

        if (next12Hours.length < 3) return;

        const current = next12Hours[0];
        updateHero(data, current);
        updateNext2(next12Hours.slice(1, 3));
        updateTodaySummary(current, astro);
        updateWindCompass(current.wind_dir);
        updateUV(location.localtime, current);
        updateTempChart(next12Hours);
        updateRainChart(next12Hours);
        updateNext10Cards(next12Hours.slice(2, 12));
        updateWeekly(next7Days);

    } catch (err) {
        console.error("Weather fetch error:", err);
    }
}

// ─── HERO ─────────────────────────────────────
function updateHero(data, current) {
    document.getElementById("locationName").textContent =
        `${data.location.name}, ${data.location.country}`;
    document.getElementById("currentTemp").textContent = `${current.temp}°C`;
    document.getElementById("currentCondition").innerHTML =
        `<img class="animated-icon" src="https:${current.icon}" alt="">${translateCondition(current.condition)}`;
    document.getElementById("heroExtra").textContent =
        `Feels like ${current.feels_like}°C • Humidity ${current.humidity}%`;
    document.getElementById("heroSection").classList.add("visible");
}

// ─── NEXT 2 HOURS ─────────────────────────────
function updateNext2(next2) {
    const makeCard = h => `
        <div style="font-size:14px;opacity:0.8">${formatHour(h.time)}</div>
        <div style="font-size:28px;font-weight:bold">${h.temp}°C</div>
        <img src="https:${h.icon}" alt="">
        <div style="font-size:14px">${translateCondition(h.condition)}</div>
        <div style="font-size:12px;opacity:0.8">
            Feels like ${h.feels_like}°C • ${h.humidity}% humidity
        </div>`;

    document.getElementById("nextHour1").innerHTML = makeCard(next2[0]);
    document.getElementById("nextHour2").innerHTML = makeCard(next2[1]);
}

// ─── SUMMARY ──────────────────────────────────
function updateTodaySummary(current, astro) {
    document.getElementById("sumFeels").textContent   = `${current.feels_like}°C`;
    document.getElementById("sumHumidity").textContent = `${current.humidity}%`;
    document.getElementById("sumWind").textContent    = `${current.wind_kph} kph`;
    document.getElementById("sumRain").textContent    = `${current.rain_chance}%`;
    document.getElementById("sumSunrise").textContent = astro.sunrise;
    document.getElementById("sumSunset").textContent  = astro.sunset;
}

// ─── WIND COMPASS ─────────────────────────────
function updateWindCompass(dir) {
    const map = {
        N:0, NNE:22.5, NE:45, ENE:67.5,
        E:90, ESE:112.5, SE:135, SSE:157.5,
        S:180, SSW:202.5, SW:225, WSW:247.5,
        W:270, WNW:292.5, NW:315, NNW:337.5
    };
    document.getElementById("windNeedle").style.transform =
        `translateX(-50%) rotate(${map[dir] ?? 0}deg)`;
}

// ─── UV INDEX ─────────────────────────────────
function updateUV(localtime, current) {
    const uv = estimateUV(localtime, current.rain_chance, current.condition);
    document.getElementById("uvPointer").style.left = `${Math.min(uv / 11, 1) * 100}%`;
    document.getElementById("uvText").textContent = `UV: ${uv}`;
}

function estimateUV(localtime, rainChance, condition) {
    const [hourStr, minuteStr] = localtime.split(" ")[1].split(":");
    const hour = parseInt(hourStr) + parseInt(minuteStr) / 60;
    let t = Math.max(0, Math.min(1, 1 - Math.abs(hour - 13) / 6));
    let cloudFactor = 1 - (rainChance / 100) * 0.6;
    const c = condition.toLowerCase();
    if (c.includes("cloud")) cloudFactor *= 0.8;
    if (c.includes("rain"))  cloudFactor *= 0.6;
    return Math.round(Math.max(0, Math.min(11, 11 * t * cloudFactor)));
}

// ─── CANVAS RESOLUTION FIX ────────────────────
function fixCanvasResolution(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    return ctx;
}

// ─── CHARTS ───────────────────────────────────
function updateTempChart(hours) {
    const canvas = document.getElementById("tempChart");
    drawLineChart(fixCanvasResolution(canvas), canvas,
        hours.map(h => h.temp), hours.map(h => h.time), "#FFEB3B", "°C");
}

function updateRainChart(hours) {
    const canvas = document.getElementById("rainChart");
    drawLineChart(fixCanvasResolution(canvas), canvas,
        hours.map(h => h.rain_chance), hours.map(h => h.time), "#80DEEA", "%");
}

function drawLineChart(ctx, canvas, values, labels, color, yLabel) {
    if (!values.length) return;
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;
    const pad = 35;
    const min = Math.min(...values), max = Math.max(...values);
    const range = max - min || 1;
    const step = (w - pad * 2) / (values.length - 1);

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(yLabel, 5, 15);
    ctx.fillText("Time →", w - 70, h - 5);

    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.stroke();

    for (let i = 0; i <= 4; i++) {
        const t = i / 4;
        const y = h - pad - t * (h - pad * 2);
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.font = "11px Arial";
        ctx.fillText((min + t * range).toFixed(1), 5, y + 3);
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    values.forEach((v, i) => {
        const x = pad + i * step;
        const y = h - pad - ((v - min) / range) * (h - pad * 2);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "11px Arial";
    labels.forEach((t, i) => {
        if (i % 2 === 0 || i === labels.length - 1) {
            ctx.fillText(formatHourShort(t), pad + i * step - 14, h - pad + 15);
        }
    });
}

// ─── NEXT 10 HOURS ────────────────────────────
function updateNext10Cards(hours) {
    const container = document.getElementById("next10Scroll");
    container.innerHTML = "";
    hours.forEach(h => {
        const card = document.createElement("div");
        card.className = "next10-card";
        card.innerHTML = `
            <div style="font-size:14px;opacity:0.8">${formatHour(h.time)}</div>
            <div style="font-size:22px;font-weight:bold">${h.temp}°C</div>
            <img src="https:${h.icon}" alt="">
            <div style="font-size:13px">${translateCondition(h.condition)}</div>
            <div style="font-size:11px;opacity:0.8">
                Feels like ${h.feels_like}°C • ${h.humidity}% humidity
            </div>`;
        container.appendChild(card);
    });
}

// ─── WEEKLY ───────────────────────────────────
function updateWeekly(days) {
    const grid = document.getElementById("weeklyForecast");
    grid.innerHTML = "";
    days.forEach(d => {
        const card = document.createElement("div");
        card.className = "day-card";
        card.innerHTML = `
            <div>${d.date}</div>
            <img src="https:${d.icon}" alt="">
            <div>${translateCondition(d.condition)}</div>
            <div><strong>${d.max}°C</strong> / ${d.min}°C</div>`;
        grid.appendChild(card);
    });
}

// ─── HELPERS ──────────────────────────────────
function formatHour(t) {
    return new Date(t.replace(" ", "T")).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatHourShort(t) {
    return new Date(t.replace(" ", "T")).toLocaleTimeString([], { hour: "2-digit" });
}
