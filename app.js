/* Settings + controls enhancement
   - Adds inputs for start date and name
   - Persists to localStorage and keeps URL params in sync for sharing
   - Theme toggle for dark/light mode
*/

const params = new URLSearchParams(window.location.search);
const STORAGE_KEY = "ais-settings";
const FALLBACK_DATE = "2025-05-17T06:00";
const DEFAULT_NAME = "Alec";

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function getInitialSettings() {
  const stored = loadStored();
  // Accept date as either a datetime string or milliseconds since epoch
  let dVal = params.get("d");
  if (dVal === null) dVal = stored.d ?? FALLBACK_DATE;
  else if (/^\d+$/.test(dVal)) {
    // numeric milliseconds
    try {
      dVal = toLocalDatetimeInputValue(new Date(Number(dVal)));
    } catch (e) {
      dVal = FALLBACK_DATE;
    }
  }

  return {
    d: dVal,
    n: params.get("n") ?? stored.n ?? DEFAULT_NAME,
    theme: stored.theme ?? "dark",
  };
}

function saveSettings(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (e) {
    // ignore
  }
}

function updateURLFromSettings(obj) {
  const u = new URL(window.location.href);
  const p = new URLSearchParams();
  if (obj.d) p.set("d", obj.d);
  if (obj.n) p.set("n", obj.n);
  const qs = p.toString();
  history.replaceState(null, "", qs ? `?${qs}` : u.pathname);
}

/* small toast helper for ephemeral messages */
function showToast(msg, ms = 1600) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.hidden = false;
  t.innerText = msg;
  t.style.opacity = "1";
  t.style.transform = "translateX(-50%) translateY(0)";
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateX(-50%) translateY(8px)";
    t.hidden = true;
  }, ms);
}

function toLocalDatetimeInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// apply settings and wire controls
let settings = getInitialSettings();
let time = (() => {
  const t = Date.parse(settings.d);
  return isNaN(t) ? Date.parse(FALLBACK_DATE) : t;
})();

// apply initial UI state
if (settings.n) {
  document.querySelectorAll(".name").forEach((s) => (s.innerText = settings.n));
}

// Apply theme
function applyTheme(theme) {
  if (theme === "light") {
    document.body.classList.add("light-mode");
    document.getElementById("dark-mode-btn")?.classList.remove("active");
    document.getElementById("light-mode-btn")?.classList.add("active");
  } else {
    document.body.classList.remove("light-mode");
    document.getElementById("dark-mode-btn")?.classList.add("active");
    document.getElementById("light-mode-btn")?.classList.remove("active");
  }
  settings.theme = theme;
  saveSettings(settings);
}

applyTheme(settings.theme);

const data = {
  years: null,
  months: null,
  weeks: null,
  days: null,
  hours: null,
  minutes: null,
  seconds: null,
};

const progresses = document.querySelectorAll(".progress[fraction]");

// Controls
const startInput = document.getElementById("start-datetime");
const nameInput = document.getElementById("name-input");
const copyBtn = document.getElementById("copy-link");
const resetBtn = document.getElementById("reset-button");
const darkModeBtn = document.getElementById("dark-mode-btn");
const lightModeBtn = document.getElementById("light-mode-btn");

function applySettingsToUI() {
  // fill inputs if present
  try {
    if (startInput) startInput.value = toLocalDatetimeInputValue(new Date(time));
    if (nameInput) nameInput.value = document.querySelectorAll(".name").length ? document.querySelectorAll(".name")[0].innerText : settings.n;
  } catch (e) {
    // ignore
  }
}

function applySettingsFromInputs() {
  // read inputs and update settings
  // start date
  if (startInput) {
    startInput.classList.remove("invalid");
    if (startInput.value) {
      const parsed = Date.parse(startInput.value);
      if (!isNaN(parsed)) {
        settings.d = startInput.value;
        time = parsed;
      } else {
        startInput.classList.add("invalid");
        showToast("Invalid start date");
      }
    }
  }

  // name (trim and limit)
  if (nameInput) {
    let nm = (nameInput.value || DEFAULT_NAME).trim();
    if (nm.length > 30) nm = nm.slice(0, 30);
    settings.n = nm;
    document.querySelectorAll(".name").forEach((s) => (s.innerText = settings.n));
  }

  saveSettings(settings);
  updateURLFromSettings(settings);
}

if (startInput) startInput.addEventListener("change", () => applySettingsFromInputs());
if (nameInput) nameInput.addEventListener("input", () => applySettingsFromInputs());

// Theme toggle
if (darkModeBtn) {
  darkModeBtn.addEventListener("click", () => applyTheme("dark"));
}
if (lightModeBtn) {
  lightModeBtn.addEventListener("click", () => applyTheme("light"));
}

if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard");
    } catch (e) {
      // fallback
      const url = window.location.href;
      try {
        // try select fallback
        const fallbackEl = document.createElement("textarea");
        fallbackEl.value = url;
        document.body.appendChild(fallbackEl);
        fallbackEl.select();
        document.execCommand("copy");
        document.body.removeChild(fallbackEl);
        showToast("Link copied to clipboard");
      } catch (err) {
        window.prompt("Copy this URL:", url);
      }
    }
  });
}

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { }
    history.replaceState(null, "", window.location.pathname);
    location.reload();
  });
}

// initialize inputs and URL/state
applySettingsToUI();
updateURLFromSettings(settings);
saveSettings(settings);

// Main update loop (same behavior as original)
update();

function update() {
  const now = new Date().getTime();
  const seconds = (now - time) / 1000;
  data.years = seconds / 31556952;
  data.days = seconds / 86400;
  data.months = data.years * 12;
  data.weeks = data.days / 7;
  data.hours = seconds / 3600;
  data.minutes = seconds / 60;
  data.seconds = seconds;
  updatePies();

  requestAnimationFrame(update);
}

function updatePies() {
  const radius = 25;
  const circumference = radius * 2 * Math.PI;
  progresses.forEach((progress) => {
    const value = data[progress.getAttribute("fraction")];
    const complete = Math.floor(value);
    let v = complete.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (complete < 10) v = value.toFixed(2);
    if (complete < 1) v = value.toFixed(3);
    const h2 = progress.querySelector("h2");
    if (h2) h2.innerText = v;
    const percent = Math.round((value - complete) * 100 * 10) / 10;
    const offset = circumference - (percent / 100) * circumference;
    const left = progress.querySelector(".left");
    if (left)
      left.innerHTML = `<svg aria-hidden="true" role="presentation" xmlns="http://www.w3.org/2000/svg" height="100" width="100" viewBox="0 0 100 100">
    <circle class="bg" r="${radius}" cx="50" cy="50" />
    <circle
      class="prog"
      r="${radius}"
      cx="50"
      cy="50"
      stroke-dasharray="${circumference} ${circumference}"
      stroke-dashoffset="${offset}"
    />
  </svg>`;
  });
}
