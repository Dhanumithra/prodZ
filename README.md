# ProdZ: green, local-first productivity

Tasks, customisable Pomodoro, synthesised frequency music, streak heatmap, breathing pacer, desk and Ba Duan Jin exercises, and a daily quote. No accounts, no backend, no tracking.

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/
npm run preview
```

## Deploy (static)
Cloudflare Pages / Netlify / Vercel: build command `npm run build`, output directory `dist`. `public/_headers` sets immutable caching for hashed assets (Cloudflare Pages / Netlify format).

## Green and persistence design
- **Local-first:** all data lives in IndexedDB (`src/db.js`) and is restored on every visit; `navigator.storage.persist()` asks the browser not to evict it. Export/Import backup (footer) moves data between devices as JSON.
- **Few dependencies:** React plus a ~15-line IndexedDB wrapper; system fonts; plain CSS; no analytics, no third-party requests.
- **Timer:** timestamp-based (`end - now`). One timeout fires at the interval end; the display re-renders once per second only while the tab is visible and wakes up zero times when hidden.
- **Audio:** all frequency presets are generated with the Web Audio API (oscillators, stereo panning for binaural beats, filtered pink/brown noise).
- **Breathing:** CSS `transform: scale()` transitions; JS wakes only at phase changes.
- **Display:** true-black OLED palette, muted accents.
- **Offline:** service worker (`public/sw.js`) caches assets; navigation is network-first so new deploys appear.

## Where to extend
- Quotes: `src/data.js` (`QUOTES`). Exercises: `MOVES`. Frequency presets: `PRESETS` in `src/audio.js`.
