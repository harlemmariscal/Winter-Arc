/* =========================================================
   Morning Lift app logic.
   The plan itself (exercises, schedules, foods) is in plan.js.
   ========================================================= */

const SETS_PER_EXERCISE = 3;

/* ---------------------------------------------------------
   Saved data

   Each profile is stored in localStorage under "morninglift.v1.<a|b>".
   The short keys below are what's already on people's phones, so
   don't rename them or old logs will stop loading.

   {
     name, cal, pro,                       // display name + daily goals
     days: {
       "2026-10-12": {
         food: [{ n, cal, p }],            // name, calories, protein grams
         sets: { squat: [{ w, r, d }] },   // weight, reps, done (3 per exercise)
         done: false,                      // workout finished?
         run:  { mi, min } | null
       }
     },
     checkins: [{ date, weight, waist, hips, thigh }],
     history:  [{ date, name }]            // finished workouts
   }
   --------------------------------------------------------- */
const storageKey = profile => "morninglift.v1." + profile;
const LAST_PROFILE_KEY = "morninglift.last";

let currentProfile = localStorage.getItem(LAST_PROFILE_KEY) || "a";
let db = null; // the current profile's saved data

function blankProfile(profile) {
  const p = PROFILES[profile];
  return { name: p.name, cal: p.cal, pro: p.protein, days: {}, checkins: [], history: [] };
}

function load() {
  try {
    const raw = localStorage.getItem(storageKey(currentProfile));
    db = raw ? JSON.parse(raw) : blankProfile(currentProfile);
  } catch (e) {
    db = blankProfile(currentProfile);
  }
  db.days ??= {};
  db.checkins ??= [];
  db.history ??= [];
}

function save() {
  try {
    localStorage.setItem(storageKey(currentProfile), JSON.stringify(db));
  } catch (e) {
    toast("Storage is full. Export a backup.");
  }
}

/* ---------------------------------------------------------
   Small helpers
   --------------------------------------------------------- */
const $ = id => document.getElementById(id);

// "YYYY-MM-DD" in local time
function dateKey(d) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
const todayKey = () => dateKey(new Date());

// Get (or create) the log for a given day. Defaults to today.
function dayLog(key = todayKey()) {
  db.days[key] ??= { food: [], sets: {}, done: false, run: null };
  return db.days[key];
}

// Escape text before putting it into innerHTML
function esc(s) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
  return String(s).replace(/[&<>"]/g, c => map[c]);
}

let toastTimer;
function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1700);
}

/* ---------------------------------------------------------
   Profile switching
   --------------------------------------------------------- */
function setProfile(profile) {
  currentProfile = profile;
  localStorage.setItem(LAST_PROFILE_KEY, profile);

  const accent = PROFILES[profile].accent;
  document.documentElement.style.setProperty("--accent", accent);
  document.documentElement.style.setProperty("--accent-dim", accent + "33");

  $("pa").setAttribute("aria-pressed", profile === "a");
  $("pb").setAttribute("aria-pressed", profile === "b");

  load();
  renderAll();
}

// Name for the switch button. Uses the saved name if they changed it.
function profileName(profile) {
  if (profile === currentProfile) return db.name;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(profile)));
    if (saved && saved.name) return saved.name;
  } catch (e) {}
  return PROFILES[profile].name;
}

/* ---------------------------------------------------------
   Today tab
   --------------------------------------------------------- */
const todayPlan = () => PROFILES[currentProfile].week[new Date().getDay()];

function renderToday() {
  const plan = todayPlan();
  const session = SESSIONS[plan.session];
  const log = dayLog();

  $("today-date").textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric"
  });

  // Headline, with the last word in the accent color
  $("today-session").innerHTML = plan.session === "rest" && !plan.run
    ? 'Rest <span class="accent">day</span>'
    : session.title.replace(/(\w+)$/, '<span class="accent">$1</span>');

  $("today-note").textContent = plan.note;

  renderRunBlock(plan, log);
  renderExercises(session, log);
  showLastWeights(session.exercises);
}

function renderRunBlock(plan, log) {
  const block = $("run-block");
  if (!plan.run) {
    block.innerHTML = "";
    return;
  }

  const run = log.run || {};
  block.innerHTML = `
    <h2>Run</h2>
    <p class="hint">${plan.run}</p>
    <div class="grid2">
      <div class="field">
        <label for="r-mi">Miles</label>
        <input id="r-mi" inputmode="decimal" value="${esc(run.mi || "")}">
      </div>
      <div class="field">
        <label for="r-min">Minutes</label>
        <input id="r-min" inputmode="numeric" value="${esc(run.min || "")}">
      </div>
    </div>`;

  const saveRun = () => {
    dayLog().run = { mi: $("r-mi").value, min: $("r-min").value };
    save();
  };
  $("r-mi").addEventListener("change", saveRun);
  $("r-min").addEventListener("change", saveRun);
}

function renderExercises(session, log) {
  const list = $("ex-list");
  const finishBtn = $("finish");

  if (!session.exercises.length) {
    list.innerHTML = `
      <h2>Lifting</h2>
      <p class="hint">Nothing programmed today. Eat normally, hit your protein, and sleep. Muscle is built on the rest days.</p>`;
    finishBtn.style.display = "none";
    return;
  }

  list.innerHTML =
    `<h2>Lifting <small>${session.exercises.length} moves</small></h2>` +
    session.exercises.map(id => exerciseHtml(id, log.sets[id] || [])).join("");

  finishBtn.style.display = "block";
  finishBtn.textContent = log.done ? "Workout saved" : "Finish workout";
  finishBtn.disabled = !!log.done;
}

function exerciseHtml(id, savedSets) {
  const ex = EXERCISES[id];
  let setsHtml = "";
  for (let i = 0; i < SETS_PER_EXERCISE; i++) {
    setsHtml += setHtml(id, i, savedSets[i] || {});
  }
  return `
    <div class="ex">
      <div class="ex-head">
        <div class="ex-name">${ex.name}</div>
        <div class="ex-rx">${ex.rx}</div>
      </div>
      <div class="ex-cue">${ex.cue}</div>
      <div class="sets">${setsHtml}</div>
    </div>`;
}

function setHtml(id, i, set) {
  const args = `'${id}',${i}`;
  return `
    <div class="set${set.d ? " done" : ""}" id="set-${id}-${i}">
      <label for="w-${id}-${i}">Set ${i + 1}</label>
      <input id="w-${id}-${i}" inputmode="decimal" placeholder="lb"   value="${esc(set.w || "")}" onchange="saveSet(${args})">
      <input id="r-${id}-${i}" inputmode="numeric" placeholder="reps" value="${esc(set.r || "")}" onchange="saveSet(${args})">
      <button class="tick" onclick="toggleSetDone(${args})">${set.d ? "done" : "mark"}</button>
    </div>`;
}

// Put the last weight they used in each empty box, so they know what to beat
function showLastWeights(exerciseIds) {
  const pastDays = Object.keys(db.days).sort().reverse().filter(k => k !== todayKey());

  exerciseIds.forEach(id => {
    for (const key of pastDays) {
      const sets = db.days[key].sets && db.days[key].sets[id];
      if (!sets || !sets[0] || !sets[0].w) continue;

      for (let i = 0; i < SETS_PER_EXERCISE; i++) {
        const input = $(`w-${id}-${i}`);
        const lastWeight = sets[i] && sets[i].w ? sets[i].w : sets[0].w;
        if (input && !input.value) input.placeholder = "last " + lastWeight;
      }
      break; // only the most recent day counts
    }
  });
}

function getSet(id, i) {
  const log = dayLog();
  log.sets[id] ??= [{}, {}, {}];
  log.sets[id][i] ??= {};
  return log.sets[id][i];
}

function saveSet(id, i) {
  const set = getSet(id, i);
  set.w = $(`w-${id}-${i}`).value;
  set.r = $(`r-${id}-${i}`).value;
  save();
}

function toggleSetDone(id, i) {
  const set = getSet(id, i);
  set.d = !set.d;
  set.w = $(`w-${id}-${i}`).value;
  set.r = $(`r-${id}-${i}`).value;
  save();

  const box = $(`set-${id}-${i}`);
  box.classList.toggle("done", set.d);
  box.querySelector(".tick").textContent = set.d ? "done" : "mark";
}

function finishWorkout() {
  dayLog().done = true;
  db.history = db.history.filter(h => h.date !== todayKey());
  db.history.push({ date: todayKey(), name: SESSIONS[todayPlan().session].title });
  save();
  renderToday();
  renderProgress();
  toast("Logged. Nice work.");
}

/* ---------------------------------------------------------
   Food tab
   --------------------------------------------------------- */
function foodTotals() {
  const food = dayLog().food || [];
  return {
    cal: food.reduce((sum, f) => sum + f.cal, 0),
    protein: food.reduce((sum, f) => sum + f.p, 0)
  };
}

function renderFood() {
  const totals = foodTotals();
  const goalProtein = db.pro;
  const goalCal = db.cal;

  // Meters on the Today tab
  $("m-p").textContent = totals.protein;
  $("m-pg").textContent = `/ ${goalProtein}g`;
  $("m-c").textContent = totals.cal;
  $("m-cg").textContent = `/ ${goalCal}`;

  // Bars on both the Today and Food tabs
  const proteinPct = Math.min(100, totals.protein / goalProtein * 100);
  const calPct = Math.min(100, totals.cal / goalCal * 100);
  $("f-p").style.width = $("f-p2").style.width = proteinPct + "%";
  $("f-c").style.width = $("f-c2").style.width = calPct + "%";

  // Food tab headline
  $("f-pro").textContent = totals.protein + "g";
  const left = goalProtein - totals.protein;
  const proteinText = left > 0 ? `${left}g protein to go` : "Protein goal hit";
  $("f-cal").textContent = `${proteinText}  ·  ${totals.cal} of ${goalCal} calories`;

  const bowl = PROFILES[currentProfile].bowl;
  $("bowl-desc").textContent = `${bowl.desc} — about ${bowl.protein}g protein, ${bowl.cal} cal`;

  $("chips").innerHTML = FOODS.map((f, i) =>
    `<button class="chip" onclick="addFood(${i})">${f.name} <span class="p">${f.protein}g</span></button>`
  ).join("");

  const eaten = dayLog().food || [];
  $("food-list").innerHTML = eaten.length
    ? eaten.map((f, i) => `
        <div class="food-row">
          <div class="nm">${esc(f.n)}</div>
          <div class="mac">${f.p}g · ${f.cal} cal</div>
          <button class="del" onclick="deleteFood(${i})" aria-label="Remove">&times;</button>
        </div>`).join("")
    : '<p class="hint">Nothing logged yet. Start with the bowl.</p>';
}

// Every food goes into the log as { n, cal, p } (see "Saved data" above)
function logFood(name, cal, protein, message) {
  dayLog().food.push({ n: name, cal, p: protein });
  save();
  renderFood();
  toast(message);
}

function addFood(i) {
  const f = FOODS[i];
  logFood(f.name, f.cal, f.protein, "Added");
}

function addBowl() {
  const b = PROFILES[currentProfile].bowl;
  logFood(b.name, b.cal, b.protein, "Breakfast logged");
}

function addCustom() {
  const name = $("c-name").value.trim();
  const cal = parseInt($("c-cal").value || 0, 10) || 0;
  const protein = parseInt($("c-pro").value || 0, 10) || 0;
  if (!name) {
    toast("Give it a name first");
    return;
  }
  ["c-name", "c-cal", "c-pro"].forEach(id => $(id).value = "");
  logFood(name, cal, protein, "Added");
}

function deleteFood(i) {
  dayLog().food.splice(i, 1);
  save();
  renderFood();
}

/* ---------------------------------------------------------
   Progress tab
   --------------------------------------------------------- */
// Midnight on the most recent Sunday
function startOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function renderProgress() {
  const weekStart = startOfWeek();
  const sessionsThisWeek = db.history.filter(h => new Date(h.date + "T12:00:00") >= weekStart).length;
  $("s-week").textContent = sessionsThisWeek;
  $("s-all").textContent = db.history.length;

  renderWeekStrip(weekStart);

  const checkins = db.checkins.slice().sort((a, b) => a.date < b.date ? -1 : 1);
  renderProgressHeadline(checkins);

  $("ci-list").innerHTML = checkins.length
    ? checkins.slice().reverse().map(c => `
        <div class="log-row">
          <span>${esc(c.date)}</span>
          <div class="num">${esc(c.weight || "--")} lb · ${esc(c.waist || "--")}" waist</div>
        </div>`).join("")
    : '<p class="hint">Nothing yet.</p>';

  $("hist").innerHTML = db.history.length
    ? db.history.slice().reverse().slice(0, 20).map(h => `
        <div class="log-row">
          <span>${esc(h.date)}</span>
          <div>${esc(h.name)}</div>
        </div>`).join("")
    : '<p class="hint">Finish a session and it shows up here.</p>';

  drawChart(checkins);
}

// Seven boxes, Sun–Sat: filled = trained, dashed = planned rest
function renderWeekStrip(weekStart) {
  const letters = ["S", "M", "T", "W", "T", "F", "S"];
  const todayIdx = new Date().getDay();

  $("week").innerHTML = letters.map((letter, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = dateKey(d);

    const planned = PROFILES[currentProfile].week[i];
    const isRest = planned.session === "rest" && !planned.run;
    const trained = db.history.some(h => h.date === key);

    const classes = ["b"];
    if (trained) classes.push("on");
    else if (isRest) classes.push("rest");
    if (i === todayIdx) classes.push("today");

    return `<div><div class="d">${letter}</div><div class="${classes.join(" ")}"></div></div>`;
  }).join("");
}

function renderProgressHeadline(checkins) {
  const first = checkins[0];
  const last = checkins[checkins.length - 1];

  if (!last) {
    $("p-head").innerHTML = 'No <span class="accent">data</span> yet';
    $("p-sub").textContent = "Save a check in below to start the trend.";
    return;
  }

  $("p-head").innerHTML = `<span class="accent">${esc(last.waist || "--")}"</span> waist`;
  $("p-sub").textContent = first !== last
    ? `Started at ${first.waist || "--"}" and ${first.weight || "--"} lb. Now ${last.weight || "--"} lb.`
    : "First check in saved. Come back in two weeks.";
}

function saveCheckin() {
  const val = id => $(id).value.trim();
  const checkin = {
    date: todayKey(),
    weight: val("ci-w"),
    waist: val("ci-wa"),
    hips: val("ci-h"),
    thigh: val("ci-t")
  };
  if (!checkin.weight && !checkin.waist) {
    toast("Add a weight or waist first");
    return;
  }

  // One check in per day; saving again replaces today's
  db.checkins = db.checkins.filter(c => c.date !== checkin.date);
  db.checkins.push(checkin);
  save();

  ["ci-w", "ci-wa", "ci-h", "ci-t"].forEach(id => $(id).value = "");
  renderProgress();
  toast("Check in saved");
}

// Weight and waist lines. Each is scaled to its own min/max.
function drawChart(checkins) {
  const svg = $("chart");
  const W = 320, H = 170, PAD = 22;
  const points = checkins.filter(c => c.weight || c.waist);

  if (points.length < 2) {
    svg.innerHTML = '<text x="160" y="88" fill="#8C94B2" font-size="12" text-anchor="middle" font-family="system-ui">Two check ins and a line appears here</text>';
    $("chart-key").textContent = "";
    return;
  }

  const accent = PROFILES[currentProfile].accent;
  const WAIST_COLOR = "#6FA8FF";
  const series = [
    { key: "weight", color: accent },
    { key: "waist", color: WAIST_COLOR }
  ];

  let lines = "";
  let dots = "";

  series.forEach(({ key, color }) => {
    const values = points.map(p => {
      const v = parseFloat(p[key]);
      return isNaN(v) ? null : v;
    });
    const known = values.filter(v => v !== null);
    if (known.length < 2) return;

    const min = Math.min(...known);
    const range = (Math.max(...known) - min) || 1;

    let path = "";
    values.forEach((v, i) => {
      if (v === null) return;
      const x = (PAD + (W - PAD * 2) * (i / (points.length - 1))).toFixed(1);
      const y = (H - PAD - (H - PAD * 2) * ((v - min) / range)).toFixed(1);
      path += `${path ? "L" : "M"}${x} ${y} `;
      dots += `<circle cx="${x}" cy="${y}" r="3" fill="${color}"/>`;
    });

    lines = `<path d="${path}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` + lines;
  });

  // Lines first so the dots sit on top
  svg.innerHTML = lines + dots;
  $("chart-key").innerHTML =
    `<span style="color:${accent}">&#9644;</span> weight &nbsp; ` +
    `<span style="color:${WAIST_COLOR}">&#9644;</span> waist — each scaled to its own range`;
}

/* ---------------------------------------------------------
   Settings sheet
   --------------------------------------------------------- */
function openSheet(kind) {
  if (kind === "settings") {
    $("sheet-in").innerHTML = `
      <h3>Settings</h3>
      <div class="field">
        <label for="st-n">Name on this profile</label>
        <input id="st-n" value="${esc(db.name)}">
      </div>
      <div class="grid2">
        <div class="field">
          <label for="st-p">Protein goal (g)</label>
          <input id="st-p" inputmode="numeric" value="${esc(db.pro)}">
        </div>
        <div class="field">
          <label for="st-c">Calorie goal</label>
          <input id="st-c" inputmode="numeric" value="${esc(db.cal)}">
        </div>
      </div>
      <button class="big" onclick="saveSettings()">Save</button>
      <button class="big ghost" onclick="exportData()">Export a backup file</button>
      <button class="big ghost" onclick="$('imp').click()">Restore from a backup</button>
      <input type="file" id="imp" accept="application/json" hidden onchange="importData(event)">
      <button class="big ghost danger" onclick="wipe()">Erase this profile</button>
      <p class="hint">Everything is stored on this device only. Nothing is uploaded anywhere. Export a backup before switching phones or clearing your browser.</p>`;
  }
  $("sheet").classList.add("open");
}

function closeSheet() {
  $("sheet").classList.remove("open");
}

function saveSettings() {
  const defaults = PROFILES[currentProfile];
  db.name = $("st-n").value.trim() || defaults.name;
  db.pro = parseInt($("st-p").value, 10) || defaults.protein;
  db.cal = parseInt($("st-c").value, 10) || defaults.cal;
  save();
  closeSheet();
  renderAll();
  toast("Saved");
}

function exportData() {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `morninglift-${currentProfile}-${todayKey()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== "object" || !("days" in data)) throw new Error("not a backup");
      db = data;
      save();
      closeSheet();
      renderAll();
      toast("Backup restored");
    } catch (e) {
      toast("That file isn't a backup from this app");
    }
  };
  reader.readAsText(file);
}

function wipe() {
  if (!confirm("Erase all logs for this profile? This can't be undone.")) return;
  db = blankProfile(currentProfile);
  save();
  closeSheet();
  renderAll();
  toast("Profile erased");
}

/* ---------------------------------------------------------
   Tabs and startup
   --------------------------------------------------------- */
const TABS = ["today", "food", "prog"];

function go(tab) {
  TABS.forEach(t => {
    $("v-" + t).classList.toggle("on", t === tab);
    $("n-" + t).setAttribute("aria-pressed", t === tab);
  });
  window.scrollTo(0, 0);
  if (tab === "prog") renderProgress();
  if (tab === "food") renderFood();
}

function renderAll() {
  $("pa").textContent = profileName("a");
  $("pb").textContent = profileName("b");
  renderToday();
  renderFood();
  renderProgress();
}

setProfile(currentProfile);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

// Redraw if the app sits open overnight
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) renderAll();
});
