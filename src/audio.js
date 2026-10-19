// ProdZ Acoustic Engine: 100% local Web Audio synthesis.
// Zero network, zero external samples. Voiced with warm analog-modeled filters,
// musical harmonic intervals, and subtle brainwave entrainment to provide
// soothing, pleasant, and audible soundscapes with ZERO high-pitched harshness or headache.

let ctx, cur, sleepTimeout;
let analyser;

export const PRESETS = [
  {
    id: 'focus_gamma',
    n: 'Velvet Focus (40 Hz Gamma)',
    cat: 'Focus',
    d: 'Warm D-major ambient pad with subtle 40 Hz gamma pulse for deep work and high cognition without ear fatigue',
    chord: [146.83, 185.00, 220.00, 293.66], // D3, F#3, A3, D4
    filterFreq: 460,
    carrier: 220,
    beat: 40,
    noiseType: 'pink',
    noiseVol: 0.015,
    lfoSpeed: 0.09,
    type: 'pad_binaural',
  },
  {
    id: 'study_beta',
    n: 'Study Sanctuary (14 Hz Beta)',
    cat: 'Focus',
    d: 'Grounding 432 Hz Pythagorean fifths with gentle 14 Hz beta wave for reading retention and mental clarity',
    chord: [108.00, 162.00, 216.00, 324.00], // Sub-octaves of 432 Hz
    filterFreq: 480,
    carrier: 216,
    beat: 14,
    noiseType: 'brown',
    noiseVol: 0.02,
    lfoSpeed: 0.07,
    type: 'pad_binaural',
  },
  {
    id: 'ocean_surf',
    n: 'Pacific Ocean Waves',
    cat: 'Nature',
    d: 'Rhythmic, natural ocean surf with 10-second wave swells crashing and receding gently on the shore',
    type: 'ocean',
    wavePeriod: 10,
  },
  {
    id: 'forest_rain',
    n: 'Gentle Forest Rain',
    cat: 'Nature',
    d: 'Cozy, soft rainfall filtered to remove harsh hiss, layered with distant ambient low-frequency warmth',
    type: 'rain',
  },
  {
    id: 'alpha_calm',
    n: 'Alpha Meadow (10 Hz Alpha)',
    cat: 'Calm',
    d: 'Warm, floating Fsus2 ambient pad with 10 Hz alpha pulse to ease stress and restore creative clarity',
    chord: [174.61, 220.00, 261.63, 349.23], // F3, A3, C4, F4
    filterFreq: 420,
    carrier: 220,
    beat: 10,
    lfoSpeed: 0.08,
    type: 'pad_binaural',
  },
  {
    id: 'solfeggio_528',
    n: 'Solfeggio 528 Hz Warmth',
    cat: 'Calm',
    d: 'Warm, choral C-major chord grounded in soothing low octaves (132 Hz & 264 Hz) with subtle, soft 528 Hz overtone',
    type: 'solfeggio_warm',
  },
  {
    id: 'theta_om',
    n: 'Earth Om Meditation (6 Hz Theta)',
    cat: 'Calm',
    d: 'Sacred 136.1 Hz Earth vibration with resonant octave and gentle 6 Hz theta pulse for deep intuitive calm',
    chord: [136.10, 204.15, 272.20], // Earth Om harmonic triad
    filterFreq: 380,
    carrier: 136.1,
    beat: 6,
    noiseType: 'brown',
    noiseVol: 0.02,
    lfoSpeed: 0.05,
    type: 'pad_binaural',
  },
  {
    id: 'delta_sleep',
    n: 'Delta Night Rest (2.5 Hz Delta)',
    cat: 'Sleep',
    d: 'Audible, warm open-fifth drone (C3 & G3) layered with comforting brown noise and 2.5 Hz delta hum',
    chord: [130.81, 196.00, 261.63], // C3, G3, C4 (clearly audible on all speakers)
    filterFreq: 340,
    carrier: 196,
    beat: 2.5,
    noiseType: 'brown',
    noiseVol: 0.15,
    lfoSpeed: 0.04,
    type: 'pad_binaural',
  },
  {
    id: 'brown_warm',
    n: 'Velvet Brown Noise',
    cat: 'Noise',
    d: 'Deep, warm atmospheric rumble that shields distractions with zero high-pitched static',
    type: 'pure_noise',
    noiseType: 'brown',
    filterFreq: 300,
  },
  {
    id: 'pink_warm',
    n: 'Soft Acoustic Pink Noise',
    cat: 'Noise',
    d: 'Smooth, balanced pink spectrum tailored for masking speech and background chatter',
    type: 'pure_noise',
    noiseType: 'pink',
    filterFreq: 950,
  },
];

/* ── Seamless Buffer Noise Generators ── */
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
   PLAY ENGINE: Soothing Acoustic & Psychoacoustic Voicings
   ══════════════════════════════════════════════════════════════ */
export function play(preset, vol = 0.5) {
  stop();
  wake();

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  // Smooth pleasant fade-in over 1.2s to prevent abrupt volume shock
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
  const register = (node) => {
    activeNodes.push(node);
    return node;
  };

  /* ── 1. PROCEDURAL OCEAN SURF (Rhythmic, Natural, Zero Harshness) ── */
  if (preset.type === 'ocean') {
    const noise = register(createNoiseBuffer(ctx, 'brown'));

    // Resonant sweep filter strictly kept between 140Hz and 420Hz (warm, zero harsh roaring)
    const waveFilter = register(ctx.createBiquadFilter());
    waveFilter.type = 'lowpass';
    waveFilter.frequency.setValueAtTime(220, now);
    waveFilter.Q.setValueAtTime(1.8, now);

    // Filter LFO (ocean period ~10s)
    const filterLfo = register(ctx.createOscillator());
    const filterLfoGain = register(ctx.createGain());
    filterLfo.frequency.setValueAtTime(1 / preset.wavePeriod, now);
    filterLfoGain.gain.setValueAtTime(180, now);
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(waveFilter.frequency);
    filterLfo.start(now);

    // Wave amplitude swelling LFO
    const swellGain = register(ctx.createGain());
    swellGain.gain.setValueAtTime(0.18, now);
    const ampLfo = register(ctx.createOscillator());
    const ampLfoGain = register(ctx.createGain());
    ampLfo.frequency.setValueAtTime(1 / preset.wavePeriod, now);
    ampLfoGain.gain.setValueAtTime(0.14, now);
    ampLfo.connect(ampLfoGain);
    ampLfoGain.connect(swellGain.gain);
    ampLfo.start(now);

    noise.connect(waveFilter);
    waveFilter.connect(swellGain);
    swellGain.connect(master);
    noise.start(now);
  }

  /* ── 2. PROCEDURAL GENTLE RAIN (Soft, Cozy, Filtered) ── */
  else if (preset.type === 'rain') {
    const pinkNoise = register(createNoiseBuffer(ctx, 'pink'));
    const brownNoise = register(createNoiseBuffer(ctx, 'brown'));

    // Soft rain droplets layer (warm bandpass at 650 Hz with gentle Q)
    const rainFilter = register(ctx.createBiquadFilter());
    rainFilter.type = 'bandpass';
    rainFilter.frequency.setValueAtTime(650, now);
    rainFilter.Q.setValueAtTime(0.7, now);

    const rainGain = register(ctx.createGain());
    rainGain.gain.setValueAtTime(0.18, now);

    // Warm distant low-frequency rain hum (lowpass at 180 Hz)
    const rumbleFilter = register(ctx.createBiquadFilter());
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(180, now);

    const rumbleGain = register(ctx.createGain());
    rumbleGain.gain.setValueAtTime(0.14, now);

    pinkNoise.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(master);
    pinkNoise.start(now);

    brownNoise.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(master);
    brownNoise.start(now);
  }

  /* ── 3. PURE SMOOTH WARM NOISE (Brown / Pink) ── */
  else if (preset.type === 'pure_noise') {
    const noise = register(createNoiseBuffer(ctx, preset.noiseType));
    const filter = register(ctx.createBiquadFilter());
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(preset.filterFreq, now);

    const gain = register(ctx.createGain());
    gain.gain.setValueAtTime(preset.noiseType === 'brown' ? 0.35 : 0.2, now);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    noise.start(now);
  }

  /* ── 4. SOLFEGGIO 528 HZ WARMTH (Pleasant, Soft Choral, Zero Screech) ── */
  else if (preset.type === 'solfeggio_warm') {
    // Solfeggio 528 Hz is voiced as a lush, warm C-major choir pad:
    // Grounded in warm, soothing low octaves (C3 132 Hz, C4 264 Hz, E4 330 Hz, G4 396 Hz)
    // 528 Hz is included as a whisper-soft overtone, NOT a loud piercing screech!
    const voices = [
      { f: 132.0, g: 0.12, pan: 0, type: 'sine' },      // C3 (Warm root foundation)
      { f: 264.0, g: 0.09, pan: -0.2, type: 'triangle' }, // C4 (Warm octave)
      { f: 330.0, g: 0.07, pan: 0.2, type: 'sine' },    // E4 (Major third warmth)
      { f: 396.0, g: 0.04, pan: -0.3, type: 'sine' },   // Solfeggio 396 Hz (Liberation frequency)
      { f: 528.0, g: 0.02, pan: 0.3, type: 'sine' },    // Solfeggio 528 Hz (Subtle soft overtone)
    ];

    const padFilter = register(ctx.createBiquadFilter());
    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(450, now); // strictly cut harsh high frequencies

    const padGain = register(ctx.createGain());
    padGain.gain.setValueAtTime(0.2, now);

    // Choral breathing LFO (slow 0.06 Hz pulse)
    const lfo = register(ctx.createOscillator());
    const lfoGain = register(ctx.createGain());
    lfo.frequency.setValueAtTime(0.06, now);
    lfoGain.gain.setValueAtTime(0.04, now);
    lfo.connect(lfoGain);
    lfoGain.connect(padGain.gain);
    lfo.start(now);

    voices.forEach((v, idx) => {
      const osc = register(ctx.createOscillator());
      osc.type = v.type;
      osc.frequency.setValueAtTime(v.f, now);
      // Subtle detune for lush organic texture
      osc.detune.setValueAtTime((idx - 2) * 2.5, now);

      const panner = register(ctx.createStereoPanner());
      panner.pan.setValueAtTime(v.pan, now);

      const vGain = register(ctx.createGain());
      vGain.gain.setValueAtTime(v.g, now);

      osc.connect(panner);
      panner.connect(vGain);
      vGain.connect(padFilter);
      osc.start(now);
    });

    padFilter.connect(padGain);
    padGain.connect(master);
  }

  /* ── 5. WARM AMBIENT PAD WITH SUBTLE BINAURAL PULSE ── */
  else {
    // A. Lush Warm Ambient Pad Chords (Sine + Triangle with Analog Lowpass)
    const chordGain = register(ctx.createGain());
    chordGain.gain.setValueAtTime(0.18, now);

    const padFilter = register(ctx.createBiquadFilter());
    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(preset.filterFreq || 440, now);
    padFilter.Q.setValueAtTime(1.1, now);

    // Gentle breathing movement on the pad
    const padLfo = register(ctx.createOscillator());
    const padLfoGain = register(ctx.createGain());
    padLfo.frequency.setValueAtTime(preset.lfoSpeed || 0.08, now);
    padLfoGain.gain.setValueAtTime(0.035, now);
    padLfo.connect(padLfoGain);
    padLfoGain.connect(chordGain.gain);
    padLfo.start(now);

    const chord = preset.chord || [146.83, 220.00, 293.66];
    chord.forEach((f, idx) => {
      const osc = register(ctx.createOscillator());
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, now);

      // Analog detuning for rich acoustic warmth
      osc.detune.setValueAtTime((idx - 1) * 3, now);

      const oscGain = register(ctx.createGain());
      oscGain.gain.setValueAtTime(0.11 / chord.length, now);

      osc.connect(oscGain);
      oscGain.connect(padFilter);
      osc.start(now);
    });

    padFilter.connect(chordGain);
    chordGain.connect(master);

    // B. Subtle, Warm Binaural Beat (Soft, pleasant, non-headache)
    if (preset.carrier && preset.beat) {
      const beatGain = register(ctx.createGain());
      beatGain.gain.setValueAtTime(0.035, now); // Soft, comfortable level

      const beatFilter = register(ctx.createBiquadFilter());
      beatFilter.type = 'lowpass';
      beatFilter.frequency.setValueAtTime(260, now); // strictly warm low frequencies

      // Left Ear
      const oscL = register(ctx.createOscillator());
      const panL = register(ctx.createStereoPanner());
      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(preset.carrier, now);
      panL.pan.setValueAtTime(-0.85, now);
      oscL.connect(panL);
      panL.connect(beatFilter);
      oscL.start(now);

      // Right Ear (Carrier + Beat Frequency)
      const oscR = register(ctx.createOscillator());
      const panR = register(ctx.createStereoPanner());
      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(preset.carrier + preset.beat, now);
      panR.pan.setValueAtTime(0.85, now);
      oscR.connect(panR);
      panR.connect(beatFilter);
      oscR.start(now);

      beatFilter.connect(beatGain);
      beatGain.connect(master);
    }

    // C. Soft Noise Bed
    if (preset.noiseType && preset.noiseVol) {
      const noise = register(createNoiseBuffer(ctx, preset.noiseType));
      const nFilter = register(ctx.createBiquadFilter());
      nFilter.type = 'lowpass';
      nFilter.frequency.setValueAtTime(400, now);

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

/* ── Pleasant Tibetan Meditation Chime (Focus interval complete) ── */
export function chime() {
  wake();
  const now = ctx.currentTime;
  // A warm, soothing pentatonic chime sequence: C4 (261 Hz), E4 (330 Hz), G4 (392 Hz)
  [261.63, 329.63, 392.00].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const t = now + i * 0.18;

    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(f * 2.2, t);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8); // warm lingering decay

    o.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);

    o.start(t);
    o.stop(t + 1.85);
  });
}

/* ── Gentle Soft Tibetan Breath Cue ── */
export function breatheCue(phase = 'inhale') {
  wake();
  const now = ctx.currentTime;
  // Subtle, soft singing bowl resonance: Inhale (E4 330Hz), Hold (G4 392Hz), Exhale (C4 261.6Hz)
  const freq = phase === 'inhale' ? 329.63 : phase === 'hold' ? 392.00 : 261.63;

  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  o.type = 'sine';
  o.frequency.setValueAtTime(freq, now);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 1.8, now);

  // Very gentle volume: 0.07, long smooth decay
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.07, now + 0.06);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

  o.connect(filter);
  filter.connect(g);
  g.connect(ctx.destination);

  o.start(now);
  o.stop(now + 1.55);
}
