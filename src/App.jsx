import React, { useState, useEffect, useRef } from 'react';
import { get, set } from './db.js';
import { 
  PRESETS, 
  play, 
  stop, 
  setVol, 
  playing, 
  getActivePreset, 
  getAnalyser, 
  chime, 
  breatheCue, 
  wake, 
  setSleepTimer 
} from './audio.js';
import { QUOTES, MOVES, ACHIEVEMENTS } from './data.js';

const DEF = {
  tasks: [],
  sessions: [],
  cycle: 0,
  vol: 0.5,
  nudge: 0,
  activeTaskId: null,
  breatheAudio: true,
  set: { work: 25, short: 5, long: 15, goal: 25, auto: false },
  timer: { mode: 'work', running: false, left: 1500000, end: null },
};

const TABS = [
  { id: 'Focus', label: 'Focus', icon: '⏱️' },
  { id: 'Tasks', label: 'Tasks', icon: '📋' },
  { id: 'Sounds', label: 'Sounds', icon: '🎧' },
  { id: 'Streak', label: 'Streak', icon: '🔥' },
  { id: 'Breathe', label: 'Breathe', icon: '🌿' },
  { id: 'Move', label: 'Move', icon: '🧘' },
];

const pad = (n) => String(n).padStart(2, '0');
const dk = (t) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const hm = (m) => `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`;
const sum = (a) => a.reduce((x, s) => x + s.min, 0);
const num = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.round(+v) || lo));

/* ── One wake-up timer finish handler ── */
function finishTimer(setS) {
  chime();
  setS((s) => {
    const m = s.timer.mode;
    const isWork = m === 'work';
    const c = s.cycle + (isWork ? 1 : 0);
    const nx = isWork ? (c % 4 === 0 ? 'long' : 'short') : 'work';
    const ms = s.set[nx] * 60000;
    
    // Auto mark linked task complete if user wants or preserve
    return {
      ...s,
      cycle: c,
      sessions: isWork ? [...s.sessions, { end: Date.now(), min: s.set.work }] : s.sessions,
      timer: {
        mode: nx,
        running: s.set.auto,
        left: ms,
        end: s.set.auto ? Date.now() + ms : null,
      },
    };
  });

  if (window.Notification && Notification.permission === 'granted') {
    new Notification('ProdZ · Cycle Complete', {
      body: 'Your focus interval has finished. Great job staying present!',
      icon: '/icon.svg',
    });
  }
}

export default function App() {
  const [S, setS] = useState(null);
  const [tab, setTab] = useState('Focus');
  const [activeSound, setActiveSound] = useState(null);
  const [zenMode, setZenMode] = useState(false);
  const [showEcoModal, setShowEcoModal] = useState(false);
  const [sleepMin, setSleepMin] = useState(0);

  // Sync active sound id
  useEffect(() => {
    setActiveSound(playing());
  }, []);

  // Initialize from IndexedDB
  useEffect(() => {
    get('state').then((v) => {
      const s = {
        ...DEF,
        ...v,
        set: { ...DEF.set, ...v?.set },
      };
      const t = s.timer;
      if (t.running && Date.now() > t.end + 60000) {
        s.timer = { mode: t.mode, running: false, left: s.set[t.mode] * 60000, end: null };
      }
      setS(s);
    });
    navigator.storage?.persist?.();
  }, []);

  // Persist state changes
  useEffect(() => {
    if (!S) return;
    const id = setTimeout(() => set('state', S), 300);
    return () => clearTimeout(id);
  }, [S]);

  // Page visibility persistence
  useEffect(() => {
    const f = () => document.hidden && S && set('state', S);
    document.addEventListener('visibilitychange', f);
    return () => document.removeEventListener('visibilitychange', f);
  }, [S]);

  // Timer interval timeout
  const tm = S?.timer;
  useEffect(() => {
    if (!tm?.running) return;
    const msLeft = Math.max(0, tm.end - Date.now());
    const id = setTimeout(() => finishTimer(setS), msLeft);
    return () => clearTimeout(id);
  }, [tm?.running, tm?.end]);

  // Nudge interval
  useEffect(() => {
    const N = window.Notification;
    if (!S?.nudge || !N) return;
    const id = setInterval(() => {
      if (N.permission === 'granted') {
        new N('ProdZ · Stand & Stretch', {
          body: 'Gentle posture reminder: take 60 seconds to reset your body.',
          icon: '/icon.svg',
        });
      }
    }, S.nudge * 60000);
    return () => clearInterval(id);
  }, [S?.nudge]);

  if (!S) {
    return (
      <div className="boot">
        <div className="boot-spinner" />
        <span>ProdZ</span>
      </div>
    );
  }

  const now = new Date();
  const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
  const q = QUOTES[(now.getFullYear() * 365 + doy) % QUOTES.length];

  const exportBackup = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }));
    a.download = `prodz-backup-${dk(Date.now())}.json`;
    a.click();
  };

  const importBackup = (e) => {
    const f = e.target.files[0];
    if (f) {
      f.text().then((x) => {
        try {
          const d = JSON.parse(x);
          if (!Array.isArray(d.tasks)) throw new Error('Invalid structure');
          setS({ ...DEF, ...d, set: { ...DEF.set, ...d.set } });
          alert('Backup restored successfully!');
        } catch {
          alert('Invalid ProdZ backup file.');
        }
      });
    }
  };

  const handleSoundToggle = (preset) => {
    if (activeSound === preset.id) {
      stop();
      setActiveSound(null);
    } else {
      play(preset, S.vol);
      setActiveSound(preset.id);
    }
  };

  const handleSleepTimerChange = (min) => {
    setSleepMin(min);
    setSleepTimer(min, () => setActiveSound(null));
  };

  const P = { S, up: setS, activeSound, handleSoundToggle, setTab };

  const currentPreset = PRESETS.find((p) => p.id === activeSound);

  return (
    <div className="app">
      {/* ── App Header ── */}
      <header>
        <div className="header-inner">
          <div className="brand" onClick={() => setTab('Focus')}>
            <div className="logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
            <div className="logo-text">Prod<span>Z</span></div>
            <span className="eco-pill" onClick={(e) => { e.stopPropagation(); setShowEcoModal(true); }}>
              🌱 0g CO₂
            </span>
          </div>

          <nav>
            {TABS.map((t) => (
              <button
                key={t.id}
                className={t.id === tab ? 'on' : ''}
                onClick={() => setTab(t.id)}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          <div className="header-actions">
            {activeSound && (
              <button
                className="btn-sound-indicator"
                onClick={() => setTab('Sounds')}
                title="Sound playing · Click to manage"
              >
                <span className="dock-wave" style={{ height: 10 }}></span>
                <span>{currentPreset?.n.split(' ')[0] || 'Sound'}</span>
              </button>
            )}

            <button
              className="btn-icon"
              title="Zen / Fullscreen Mode"
              onClick={() => setZenMode(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Tab Router ── */}
      <main>
        {tab === 'Focus' && <FocusView {...P} />}
        {tab === 'Tasks' && <TasksView {...P} />}
        {tab === 'Sounds' && <SoundsView {...P} sleepMin={sleepMin} onSleepChange={handleSleepTimerChange} />}
        {tab === 'Streak' && <StreakView {...P} />}
        {tab === 'Breathe' && <BreatheView {...P} />}
        {tab === 'Move' && <MoveView {...P} />}
      </main>

      {/* ── Persistent Floating Audio Dock (Mini Player) ── */}
      {activeSound && currentPreset && (
        <div className="audio-dock">
          <div className="dock-sound-waves">
            <span className="dock-wave"></span>
            <span className="dock-wave"></span>
            <span className="dock-wave"></span>
            <span className="dock-wave"></span>
          </div>

          <div className="grow" style={{ minWidth: 120 }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#fff' }}>
              {currentPreset.n}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--tx-muted)' }}>
              Client-Synthesized Web Audio
            </div>
          </div>

          <div className="row" style={{ gap: 8 }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={S.vol}
              onChange={(e) => {
                const v = +e.target.value;
                setVol(v);
                setS((s) => ({ ...s, vol: v }));
              }}
              style={{ width: 70 }}
              title={`Volume ${Math.round(S.vol * 100)}%`}
            />

            <button
              className="primary"
              style={{ padding: '5px 12px', fontSize: '0.8rem', borderRadius: 999 }}
              onClick={() => handleSoundToggle(currentPreset)}
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* ── Zen Fullscreen Overlay ── */}
      {zenMode && (
        <div className="zen-overlay">
          <button className="secondary zen-exit-btn" onClick={() => setZenMode(false)}>
            Exit Zen Mode ✕
          </button>
          <div style={{ width: '100%', maxWidth: 440 }}>
            <FocusView {...P} isZen />
          </div>
        </div>
      )}

      {/* ── Eco & Sustainability Modal ── */}
      {showEcoModal && (
        <div className="zen-overlay" onClick={() => setShowEcoModal(false)}>
          <div className="card" style={{ maxWidth: 520, margin: 20 }} onClick={(e) => e.stopPropagation()}>
            <div className="section-head">
              <h2 className="section-title">🌱 Green Engineering Manifesto</h2>
              <button className="ghost" onClick={() => setShowEcoModal(false)}>✕</button>
            </div>
            <p className="note" style={{ marginBottom: 16 }}>
              Most modern web applications consume gigabytes of cloud bandwidth, background telemetry pings, and database roundtrips that burn fossil fuels. ProdZ is built differently:
            </p>
            <ul style={{ display: 'grid', gap: 10, listStyle: 'none', fontSize: '0.88rem' }}>
              <li className="row">
                <b style={{ color: 'var(--ac)', minWidth: 90 }}>100% Local:</b>
                <span>Zero backend servers. All tasks and timer telemetry stay in your browser's IndexedDB.</span>
              </li>
              <li className="row">
                <b style={{ color: 'var(--ac)', minWidth: 90 }}>Zero Cloud DSP:</b>
                <span>All binaural frequencies, tones, and noise profiles are generated in real-time by your device's audio chip. Zero streamed audio files.</span>
              </li>
              <li className="row">
                <b style={{ color: 'var(--ac)', minWidth: 90 }}>OLED Power:</b>
                <span>True-black dark palette reduces OLED display power consumption by up to 40%.</span>
              </li>
              <li className="row">
                <b style={{ color: 'var(--ac)', minWidth: 90 }}>Zero Tracking:</b>
                <span>No Google Analytics, no third-party trackers, no cookies. Completely private by architecture.</span>
              </li>
            </ul>
            <div className="row" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="primary" onClick={() => setShowEcoModal(false)}>Understood</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer>
        <div className="quote-card">
          <p className="quote">“{q[0]}” <span>— {q[1]}</span></p>
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row">
            <button className="ghost" onClick={exportBackup}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Export JSON
            </button>
            <label className="ghost file" style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              Import JSON
              <input type="file" accept="application/json" onChange={importBackup} hidden />
            </label>
          </div>
          <small style={{ color: 'var(--tx-dim)' }}>
            100% Client-Side · Private & Offline-First
          </small>
        </div>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   1. FOCUS VIEW (Pomodoro Timer + Linked Task + Telemetry)
   ══════════════════════════════════════════════════════════════ */
function FocusView({ S, up, isZen, setTab }) {
  const t = S.timer;
  const g = S.set;
  const [, tick] = useState(0);

  // High precision visual tick without heavy background CPU
  useEffect(() => {
    if (!t.running) return;
    let id;
    const f = () => {
      if (document.hidden) return;
      tick((n) => n + 1);
      id = setTimeout(f, 1000 - (Date.now() % 1000));
    };
    const v = () => {
      clearTimeout(id);
      f();
    };
    document.addEventListener('visibilitychange', v);
    f();
    return () => {
      clearTimeout(id);
      document.removeEventListener('visibilitychange', v);
    };
  }, [t.running, t.end]);

  const total = g[t.mode] * 60000;
  const left = t.running ? Math.max(0, t.end - Date.now()) : t.left;
  const sec = Math.ceil(left/1000);
  const R = 110;
  const C = 2 * Math.PI * R;
  const today = dk(Date.now());

  const start = () => {
    wake();
    const N = window.Notification;
    if (N?.permission === 'default') N.requestPermission();
    up((s) => ({
      ...s,
      timer: { ...s.timer, running: true, end: Date.now() + s.timer.left },
    }));
  };

  const pause = () =>
    up((s) => ({
      ...s,
      timer: {
        ...s.timer,
        running: false,
        left: Math.max(0, s.timer.end - Date.now()),
        end: null,
      },
    }));

  const mode = (m) =>
    up((s) => ({
      ...s,
      timer: { mode: m, running: false, left: s.set[m] * 60000, end: null },
    }));

  const cfg = (k, v) =>
    up((s) => ({
      ...s,
      set: { ...s.set, [k]: v },
      timer: !s.timer.running && s.timer.mode === k ? { ...s.timer, left: v * 60000 } : s.timer,
    }));

  // Linked task resolution
  const linkedTask = S.tasks.find((task) => task.id === S.activeTaskId);
  const activeTasks = S.tasks.filter((task) => !task.done);

  return (
    <div className="focus-container">
      {/* Mode Segment Chips */}
      <div className="chips" style={{ margin: '0 0 6px' }}>
        {[
          ['work', '🎯 Focus Sprint'],
          ['short', '☕ Short Break'],
          ['long', '🌴 Long Rest'],
        ].map(([m, l]) => (
          <button
            key={m}
            className={'chip' + (t.mode === m ? ' on' : '')}
            onClick={() => mode(m)}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Linked Task Indicator */}
      {linkedTask ? (
        <div className="linked-task-pill">
          <span>🎯 Focusing on:</span>
          <b>{linkedTask.title}</b>
          <button
            className="ghost"
            style={{ padding: '0 4px', fontSize: '0.75rem' }}
            onClick={() => up((s) => ({ ...s, activeTaskId: null }))}
            title="Unlink task"
          >
            ✕
          </button>
        </div>
      ) : activeTasks.length > 0 ? (
        <div className="row" style={{ fontSize: '0.84rem', color: 'var(--tx-muted)' }}>
          <span>Link a task:</span>
          <select
            value={S.activeTaskId || ''}
            onChange={(e) => up((s) => ({ ...s, activeTaskId: e.target.value || null }))}
            style={{ padding: '4px 10px', fontSize: '0.82rem' }}
          >
            <option value="">(No specific task)</option>
            {activeTasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {/* Circular Timer Ring with SVG Gradient */}
      <div className="clock">
        <svg viewBox="0 0 260 260" className="ring">
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <circle cx="130" cy="130" r={R} className="trk" />
          <circle
            cx="130"
            cy="130"
            r={R}
            className="bar"
            style={{
              strokeDasharray: C,
              strokeDashoffset: C * (1 - left / total),
            }}
          />
        </svg>

        <div className="time-box">
          <div className="time">
            {pad(Math.floor(sec / 60))}:{pad(sec % 60)}
          </div>
          <div className="time-status">
            {t.running ? (t.mode === 'work' ? 'Deep Work' : 'Break Time') : 'Paused'}
          </div>
        </div>
      </div>

      {/* Cycle Progress Dots */}
      <div className="cycle-dots">
        {[1, 2, 3, 4].map((i) => {
          const currentInCycle = (S.cycle % 4) || (S.cycle > 0 && S.cycle % 4 === 0 ? 4 : 0);
          return (
            <div
              key={i}
              className={`cycle-dot ${i <= currentInCycle ? 'active' : ''}`}
              title={`Sprint ${i} of 4`}
            />
          );
        })}
        <span className="cycle-label">
          Sprint {(S.cycle % 4) + 1} of 4
        </span>
      </div>

      {/* Primary Action Buttons */}
      <div className="controls-row">
        {t.running ? (
          <button className="primary btn-large" onClick={pause}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1"/>
              <rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
            Pause
          </button>
        ) : (
          <button className="primary btn-large" onClick={start}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            {left < total ? 'Resume' : 'Start Focus'}
          </button>
        )}

        <button className="secondary" onClick={() => mode(t.mode)}>
          Reset
        </button>
      </div>

      {/* Focus Telemetry Stats */}
      {!isZen && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <b>{hm(sum(S.sessions.filter((s) => dk(s.end) === today)))}</b>
              <span>Focused Today</span>
            </div>
            <div className="stat-card">
              <b>{hm(sum(S.sessions))}</b>
              <span>All-Time Focus</span>
            </div>
            <div className="stat-card">
              <b>{S.sessions.length}</b>
              <span>Sprints Completed</span>
            </div>
          </div>

          {/* Settings Customizer Card */}
          <div className="card" style={{ width: '100%', marginTop: 8 }}>
            <div className="section-head" style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Interval Settings</h3>
            </div>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              {[
                ['work', 'Focus Duration (min)', 25],
                ['short', 'Short Break (min)', 5],
                ['long', 'Long Break (min)', 15],
              ].map(([k, l]) => (
                <label key={k} className="fld" style={{ display: 'grid', gap: 4, fontSize: '0.82rem', color: 'var(--tx-muted)' }}>
                  {l}
                  <input
                    type="number"
                    min="1"
                    max="180"
                    defaultValue={g[k]}
                    key={g[k]}
                    onBlur={(e) => cfg(k, num(e.target.value, 1, 180))}
                    style={{ width: 100 }}
                  />
                </label>
              ))}
              <label className="row" style={{ cursor: 'pointer', fontSize: '0.86rem', color: 'var(--tx)' }}>
                <input
                  type="checkbox"
                  checked={g.auto}
                  onChange={(e) => cfg('auto', e.target.checked)}
                />
                Auto-start intervals
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   2. TASKS VIEW (Priority, Due Dates, Search & Focus Link)
   ══════════════════════════════════════════════════════════════ */
const W = { high: 3, medium: 2, low: 1, none: 0 };
const CATEGORIES = ['General', 'Work', 'Study', 'Personal', 'Health'];

function TasksView({ S, up, setTab }) {
  const [f, setF] = useState({ title: '', due: '', priority: 'none', category: 'General' });
  const [ed, setEd] = useState(null);
  const [openDone, setOpenDone] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPri, setFilterPri] = useState('all');

  const patch = (id, p) =>
    up((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...p } : t)),
    }));

  const add = (e) => {
    e.preventDefault();
    const title = f.title.trim();
    if (!title) return;
    up((s) => ({
      ...s,
      tasks: [
        ...s.tasks,
        {
          id: crypto.randomUUID(),
          title,
          due: f.due || null,
          priority: f.priority,
          category: f.category,
          done: false,
          doneAt: null,
          created: Date.now(),
        },
      ],
    }));
    setF({ title: '', due: '', priority: 'none', category: 'General' });
  };

  const saveEdit = () => {
    const title = ed.title.trim();
    if (title) {
      patch(ed.id, {
        title,
        due: ed.due || null,
        priority: ed.priority,
        category: ed.category || 'General',
      });
    }
    setEd(null);
  };

  const activeTasks = S.tasks.filter((t) => !t.done);
  const doneTasks = S.tasks.filter((t) => t.done).sort((a, b) => b.doneAt - a.doneAt);

  const filteredActive = activeTasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchPri = filterPri === 'all' || t.priority === filterPri;
    return matchSearch && matchPri;
  });

  const completionRate = S.tasks.length > 0 ? Math.round((doneTasks.length / S.tasks.length) * 100) : 0;
  const today = dk(Date.now());

  const linkToFocus = (taskId) => {
    up((s) => ({ ...s, activeTaskId: taskId }));
    setTab('Focus');
  };

  return (
    <div className="tasks-layout">
      {/* ── Progress Card ── */}
      {S.tasks.length > 0 && (
        <div className="card" style={{ padding: '14px 18px' }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>Task Completion</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--ac)' }}>
              {doneTasks.length} of {S.tasks.length} done ({completionRate}%)
            </span>
          </div>
          <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${completionRate}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}

      {/* ── Task Creator Card ── */}
      <form className="task-creator-card" onSubmit={add}>
        <div className="task-input-primary">
          <input
            type="text"
            placeholder="Add a new task (e.g., 'Finish research paper chapter')..."
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
            autoFocus
          />
          <button type="submit" className="primary">
            Add Task
          </button>
        </div>

        <div className="task-creator-controls">
          <div className="row" style={{ gap: 8 }}>
            {/* Priority Selector */}
            <select
              value={f.priority}
              onChange={(e) => setF({ ...f, priority: e.target.value })}
              style={{ fontSize: '0.82rem', padding: '6px 10px' }}
            >
              <option value="none">Priority: None</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>

            {/* Category Selector */}
            <select
              value={f.category}
              onChange={(e) => setF({ ...f, category: e.target.value })}
              style={{ fontSize: '0.82rem', padding: '6px 10px' }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Due Date */}
            <input
              type="date"
              value={f.due}
              onChange={(e) => setF({ ...f, due: e.target.value })}
              style={{ fontSize: '0.82rem', padding: '6px 10px' }}
              title="Due date (optional)"
            />

            {/* Quick date shortcuts */}
            <button
              type="button"
              className="ghost"
              style={{ fontSize: '0.78rem', padding: '5px 8px' }}
              onClick={() => setF({ ...f, due: today })}
            >
              Today
            </button>
          </div>
        </div>
      </form>

      {/* ── Filter & Search Bar ── */}
      <div className="filter-bar">
        <div className="search-box">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="row" style={{ gap: 6 }}>
          {['all', 'high', 'medium', 'low'].map((p) => (
            <button
              key={p}
              className={`chip ${filterPri === p ? 'on' : ''}`}
              style={{ padding: '4px 12px', fontSize: '0.78rem', textTransform: 'capitalize' }}
              onClick={() => setFilterPri(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Active Tasks List ── */}
      {filteredActive.length === 0 ? (
        <div className="card center" style={{ padding: '36px 20px', color: 'var(--tx-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎯</div>
          <b>No active tasks in this view</b>
          <p className="note" style={{ marginTop: 4 }}>Add a task above to plan your next focus sprint.</p>
        </div>
      ) : (
        <ul className="task-list">
          {filteredActive
            .sort((a, b) => W[b.priority] - W[a.priority] || a.created - b.created)
            .map((t) => {
              const isEditing = ed?.id === t.id;
              const isLinked = S.activeTaskId === t.id;

              if (isEditing) {
                return (
                  <li className="task-card" key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input
                      type="text"
                      value={ed.title}
                      onChange={(e) => setEd({ ...ed, title: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      style={{ width: '100%' }}
                      autoFocus
                    />
                    <div className="row" style={{ width: '100%', justifyContent: 'space-between' }}>
                      <div className="row">
                        <select
                          value={ed.priority}
                          onChange={(e) => setEd({ ...ed, priority: e.target.value })}
                          style={{ fontSize: '0.82rem' }}
                        >
                          <option value="none">No priority</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                        <input
                          type="date"
                          value={ed.due}
                          onChange={(e) => setEd({ ...ed, due: e.target.value })}
                          style={{ fontSize: '0.82rem' }}
                        />
                      </div>
                      <div className="row">
                        <button className="primary" onClick={saveEdit}>Save</button>
                        <button className="ghost" onClick={() => setEd(null)}>Cancel</button>
                      </div>
                    </div>
                  </li>
                );
              }

              return (
                <li className="task-card" key={t.id}>
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() =>
                      patch(t.id, {
                        done: true,
                        doneAt: Date.now(),
                      })
                    }
                    title="Mark complete"
                  />

                  <div className="grow">
                    <div className="task-title" style={{ fontWeight: 500, fontSize: '0.94rem' }}>
                      {t.title}
                    </div>
                    <div className="task-meta">
                      {t.priority !== 'none' && (
                        <span className={`priority-badge ${t.priority}`}>
                          {t.priority}
                        </span>
                      )}
                      {t.category && (
                        <span className="category-badge">
                          {t.category}
                        </span>
                      )}
                      {t.due && (
                        <span className={`due-badge ${t.due < today ? 'late' : ''}`}>
                          📅 {t.due === today ? 'Due Today' : `Due ${t.due}`}
                        </span>
                      )}
                      {isLinked && (
                        <span style={{ fontSize: '0.74rem', color: 'var(--ac)', fontWeight: 600 }}>
                          ● Active in Timer
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="task-actions">
                    <button
                      className={isLinked ? 'primary' : 'ghost'}
                      style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                      onClick={() => linkToFocus(t.id)}
                      title="Set as target for Focus Pomodoro"
                    >
                      {isLinked ? 'Focusing' : 'Focus'}
                    </button>

                    <button
                      className="ghost"
                      style={{ padding: '6px' }}
                      onClick={() => setEd({ id: t.id, title: t.title, due: t.due || '', priority: t.priority, category: t.category })}
                      title="Edit task"
                    >
                      ✏️
                    </button>

                    <button
                      className="ghost danger"
                      style={{ padding: '6px' }}
                      onClick={() => up((s) => ({ ...s, tasks: s.tasks.filter((x) => x.id !== t.id) }))}
                      title="Delete task"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              );
            })}
        </ul>
      )}

      {/* ── Completed Tasks Drawer ── */}
      {doneTasks.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button className="ghost" onClick={() => setOpenDone(!openDone)}>
            {openDone ? '▾' : '▸'} Completed Archive ({doneTasks.length})
          </button>

          {openDone && (
            <ul className="task-list" style={{ marginTop: 8 }}>
              {doneTasks.map((t) => (
                <li className="task-card done" key={t.id}>
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => patch(t.id, { done: false, doneAt: null })}
                    title="Re-open task"
                  />
                  <div className="grow">
                    <div className="task-title">{t.title}</div>
                    <small style={{ color: 'var(--tx-dim)', fontSize: '0.75rem' }}>
                      Completed {new Date(t.doneAt).toLocaleDateString()}
                    </small>
                  </div>
                  <button
                    className="ghost danger"
                    onClick={() => up((s) => ({ ...s, tasks: s.tasks.filter((x) => x.id !== t.id) }))}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   3. SOUNDS VIEW (Synthesizer, Audio Visualizer, Presets)
   ══════════════════════════════════════════════════════════════ */
function SoundsView({ S, up, activeSound, handleSoundToggle, sleepMin, onSleepChange }) {
  const [selectedCat, setSelectedCat] = useState('All');
  const canvasRef = useRef(null);

  // Live Canvas Visualizer connected to Web Audio AnalyserNode
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      animId = requestAnimationFrame(render);
      if (document.hidden) return;

      const analyser = getAnalyser();
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (!activeSound || !analyser) {
        // Flat baseline ambient line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 2;
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const barWidth = (w / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * h * 0.85;

        const grad = ctx.createLinearGradient(0, h, 0, h - barHeight);
        grad.addColorStop(0, '#064e3b');
        grad.addColorStop(0.5, '#10b981');
        grad.addColorStop(1, '#6ee7b7');

        ctx.fillStyle = grad;
        ctx.fillRect(x, h - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeSound]);

  const categories = ['All', 'Focus', 'Nature', 'Calm', 'Sleep', 'Noise'];
  const filteredPresets = selectedCat === 'All'
    ? PRESETS
    : PRESETS.filter((p) => p.cat === selectedCat);

  return (
    <div>
      {/* ── Live Visualizer Card ── */}
      <div className="sound-visualizer-card">
        <div className="row" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <b style={{ color: '#fff', fontSize: '0.94rem' }}>
              {activeSound ? `Now Synthesizing: ${PRESETS.find((p) => p.id === activeSound)?.n}` : 'Synthesizer Idle'}
            </b>
            <div style={{ fontSize: '0.78rem', color: 'var(--tx-muted)' }}>
              100% Real-time local oscillators · Zero audio streaming
            </div>
          </div>
          {activeSound && (
            <span className="eco-pill">Active DSP</span>
          )}
        </div>

        <canvas
          ref={canvasRef}
          className="visualizer-canvas"
          width={600}
          height={90}
        />
      </div>

      {/* ── Category Filters ── */}
      <div className="chips" style={{ margin: '0 0 16px' }}>
        {categories.map((c) => (
          <button
            key={c}
            className={`chip ${selectedCat === c ? 'on' : ''}`}
            onClick={() => setSelectedCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* ── Sound Cards Grid ── */}
      <div className="sound-grid">
        {filteredPresets.map((p) => {
          const isPlaying = activeSound === p.id;
          return (
            <div
              key={p.id}
              className={`sound-tile ${isPlaying ? 'on' : ''}`}
              onClick={() => handleSoundToggle(p)}
            >
              <div className="sound-tile-top">
                <b>{p.n}</b>
                <span className="category-badge">{p.cat}</span>
              </div>

              <small>{p.d}</small>

              <div className="sound-tile-footer">
                <span style={{ fontSize: '0.8rem', color: isPlaying ? 'var(--ac)' : 'var(--tx-muted)', fontWeight: 600 }}>
                  {isPlaying ? '● Playing' : 'Ready'}
                </span>

                <button
                  className={isPlaying ? 'primary' : 'secondary'}
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSoundToggle(p);
                  }}
                >
                  {isPlaying ? '■ Stop' : '▶ Play'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Master Controls (Volume & Sleep Timer) ── */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row grow" style={{ gap: 12 }}>
            <label htmlFor="master-vol" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
              Master Volume
            </label>
            <input
              id="master-vol"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={S.vol}
              onChange={(e) => {
                const v = +e.target.value;
                setVol(v);
                up((s) => ({ ...s, vol: v }));
              }}
              style={{ flex: '1 1 140px' }}
            />
            <span style={{ fontSize: '0.84rem', color: 'var(--tx-muted)', minWidth: 36 }}>
              {Math.round(S.vol * 100)}%
            </span>
          </div>

          <div className="row" style={{ gap: 8 }}>
            <label htmlFor="sleep-timer" style={{ fontSize: '0.84rem', color: 'var(--tx-muted)' }}>
              Auto-off timer:
            </label>
            <select
              id="sleep-timer"
              value={sleepMin}
              onChange={(e) => onSleepChange(+e.target.value)}
              style={{ fontSize: '0.82rem', padding: '6px 10px' }}
            >
              <option value={0}>Disabled</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   4. STREAK VIEW (Matrix Heatmap, Weekly Analytics & Badges)
   ══════════════════════════════════════════════════════════════ */
function StreakView({ S, up }) {
  const by = {};
  S.sessions.forEach((s) => {
    const k = dk(s.end);
    by[k] = (by[k] || 0) + s.min;
  });

  const g = S.set.goal;
  const dn = (k) => Math.round(new Date(k + 'T12:00:00') / 864e5);
  const days = Object.keys(by).filter((k) => by[k] >= g).sort();

  let best = 0, run = 0;
  days.forEach((k, i) => {
    run = i && dn(k) - dn(days[i - 1]) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });

  let cur = 0;
  const d = new Date();
  d.setHours(12);
  if ((by[dk(d)] || 0) < g) d.setDate(d.getDate() - 1);
  while ((by[dk(d)] || 0) >= g) {
    cur++;
    d.setDate(d.getDate() - 1);
  }

  // 365 Days Cells
  const cells = [];
  const t = new Date();
  t.setHours(12);
  t.setDate(t.getDate() - 364);
  for (let i = 0; i < 365; i++) {
    cells.push(dk(t));
    t.setDate(t.getDate() + 1);
  }

  const lead = new Date(cells[0] + 'T12:00:00').getDay();
  const lvl = (m) => (!m ? 0 : m <= 25 ? 1 : m <= 60 ? 2 : 3);
  const ref = useRef();

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollLeft = ref.current.scrollWidth;
    }
  }, []);

  const totalMin = sum(S.sessions);
  const totalTasksDone = S.tasks.filter((t) => t.done).length;

  // Unlocked achievements check
  const isUnlocked = (id) => {
    if (id === 'first_session') return S.sessions.length >= 1;
    if (id === 'streak_3') return cur >= 3 || best >= 3;
    if (id === 'streak_7') return cur >= 7 || best >= 7;
    if (id === 'century') return totalMin >= 100;
    if (id === 'master_500') return totalMin >= 500;
    if (id === 'task_slayer') return totalTasksDone >= 10;
    if (id === 'zen_master') return S.cycle >= 5;
    if (id === 'eco_hero') return true;
    return false;
  };

  const [hoveredDay, setHoveredDay] = useState(dk(Date.now()));

  return (
    <div>
      {/* ── Key Metrics ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <b>{cur} days</b>
          <span>Current Streak</span>
        </div>
        <div className="stat-card">
          <b>{best} days</b>
          <span>Longest Streak</span>
        </div>
        <div className="stat-card">
          <b>{hm(by[dk(Date.now())] || 0)}</b>
          <span>Focused Today</span>
        </div>
      </div>

      {/* ── Heatmap Card ── */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-head">
          <div>
            <h3 className="section-title">Annual Focus Matrix</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--tx-muted)' }}>
              Daily qualification: {g} min / day
            </span>
          </div>

          <div className="legend">
            <span>Less</span>
            <i className="l0" title="0 min" />
            <i className="l1" title="1-25 min" />
            <i className="l2" title="26-60 min" />
            <i className="l3" title="60+ min" />
            <span>More</span>
          </div>
        </div>

        <div className="heat-container">
          {/* Day of Week Labels */}
          <div className="heat-days-col">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Scrolling Grid */}
          <div className="heat-scroll" ref={ref}>
            <div className="heat">
              {Array.from({ length: lead }, (_, i) => (
                <u key={'p' + i} />
              ))}
              {cells.map((k) => (
                <i
                  key={k}
                  className={`l${lvl(by[k] || 0)} ${hoveredDay === k ? 'active' : ''}`}
                  onMouseEnter={() => setHoveredDay(k)}
                  onClick={() => setHoveredDay(k)}
                  title={`${k}: ${by[k] || 0} minutes logged`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Live Hover Tooltip Bar */}
        <div className="heat-tooltip-bar">
          <div>
            <b>{hoveredDay === dk(Date.now()) ? 'Today' : hoveredDay}:</b>{' '}
            <span>{by[hoveredDay] ? `${by[hoveredDay]} minutes focused` : 'No focus sessions'}</span>
          </div>
          <div>
            {(by[hoveredDay] || 0) >= g ? (
              <span style={{ color: 'var(--ac)', fontWeight: 600 }}>✓ Streak Goal Reached</span>
            ) : (
              <span style={{ color: 'var(--tx-dim)' }}>Below {g}m threshold</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Daily Goal Setter ── */}
      <div className="card row" style={{ marginTop: 14, justifyContent: 'space-between' }}>
        <label htmlFor="goal" style={{ fontSize: '0.88rem' }}>
          Daily streak qualification threshold
        </label>
        <div className="row">
          <input
            id="goal"
            type="number"
            min="1"
            max="600"
            defaultValue={g}
            key={g}
            onBlur={(e) => up((s) => ({ ...s, set: { ...s.set, goal: num(e.target.value, 1, 600) } }))}
            style={{ width: 90 }}
          />
          <span style={{ fontSize: '0.84rem', color: 'var(--tx-muted)' }}>minutes</span>
        </div>
      </div>

      {/* ── Achievements Showcase ── */}
      <div style={{ marginTop: 24 }}>
        <h3 className="section-title" style={{ fontSize: '1.1rem' }}>
          🏆 Milestones & Achievements
        </h3>
        <div className="achievements-grid">
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = isUnlocked(ach.id);
            return (
              <div
                key={ach.id}
                className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="achievement-icon">{ach.icon}</div>
                <div>
                  <b style={{ display: 'block', fontSize: '0.9rem', color: unlocked ? '#fff' : 'var(--tx-muted)' }}>
                    {ach.title}
                  </b>
                  <small style={{ fontSize: '0.76rem', color: 'var(--tx-dim)' }}>
                    {ach.desc}
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   5. BREATHE VIEW (Breathing Pacer with Audio Cues & Scaled Orb)
   ══════════════════════════════════════════════════════════════ */
const PROTOCOLS = [
  ['Box Breathing', '4 · 4 · 4 · 4 pattern for intense focus and nervous system balance', [['Inhale', 4, 1], ['Hold', 4, 1], ['Exhale', 4, 0.45], ['Hold', 4, 0.45]]],
  ['4-7-8 Deep Calm', 'Extended exhale stimulates the vagus nerve for tension relief', [['Inhale', 4, 1], ['Hold', 7, 1], ['Exhale', 8, 0.45]]],
  ['Coherent Breathing', '5.5s in, 5.5s out for optimal heart-rate variability (HRV)', [['Inhale', 5.5, 1], ['Exhale', 5.5, 0.45]]],
  ['Equal Flow', 'Simple 4s symmetry to steady erratic thoughts', [['Inhale', 4, 1], ['Exhale', 4, 0.45]]],
];

function BreatheView({ S, up }) {
  const [protoIndex, setProtoIndex] = useState(0);
  const [active, setActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [countdown, setCountdown] = useState(4);
  const [soundEnabled, setSoundEnabled] = useState(S.breatheAudio ?? true);

  const phases = PROTOCOLS[protoIndex][2];
  const currentPhase = active ? phases[phaseIndex] : ['Ready', 0.6, 0.5];
  const [phaseLabel, durationSec, targetScale] = currentPhase;

  // Countdown second ticker
  useEffect(() => {
    if (!active) return;
    setCountdown(Math.ceil(durationSec));

    const id = setInterval(() => {
      setCountdown((c) => Math.max(1, c - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [active, phaseIndex, durationSec]);

  // Phase transition handler with optional gentle sound cue
  useEffect(() => {
    if (!active) return;
    if (soundEnabled) {
      breatheCue(phaseLabel.toLowerCase());
    }

    const id = setTimeout(() => {
      setPhaseIndex((prev) => (prev + 1) % phases.length);
    }, durationSec * 1000);

    return () => clearTimeout(id);
  }, [active, phaseIndex, protoIndex, durationSec, soundEnabled, phaseLabel, phases.length]);

  const togglePacer = () => {
    wake();
    if (active) {
      setActive(false);
      setPhaseIndex(0);
    } else {
      setActive(true);
      setPhaseIndex(0);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Protocol Selection */}
      <div className="chips center">
        {PROTOCOLS.map((p, idx) => (
          <button
            key={p[0]}
            className={`chip ${idx === protoIndex ? 'on' : ''}`}
            onClick={() => {
              setProtoIndex(idx);
              setPhaseIndex(0);
              setActive(false);
            }}
          >
            {p[0]}
          </button>
        ))}
      </div>

      <p className="note center" style={{ maxWidth: 520, margin: '0 auto 10px' }}>
        {PROTOCOLS[protoIndex][1]}
      </p>

      {/* Smooth GPU Animated Orb */}
      <div className="stage">
        <div className="orb-glow" />
        <div
          className="orb"
          style={{
            transform: `scale(${targetScale})`,
            transition: `transform ${durationSec}s ${phaseLabel === 'Hold' ? 'linear' : 'ease-in-out'}`,
          }}
        />

        <div className="lab">
          <div className="lab-phase">{active ? phaseLabel : 'Center Yourself'}</div>
          {active && <div className="lab-countdown">{countdown}s</div>}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="row center" style={{ gap: 14 }}>
        <button className="primary btn-large" onClick={togglePacer}>
          {active ? 'Pause Pacing' : 'Begin Breathing'}
        </button>

        <button
          className={soundEnabled ? 'chip on' : 'chip'}
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            up((s) => ({ ...s, breatheAudio: next }));
          }}
          title="Toggle soft Tibetan audio bell on phase shifts"
        >
          {soundEnabled ? '🔔 Sound Cues On' : '🔕 Muted'}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   6. MOVE VIEW (Desk Mobility Coach & Routine Runner)
   ══════════════════════════════════════════════════════════════ */
function MoveView({ S, up }) {
  const [category, setCategory] = useState('Neck');
  const [activeMove, setActiveMove] = useState(null);

  // Move countdown timer
  useEffect(() => {
    if (!activeMove) return;
    if (activeMove.left <= 0) {
      chime();
      setActiveMove(null);
      return;
    }
    const id = setTimeout(() => {
      setActiveMove((m) => m && { ...m, left: m.left - 1 });
    }, 1000);
    return () => clearTimeout(id);
  }, [activeMove]);

  const categories = Object.keys(MOVES);

  const startExercise = (name, sec) => {
    wake();
    if (activeMove?.name === name) {
      setActiveMove(null);
    } else {
      setActiveMove({ name, left: sec, total: sec });
    }
  };

  return (
    <div>
      {/* Category Tabs */}
      <div className="chips">
        {categories.map((c) => (
          <button
            key={c}
            className={`chip ${c === category ? 'on' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Move Cards List */}
      <div className="moves-grid">
        {MOVES[category].map(([name, sec, cueStr]) => {
          const [breathe, form, relief] = cueStr.split('|');
          const isCurrent = activeMove?.name === name;

          return (
            <div key={name} className={`move-card ${isCurrent ? 'active' : ''}`}>
              <div className="move-card-header">
                <div>
                  <b style={{ fontSize: '1.05rem', color: '#fff' }}>{name}</b>
                  <span style={{ fontSize: '0.8rem', color: 'var(--tx-muted)', marginLeft: 8 }}>
                    {sec} seconds
                  </span>
                </div>

                <button
                  className={isCurrent ? 'primary' : 'secondary'}
                  onClick={() => startExercise(name, sec)}
                >
                  {isCurrent ? `${activeMove.left}s · Stop` : `Start ${sec}s`}
                </button>
              </div>

              {/* Step-by-step guidance cues */}
              <ul className="cues">
                <li>
                  <span>Breathe</span>
                  <div>{breathe}</div>
                </li>
                <li>
                  <span>Form</span>
                  <div>{form}</div>
                </li>
                <li>
                  <span>Relief</span>
                  <div>{relief}</div>
                </li>
              </ul>
            </div>
          );
        })}
      </div>

      {/* Posture Nudge Reminder Settings */}
      <div className="card row" style={{ marginTop: 20, justifyContent: 'space-between' }}>
        <div>
          <b style={{ display: 'block', fontSize: '0.92rem' }}>Movement & Posture Nudges</b>
          <span style={{ fontSize: '0.8rem', color: 'var(--tx-muted)' }}>
            Gentle browser notification reminding you to stretch your neck and back
          </span>
        </div>

        <select
          id="nudge"
          value={S.nudge}
          onChange={(e) => {
            const v = +e.target.value;
            if (v && window.Notification) {
              window.Notification.requestPermission();
            }
            up((s) => ({ ...s, nudge: v }));
          }}
          style={{ padding: '8px 12px' }}
        >
          <option value={0}>Reminders Off</option>
          <option value={30}>Every 30 minutes</option>
          <option value={45}>Every 45 minutes</option>
          <option value={60}>Every 60 minutes</option>
        </select>
      </div>
    </div>
  );
}
