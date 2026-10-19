// Sounds are synthesised 100% locally with the Web Audio API: zero streaming, zero network, zero footprint.
let ctx, cur, sleepTimeout;
let analyser;

export const PRESETS = [
  { id: 'focus', n: 'Deep Focus Gamma', cat: 'Focus', d: '40 Hz gamma binaural beat with soothing pink noise', L: 240, B: 40, N: 'pink', ng: 0.05 },
  { id: 'study', n: 'Study & Retention', cat: 'Focus', d: '14 Hz beta beat with grounding 432 Hz harmonic tone', L: 200, B: 14, x: [[432, 0.06]] },
  { id: 'wake', n: 'Brain Wake-Up', cat: 'Energy', d: '20 Hz high-beta beat with vibrant overtones', L: 300, B: 20, x: [[900, 0.02, 0.2]] },
  { id: 'refresh', n: 'Alpha Flow & Refresh', cat: 'Calm', d: '10 Hz alpha wave with 528 Hz restorative tone', L: 528, B: 10 },
  { id: 'stress', n: 'Theta Stress Release', cat: 'Calm', d: '6 Hz theta wave on 136.1 Hz Earth frequency with soft noise', L: 136.1, B: 6, N: 'pink', ng: 0.04, lp: 800 },
  { id: 'heal', n: '528 Hz Cellular Harmony', cat: 'Calm', d: '528 Hz and 264 Hz octaves with gentle 4 Hz theta pulse', L: 528, B: 4, x: [[264, 0.1]] },
  { id: 'sleep', n: 'Delta Deep Rest', cat: 'Sleep', d: '2.5 Hz delta waves immersed in warm brown noise', L: 100, B: 2.5, N: 'brown', ng: 0.45, lp: 280 },
  { id: 'brown', n: 'Pure Brown Noise', cat: 'Noise', d: 'Warm, low-frequency atmospheric rumble to shield distractions', N: 'brown', ng: 0.5 },
  { id: 'pink', n: 'Balanced Pink Noise', cat: 'Noise', d: 'Even spectral power per octave for balanced masking', N: 'pink', ng: 0.35 },
  { id: 'vibe', n: 'Celestial Harmonics', cat: 'Calm', d: '396 Hz, 528 Hz & 639 Hz sacred chord with slow shimmer', x: [[396, 0.09, 0.1], [528, 0.09, 0.13], [639, 0.09, 0.17]] },
];

function createNoise(c, type) {
  const n = c.sampleRate * 6, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  let l = 0; const p = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    if (type === 'brown') {
      l = (l + 0.02 * w) / 1.02;
      d[i] = l * 3.5;
    } else {
      p[0] = 0.99886 * p[0] + w * 0.0555179;
      p[1] = 0.99332 * p[1] + w * 0.0750759;
      p[2] = 0.969 * p[2] + w * 0.153852;
      p[3] = 0.8665 * p[3] + w * 0.3104856;
      p[4] = 0.55 * p[4] + w * 0.5329522;
      p[5] = -0.7616 * p[5] - w * 0.016898;
      d[i] = (p[0] + p[1] + p[2] + p[3] + p[4] + p[5] + p[6] + w * 0.5362) * 0.11;
      p[6] = w * 0.115926;
    }
  }
  const s = c.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  return s;
}

export const wake = () => {
  ctx ??= new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
};

export const playing = () => cur?.id;
export const getActivePreset = () => PRESETS.find(p => p.id === cur?.id) || null;

export function getAnalyser() {
  return analyser;
}

export function play(p, vol = 0.5) {
  stop();
  wake();

  const out = ctx.createGain();
  const src = [];
  out.gain.value = vol;

  // Analyser node for live visualizer
  if (!analyser) {
    analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.8;
  }
  out.connect(analyser);
  analyser.connect(ctx.destination);

  const tone = (f, pan, g) => {
    const o = ctx.createOscillator();
    const pn = ctx.createStereoPanner();
    const gn = ctx.createGain();
    o.frequency.value = f;
    pn.pan.value = pan;
    gn.gain.value = g;
    o.connect(gn);
    gn.connect(pn);
    pn.connect(out);
    o.start();
    src.push(o);
    return gn;
  };

  // Binaural frequency pair (Left / Right stereo split)
  if (p.L) {
    tone(p.L, -1, 0.22);
    tone(p.L + p.B, 1, 0.22);
  }

  // Harmonic overtones / Solfeggio additions
  for (const [f, g, l] of p.x || []) {
    const gn = tone(f, 0, g);
    if (l) {
      const o = ctx.createOscillator();
      const k = ctx.createGain();
      o.frequency.value = l;
      k.gain.value = g * 0.8;
      o.connect(k);
      k.connect(gn.gain);
      o.start();
      src.push(o);
    }
  }

  // Synthesized organic noise layer
  if (p.N) {
    const s = createNoise(ctx, p.N);
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    f.type = 'lowpass';
    f.frequency.value = p.lp || 14000;
    g.gain.value = p.ng;
    s.connect(f);
    f.connect(g);
    g.connect(out);
    s.start();
    src.push(s);
  }

  cur = { id: p.id, src, out };
}

export const setVol = (v) => {
  if (cur?.out) {
    cur.out.gain.cancelScheduledValues(ctx.currentTime);
    cur.out.gain.setValueAtTime(v, ctx.currentTime);
  }
};

export function stop() {
  if (sleepTimeout) {
    clearTimeout(sleepTimeout);
    sleepTimeout = null;
  }
  if (!cur) return;
  const { src, out } = cur;
  cur = null;
  if (ctx) {
    out.gain.cancelScheduledValues(ctx.currentTime);
    out.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
  }
  setTimeout(() => {
    src.forEach(s => {
      try { s.stop(); } catch {}
    });
    try { out.disconnect(); } catch {}
  }, 350);
}

export function setSleepTimer(minutes, onEnd) {
  if (sleepTimeout) clearTimeout(sleepTimeout);
  if (!minutes || minutes <= 0) return;
  sleepTimeout = setTimeout(() => {
    stop();
    if (onEnd) onEnd();
  }, minutes * 60000);
}

export function chime() {
  wake();
  [528, 660, 880].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const t = ctx.currentTime + i * 0.18;
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + 1.25);
  });
}

export function breatheCue(phase = 'inhale') {
  wake();
  const freq = phase === 'inhale' ? 440 : phase === 'hold' ? 554.37 : 330;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const t = ctx.currentTime;
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(t);
  o.stop(t + 0.95);
}

