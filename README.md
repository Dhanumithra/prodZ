# ProdZ · Green, Local-First Productivity Workspace

[![Live Demo](https://img.shields.io/badge/Live_Demo-prod--z.vercel.app-00df8f?style=for-the-badge&logo=vercel&logoColor=white)](https://prod-z.vercel.app/)
[![Zero Cloud Emissions](https://img.shields.io/badge/Emissions-0g_CO₂_(Local--First)-brightgreen?style=for-the-badge)](https://prod-z.vercel.app/)
[![Offline PWA](https://img.shields.io/badge/PWA-100%25_Offline_Ready-blue?style=for-the-badge)](https://prod-z.vercel.app/)
[![Zero Tracking](https://img.shields.io/badge/Privacy-Zero_Tracking-purple?style=for-the-badge)](https://prod-z.vercel.app/)

> **ProdZ** is an ultra-lightweight, local-first productivity workspace combining interval timers, task management, procedural brainwave audio, streak analytics, breathing pacers, and desk mobility stretches—engineered with a strict commitment to **Green Software Engineering (GSE)** and zero cloud emissions.

---

## 💡 Why is it named "ProdZ"?

The name **ProdZ** unites the concepts of **Productivity** and the letter **Z**, which represents four core design philosophies:

1. **Zero (Zero-Cloud, Zero-Carbon, Zero-Tracking, Zero-Streaming)**  
   Most modern web applications consume gigabytes of cloud bandwidth, execute 24/7 server cron jobs, and stream heavy media files across data centers. ProdZ challenges this paradigm by operating with **0g of cloud CO₂ emissions**:
   - **Zero Cloud Servers:** 100% of tasks, timers, and telemetry reside locally in browser IndexedDB.
   - **Zero Streamed Bandwidth:** Soundscapes are synthesized locally on your audio chip using the Web Audio API instead of streaming MP3s over CDNs.
   - **Zero Telemetry / Trackers:** No analytics beacons, cookies, or remote surveillance scripts draining background CPU.
2. **Zen (Mindful & Distraction-Free Focus)**  
   Productivity should feel calm and intentional, not frantic. ProdZ incorporates mindfulness into everyday workflows through a dedicated fullscreen **Zen Mode**, guided breathing pacers, meditative soundscapes, and daily stoic reflections.
3. **Zzz (Rest, Recovery & Ergonomic Rejuvenation)**  
   True productivity requires balanced work-rest cycles. The "Z" also signifies rest: sleep timers, gentle posture resets, and restorative Ba Duan Jin mobility routines that prevent cognitive burnout and physical strain.
4. **Gen Z & Modern Minimalist Aesthetic**  
   Designed for the modern digital craftsperson who values clean design, digital privacy, and sustainability. Built with a sleek, true-black OLED visual palette (`#050505`) and glassmorphic emerald accents.

---

## ✨ Key Features

### ⏱️ 1. Focus & Interval Timer (Pomodoro + Zen Mode)
- **Customizable Intervals:** Set custom Focus, Short Break, and Long Break durations, as well as daily session targets.
- **Timestamp-Delta Engine:** Uses `targetEndTime - now` instead of continuous polling loops. The CPU remains dormant, waking zero times when hidden.
- **Fullscreen Zen Overlay:** Enter a distraction-free, true-black workspace with a single click or keyboard shortcut.
- **Browser & System Notifications:** Desktop notifications sound and alert you when an interval completes, even when working in another tab.

### 📝 2. Local Task Management
- **Fast & Intuitive:** Quickly capture, reorder, edit, and check off daily priorities.
- **Priority Tags & Pomodoro Estimates:** Tag tasks by priority (High, Medium, Low) and track estimated vs. completed focus cycles per task.
- **Instant Filtering:** Filter between All, Active, and Completed tasks seamlessly.
- **100% Client-Side:** Saved instantly to browser IndexedDB with zero cloud syncing delays.

### 🎧 3. Procedural Web Audio Engine (Generative Music & Entrainment)
- **Zero Audio Streaming:** Instead of streaming 50–100 MB of audio per hour from cloud servers, all soundscapes are procedurally synthesized in real-time by your device's audio chip using the Web Audio API.
- **Generative Music Presets:**
  - *Lo-Fi Study Piano (14 Hz Beta)*: Soothing chord progressions with gentle vinyl crackle.
  - *Deep Flow Ambient (40 Hz Gamma)*: Cinematic evolving pads for peak cognitive flow.
  - *Rainy Day Cafe Piano*: Melodic jazz chords combined with procedurally generated falling rain.
  - *Zen Garden Kalimba (10 Hz Alpha)*: Relaxed alertness acoustic melodies.
  - *Tibetan Temple Singing Bowl (6 Hz Theta)*: Deep meditative resonant frequencies.
  - *Cyberpunk Chill & Cosmic Dust*: Dreamy lo-fi synthesizer chords.
- **Acoustic Noise Colors:** Pure Pink Noise, Deep Brown Noise, Gentle Rain, and River Stream synthesis.
- **Floating Mini Audio Dock:** A persistent dock with live animated waveforms, volume control, and automated sleep timers (15m, 30m, 45m, 60m).

### 📊 4. Productivity Heatmap & Habit Streak Analytics
- **GitHub-Style Contribution Heatmap:** An annual visualization of your daily focus intensity and consistency.
- **Key Metrics:** Real-time tracking of total focus hours, completed session count, current daily streak, and longest streak.
- **Milestone Achievements:** Unlock badges as your habits build (*First Spark*, *On a Roll*, *Habit Champion*, *Centurion*, *Deep Work Master*).

### 🫁 5. Visual Breathing Pacer
- **Smooth Pacing Animations:** Guided visual breathing ring powered by hardware-accelerated CSS `transform: scale()` transitions.
- **Science-Backed Protocols:**
  - **Box Breathing (4-4-4-4):** Inhale 4s, Hold 4s, Exhale 4s, Hold 4s — to steady the nervous system under stress.
  - **4-7-8 Relaxing Breath:** Inhale 4s, Hold 7s, Exhale 8s — promotes parasympathetic relaxation.
  - **Deep Belly Breathing (4-6):** Inhale 4s, Exhale 6s — lowers heart rate and blood pressure.
- **Cycle Counter:** Tracks consecutive completed breathing rounds.

### 🧘 6. Desk Mobility & Ba Duan Jin (Eight Brocades)
- **Targeted Desk Stretches:** Bite-sized ergonomic movements for common tension areas:
  - *Neck & Shoulders:* Chin tucks, lateral tilts, levator scapulae release.
  - *Arms & Wrists:* Prayer stretch, wrist flexors, tendon splay for typing relief.
  - *Legs & Lower Body:* Seated hamstring stretch, seated figure-4 hip opener, ankle rotations.
  - *Spine:* Overhead reach, seated spinal twist, chest openers.
- **Traditional Ba Duan Jin (八段錦):** Traditional Qigong movements with guided breath cues and form notes:
  - *1. Propping up the Heavens*
  - *2. Drawing the Bow*
  - *3. Raising a Single Arm*
  - *4. Looking Backward (Clearing the 5 Fatigues)*
  - *5. Clenching Fists with Fierce Gaze*
- **Customizable Posture Nudges:** Automatic periodic prompts (every 30 to 60 minutes) to remind you to stand, hydrate, and stretch.

### 📜 7. Daily Stoic & Philosophical Wisdom
- Curated daily wisdom from Marcus Aurelius, Seneca, Lao Tzu, Confucius, Epictetus, Cal Newport, and James Clear.
- Deterministically selected based on the day of the year (`dayOfYear % length`), requiring zero external network fetch calls.

### 💾 8. Complete Data Sovereignty & Portability
- **One-Click Backup & Restore:** Export your full application state (tasks, history, settings) into a portable JSON file.
- **Local Persistence:** Requests `navigator.storage.persist()` to safeguard your data against automatic browser storage eviction.

---

## 🌿 Green Software Engineering (GSE) Architecture

ProdZ was engineered to align directly with the **Green Software Foundation (GSF)** principles to minimize **Software Carbon Intensity (SCI)**:

| Evaluation Metric | Conventional Cloud Productivity Apps | ProdZ Green Architecture |
| :--- | :--- | :--- |
| **Cloud Infrastructure** | 24/7 cloud servers, microservices & databases | **Zero servers**; runs 100% in client browser |
| **Data Persistence** | Continuous remote API calls & cloud DB sync | **Local IndexedDB** with zero network roundtrips |
| **Focus Audio & Music** | Streamed audio files (~50–100 MB / hour) | **Web Audio API DSP synthesis** (0 bytes network) |
| **Network Footprint** | Continuous analytics, telemetry, and pings | **Zero bytes transferred** after initial static bundle (<300 KB) |
| **Idle Energy Usage** | High; polling loops wake CPU every second | **Timestamp-delta math**; CPU stays dormant |
| **Page Visibility** | Runs animations continuously in hidden tabs | **Page Visibility API** suspends loops when tab is hidden |
| **Display Power** | Bright white themes burning peak display watts | **True-Black OLED Palette (`#050505`)** turns off OLED pixels |
| **Telemetry & Privacy** | Tracking beacons, ad scripts, user profiling | **Zero trackers, zero cookies, zero analytics** |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm, pnpm, or yarn

### Installation & Local Development
```bash
# Clone the repository
git clone https://github.com/Dhanumithra/prodZ.git

# Navigate into the project directory
cd prodZ

# Install dependencies
npm install

# Start the Vite local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
# Build production-ready static assets
npm run build

# Preview the production build locally
npm run preview
```

### Static Deployment
ProdZ builds to standard static files in `dist/` and can be deployed anywhere with zero server requirements:
- **Vercel:** Deploys automatically with zero configuration using the included `vercel.json`.
- **Cloudflare Pages / Netlify:** Build command `npm run build`, output directory `dist`. (Preconfigured cache headers in `public/_headers`).
- **GitHub Pages:** Deploy the `dist/` directory directly.

---

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/)
- **Bundler:** [Vite](https://vite.dev/)
- **Styling:** Vanilla CSS (True-black OLED `#050505`, custom glassmorphism)
- **Audio:** Web Audio API (Oscillators, BiquadFilterNodes, StereoPanner, procedural noise generators)
- **Storage:** Browser IndexedDB (`src/db.js`)
- **PWA:** Service Worker (`public/sw.js`) and Web App Manifest

---

## 📄 License

Open-source under the [MIT License](LICENSE). Built for mindful focus and sustainable computing.
