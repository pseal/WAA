const WEATHERAPI_KEY = "f5409efbd49e44e4897140104262704";
const WEATHERAPI_BASE = "https://api.weatherapi.com/v1/forecast.json";

let currentLang = "en";
let lastWeatherData = null;

// ── ALL UI STRINGS IN ONE PLACE ─────────────────────────────────────────────
const LANG = {
  en: {
    todaySummary:   "Today Summary",
    feelsLike:      "Feels Like",
    feelsLikeShort: "Feels like",   // used inline in cards
    humidity:       "Humidity",
    humidityShort:  "Humidity",
    wind:           "Wind",
    rainChance:     "Rain Chance",
    sunrise:        "Sunrise",
    sunset:         "Sunset",
    windDirection:  "Wind Direction",
    uvIndex:        "UV Index",
    tempTrend:      "Temperature Trend (Next 12h)",
    rainTrend:      "Rain Chance Trend (Next 12h)",
    next10Hours:    "Next 10 Hours",
    next7Days:      "Next 7 Days",
    searchPlaceholder: "Enter city name...",
    searchButton:   "Search",
  },
  fi: {
    todaySummary:   "Päivän yhteenveto",
    feelsLike:      "Tuntuu kuin",
    feelsLikeShort: "Tuntuu kuin",
    humidity:       "Kosteus",
    humidityShort:  "Kosteus",
    wind:           "Tuuli",
    rainChance:     "Sateen tod.näk.",
    sunrise:        "Auringonnousu",
    sunset:         "Auringonlasku",
    windDirection:  "Tuulen suunta",
    uvIndex:        "UV-indeksi",
    tempTrend:      "Lämpötilatrendi (12h)",
    rainTrend:      "Sateen tod.näk. (12h)",
    next10Hours:    "Seuraavat 10 tuntia",
    next7Days:      "Seuraavat 7 päivää",
    searchPlaceholder: "Syötä kaupungin nimi...",
    searchButton:   "Hae",
  }
};

const CONDITION_FI = {
  // Clear / cloudy
  "Sunny":                                          "Aurinkoista",
  "Clear":                                          "Selkeää",
  "Partly cloudy":                                  "Puolipilvistä",
  "Cloudy":                                         "Pilvistä",
  "Overcast":                                       "Ylipilvistä",

  // Fog / mist
  "Mist":                                           "Utuista",
  "Fog":                                            "Sumuista",
  "Freezing fog":                                   "Jäätävää sumua",

  // Rain – patchy / possible
  "Patchy rain possible":                           "Mahdollisesti sadetta",
  "Patchy rain nearby":                             "Sadetta lähialueella",
  "Patchy light rain":                              "Paikoin kevyttä sadetta",
  "Patchy light rain with thunder":                 "Paikoin kevyttä sadetta ja ukkosta",
  "Patchy moderate rain":                           "Paikoin kohtalaista sadetta",
  "Patchy heavy rain":                              "Paikoin voimakasta sadetta",
  "Patchy freezing drizzle possible":               "Mahdollisesti jäätävää tihkusadetta",

  // Drizzle
  "Light drizzle":                                  "Kevyttä tihkusadetta",
  "Freezing drizzle":                               "Jäätävää tihkusadetta",
  "Heavy freezing drizzle":                         "Voimakasta jäätävää tihkusadetta",

  // Rain
  "Light rain":                                     "Kevyttä sadetta",
  "Moderate rain":                                  "Kohtalaista sadetta",
  "Heavy rain":                                     "Voimakasta sadetta",
  "Light rain shower":                              "Kevyitä sadekuuroja",
  "Moderate or heavy rain shower":                  "Kohtalaisia tai voimakkaita sadekuuroja",
  "Torrential rain shower":                         "Rankkakuuroja",
  "Light freezing rain":                            "Kevyttä jäätävää sadetta",
  "Moderate or heavy freezing rain":                "Kohtalaista tai voimakasta jäätävää sadetta",
  "Moderate or heavy rain in area with thunder":    "Kohtalaista tai voimakasta sadetta ukkosen kanssa",

  // Sleet
  "Light sleet":                                    "Kevyttä räntää",
  "Moderate or heavy sleet":                        "Kohtalaista tai voimakasta räntää",
  "Light sleet showers":                            "Kevyitä räntäkuuroja",
  "Moderate or heavy sleet showers":                "Kohtalaisia tai voimakkaita räntäkuuroja",

  // Snow – patchy / possible
  "Patchy snow possible":                           "Mahdollisesti lunta",
  "Patchy snow nearby":                             "Lunta lähialueella",
  "Patchy light snow":                              "Paikoin kevyttä lunta",
  "Patchy moderate snow":                           "Paikoin kohtalaista lunta",
  "Patchy heavy snow":                              "Paikoin voimakasta lumisadetta",
  "Patchy light snow with thunder":                 "Paikoin kevyttä lunta ja ukkosta",

  // Snow
  "Light snow":                                     "Kevyttä lunta",
  "Moderate snow":                                  "Kohtalaista lunta",
  "Heavy snow":                                     "Voimakasta lumisadetta",
  "Blowing snow":                                   "Tuiskua",
  "Blizzard":                                       "Lumimyrsky",
  "Light snow showers":                             "Kevyitä lumikuuroja",
  "Moderate or heavy snow showers":                 "Kohtalaisia tai voimakkaita lumikuuroja",
  "Moderate or heavy snow in area with thunder":    "Kohtalaista tai voimakasta lunta ukkosen kanssa",

  // Ice / hail
  "Ice pellets":                                    "Jäätihkua",
  "Light showers of ice pellets":                   "Kevyitä jäätihkukuuroja",
  "Moderate or heavy showers of ice pellets":       "Kohtalaisia tai voimakkaita jäätihkukuuroja",

  // Thunder
  "Thundery outbreaks possible":                    "Mahdollisia ukkoskuuroja",
  "Thunder":                                        "Ukkosta",
  "Thunderstorm":                                   "Ukkosmyrsky",
};

const t = () => LANG[currentLang];
const cond = (text) => currentLang === "fi" ? (CONDITION_FI[text] || text) : text;

// ── LANGUAGE TOGGLE ──────────────────────────────────────────────────────────
function toggleLanguage() {
  currentLang = currentLang === "en" ? "fi" : "en";
  applyLanguage();
  if (lastWeatherData) rerender();
}

function applyLanguage() {
  const l = t();
  // static labels
  document.getElementById("cityInput").placeholder = l.searchPlaceholder;
  document.querySelector(".search-wrap button").textContent = l.searchButton;
  document.getElementById("labelToday").textContent   = l.todaySummary;
  document.getElementById("labelNext10").textContent  = l.next10Hours;
  document.getElementById("labelWeekly").textContent  = l.next7Days;
  document.getElementById("lblFeels").textContent     = l.feelsLike;
  document.getElementById("lblHumidity").textContent  = l.humidity;
  document.getElementById("lblWind").textContent      = l.wind;
  document.getElementById("lblRain").textContent      = l.rainChance;
  document.getElementById("lblSunrise").textContent   = l.sunrise;
  document.getElementById("lblSunset").textContent    = l.sunset;
  document.getElementById("lblWindDir").textContent   = l.windDirection;
  document.getElementById("lblUV").textContent        = l.uvIndex;
  document.getElementById("lblTempChart").textContent = l.tempTrend;
  document.getElementById("lblRainChart").textContent = l.rainTrend;
  // hero sub-labels
  document.getElementById("lblHeroFeels").textContent    = l.feelsLikeShort;
  document.getElementById("lblHeroHumidity").textContent = l.humidityShort;
}

function rerender() {
  const d = lastWeatherData;
  const hours = d.next12Hours;
  updateHero(d, hours[0]);
  updateNext2(hours.slice(1, 3));
  updateTodaySummary(hours[0], d.astro);
  updateWindCompass(hours[0].wind_dir);
  updateUV(d.location.localtime, hours[0]);
  updateTempChart(hours);
  updateRainChart(hours);
  updateNext10Cards(hours.slice(2, 12));
  updateWeekly(d.next7Days);
}

// ── BOOT ────────────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  applyLanguage();
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      pos => fetchAndRender(`${pos.coords.latitude},${pos.coords.longitude}`),
      ()  => console.warn("Geolocation denied")
    );
  }
});

async function getWeather() {
  const city = document.getElementById("cityInput").value.trim();
  if (city) await fetchAndRender(city);
}

// ── FETCH + TRANSFORM ────────────────────────────────────────────────────────
async function fetchAndRender(query) {
  try {
    const url = `${WEATHERAPI_BASE}?key=${WEATHERAPI_KEY}&q=${encodeURIComponent(query)}&days=7&aqi=no&alerts=no`;
    const res  = await fetch(url);
    if (!res.ok) return;
    const raw = await res.json();

    const location = {
      name: raw.location.name, country: raw.location.country,
      lat: raw.location.lat, lon: raw.location.lon,
      localtime: raw.location.localtime
    };
    const astro = {
      sunrise: raw.forecast.forecastday[0].astro.sunrise,
      sunset:  raw.forecast.forecastday[0].astro.sunset
    };

    const allHours = [
      ...raw.forecast.forecastday[0].hour,
      ...raw.forecast.forecastday[1].hour
    ];
    const now = new Date(raw.location.localtime);
    const start = allHours.findIndex(h => new Date(h.time) >= now);

    const next12Hours = allHours.slice(start, start + 12).map(h => ({
      time: h.time, temp: h.temp_c, feels_like: h.feelslike_c,
      condition: h.condition.text, icon: h.condition.icon,
      wind_kph: h.wind_kph, wind_dir: h.wind_dir,
      rain_chance: h.chance_of_rain, humidity: h.humidity
    }));

    const next7Days = raw.forecast.forecastday.map(d => ({
      date: d.date, min: d.day.mintemp_c, max: d.day.maxtemp_c,
      condition: d.day.condition.text, icon: d.day.condition.icon
    }));

    lastWeatherData = { location, next12Hours, next7Days, astro };
    if (next12Hours.length < 3) return;
    rerender();

  } catch (err) { console.error("Fetch error:", err); }
}

// ── HERO ─────────────────────────────────────────────────────────────────────
function updateHero(data, cur) {
  document.getElementById("locationName").textContent = `${data.location.name}, ${data.location.country}`;
  document.getElementById("currentTemp").textContent  = `${cur.temp}°`;
  document.getElementById("currentCondition").innerHTML =
    `<img class="animated-icon" src="https:${cur.icon}" alt="">${cond(cur.condition)}`;
  // values (labels already handled by applyLanguage)
  document.getElementById("heroFeels").textContent    = `${cur.feels_like}°C`;
  document.getElementById("heroHumidity").textContent = `${cur.humidity}%`;
  document.getElementById("heroSection").classList.add("visible");
}

// ── NEXT 2 HOURS ─────────────────────────────────────────────────────────────
function updateNext2(next2) {
  const l = t();
  const makeCard = h => `
    <div class="n2-time">${formatHour(h.time)}</div>
    <div class="n2-temp">${h.temp}°</div>
    <img src="https:${h.icon}" alt="">
    <div class="n2-cond">${cond(h.condition)}</div>
    <div class="n2-sub">
      <span>${l.feelsLikeShort}: <strong>${h.feels_like}°C</strong></span>
      <span>${l.humidityShort}: <strong>${h.humidity}%</strong></span>
    </div>`;
  document.getElementById("nextHour1").innerHTML = makeCard(next2[0]);
  document.getElementById("nextHour2").innerHTML = makeCard(next2[1]);
}

// ── SUMMARY ──────────────────────────────────────────────────────────────────
function updateTodaySummary(cur, astro) {
  document.getElementById("sumFeels").textContent   = `${cur.feels_like}°C`;
  document.getElementById("sumHumidity").textContent = `${cur.humidity}%`;
  document.getElementById("sumWind").textContent    = `${cur.wind_kph} kph`;
  document.getElementById("sumRain").textContent    = `${cur.rain_chance}%`;
  document.getElementById("sumSunrise").textContent = astro.sunrise;
  document.getElementById("sumSunset").textContent  = astro.sunset;
}

// ── COMPASS ──────────────────────────────────────────────────────────────────
function updateWindCompass(dir) {
  const map = {N:0,NNE:22.5,NE:45,ENE:67.5,E:90,ESE:112.5,SE:135,SSE:157.5,
    S:180,SSW:202.5,SW:225,WSW:247.5,W:270,WNW:292.5,NW:315,NNW:337.5};
  document.getElementById("windNeedle").style.transform =
    `translateX(-50%) rotate(${map[dir] ?? 0}deg)`;
}

// ── UV ───────────────────────────────────────────────────────────────────────
function updateUV(localtime, cur) {
  const uv = estimateUV(localtime, cur.rain_chance, cur.condition);
  document.getElementById("uvPointer").style.left = `${Math.min(uv / 11, 1) * 100}%`;
  document.getElementById("uvText").textContent = `UV: ${uv}`;
}
function estimateUV(localtime, rainChance, condition) {
  const [h, m] = localtime.split(" ")[1].split(":").map(Number);
  const hour = h + m / 60;
  let t = Math.max(0, Math.min(1, 1 - Math.abs(hour - 13) / 6));
  let cf = 1 - (rainChance / 100) * 0.6;
  const c = condition.toLowerCase();
  if (c.includes("cloud")) cf *= 0.8;
  if (c.includes("rain"))  cf *= 0.6;
  return Math.round(Math.max(0, Math.min(11, 11 * t * cf)));
}

// ── CANVAS ───────────────────────────────────────────────────────────────────
function fixCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width  = rect.width  * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  return ctx;
}

function updateTempChart(hours) {
  drawLineChart(fixCanvas(document.getElementById("tempChart")),
    document.getElementById("tempChart"),
    hours.map(h => h.temp), hours.map(h => h.time), "#38bdf8", "°C");
}
function updateRainChart(hours) {
  drawLineChart(fixCanvas(document.getElementById("rainChart")),
    document.getElementById("rainChart"),
    hours.map(h => h.rain_chance), hours.map(h => h.time), "#818cf8", "%");
}

function drawLineChart(ctx, canvas, values, labels, color, yLabel) {
  if (!values.length) return;
  const w = canvas.getBoundingClientRect().width;
  const h = canvas.getBoundingClientRect().height;
  const pad = 38;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const step = (w - pad * 2) / (values.length - 1);

  ctx.clearRect(0, 0, w, h);

  // grid lines
  for (let i = 0; i <= 4; i++) {
    const tv = i / 4;
    const y  = h - pad - tv * (h - pad * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
    ctx.fillStyle = "rgba(200,220,255,0.45)";
    ctx.font = "11px Outfit, sans-serif";
    ctx.fillText((min + tv * range).toFixed(1), 4, y + 4);
  }

  // axis label
  ctx.fillStyle = color;
  ctx.font = "bold 11px Outfit, sans-serif";
  ctx.fillText(yLabel, w - pad + 6, h - pad + 4);

  // gradient fill under line
  const grad = ctx.createLinearGradient(0, pad, 0, h - pad);
  grad.addColorStop(0, color.replace(")", ",0.25)").replace("rgb", "rgba"));
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = pad + i * step;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(pad + (values.length - 1) * step, h - pad);
  ctx.lineTo(pad, h - pad);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = pad + i * step;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // dots
  values.forEach((v, i) => {
    const x = pad + i * step;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  });

  // x labels
  ctx.fillStyle = "rgba(200,220,255,0.45)";
  ctx.font = "11px Outfit, sans-serif";
  labels.forEach((lbl, i) => {
    if (i % 2 === 0 || i === labels.length - 1) {
      ctx.fillText(formatHourShort(lbl), pad + i * step - 12, h - pad + 16);
    }
  });
}

// ── NEXT 10 HOURS ────────────────────────────────────────────────────────────
function updateNext10Cards(hours) {
  const l = t();
  const container = document.getElementById("next10Scroll");
  container.innerHTML = "";
  hours.forEach(h => {
    const card = document.createElement("div");
    card.className = "n10-card";
    card.innerHTML = `
      <div class="n10-time">${formatHour(h.time)}</div>
      <div class="n10-temp">${h.temp}°</div>
      <img src="https:${h.icon}" alt="">
      <div class="n10-cond">${cond(h.condition)}</div>
      <div class="n10-sub">
        ${l.feelsLikeShort}: ${h.feels_like}°C<br>
        ${l.humidityShort}: ${h.humidity}%
      </div>`;
    container.appendChild(card);
  });
}

// ── WEEKLY ───────────────────────────────────────────────────────────────────
function updateWeekly(days) {
  const grid = document.getElementById("weeklyForecast");
  grid.innerHTML = "";
  days.forEach(d => {
    const card = document.createElement("div");
    card.className = "day-card";
    card.innerHTML = `
      <div class="dc-date">${d.date}</div>
      <img src="https:${d.icon}" alt="">
      <div class="dc-cond">${cond(d.condition)}</div>
      <div class="dc-temp"><strong>${d.max}°C</strong> <span>/ ${d.min}°C</span></div>`;
    grid.appendChild(card);
  });
}

// ── HELPERS ──────────────────────────────────────────────────────────────────
function formatHour(t) {
  return new Date(t.replace(" ", "T")).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatHourShort(t) {
  return new Date(t.replace(" ", "T")).toLocaleTimeString([], { hour: "2-digit" });
}
