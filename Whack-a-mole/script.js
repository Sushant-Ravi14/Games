/* ── DOM References ──────────────────────────────────────── */
const scoreEl    = document.getElementById('scoreEl');
const timeEl     = document.getElementById('timeEl');
const bestEl     = document.getElementById('bestEl');
const scoreBox   = document.getElementById('scoreBox');
const timeBox    = document.querySelector('.time-box');
const progressBar = document.getElementById('progressBar');
const comboMsg   = document.getElementById('comboMsg');
const btnStart   = document.getElementById('btnStart');
const btnAgain   = document.getElementById('btnAgain');
const holes      = document.querySelectorAll('.hole');
const moles      = document.querySelectorAll('.mole');
const overlay    = document.getElementById('overlay');
const ovIcon     = document.getElementById('ovIcon');
const ovTitle    = document.getElementById('ovTitle');
const ovScore    = document.getElementById('ovScore');
const ovBest     = document.getElementById('ovBest');
 
/* ── Game Constants ──────────────────────────────────────── */
const TOTAL_TIME   = 30;
const HOLE_COUNT   = 9;
 
/* Difficulty ramp: [minDelay, maxDelay, maxUpTime, minUpTime, maxConcurrent] */
const DIFF_STAGES = [
  { at:  0, delayMin: 700, delayMax: 1400, upMin: 900,  upMax: 1600, concurrent: 1 },
  { at:  7, delayMin: 500, delayMax: 1100, upMin: 700,  upMax: 1300, concurrent: 2 },
  { at: 14, delayMin: 350, delayMax: 900,  upMin: 500,  upMax: 1000, concurrent: 3 },
  { at: 21, delayMin: 220, delayMax: 650,  upMin: 380,  upMax: 750,  concurrent: 3 },
];
 
/* ── Game State ──────────────────────────────────────────── */
let score       = 0;
let bestScore   = 0;
let timeLeft    = TOTAL_TIME;
let gameActive  = false;
let gameTimer   = null;
let holeTimers  = new Array(HOLE_COUNT).fill(null);
let comboCount  = 0;
let comboTimer  = null;
let audioCtx    = null;
 
/* ── Persistence ─────────────────────────────────────────── */
(function loadBest() {
  const saved = localStorage.getItem('wam_best');
  bestScore = saved ? parseInt(saved, 10) : 0;
  bestEl.textContent = bestScore;
})();
 
/* ── Web Audio ───────────────────────────────────────────── */
function getAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {}
  }
  return audioCtx;
}
 
function playTone(freq, endFreq, type, duration, vol) {
  try {
    const ctx  = getAudio(); if (!ctx) return;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.start(); osc.stop(ctx.currentTime + duration);
  } catch (_) {}
}
 
const sfx = {
  hit:   () => playTone(700, 220, 'sine',     0.14, 0.28),
  combo: (n) => playTone(380 + n * 80, 900 + n * 60, 'square', 0.22, 0.18),
  start: () => { playTone(330, 660, 'sine', 0.18, 0.22); setTimeout(() => playTone(660, 990, 'sine', 0.15, 0.18), 200); },
  end:   () => { playTone(440, 220, 'sawtooth', 0.2, 0.3); setTimeout(() => playTone(220, 110, 'sawtooth', 0.15, 0.35), 280); },
};
 
/* ── Utility ─────────────────────────────────────────────── */
const rand = (min, max) => Math.random() * (max - min) + min;
 
function getDiff() {
  const elapsed = TOTAL_TIME - timeLeft;
  let stage = DIFF_STAGES[0];
  for (const s of DIFF_STAGES) { if (elapsed >= s.at) stage = s; }
  return stage;
}
 
function countUp() {
  return [...moles].filter(m => m.classList.contains('up')).length;
}
 
/* ── Mole Scheduling ─────────────────────────────────────── */
function scheduleHole(index) {
  if (!gameActive) return;
 
  const diff  = getDiff();
  const delay = rand(diff.delayMin, diff.delayMax);
 
  holeTimers[index] = setTimeout(() => {
    if (!gameActive) return;
 
    /* Check concurrent cap */
    if (countUp() >= diff.concurrent) {
      scheduleHole(index);
      return;
    }
 
    const mole = moles[index];
    if (mole.classList.contains('up') || mole.classList.contains('bonked')) {
      scheduleHole(index);
      return;
    }
 
    mole.classList.add('up');
    const upTime = rand(diff.upMin, diff.upMax);
 
    holeTimers[index] = setTimeout(() => {
      if (mole.classList.contains('up')) {
        mole.classList.remove('up');
      }
      if (gameActive) scheduleHole(index);
    }, upTime);
 
  }, delay);
}
 
/* ── Visual FX ───────────────────────────────────────────── */
function spawnParticles(x, y) {
  const colors = ['#00e5ff','#39ff14','#ff6b35','#ff2d9b','#ffd600','#ffffff'];
  for (let i = 0; i < 10; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (Math.PI * 2 * i) / 10 + rand(-0.3, 0.3);
    const dist  = rand(45, 100);
    p.style.cssText = `
      left:${x}px; top:${y}px;
      background:${colors[Math.floor(rand(0, colors.length))]};
      --dx:${Math.cos(angle) * dist}px;
      --dy:${Math.sin(angle) * dist - 30}px;
      width:${rand(5,9)}px; height:${rand(5,9)}px;
    `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 600);
  }
}
 
function spawnHitRing(x, y) {
  const ring = document.createElement('div');
  ring.className = 'hit-ring';
  ring.style.left = `${x}px`;
  ring.style.top  = `${y}px`;
  document.body.appendChild(ring);
  setTimeout(() => ring.remove(), 450);
}
 
const HIT_WORDS = ['WHACK!','BONK!','POW!','SMASH!','ZAP!','THWAP!','KA-POW!'];
 
function spawnHitText(x, y, multiplier) {
  const el = document.createElement('div');
  el.className = 'hit-text';
  const word  = HIT_WORDS[Math.floor(rand(0, HIT_WORDS.length))];
  const color = multiplier >= 4 ? '#ff2d9b' : multiplier >= 3 ? '#ff6b35' : multiplier >= 2 ? '#ffd600' : '#39ff14';
  el.textContent = multiplier > 1 ? `${word} ×${multiplier}` : word;
  el.style.cssText = `left:${x}px; top:${y}px; color:${color}; text-shadow:0 0 12px ${color};`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 750);
}
 
/* ── Whack Handler ───────────────────────────────────────── */
function whack(e) {
  if (!e.isTrusted || !gameActive) return;
 
  const mole = this;
  if (!mole.classList.contains('up')) return;
 
  /* Clear scheduled hide timer for this hole */
  const idx = [...moles].indexOf(mole);
  clearTimeout(holeTimers[idx]);
 
  mole.classList.remove('up');
  mole.classList.add('bonked');
  setTimeout(() => {
    mole.classList.remove('bonked');
    if (gameActive) scheduleHole(idx);
  }, 350);
 
  /* Combo ── */
  comboCount++;
  clearTimeout(comboTimer);
  comboTimer = setTimeout(() => {
    comboCount = 0;
    comboMsg.classList.remove('show');
  }, 1600);
 
  const multiplier = comboCount >= 8 ? 4 : comboCount >= 5 ? 3 : comboCount >= 3 ? 2 : 1;
  score += multiplier;
  scoreEl.textContent = score;
 
  /* Animate score */
  scoreBox.classList.remove('pop');
  void scoreBox.offsetWidth; /* reflow to retrigger animation */
  scoreBox.classList.add('pop');
 
  /* Combo display */
  if (comboCount >= 3) {
    comboMsg.textContent = `${comboCount}× COMBO!  ×${multiplier}`;
    comboMsg.classList.add('show');
    sfx.combo(comboCount);
  } else {
    comboMsg.classList.remove('show');
    sfx.hit();
  }
 
  /* FX position */
  const rect = mole.getBoundingClientRect();
  const cx   = rect.left + rect.width  / 2;
  const cy   = rect.top  + rect.height / 2;
 
  spawnParticles(cx, cy);
  spawnHitRing(cx, cy);
  spawnHitText(cx, cy, multiplier);
}
 
/* ── Start Game ──────────────────────────────────────────── */
function startGame() {
  /* Reset state */
  score      = 0;
  timeLeft   = TOTAL_TIME;
  comboCount = 0;
  gameActive = true;
 
  scoreEl.textContent  = '0';
  timeEl.textContent   = TOTAL_TIME;
  progressBar.style.width = '100%';
  progressBar.classList.remove('danger');
  timeBox.classList.remove('danger');
  comboMsg.textContent = '';
  comboMsg.classList.remove('show');
 
  btnStart.disabled = true;
  overlay.classList.remove('show');
 
  /* Clear all moles */
  holeTimers.forEach(t => clearTimeout(t));
  holeTimers.fill(null);
  moles.forEach(m => m.classList.remove('up','bonked'));
 
  sfx.start();
 
  /* Stagger initial hole starts so not all fire at once */
  holes.forEach((_, i) => {
    const stagger = i * 220 + rand(0, 300);
    holeTimers[i] = setTimeout(() => {
      if (gameActive) scheduleHole(i);
    }, stagger);
  });
 
  /* Countdown timer */
  gameTimer = setInterval(() => {
    timeLeft--;
    timeEl.textContent = timeLeft;
    progressBar.style.width = `${(timeLeft / TOTAL_TIME) * 100}%`;
 
    if (timeLeft <= 10) {
      progressBar.classList.add('danger');
      timeBox.classList.add('danger');
    }
    if (timeLeft <= 0) endGame();
  }, 1000);
}
 
/* ── End Game ────────────────────────────────────────────── */
function endGame() {
  gameActive = false;
  clearInterval(gameTimer);
  clearTimeout(comboTimer);
  holeTimers.forEach(t => clearTimeout(t));
  holeTimers.fill(null);
  moles.forEach(m => m.classList.remove('up'));
 
  btnStart.disabled = false;
  progressBar.style.width = '0%';
 
  sfx.end();
 
  /* Record check — MUST compare before overwriting bestScore */
  const isNewRecord = score > bestScore;
  if (isNewRecord) {
    bestScore = score;
    localStorage.setItem('wam_best', bestScore);
    bestEl.textContent = bestScore;
  }
 
  /* Overlay */
  ovIcon.textContent  = isNewRecord ? '🏆' : score >= 20 ? '🎉' : score >= 10 ? '👏' : '😅';
  ovTitle.textContent = isNewRecord ? 'NEW RECORD!' : 'GAME OVER';
  ovScore.textContent = score;
  ovBest.textContent  = isNewRecord
    ? '⭐ New best score!'
    : bestScore > 0 ? `Best: ${bestScore}` : '';
 
  /* Small delay for impact */
  setTimeout(() => overlay.classList.add('show'), 300);
}
 
/* ── Event Listeners ─────────────────────────────────────── */
moles.forEach(mole => mole.addEventListener('click', whack));
btnStart.addEventListener('click',  startGame);
btnAgain.addEventListener('click',  startGame);
 
/* Resume AudioContext on first interaction (browser policy) */
document.addEventListener('click', () => {
  const ctx = getAudio();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}, { once: true });