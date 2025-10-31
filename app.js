/* Settings + controls enhancement
   - Adds inputs for start date, daily cost, currency, name and color
   - Persists to localStorage and keeps URL params in sync for sharing
*/

const params = new URLSearchParams(window.location.search);
const STORAGE_KEY = "ais-settings";
const FALLBACK_DATE = "2025-05-17T06:00";
const DEFAULT_DAILY = 20;
const DEFAULT_CURRENCY = "$";
const DEFAULT_NAME = "Alec";
const DEFAULT_COLOR = "FB0";

function expandHex3To6(h) {
  // accepts 'FB0' or 'fb0' and returns 'FFBB00'
  const m = /^([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/.exec(h);
  if (!m) return null;
  return (m[1] + m[1] + m[2] + m[2] + m[3] + m[3]).toUpperCase();
}

function normalizeHex(h) {
  if (!h) return expandHex3To6(DEFAULT_COLOR) || "FFBB00";
  h = h.replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(h)) return h.toUpperCase();
  if (/^[0-9a-fA-F]{3}$/.test(h)) return expandHex3To6(h);
  // fallback
  return expandHex3To6(DEFAULT_COLOR) || "FFBB00";
}

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
  // Normalize color to 6-digit hex without '#'
  const colorParam = params.get("h");
  const colorStored = stored.h;
  const hNorm = normalizeHex(colorParam ?? colorStored ?? DEFAULT_COLOR);

  return {
    d: dVal,
    s: params.has("s") ? params.get("s") : (stored.s ?? String(DEFAULT_DAILY)),
    c: params.get("c") ?? stored.c ?? DEFAULT_CURRENCY,
    n: params.get("n") ?? stored.n ?? DEFAULT_NAME,
    h: hNorm,
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
  if (obj.s) p.set("s", obj.s);
  if (obj.c) p.set("c", obj.c);
  if (obj.n) p.set("n", obj.n);
  if (obj.h) p.set("h", obj.h);
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
let dailyCost = parseFloat(settings.s) || DEFAULT_DAILY;
let currency = settings.c || DEFAULT_CURRENCY;

// apply initial UI state
if (settings.n) {
  document.querySelectorAll(".name").forEach((s) => (s.innerText = settings.n));
}
if (settings.h) {
  document.body.style.setProperty("--color", `#${normalizeHex(settings.h)}`);
}

const data = {
  years: null,
  months: null,
  weeks: null,
  days: null,
  hours: null,
  minutes: null,
  seconds: null,
  savings: null,
  dollars: null,
  cents: null,
};

const progresses = document.querySelectorAll(".progress[fraction]");

// Controls (may not exist if someone stripped them)
const startInput = document.getElementById("start-datetime");
const dailyCostInput = document.getElementById("daily-cost");
const currencyInput = document.getElementById("currency");
const nameInput = document.getElementById("name-input");
const colorInput = document.getElementById("color-input");
const copyBtn = document.getElementById("copy-link");
const resetBtn = document.getElementById("reset-button");

function applySettingsToUI() {
  // fill inputs if present
  try {
    if (startInput) startInput.value = toLocalDatetimeInputValue(new Date(time));
    if (dailyCostInput) dailyCostInput.value = Number(dailyCost).toFixed(2);
    if (currencyInput) currencyInput.value = currency;
    if (nameInput) nameInput.value = document.querySelectorAll(".name").length ? document.querySelectorAll(".name")[0].innerText : settings.n;
  if (colorInput) colorInput.value = `#${normalizeHex(settings.h)}`;
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

  // daily cost
  if (dailyCostInput) {
    dailyCostInput.classList.remove("invalid");
    if (dailyCostInput.value !== "") {
      const val = parseFloat(dailyCostInput.value);
      if (!isNaN(val) && val >= 0) {
        settings.s = String(val);
        dailyCost = val;
      } else {
        dailyCostInput.classList.add("invalid");
        showToast("Enter a valid non-negative daily cost");
      }
    }
  }

  // currency (short string)
  if (currencyInput) {
    let cur = (currencyInput.value || DEFAULT_CURRENCY).trim();
    if (cur.length > 3) cur = cur.slice(0, 3);
    settings.c = cur;
    currency = cur;
  }

  // name (trim and limit)
  if (nameInput) {
    let nm = (nameInput.value || DEFAULT_NAME).trim();
    if (nm.length > 30) nm = nm.slice(0, 30);
    settings.n = nm;
    document.querySelectorAll(".name").forEach((s) => (s.innerText = settings.n));
  }

  // color
  if (colorInput && colorInput.value) {
    settings.h = normalizeHex(colorInput.value);
    document.body.style.setProperty("--color", `#${settings.h}`);
  }

  saveSettings(settings);
  updateURLFromSettings(settings);
}

if (startInput) startInput.addEventListener("change", () => applySettingsFromInputs());
if (dailyCostInput) dailyCostInput.addEventListener("input", () => applySettingsFromInputs());
if (currencyInput) currencyInput.addEventListener("input", () => applySettingsFromInputs());
if (nameInput) nameInput.addEventListener("input", () => applySettingsFromInputs());
if (colorInput) colorInput.addEventListener("input", () => applySettingsFromInputs());

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
    } catch (e) {}
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
  data.savings = data.days * dailyCost;
  data.dollars = Math.floor(data.savings)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  data.cents = (data.savings - Math.floor(data.savings))
    .toFixed(2)
    .split(".")[1];
  updatePies();
  const dollarsEl = document.getElementById("dollars");
  const centsEl = document.getElementById("cents");
  if (dollarsEl) dollarsEl.innerText = `${currency}${data.dollars}`;
  if (centsEl) centsEl.innerText = data.cents;

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
