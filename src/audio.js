// ProdZ Acoustic Engine: 100% local Web Audio synthesis.
// Zero network, zero samples downloaded. Specially voiced with warm analog filters,
// gentle harmonic chords, and subtle brainwave entrainment to replace harsh alien tones
// with lush, pleasant, and deeply comforting soundscapes.

let ctx, cur, sleepTimeout;
let analyser;

export const PRESETS = [
  {
    id: 'focus_gamma',
    n: 'Velvet Focus (40 Hz Gamma)',
    cat: 'Focus',
    d: 'Warm ambient chord in C-minor with subtle 40 Hz gamma pulse for laser focus without ear fatigue',
    type: 'pad_binaural',
    chord: [130.81, 196.00, 246.94, 293.66], // C3, G3, B3, D4 (maj9)
    filterFreq: 480,
    carrier: 140,
    beat: 40,
    noiseType: 'pink',
    noiseVol: 0.02,
    lfoSpeed: 0.1,
  },
  {
    id: 'study_beta',
    n: 'Study Sanctuary (14 Hz Beta)',
    cat: 'Focus',
    d: 'Grounding 432 Hz harmonic fifths with gentle 14 Hz beta pulse for sustained reading & memory',
    type: 'pad_binaural',
    chord: [108.00, 162.00, 216.00, 324.00], // 432 Hz Pythagorean sub-harmonics
    filterFreq: 520,
    carrier: 162,
    beat: 14,
    noiseType: 'brown',
    noiseVol: 0.03,
    lfoSpeed: 0.08,
  },
  {
    id: 'ocean_surf',
    n: 'Pacific Ocean Swell',
    cat: 'Nature',
    d: 'Procedural ocean surf with natural 12-second rhythmic waves crashing and receding',
    type: 'ocean',
    wavePeriod: 12,
  },
  {
    id: 'forest_rain',
    n: 'Gentle Forest Rain',
    cat: 'Nature',
    d: 'Soothing rainfall on leaves with warm acoustic low-pass filtering and distant thunder hum',
    type: 'rain',
  },
  {
    id: 'alpha_calm',
    n: 'Alpha Meadow (10 Hz Alpha)',
    cat: 'Calm',
    d: 'Dreamy, floating ambient pad with 10 Hz alpha wave to dissolve cognitive tension and fatigue',
    type: 'pad_binaural',
    chord: [146.83, 220.00, 293.66, 369.99], // D3, A3, D4, F#4
    filterFreq: 420,
    carrier: 146.83,
    beat: 10,
    lfoSpeed: 0.07,
  },
  {
    id: 'theta_om',
    n: 'Earth Meditation (6 Hz Theta)',
    cat: 'Calm',
    d: 'Sacred 136.1 Hz Earth Om chord with gentle 6 Hz theta pulse for deep intuitive problem-solving',
    type: 'pad_binaural',
    chord: [136.10, 204.15, 272.20], // 136.1 Hz Earth tone harmonics
    filterFreq: 380,
    carrier: 136.1,
    beat: 6,
    noiseType: 'brown',
    noiseVol: 0.02,
    lfoSpeed: 0.05,
  },
  {
    id: 'solfeggio_harmony',
    n: 'Celestial 528 Hz Healing',
    cat: 'Calm',
    d: 'Lush, shimmering triad chord of 396 Hz, 528 Hz, and 639 Hz with slow choral breathing',
    type: 'celestial',
    freqs: [396, 528, 639],
  },
  {
    id: 'delta_sleep',
    n: 'Warm Hearth & Delta (2.5 Hz)',
    cat: 'Sleep',
    d: 'Deep, enveloping brown noise with 2.5 Hz delta undercurrent and warm low-end warmth',
    type: 'pad_binaural',
    chord: [98.00, 147.00], // G2, D3
    filterFreq: 260,
    carrier: 98,
    beat: 2.5,
    noiseType: 'brown',
    noiseVol: 0.25,
    lfoSpeed: 0.04,
  },
  {
    id: 'brown_warm',
    n: 'Velvet Brown Noise',
    cat: 'Noise',
    d: 'Silky, deep atmospheric drone that blocks office voices and outside traffic',
    type: 'pure_noise',
    noiseType: 'brown',
    filterFreq: 320,
  },
  {
    id: 'pink_warm',
    n: 'Soft Rainfall Pink Noise',
    cat: 'Noise',
    d: 'Smooth, balanced pink spectrum tailored for masking distractions without high-pitch hiss',
    type: 'pure_noise',
    noiseType: 'pink',
    filterFreq: 1400,
  },
];

/* ── Buffer Noise Generators ── */
function createNoiseBuffer(c, type) {
  const sampleRate = c.sampleRate;
  const length = sampleRate * 5; // 5-second seamless loop
  const buffer = c.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  let lastOut = 0;

  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;

    if (type === 'brown') {
      // True 6dB/octave brown noise integration
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.2;
    } else {
      // Paul Kellet's refined Pink Noise algorithm
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }

  const source = c.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

export const wake = () => {
  ctx ??= new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
};

export const playing = () => cur?.id;
export const getActivePreset = () => PRESETS.find(p => p.id === cur?.id) || null;
export const getAnalyser = () => analyser;

/* ══════════════════════════════════════════════════════════════
   PLAY ENGINE: Beautiful, Pleasant Acoustic & Ambient Voicings
   ══════════════════════════════════════════════════════════════ */
export function play(preset, vol = 0.5) {
  stop();
  wake();

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  // Smooth pleasant fade-in over 1.2s to prevent click / abrupt blast
  master.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol), now + 1.2);

  // Setup Live Analyser Node
  if (!analyser) {
    analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.82;
  }
  master.connect(analyser);
  analyser.connect(ctx.destination);

  const activeNodes = [];

  // Helper to add node for cleanup
  const register = (node) => {
    activeNodes.push(node);
    return node;
  };

  /* ── 1. PROCEDURAL OCEAN SURF ── */
  if (preset.type === 'ocean') {
    const noise = register(createNoiseBuffer(ctx, 'brown'));

    // Resonant sweep filter that mimics wave swelling and breaking
    const waveFilter = register(ctx.createBiquadFilter());
    waveFilter.type = 'lowpass';
    waveFilter.frequency.setValueAtTime(220, now);
    waveFilter.Q.setValueAtTime(2.2, now);

    // Filter LFO (ocean period ~12s)
    const filterLfo = register(ctx.createOscillator());
    const filterLfoGain = register(ctx.createGain());
    filterLfo.frequency.setValueAtTime(1 / preset.wavePeriod, now);
    filterLfoGain.gain.setValueAtTime(260, now); // sweeps from ~150Hz to ~500Hz
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(waveFilter.frequency);
    filterLfo.start(now);

    // Wave amplitude swelling LFO
    const swellGain = register(ctx.createGain());
    swellGain.gain.setValueAtTime(0.15, now);
    const ampLfo = register(ctx.createOscillator());
    const ampLfoGain = register(ctx.createGain());
    ampLfo.frequency.setValueAtTime(1 / preset.wavePeriod, now);
    ampLfoGain.gain.setValueAtTime(0.2, now);
    ampLfo.connect(ampLfoGain);
    ampLfoGain.connect(swellGain.gain);
    ampLfo.start(now);

    noise.connect(waveFilter);
    waveFilter.connect(swellGain);
    swellGain.connect(master);
    noise.start(now);
  }

  /* ── 2. PROCEDURAL GENTLE RAIN ── */
  else if (preset.type === 'rain') {
    const noise1 = register(createNoiseBuffer(ctx, 'pink'));
    const noise2 = register(createNoiseBuffer(ctx, 'brown'));

    const rainFilter = register(ctx.createBiquadFilter());
    rainFilter.type = 'bandpass';
    rainFilter.frequency.setValueAtTime(900, now);
    rainFilter.Q.setValueAtTime(0.8, now);

    const rainGain = register(ctx.createGain());
    rainGain.gain.setValueAtTime(0.22, now);

    const rumbleFilter = register(ctx.createBiquadFilter());
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(180, now);

    const rumbleGain = register(ctx.createGain());
    rumbleGain.gain.setValueAtTime(0.12, now);

    noise1.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(master);
    noise1.start(now);

    noise2.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(master);
    noise2.start(now);
  }

  /* ── 3. PURE SMOOTH WARM NOISE ── */
  else if (preset.type === 'pure_noise') {
    const noise = register(createNoiseBuffer(ctx, preset.noiseType));
    const filter = register(ctx.createBiquadFilter());
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(preset.filterFreq, now);

    const gain = register(ctx.createGain());
    gain.gain.setValueAtTime(preset.noiseType === 'brown' ? 0.35 : 0.22, now);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    noise.start(now);
  }

  /* ── 4. CELESTIAL SOLFEGGIO CHORDS ── */
  else if (preset.type === 'celestial') {
    // Beautiful, shimmering multi-frequency choral soundscape
    preset.freqs.forEach((freq, i) => {
      // Soft fundamental sine
      const osc = register(ctx.createOscillator());
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Warm lowpass
      const filter = register(ctx.createBiquadFilter());
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 1.5, now);

      // Stereo spread
      const panner = register(ctx.createStereoPanner());
      panner.pan.setValueAtTime(i === 0 ? -0.4 : i === 1 ? 0 : 0.4, now);

      // Individual slow breathing shimmer
      const gain = register(ctx.createGain());
      gain.gain.setValueAtTime(0.08, now);

      const lfo = register(ctx.createOscillator());
      const lfoGain = register(ctx.createGain());
      lfo.frequency.setValueAtTime(0.06 + i * 0.02, now);
      lfoGain.gain.setValueAtTime(0.03, now);
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start(now);

      osc.connect(filter);
      filter.connect(panner);
      panner.connect(gain);
      gain.connect(master);
      osc.start(now);
    });
  }

  /* ── 5. WARM AMBIENT PAD WITH SUBTLE BINAURAL PULSE ── */
  else {
    // A. Lush Ambient Pad Chords (Warm Sine + Triangle with Low-pass)
    const chordGain = register(ctx.createGain());
    chordGain.gain.setValueAtTime(0.18, now);

    const padFilter = register(ctx.createBiquadFilter());
    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(preset.filterFreq || 450, now);
    padFilter.Q.setValueAtTime(1.2, now);

    // Subtle gentle breathing movement on the pad
    const padLfo = register(ctx.createOscillator());
    const padLfoGain = register(ctx.createGain());
    padLfo.frequency.setValueAtTime(preset.lfoSpeed || 0.08, now);
    padLfoGain.gain.setValueAtTime(0.04, now);
    padLfo.connect(padLfoGain);
    padLfoGain.connect(chordGain.gain);
    padLfo.start(now);

    (preset.chord || [130.81, 196.00, 246.94]).forEach((f, idx) => {
      // Warm blended sine and triangle waves
      const osc = register(ctx.createOscillator());
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, now);

      // Subtle detune for lush analog warmth
      osc.detune.setValueAtTime((idx - 1) * 3, now);

      const oscGain = register(ctx.createGain());
      oscGain.gain.setValueAtTime(0.12 / preset.chord.length, now);

      osc.connect(oscGain);
      oscGain.connect(padFilter);
      osc.start(now);
    });

    padFilter.connect(chordGain);
    chordGain.connect(master);

    // B. Subtle, Warm Binaural Beat Undercurrent (NOT harsh alien beeps!)
    if (preset.carrier && preset.beat) {
      const beatGain = register(ctx.createGain());
      // Subdued pleasant volume (0.04 instead of raw 0.22)
      beatGain.gain.setValueAtTime(0.04, now);

      const beatFilter = register(ctx.createBiquadFilter());
      beatFilter.type = 'lowpass';
      beatFilter.frequency.setValueAtTime(220, now); // strictly warm low frequencies

      // Left Ear
      const oscL = register(ctx.createOscillator());
      const panL = register(ctx.createStereoPanner());
      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(preset.carrier, now);
      panL.pan.setValueAtTime(-1, now);
      oscL.connect(panL);
      panL.connect(beatFilter);
      oscL.start(now);

      // Right Ear (Carrier + Beat Frequency)
      const oscR = register(ctx.createOscillator());
      const panR = register(ctx.createStereoPanner());
      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(preset.carrier + preset.beat, now);
      panR.pan.setValueAtTime(1, now);
      oscR.connect(panR);
      panR.connect(beatFilter);
      oscR.start(now);

      beatFilter.connect(beatGain);
      beatGain.connect(master);
    }

    // C. Optional Soft Noise Undercurrent
    if (preset.noiseType && preset.noiseVol) {
      const noise = register(createNoiseBuffer(ctx, preset.noiseType));
      const nFilter = register(ctx.createBiquadFilter());
      nFilter.type = 'lowpass';
      nFilter.frequency.setValueAtTime(500, now);

      const nGain = register(ctx.createGain());
      nGain.gain.setValueAtTime(preset.noiseVol, now);

      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(master);
      noise.start(now);
    }
  }

  cur = { id: preset.id, nodes: activeNodes, master };
}

export const setVol = (v) => {
  if (cur?.master) {
    cur.master.gain.cancelScheduledValues(ctx.currentTime);
    cur.master.gain.setValueAtTime(Math.max(0.0001, v), ctx.currentTime);
  }
};

export function stop() {
  if (sleepTimeout) {
    clearTimeout(sleepTimeout);
    sleepTimeout = null;
  }
  if (!cur) return;
  const { nodes, master } = cur;
  cur = null;

  if (ctx && master) {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(0.0001, now, 0.2); // Smooth 200ms fade-out
  }

  setTimeout(() => {
    nodes.forEach((n) => {
      try {
        if (typeof n.stop === 'function') n.stop();
        if (typeof n.disconnect === 'function') n.disconnect();
      } catch {}
    });
    try {
      master.disconnect();
    } catch {}
  }, 450);
}

export function setSleepTimer(minutes, onEnd) {
  if (sleepTimeout) clearTimeout(sleepTimeout);
  if (!minutes || minutes <= 0) return;
  sleepTimeout = setTimeout(() => {
    stop();
    if (onEnd) onEnd();
  }, minutes * 60000);
}

/* ── Pleasant Tibetan Singing Bowl Chime (Focus interval complete) ── */
export function chime() {
  wake();
  const now = ctx.currentTime;
  // A pleasant, warm pentatonic chime sequence: F4, A4, C5 (432 Hz Pythagorean tuned)
  [342, 432, 513].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const t = now + i * 0.16;

    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(f * 2.5, t);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6); // warm lingering decay

    o.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);

    o.start(t);
    o.stop(t + 1.7);
  });
}

/* ── Gentle Soft Tibetan Breath Cue ── */
export function breatheCue(phase = 'inhale') {
  wake();
  const now = ctx.currentTime;
  // Subtle, soft singing bowl resonance: Inhale (warm G4 392Hz), Hold (C5 523Hz), Exhale (C4 261Hz)
  const freq = phase === 'inhale' ? 392 : phase === 'hold' ? 440 : 261.63;

  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  o.type = 'sine';
  o.frequency.setValueAtTime(freq, now);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 2, now);

  // Very gentle volume: 0.08, long smooth decay
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.08, now + 0.06);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

  o.connect(filter);
  filter.connect(g);
  g.connect(ctx.destination);

  o.start(now);
  o.stop(now + 1.45);
}
