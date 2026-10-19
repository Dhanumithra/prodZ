// ProdZ Generative Music & Acoustic Engine: 100% local Web Audio synthesis.
// Zero streaming, zero external audio files. Generates real, peaceful, melodic
// study music (lo-fi piano, acoustic kalimba, ambient chord progressions, soothing rain)
// with scientifically embedded brainwave entrainment (40Hz Gamma, 14Hz Beta, 10Hz Alpha).

let ctx, cur, sleepTimeout;
let analyser;

// Musical Note Frequency Map (Hz)
const N = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00,
};

export const PRESETS = [
  {
    id: 'lofi_study_piano',
    n: 'Lo-Fi Study Piano (14 Hz Beta)',
    cat: 'Focus',
    d: 'Peaceful electric piano playing soothing study melodies in A-minor over a warm vinyl crackle with 14 Hz beta wave',
    type: 'music',
    style: 'piano',
    scale: [N.A3, N.C4, N.D4, N.E4, N.G4, N.A4, N.C5, N.D5, N.E5],
    chords: [
      [N.A2, N.E3, N.C4, N.E4], // Am
      [N.F2, N.C3, N.A3, N.C4], // Fmaj7
      [N.C2, N.G2, N.E3, N.G3], // C
      [N.G2, N.D3, N.B3, N.D4], // G
    ],
    carrier: 216,
    beat: 14,
    tempoMs: 1600,
    ambient: 'vinyl',
  },
  {
    id: 'deep_flow_ambient',
    n: 'Deep Flow Ambient (40 Hz Gamma)',
    cat: 'Focus',
    d: 'Cinematic ambient piano & warm evolving pads playing deep concentration progressions with 40 Hz gamma flow',
    type: 'music',
    style: 'piano_ambient',
    scale: [N.D3, N.F3, N.A3, N.C4, N.D4, N.F4, N.A4, N.C5],
    chords: [
      [N.D2, N.A2, N.F3, N.C4], // Dm7
      [N.B2, N.F3, N.A3, N.D4], // Bbmaj7
      [N.G2, N.D3, N.B3, N.F4], // Gm7
      [N.A2, N.E3, N.C4, N.G4], // Am7
    ],
    carrier: 220,
    beat: 40,
    tempoMs: 2200,
    ambient: 'subtle_pink',
  },
  {
    id: 'rainy_study',
    n: 'Rainy Day Cafe Piano',
    cat: 'Focus',
    d: 'Melodic, cozy jazz piano chords and floating notes accompanied by gentle falling rain on a window',
    type: 'music',
    style: 'piano',
    scale: [N.C4, N.D4, N.E4, N.G4, N.A4, N.C5, N.D5],
    chords: [
      [N.C3, N.G3, N.E4, N.B4], // Cmaj7
      [N.A2, N.E3, N.C4, N.G4], // Am7
      [N.D3, N.A3, N.F4, N.C5], // Dm7
      [N.G2, N.D3, N.F4, N.B4], // G7
    ],
    carrier: 216,
    beat: 14,
    tempoMs: 1800,
    ambient: 'rain',
  },
  {
    id: 'zen_kalimba',
    n: 'Zen Garden Kalimba (10 Hz Alpha)',
    cat: 'Calm',
    d: 'Clear, peaceful acoustic music box & thumb piano notes playing mindful pentatonic patterns to melt stress away',
    type: 'music',
    style: 'kalimba',
    scale: [N.G3, N.A3, N.C4, N.D4, N.E4, N.G4, N.A4, N.C5],
    chords: [
      [N.C3, N.G3, N.E4], // C
      [N.G2, N.D3, N.B3], // G
      [N.A2, N.E3, N.C4], // Am
      [N.F2, N.C3, N.A3], // F
    ],
    carrier: 220,
    beat: 10,
    tempoMs: 1500,
    ambient: 'air',
  },
  {
    id: 'ocean_piano',
    n: 'Ocean Waves & Piano (Alpha)',
    cat: 'Nature',
    d: 'Gentle, drifting piano notes washing in and out alongside natural rhythmic Pacific surf',
    type: 'music',
    style: 'piano_ambient',
    scale: [N.F3, N.G3, N.A3, N.C4, N.D4, N.F4, N.A4, N.C5],
    chords: [
      [N.F2, N.C3, N.A3, N.E4], // Fmaj7
      [N.D2, N.A2, N.F3, N.C4], // Dm7
      [N.B2, N.F3, N.D4, N.A4], // Bbmaj7
      [N.C3, N.G3, N.E4, N.B4], // Cmaj7
    ],
    carrier: 220,
    beat: 10,
    tempoMs: 2200,
    ambient: 'ocean',
  },
  {
    id: 'solfeggio_bells',
    n: 'Celestial 528 Hz Chimes & Pad',
    cat: 'Calm',
    d: 'Soothing crystal singing bowls and gentle bell arpeggios voiced in harmonious 528 Hz and 432 Hz scales',
    type: 'music',
    style: 'bells',
    scale: [N.C4, N.D4, N.E4, N.G4, N.A4, N.C5, 528.0],
    chords: [
      [N.C3, N.G3, N.C4, N.E4], // C
      [N.F2, N.C3, N.A3, N.C4], // F
      [N.A2, N.E3, N.C4, N.E4], // Am
      [N.G2, N.D3, N.B3, N.D4], // G
    ],
    carrier: 264,
    beat: 6,
    tempoMs: 2000,
    ambient: 'crystal',
  },
  {
    id: 'theta_meditation',
    n: 'Temple Meditation Flute (6 Hz Theta)',
    cat: 'Calm',
    d: 'Soothing Asian temple flute tones and Tibetan bowl drones for deep creative contemplation and stress release',
    type: 'music',
    style: 'flute',
    scale: [N.D3, N.F3, N.G3, N.A3, N.C4, N.D4],
    chords: [
      [N.D2, N.A2, N.F3],
      [N.G2, N.D3, N.B3],
      [N.A2, N.E3, N.C4],
    ],
    carrier: 136.1,
    beat: 6,
    tempoMs: 2400,
    ambient: 'temple',
  },
  {
    id: 'midnight_lullaby',
    n: 'Midnight Lullaby Harp (2.5 Hz Delta)',
    cat: 'Sleep',
    d: 'Whisper-soft, slow acoustic harp notes and warm hearth rumble for drifting peacefully to sleep',
    type: 'music',
    style: 'kalimba',
    scale: [N.C3, N.E3, N.G3, N.A3, N.C4, N.E4, N.G4],
    chords: [
      [N.C2, N.G2, N.E3],
      [N.F2, N.C3, N.A3],
      [N.A2, N.E3, N.C4],
      [N.G2, N.D3, N.B3],
    ],
    carrier: 196,
    beat: 2.5,
    tempoMs: 2800,
    ambient: 'hearth',
  },
  {
    id: 'brown_warm',
    n: 'Velvet Brown Noise',
    cat: 'Noise',
    d: 'Deep, warm atmospheric rumble that shields distractions with zero high-pitched static',
    type: 'noise',
    noiseType: 'brown',
    filterFreq: 320,
  },
  {
    id: 'pink_warm',
    n: 'Soft Acoustic Pink Noise',
    cat: 'Noise',
    d: 'Smooth, balanced pink spectrum tailored for masking speech and background chatter',
    type: 'noise',
    noiseType: 'pink',
    filterFreq: 950,
  },
];

/* ── Seamless Buffer Noise Generator ── */
function createNoiseBuffer(c, type) {
  const sampleRate = c.sampleRate;
  const length = sampleRate * 5;
  const buffer = c.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  let lastOut = 0;

  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    if (type === 'brown') {
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.2;
    } else {
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
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
};

export const playing = () => cur?.id;
export const getActivePreset = () => PRESETS.find(p => p.id === cur?.id) || null;
export const getAnalyser = () => analyser;

/* ══════════════════════════════════════════════════════════════
   INSTRUMENT SYNTHESIZERS (Rhodes Piano, Kalimba, Chimes, Flute)
   Audible, Punchy, Warm Acoustic Voicings
   ══════════════════════════════════════════════════════════════ */
function playInstrumentNote(c, dest, freq, time, duration = 2.0, style = 'piano', velocity = 0.8) {
  const masterNoteGain = c.createGain();
  masterNoteGain.gain.setValueAtTime(0.0001, time);
  masterNoteGain.connect(dest);

  if (style === 'piano' || style === 'piano_ambient') {
    // 🎹 Warm Electric / Felt Piano
    const osc1 = c.createOscillator();
    const osc2 = c.createOscillator();
    const tine = c.createOscillator();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq, time);
    osc2.detune.setValueAtTime(3.0, time); // warm stereo chorus

    tine.type = 'sine';
    tine.frequency.setValueAtTime(freq * 3, time);

    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(1400, freq * 4.0), time);
    filter.frequency.exponentialRampToValueAtTime(Math.max(240, freq * 1.4), time + duration * 0.7);

    const osc1Gain = c.createGain();
    const osc2Gain = c.createGain();
    const tineGain = c.createGain();

    // CLEAR, AUDIBLE VOLUME LEVELS
    osc1Gain.gain.setValueAtTime(0.45 * velocity, time);
    osc2Gain.gain.setValueAtTime(0.25 * velocity, time);
    tineGain.gain.setValueAtTime(0.08 * velocity, time);
    tineGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);

    osc1.connect(osc1Gain);
    osc2.connect(osc2Gain);
    tine.connect(tineGain);

    osc1Gain.connect(filter);
    osc2Gain.connect(filter);
    tineGain.connect(filter);
    filter.connect(masterNoteGain);

    // Natural Piano Envelope
    masterNoteGain.gain.linearRampToValueAtTime(velocity * 0.85, time + 0.02);
    masterNoteGain.gain.exponentialRampToValueAtTime(velocity * 0.35, time + 0.3);
    masterNoteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc1.start(time);
    osc2.start(time);
    tine.start(time);

    osc1.stop(time + duration + 0.1);
    osc2.stop(time + duration + 0.1);
    tine.stop(time + duration + 0.1);
  } else if (style === 'kalimba' || style === 'bells') {
    // 🔔 Peaceful Kalimba / Crystal Bell
    const osc = c.createOscillator();
    const overtone = c.createOscillator();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(freq * 2.756, time);

    const oscGain = c.createGain();
    const overtoneGain = c.createGain();

    oscGain.gain.setValueAtTime(0.45 * velocity, time);
    overtoneGain.gain.setValueAtTime(0.12 * velocity, time);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);

    osc.connect(oscGain);
    overtone.connect(overtoneGain);
    oscGain.connect(masterNoteGain);
    overtoneGain.connect(masterNoteGain);

    masterNoteGain.gain.linearRampToValueAtTime(velocity * 0.85, time + 0.01);
    masterNoteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration * 1.2);

    osc.start(time);
    overtone.start(time);
    osc.stop(time + duration * 1.3);
    overtone.stop(time + duration * 1.3);
  } else {
    // 🪈 Temple Flute
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 2.5, time);

    const fGain = c.createGain();
    fGain.gain.setValueAtTime(0.4 * velocity, time);

    osc.connect(filter);
    filter.connect(fGain);
    fGain.connect(masterNoteGain);

    masterNoteGain.gain.linearRampToValueAtTime(velocity * 0.75, time + 0.1);
    masterNoteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.start(time);
    osc.stop(time + duration + 0.1);
  }
}

/* ══════════════════════════════════════════════════════════════
   PLAY ENGINE: Real Generative Melodic Music + Brainwave Waves
   ══════════════════════════════════════════════════════════════ */
export function play(preset, vol = 0.6) {
  stop();
  wake();

  const now = ctx.currentTime;
  const master = ctx.createGain();
  // Immediate audible volume, smoothly ramped over 0.2s (no 1.2s delay or silence!)
  master.gain.setValueAtTime(0.01, now);
  master.gain.linearRampToValueAtTime(Math.max(0.05, vol), now + 0.25);

  if (!analyser) {
    analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.82;
  }
  master.connect(analyser);
  analyser.connect(ctx.destination);

  const activeNodes = [];
  const curSession = {
    id: preset.id,
    nodes: activeNodes,
    master,
    musicTimer: null,
    active: true,
  };
  // CRUCIAL: Set cur immediately so the music loop starts running right away!
  cur = curSession;

  const register = (node) => {
    activeNodes.push(node);
    return node;
  };

  /* ── 1. REAL GENERATIVE PEACEFUL MUSIC ── */
  if (preset.type === 'music') {
    const musicBus = register(ctx.createGain());
    musicBus.gain.setValueAtTime(1.0, now);
    musicBus.connect(master);

    // A. Warm Background Pad Drone (Soft Sustained Chord Base)
    let chordIndex = 0;
    const padGain = register(ctx.createGain());
    padGain.gain.setValueAtTime(0.22, now);
    padGain.connect(musicBus);

    // B. Subtle Brainwave Entrainment Underneath Music
    if (preset.carrier && preset.beat) {
      const beatGain = register(ctx.createGain());
      beatGain.gain.setValueAtTime(0.04, now); // Soft, comfortable background presence

      const beatFilter = register(ctx.createBiquadFilter());
      beatFilter.type = 'lowpass';
      beatFilter.frequency.setValueAtTime(260, now);

      const oscL = register(ctx.createOscillator());
      const panL = register(ctx.createStereoPanner());
      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(preset.carrier, now);
      panL.pan.setValueAtTime(-0.85, now);
      oscL.connect(panL);
      panL.connect(beatFilter);
      oscL.start(now);

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

    // C. Natural Ambient Texture (Rain, Ocean, Vinyl Crackle)
    if (preset.ambient === 'rain') {
      const pNoise = register(createNoiseBuffer(ctx, 'pink'));
      const rFilter = register(ctx.createBiquadFilter());
      rFilter.type = 'bandpass';
      rFilter.frequency.setValueAtTime(650, now);
      rFilter.Q.setValueAtTime(0.7, now);
      const rGain = register(ctx.createGain());
      rGain.gain.setValueAtTime(0.18, now);
      pNoise.connect(rFilter);
      rFilter.connect(rGain);
      rGain.connect(master);
      pNoise.start(now);
    } else if (preset.ambient === 'ocean') {
      const bNoise = register(createNoiseBuffer(ctx, 'brown'));
      const oFilter = register(ctx.createBiquadFilter());
      oFilter.type = 'lowpass';
      oFilter.frequency.setValueAtTime(240, now);
      const oGain = register(ctx.createGain());
      oGain.gain.setValueAtTime(0.2, now);
      const oLfo = register(ctx.createOscillator());
      const oLfoGain = register(ctx.createGain());
      oLfo.frequency.setValueAtTime(0.09, now);
      oLfoGain.gain.setValueAtTime(160, now);
      oLfo.connect(oLfoGain);
      oLfoGain.connect(oFilter.frequency);
      oLfo.start(now);
      bNoise.connect(oFilter);
      oFilter.connect(oGain);
      oGain.connect(master);
      bNoise.start(now);
    } else if (preset.ambient === 'vinyl') {
      const bNoise = register(createNoiseBuffer(ctx, 'brown'));
      const vFilter = register(ctx.createBiquadFilter());
      vFilter.type = 'lowpass';
      vFilter.frequency.setValueAtTime(280, now);
      const vGain = register(ctx.createGain());
      vGain.gain.setValueAtTime(0.09, now);
      bNoise.connect(vFilter);
      vFilter.connect(vGain);
      vGain.connect(master);
      bNoise.start(now);
    }

    // D. Generative Music Melody Sequencer Loop
    const chords = preset.chords || [[N.C3, N.G3, N.E4]];
    const scale = preset.scale || [N.C4, N.D4, N.E4, N.G4, N.A4, N.C5];
    const tempo = preset.tempoMs || 1800;

    let step = 0;
    const playMusicalStep = () => {
      if (!curSession.active) return;
      const t = ctx.currentTime;

      // 1. Play Soft Background Chord Root & Harmony every 4 steps
      if (step % 4 === 0) {
        const chord = chords[chordIndex % chords.length];
        chordIndex++;
        chord.forEach((freq) => {
          playInstrumentNote(ctx, padGain, freq, t, 5.0, 'piano_ambient', 0.6);
        });
      }

      // 2. Play 1 or 2 Peaceful Melodic Notes
      const noteCount = Math.random() > 0.35 ? 1 : 2;
      for (let i = 0; i < noteCount; i++) {
        const noteDelay = i * (0.3 + Math.random() * 0.2);
        const randomNote = scale[Math.floor(Math.random() * scale.length)];
        const velocity = 0.75 + Math.random() * 0.3;
        const duration = 2.0 + Math.random() * 1.2;

        playInstrumentNote(ctx, musicBus, randomNote, t + noteDelay, duration, preset.style, velocity);
      }

      step++;
      const nextDelay = tempo * (0.85 + Math.random() * 0.3); // humanized breathing tempo
      curSession.musicTimer = setTimeout(playMusicalStep, nextDelay);
    };

    // Begin the peaceful music progression immediately!
    playMusicalStep();
  }

  /* ── 2. PURE SMOOTH WARM NOISE (Brown / Pink) ── */
  else {
    const noise = register(createNoiseBuffer(ctx, preset.noiseType));
    const filter = register(ctx.createBiquadFilter());
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(preset.filterFreq || 400, now);

    const gain = register(ctx.createGain());
    gain.gain.setValueAtTime(preset.noiseType === 'brown' ? 0.4 : 0.25, now);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    noise.start(now);
  }
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
  cur.active = false;
  if (cur.musicTimer) clearTimeout(cur.musicTimer);

  const { nodes, master } = cur;
  cur = null;

  if (ctx && master) {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(0.0001, now, 0.15); // Quick smooth fade-out
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

/* ── Pleasant Tibetan Meditation Chime (Focus interval complete) ── */
export function chime() {
  wake();
  const now = ctx.currentTime;
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
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);

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
  const freq = phase === 'inhale' ? 329.63 : phase === 'hold' ? 392.00 : 261.63;

  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  o.type = 'sine';
  o.frequency.setValueAtTime(freq, now);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 1.8, now);

  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.12, now + 0.06);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

  o.connect(filter);
  filter.connect(g);
  g.connect(ctx.destination);

  o.start(now);
  o.stop(now + 1.55);
}
