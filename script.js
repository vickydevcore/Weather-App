const $ = (id) => document.getElementById(id);
const weatherCodes = {
  0: ["☀️", "Clear sky"],
  1: ["🌤️", "Mainly clear"],
  2: ["⛅", "Partly cloudy"],
  3: ["☁️", "Overcast"],
  45: ["🌫️", "Foggy"],
  48: ["🌫️", "Rime fog"],
  51: ["🌦️", "Light drizzle"],
  53: ["🌦️", "Drizzle"],
  55: ["🌧️", "Heavy drizzle"],
  61: ["🌦️", "Light rain"],
  63: ["🌧️", "Rain"],
  65: ["🌧️", "Heavy rain"],
  71: ["🌨️", "Light snow"],
  73: ["❄️", "Snow"],
  75: ["❄️", "Heavy snow"],
  80: ["🌦️", "Rain showers"],
  81: ["🌧️", "Rain showers"],
  82: ["⛈️", "Heavy showers"],
  95: ["⛈️", "Thunderstorm"],
  96: ["⛈️", "Thunderstorm"],
  99: ["⛈️", "Thunderstorm"],
};
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function uvLabel(v) {
  return v <= 2
    ? "Low"
    : v <= 5
      ? "Moderate"
      : v <= 7
        ? "High"
        : v <= 10
          ? "Very High"
          : "Extreme";
}
function showError(msg) {
  $("error").textContent = msg;
  $("error").style.display = "block";
}
function clearError() {
  $("error").style.display = "none";
}

async function loadWeather(city) {
  clearError();
  $("status").textContent = "● LOADING";
  try {
    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
    ).then((r) => r.json());
    if (!geo.results?.length)
      throw new Error("City not found. Try another city name.");
    const p = geo.results[0];
    const params = new URLSearchParams({
      latitude: p.latitude,
      longitude: p.longitude,
      timezone: "auto",
      current:
        "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,pressure_msl,wind_speed_10m,visibility",
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max",
      forecast_days: 6,
    });
    const data = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`,
    ).then((r) => r.json());
    render(p, data);
    $("status").textContent = "● LIVE";
  } catch (e) {
    showError(e.message);
    $("status").textContent = "● OFFLINE";
  }
}
function render(p, w) {
  const c = w.current,
    d = w.daily,
    code = c.weather_code,
    info = weatherCodes[code] || ["🌤️", "Unknown"];
  $("location").textContent =
    `📍 ${p.name}${p.admin1 ? `, ${p.admin1}` : ""}${p.country_code ? ` • ${p.country_code}` : ""}`;
  const now = new Date(c.time);
  $("day").textContent = now.toLocaleDateString([], { weekday: "long" });
  $("date").textContent = now.toLocaleDateString([], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  $("icon").textContent = info[0];
  $("condition").textContent = info[1];
  $("temp").innerHTML =
    `${Math.round(c.temperature_2m)}<span class="unit">°C</span>`;
  $("feels").textContent = `Feels like ${Math.round(c.apparent_temperature)}°C`;
  $("humidity").textContent = `${c.relative_humidity_2m}%`;
  $("wind").textContent = `${Math.round(c.wind_speed_10m)} km/h`;
  $("pressure").textContent = `${Math.round(c.pressure_msl)} hPa`;
  $("visibility").textContent = `${(c.visibility / 1000).toFixed(1)} km`;
  $("sunrise").textContent = fmtTime(d.sunrise[0]);
  $("sunset").textContent = fmtTime(d.sunset[0]);
  const uv = d.uv_index_max[0] ?? 0;
  $("uv").textContent = uv.toFixed(1);
  $("uvtext").textContent = uvLabel(uv);
  $("uvbar").style.width = Math.min(100, uv * 10) + "%";
  $("high").textContent = `High ${Math.round(d.temperature_2m_max[0])}°`;
  $("low").textContent = `Low ${Math.round(d.temperature_2m_min[0])}°`;
  const days = $("days");
  days.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const di = new Date(d.time[i]);
    const inf = weatherCodes[d.weather_code[i]] || ["🌤️", "—"];
    days.innerHTML += `<div class="daycard"><div class="d">${di.toLocaleDateString([], { weekday: "short" })}</div><div class="wi">${inf[0]}</div><div class="range">${Math.round(d.temperature_2m_max[i])}° <em>${Math.round(d.temperature_2m_min[i])}°</em></div><div class="rain">💧 ${d.precipitation_probability_max[i] ?? 0}%</div></div>`;
  }
}
$("searchBtn").addEventListener("click", () => {
  const city = $("cityInput").value.trim();
  if (city) loadWeather(city);
});
$("cityInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("searchBtn").click();
});
loadWeather("Amritsar");
