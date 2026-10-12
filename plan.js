/* =========================================================
   The plan. Edit this file to change workouts, schedules,
   goals, or the quick-add foods. No logic lives here.
   ========================================================= */

// Every exercise the app knows about.
// The key (e.g. "squat") is what SESSIONS refers to. Don't rename keys
// once people have logged them, or their old weights won't show up.
const EXERCISES = {
  // Lower A
  squat:     { name: "Goblet or back squat",       rx: "3 x 8-12",               cue: "Chest tall, knees track over toes" },
  rdl:       { name: "Romanian deadlift",          rx: "3 x 8-12",               cue: "Push hips back, feel the hamstrings" },
  lunge:     { name: "Walking lunge",              rx: "3 x 10 each leg",        cue: "Long step, back knee to the floor" },
  calf:      { name: "Standing calf raise",        rx: "3 x 12-15",              cue: "Pause a beat at the top" },
  plank:     { name: "Plank",                      rx: "3 x 30-45 sec",          cue: "Ribs down, squeeze the glutes" },

  // Upper and core
  pull:      { name: "Lat pulldown",               rx: "3 x 8-12",               cue: "Drive elbows down, not back" },
  row:       { name: "Seated cable row",           rx: "3 x 8-12",               cue: "Shoulders down and away from ears" },
  press:     { name: "Dumbbell shoulder press",    rx: "3 x 8-12",               cue: "Stop just short of locking out" },
  pushup:    { name: "Push up",                    rx: "3 sets to near failure", cue: "Knees down is fine, keep the line straight" },
  deadbug:   { name: "Dead bug",                   rx: "3 x 10 each side",       cue: "Low back stays glued to the floor" },
  sideplank: { name: "Side plank",                 rx: "3 x 20-30 sec each",     cue: "Stack the hips, lift tall" },

  // Lower B
  thrust:    { name: "Hip thrust",                 rx: "3 x 8-12",               cue: "Chin tucked, hold the top 2 seconds" },
  bulg:      { name: "Bulgarian split squat",      rx: "3 x 8-10 each",          cue: "Front shin vertical, weight in the heel" },
  curl:      { name: "Seated leg curl",            rx: "3 x 10-12",              cue: "Slow on the way back" },
  step:      { name: "Step up",                    rx: "3 x 10 each",            cue: "Push through the top foot, don't hop" },
  legraise:  { name: "Hanging or lying leg raise", rx: "3 x 10-15",              cue: "Curl the hips up at the top" },

  // Full body, abs, easy day
  goblet:    { name: "Goblet squat",               rx: "3 x 10",                 cue: "Elbows inside the knees at the bottom" },
  dbrow:     { name: "One arm dumbbell row",       rx: "3 x 10 each",            cue: "Pull to the hip, no twisting" },
  incline:   { name: "Incline dumbbell press",     rx: "3 x 10",                 cue: "30 degree bench, controlled down" },
  crunch:    { name: "Cable or weighted crunch",   rx: "3 x 12-15",              cue: "Round the spine, hips still" },
  pallof:    { name: "Pallof press",               rx: "3 x 10 each side",       cue: "Resist the twist, that's the whole move" },
  bike:      { name: "Bicycle crunch",             rx: "3 x 20 total",           cue: "Slow, reach shoulder to knee" },
  walk:      { name: "Incline walk",               rx: "30-40 min",              cue: "Speed 3.0, incline 8-10, keep it easy" }
};

// Workouts. Each one is a title plus a list of EXERCISES keys, in order.
const SESSIONS = {
  lowerA: { title: "Lower A",           exercises: ["squat", "rdl", "lunge", "calf", "plank"] },
  upper:  { title: "Upper and core",    exercises: ["pull", "row", "press", "pushup", "deadbug", "sideplank"] },
  lowerB: { title: "Lower B",           exercises: ["thrust", "bulg", "curl", "step", "legraise"] },
  full:   { title: "Full body and abs", exercises: ["goblet", "dbrow", "incline", "crunch", "legraise", "pallof"] },
  light:  { title: "Easy day",          exercises: ["walk", "plank", "deadbug", "bike"] },
  rest:   { title: "Rest day",          exercises: [] }
};

// One entry per person.
//   week: 7 days, starting on SUNDAY. Each day picks a SESSIONS key,
//         a note, and optionally a `run` note (shows the run logger).
const PROFILES = {
  a: {
    name: "Sister (23)",
    accent: "#F2A14B",
    cal: 1700,
    protein: 110,
    bowl: {
      name: "Oikos vanilla bowl",
      cal: 320,
      protein: 24,
      desc: "1 cup Oikos vanilla, 1/2 cup berries, 2 tbsp granola"
    },
    week: [
      /* Sun */ { session: "rest",   note: "Full rest. Walk if you feel like moving." },
      /* Mon */ { session: "lowerA", note: "Heaviest day of the week. Warm up 5 minutes first." },
      /* Tue */ { session: "upper",  note: "Keep arms at this volume, it's enough to hold what you have." },
      /* Wed */ { session: "rest",   note: "Midweek rest. Sleep in." },
      /* Thu */ { session: "lowerB", note: "Glutes and hamstrings lead today." },
      /* Fri */ { session: "full",   note: "Core gets the most attention on Fridays." },
      /* Sat */ { session: "light",  note: "Low effort on purpose. You should finish able to do more." }
    ]
  },

  b: {
    name: "Sister (18)",
    accent: "#AE8FEE",
    cal: 1950,
    protein: 115,
    bowl: {
      name: "Oikos vanilla bowl",
      cal: 435,
      protein: 28,
      desc: "1 1/4 cup Oikos vanilla, 1/2 cup berries, 1/4 cup granola"
    },
    week: [
      /* Sun */ { session: "rest",
                  note: "No run, no lift. This one matters more than you think." },
      /* Mon */ { session: "lowerA",
                  run:  "Easy run first, then lift. Keep the run conversational.",
                  note: "Your double day. Lift second if you're short on time, legs will be tired." },
      /* Tue */ { session: "upper",
                  note: "No run today. Upper body and core only." },
      /* Wed */ { session: "rest",
                  run:  "Hard run day. Tempo or intervals, your call.",
                  note: "Running is the work today. No lifting." },
      /* Thu */ { session: "lowerB",
                  note: "Fresh legs, no run. Push the weight here." },
      /* Fri */ { session: "full",
                  run:  "Optional short easy run if you want it.",
                  note: "Core heavy. Skip the run if your legs feel beat up." },
      /* Sat */ { session: "rest",
                  run:  "Long easy run. Slower than you think.",
                  note: "Running only. Stretch after." }
    ]
  }
};

// Quick-add buttons on the Food tab.
const FOODS = [
  { name: "Chicken breast, 4 oz",    cal: 185, protein: 35 },
  { name: "Protein shake",           cal: 120, protein: 25 },
  { name: "2 eggs",                  cal: 140, protein: 12 },
  { name: "Egg whites, 1 cup",       cal: 125, protein: 26 },
  { name: "Greek yogurt cup",        cal: 140, protein: 15 },
  { name: "Cottage cheese, 1/2 cup", cal: 90,  protein: 12 },
  { name: "Tuna pouch",              cal: 70,  protein: 16 },
  { name: "Salmon, 4 oz",            cal: 230, protein: 25 },
  { name: "Lean ground beef, 4 oz",  cal: 200, protein: 23 },
  { name: "Turkey slices, 3 oz",     cal: 90,  protein: 18 },
  { name: "Tofu, 1/2 block",         cal: 180, protein: 20 },
  { name: "Protein bar",             cal: 200, protein: 20 },
  { name: "String cheese",           cal: 80,  protein: 7 },
  { name: "Rice, 1 cup",             cal: 205, protein: 4 },
  { name: "Oats, 1/2 cup dry",       cal: 150, protein: 5 },
  { name: "Sweet potato, medium",    cal: 115, protein: 2 },
  { name: "Peanut butter, 2 tbsp",   cal: 190, protein: 7 },
  { name: "Almonds, 1 oz",           cal: 165, protein: 6 },
  { name: "Banana",                  cal: 105, protein: 1 },
  { name: "Avocado, half",           cal: 160, protein: 2 },
  { name: "Veggies, big serving",    cal: 50,  protein: 3 },
  { name: "Olive oil, 1 tbsp",       cal: 120, protein: 0 }
];
