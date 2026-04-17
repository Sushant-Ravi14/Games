const TEXTS = [
    "The quick brown fox jumps over the lazy dog near the river bank.",
    "Technology has revolutionized the way we communicate in the modern digital era.",
    "Typing speed is an essential skill for anyone working with computers today.",
    "Patience and practice are the two pillars of mastery in any craft.",
    "The stars above the mountain reflected beautifully in the still lake below.",
    "A journey of a thousand miles begins with a single step forward.",
    "Creativity is intelligence having fun with the tools at its disposal.",
    "The rain fell softly on the cobblestone streets of the old city.",
    "Science is not only a discipline of reason but also one of romance.",
    "She opened the window and let the cool autumn breeze fill the room."
];
 
// DOM references
const timerDisp = document.getElementById('timerDisp');
const wpmDisp   = document.getElementById('wpmDisp');
const accDisp   = document.getElementById('accDisp');
const bestDisp  = document.getElementById('bestDisp');
const textBox   = document.getElementById('textBox');
const typingArea= document.getElementById('typingArea');
const startBtn  = document.getElementById('startBtn');
const resetBtn  = document.getElementById('resetBtn');
const modal     = document.getElementById('modal');
const timeFill  = document.getElementById('timeFill');
const statTime  = document.getElementById('statTime');
 
// State
let currentText = '';
let timeLeft    = 60;
let interval    = null;
let startTime   = null;
let active      = false;
let bestWPM     = parseInt(sessionStorage.getItem('tst_best') || '0');
let history     = [];
 
bestDisp.textContent = bestWPM;
 
// Render character-by-character highlighting
function renderText() {
    const typed = typingArea.value;
    let html = '';
    for (let i = 0; i < currentText.length; i++) {
        const ch = currentText[i] === ' ' ? '&nbsp;' : currentText[i];
        if (i < typed.length) {
            const cls = typed[i] === currentText[i] ? 'correct' : 'wrong';
            html += `<span class="char ${cls}">${ch}</span>`;
        } else if (i === typed.length) {
            html += `<span class="char pending cursor">${ch}</span>`;
        } else {
            html += `<span class="char pending">${ch}</span>`;
        }
    }
    textBox.innerHTML = html;
}
 
// Calculate and display WPM + accuracy, return values
function calcStats() {
    const typed   = typingArea.value;
    const elapsed = (Date.now() - startTime) / 60000;
    const words   = typed.trim().split(/\s+/).filter(w => w.length > 0).length;
    const wpm     = elapsed > 0 ? Math.round(words / elapsed) : 0;
 
    let correct = 0;
    for (let i = 0; i < typed.length; i++) {
        if (typed[i] === currentText[i]) correct++;
    }
    const acc = typed.length > 0 ? Math.round(correct / typed.length * 100) : 100;
 
    wpmDisp.textContent = wpm;
    accDisp.textContent = acc + '%';
    return { wpm, acc, correct };
}
 
// Start or restart the test
function startTest() {
    timeLeft  = 60;
    active    = true;
    startTime = null;
    typingArea.value = '';
 
    currentText = TEXTS[Math.floor(Math.random() * TEXTS.length)];
 
    wpmDisp.textContent  = '—';
    accDisp.textContent  = '—';
    timerDisp.textContent = '60';
    timeFill.style.width  = '100%';
    timeFill.classList.remove('warn');
    statTime.classList.remove('warn');
 
    startBtn.disabled = true;
    textBox.classList.add('active');
 
    clearInterval(interval);
    interval = setInterval(tick, 1000);
 
    renderText();
    typingArea.focus();
}
 
// Countdown tick
function tick() {
    timeLeft--;
    timerDisp.textContent = timeLeft;
    timeFill.style.width  = (timeLeft / 60 * 100) + '%';
 
    if (timeLeft <= 10) {
        timeFill.classList.add('warn');
        statTime.classList.add('warn');
    }
    if (timeLeft <= 0) endTest();
}
 
// End the test and show results
function endTest() {
    active = false;
    clearInterval(interval);
    startBtn.disabled = false;
    textBox.classList.remove('active');
 
    const { wpm, acc, correct } = calcStats();
    history.push(wpm);
 
    const isNewBest = wpm > bestWPM;
    if (isNewBest) {
        bestWPM = wpm;
        sessionStorage.setItem('tst_best', bestWPM);
        bestDisp.textContent = bestWPM;
    }
 
    showModal(wpm, acc, correct, isNewBest);
}
 
// Grade based on WPM
function grade(wpm) {
    if (wpm >= 80) return { emoji: '🏆', text: 'Blazing fast!' };
    if (wpm >= 60) return { emoji: '⚡', text: 'Excellent!' };
    if (wpm >= 40) return { emoji: '👍', text: 'Good job!' };
    if (wpm >= 20) return { emoji: '✊', text: 'Keep going!' };
    return { emoji: '🌱', text: 'Just starting out!' };
}
 
// Show results modal
function showModal(wpm, acc, correct, isNewBest) {
    const g = grade(wpm);
    document.getElementById('modalTitle').textContent = g.text;
    document.getElementById('modalGrade').textContent = g.emoji;
    document.getElementById('mWpm').textContent   = wpm;
    document.getElementById('mAcc').textContent   = acc + '%';
    document.getElementById('mChars').textContent = correct;
    document.getElementById('mBest').textContent  = bestWPM;
    document.getElementById('newBestMsg').style.display = isNewBest ? '' : 'none';
 
    // Dot trail showing run history (last 10)
    const ring = document.getElementById('progressRing');
    ring.innerHTML = history.slice(-10).map(() =>
        `<div class="ring-dot done"></div>`
    ).join('');
 
    modal.classList.add('show');
}
 
// Input handler — single listener
typingArea.addEventListener('input', function () {
    if (!active) return;
    if (!startTime) startTime = Date.now();
 
    calcStats();
    renderText();
 
    // Chain next sentence when current one is completed
    if (typingArea.value.trim() === currentText.trim()) {
        const next = TEXTS.filter(t => t !== currentText);
        currentText += ' ' + next[Math.floor(Math.random() * next.length)];
    }
});
 
// Button handlers
startBtn.addEventListener('click', startTest);
 
resetBtn.addEventListener('click', function () {
    if (confirm('Reset your best WPM score?')) {
        sessionStorage.removeItem('tst_best');
        bestWPM = 0;
        history = [];
        bestDisp.textContent = 0;
    }
});
 
document.getElementById('retryBtn').addEventListener('click', function () {
    modal.classList.remove('show');
    startTest();
});
 
// Close modal on backdrop click
modal.addEventListener('click', function (e) {
    if (e.target === modal) modal.classList.remove('show');
});
 
// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
    // Tab to restart
    if (e.key === 'Tab') {
        e.preventDefault();
        if (!modal.classList.contains('show')) startTest();
    }
    // Space to start when idle
    if (e.key === ' ' && !active && !modal.classList.contains('show')) {
        e.preventDefault();
        startTest();
    }
});
 
// Click on text box to focus input
textBox.addEventListener('click', function () {
    if (active) typingArea.focus();
});
 