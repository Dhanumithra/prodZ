// Add more quotes freely: the daily pick is deterministic (year*365 + dayOfYear) mod length.
export const QUOTES = [
  ['We suffer more often in imagination than in reality.', 'Seneca'],
  ['You have power over your mind, not outside events.', 'Marcus Aurelius'],
  ['The impediment to action advances action.', 'Marcus Aurelius'],
  ['Waste no more time arguing what a good person should be. Be one.', 'Marcus Aurelius'],
  ['A journey of a thousand miles begins with a single step.', 'Lao Tzu'],
  ['It does not matter how slowly you go as long as you do not stop.', 'Confucius'],
  ['Energy and persistence conquer all things.', 'Benjamin Franklin'],
  ['No person is free who is not master of themselves.', 'Epictetus'],
  ['He who has a why to live can bear almost any how.', 'Friedrich Nietzsche'],
  ['Well begun is half done.', 'Aristotle'],
  ['Simplicity is the ultimate sophistication.', 'Leonardo da Vinci'],
  ['Focus is a muscle. The more you protect it, the sharper it becomes.', 'Cal Newport'],
  ['Do less than you think you should do at first. Just do it every day.', 'James Clear'],
  ['Action is the foundational key to all success.', 'Pablo Picasso'],
  ['Peace comes from within. Do not seek it without.', 'Buddha'],
];

// name, seconds, 'breathing|form|relief'
export const MOVES = {
  'Neck': [
    ['Chin tucks', 30, 'Exhale as you glide the chin back|Eyes level, shoulders down|Eases forward-head posture'],
    ['Lateral head tilt', 30, 'Slow breaths as the ear nears the shoulder|Opposite shoulder stays low|Relieves upper-trapezius tension'],
    ['Levator scapulae stretch', 30, 'Exhale as you look toward your armpit|Sit tall, hand resting on the head|Releases neck-to-shoulder tightness'],
  ],
  'Arm & Wrist': [
    ['Prayer stretch', 30, 'Breathe steadily, lower hands slowly|Palms together, elbows wide|Relieves wrist strain from typing'],
    ['Wrist flexor stretch', 30, 'Exhale as you gently pull fingers back|Elbow straight, palm facing out|Eases forearm tightness'],
    ['Finger & tendon splay', 25, 'Inhale spread fingers wide, exhale curl|Maintain gentle wrist alignment|Releases typing strain in hand fascia'],
  ],
  'Leg': [
    ['Seated hamstring stretch', 30, 'Exhale as you hinge forward|One heel out, back flat|Loosens hamstrings shortened by sitting'],
    ['Standing calf raises', 45, 'Inhale up, exhale down slowly|Stand tall, hold desk for balance|Restores circulation in lower legs'],
    ['Ankle rotations', 30, 'Circular smooth motion with toes|Keep leg stable|Improves venous blood return'],
  ],
  'Lower body': [
    ['Seated figure-4', 40, 'Breathe deeply into the hip|Ankle on opposite knee, spine long|Opens tight hips and piriformis'],
    ['Pelvic tilts', 30, 'Exhale to tuck, inhale to arch|Move only the pelvis smoothly|Frees a stiff lower back'],
  ],
  'Whole body': [
    ['Overhead reach & side bend', 40, 'Inhale reaching up, exhale bending|Hips stay square to the front|Expands ribs and lateral torso'],
    ['Seated spinal twist', 40, 'Exhale into each gentle twist|Sit tall, turn from the mid-back|Restores spinal mobility'],
    ['Doorway / Wall chest opener', 35, 'Inhale expand chest forward|Elbows 90 degrees against frame|Counteracts computer slouch'],
  ],
  'Ba Duan Jin (Eight Brocades)': [
    ['1. Propping up the heavens', 45, 'Inhale palms up overhead, exhale lower|Stretch tall, relax shoulders|Traditionally regulates the Triple Burner; opens the torso'],
    ['2. Drawing the bow', 45, 'Inhale to draw, exhale to release|Stable stance, chest open|Expands chest and lung capacity'],
    ['3. Raising a single arm', 45, 'Inhale one arm up, other presses down|Alternate sides with ease|Traditionally harmonizes spleen and stomach'],
    ['4. Looking backward', 45, 'Exhale turning head slowly behind|Keep shoulders square|Clears five fatigues and screen strain'],
    ['5. Clenching fists, fierce gaze', 45, 'Exhale punching out slowly with intent|Eyes focused, fists firm|Stimulates vitality and cerebral blood flow'],
  ],
};

export const ACHIEVEMENTS = [
  { id: 'first_session', title: 'First Spark', desc: 'Complete your first focus session', icon: '🌱' },
  { id: 'streak_3', title: 'On A Roll', desc: 'Maintain a 3-day focus streak', icon: '🔥' },
  { id: 'streak_7', title: 'Habit Champion', desc: 'Reach a full 7-day focus streak', icon: '⚡' },
  { id: 'century', title: 'Centurion', desc: 'Log 100+ minutes of deep focus', icon: '🎯' },
  { id: 'master_500', title: 'Deep Work Master', desc: 'Accumulate 500+ minutes focused', icon: '👑' },
  { id: 'task_slayer', title: 'Task Finisher', desc: 'Complete 10 or more tasks', icon: '✨' },
  { id: 'zen_master', title: 'Breath Master', desc: 'Practice 5 mindful breathing resets', icon: '🧘' },
  { id: 'eco_hero', title: 'Green Engineer', desc: 'Saved 100% cloud bandwidth with local-first DSP', icon: '🌍' },
];

