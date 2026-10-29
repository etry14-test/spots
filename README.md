# Spots

A mobile soundboard: 22 sounds, any 6 of them on screen at a time as big pads.
Installs to an Android home screen and works fully offline.

Currently loaded with 22 generated placeholder tones so you can test it before
you have real audio.

## Run it locally

```sh
cd /home/ethand/Code/Spots
python3 -m http.server 8777
```

Then open <http://localhost:8777>. It must be served over http — opening
`index.html` as a `file://` path will fail, because `fetch()` can't read local
files and service workers won't register.

To try it on your phone on the same wifi, use your machine's LAN address
(`ip addr | grep 'inet 192'`), e.g. `http://192.168.1.50:8777`. Sound and pads
work, but **installing to the home screen needs HTTPS** — see below.

## Adding your own sounds

1. Drop your audio into `sounds/`. Any format the browser decodes works —
   `.mp3`, `.m4a`, `.ogg`, `.wav`. Keep them short; they're all decoded into
   memory at startup.
2. Edit `sounds/sounds.json` to match:

```json
[
  { "file": "airhorn.mp3", "label": "Air horn" },
  { "file": "sadtrombone.m4a", "label": "Sad trombone" }
]
```

`label` is just the default pad name — you can rename pads in the app, and your
rename wins from then on.

There's nothing special about the number 22: the list can be any length. The
settings screen shows every entry and you pick 6 for the board.

3. Bump `CACHE = 'spots-v1'` in `sw.js` to `v2` (etc.) whenever you change
   sounds or `index.html`, otherwise already-installed phones keep serving the
   old cached copy.

## Using it

- **Tap a pad** to play. Sounds overlap, so rapid-fire taps all sound.
- **⏹ bottom-left** cuts everything that's still playing.
- **⚙ bottom-right** opens settings. Tap the square left of a sound to put it on
  the board — the number is its position, filling left-to-right, top-to-bottom.
  Tap a name to rename it. **▶** previews without changing the board.
- With 6 pads already chosen, picking a 7th replaces the oldest choice.
- Your picks and names live in `localStorage`, so they survive restarts, but are
  per-browser and per-origin — moving from `localhost` to a hosted URL starts fresh.

The board is 2×3 in portrait and 3×2 in landscape. The screen is kept awake
while the board is open, where the browser allows it.

## Hosting it (so you can install it to your home screen)

Android only offers "Add to home screen" as a real installed app over HTTPS.
Easiest free option is GitHub Pages:

```sh
cd /home/ethand/Code/Spots
git init && git add -A && git commit -m "Spots soundboard"
gh repo create spots --private --source=. --push
```

Then in the repo: **Settings → Pages → Source: deploy from branch `main`, `/`**.
It'll be at `https://<user>.github.io/spots/`. Open that in Chrome on your
phone, then **⋮ → Add to home screen**. After the first load it runs offline.

Netlify Drop (drag the folder onto <https://app.netlify.com/drop>) works too and
takes about ten seconds, but gives you a random URL.

Note: a **private** GitHub repo still publishes a **public** Pages site on the
free plan. If the sounds shouldn't be public, use Netlify with a password, or
Tailscale Serve to keep it on your own network.

## If you'd rather have a real APK

The same files wrap into an Android app with Capacitor, no code changes:

```sh
npm init -y && npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init Spots com.example.spots --web-dir=.
npx cap add android
npx cap sync
cd android && ./gradlew assembleDebug
```

APK lands in `android/app/build/outputs/apk/debug/`. This needs a JDK and the
Android SDK installed, which is the bulk of the work. Worth doing only if the
PWA's audio-focus behaviour (how it interacts with the volume rocker and other
apps' audio) turns out to bother you — playback latency itself is already fine,
because pads play from pre-decoded Web Audio buffers rather than `<audio>` tags.

## Files

| | |
|---|---|
| `index.html` | the whole app — markup, styles, logic |
| `sounds/sounds.json` | which files exist and their default names |
| `sounds/*.mp3` | the audio (placeholder tones right now) |
| `sw.js` | service worker; precaches everything for offline use |
| `manifest.webmanifest` | app name, icons, standalone display |
| `icons/` | generated from `icons/icon.svg` |

To regenerate the icons after editing the SVG:

```sh
magick -background none icons/icon.svg -resize 192x192 icons/icon-192.png
magick -background none icons/icon.svg -resize 512x512 icons/icon-512.png
magick -background none icons/icon.svg -resize 320x320 -gravity center \
  -background '#14161c' -extent 512x512 icons/icon-maskable-512.png
```
