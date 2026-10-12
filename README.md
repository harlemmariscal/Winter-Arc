# Morning Lift

A small offline tracker for two people training in the early morning. No server, no accounts, no build step. Four files and a couple of icons.

## Put it online (about 3 minutes)

1. On GitHub, make a new **public** repository. Name it something like `morning-lift`.
2. Upload every file in this folder to the root of the repo: `index.html`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`, `icon-maskable.png`. Commit.
3. Go to **Settings → Pages**. Under "Build and deployment", set Source to **Deploy from a branch**, branch **main**, folder **/ (root)**. Save.
4. Wait a minute, then open `https://YOURNAME.github.io/morning-lift/`.

The repo has to be public for Pages to work on a free account. Nothing personal is in the code, and no logged data ever leaves the phone, so a public repo only exposes the app itself.

## Install it on a phone

**iPhone:** open the link in Safari (not Chrome), tap the share button, then **Add to Home Screen**.
**Android:** open the link in Chrome, tap the three dots, then **Install app** or **Add to Home screen**.

After that it opens full screen with no browser bar and works without a signal.

## How the data works

Everything is saved in the browser's local storage on that one device. That means:

- Each sister's phone keeps her own logs. They do not see each other's data.
- There is no sync. The same profile opened on a laptop starts empty.
- Clearing browser data or "Clear website data" erases the logs.
- Settings → **Export a backup file** saves a `.json`. **Restore from a backup** loads it back, on the same phone or a new one. Worth doing once a month.

## Changing the plan

Everything is in the `<script>` block at the bottom of `index.html`:

- `EX` — the exercise list, each with a name, prescription, and a form cue.
- `S` — the sessions, each one a list of exercise keys from `EX`.
- `PROFILES` — per person: name, accent color, calorie and protein goals, the breakfast bowl, and `week`, an array of 7 days starting at **Sunday**. Each day picks a session and can carry a `run` note.
- `FOODS` — the quick-add buttons.

Calorie and protein goals can also be changed in Settings without touching the code.

## A note on the numbers

Goals default to roughly maintenance, not a real deficit. Both sisters are at healthy weights, and the "toned" look comes from building muscle while eating enough to support the training. If the scale and the tape do not move in a month, adjust by about 100 calories, not 500.
