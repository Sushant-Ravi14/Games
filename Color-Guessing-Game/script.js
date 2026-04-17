    // ── DOM refs ──────────────────────────────────────────────────
    const colorDisplay   = document.getElementById('colorDisplay');
    const chR = document.getElementById('chR');
    const chG = document.getElementById('chG');
    const chB = document.getElementById('chB');
    const messageEl      = document.getElementById('message');
    const currentStreakEl= document.getElementById('currentStreak');
    const bestStreakEl   = document.getElementById('bestStreak');
    const colorBoxes     = document.querySelectorAll('.color-box');
    const newRoundBtn    = document.getElementById('newRoundBtn');
    const easyBtn        = document.getElementById('easyBtn');
    const hardBtn        = document.getElementById('hardBtn');
    const resetStreakBtn = document.getElementById('resetStreakBtn');
    const attemptsRow    = document.getElementById('attemptsRow');
    const diffBadge      = document.getElementById('diffBadge');
    const overlay        = document.getElementById('overlay');
 
    // ── State ─────────────────────────────────────────────────────
    let colors = [];
    let correctColor = '';
    let correctRgb   = { r:0, g:0, b:0 };
    let currentStreak = 0;
    let bestStreak    = 0;
    let numColors     = 3;
    let wrongAttempts = 0;
    let roundOver     = false;
 
    // ── Storage ───────────────────────────────────────────────────
    function loadBest() {
      const v = localStorage.getItem('rgbBest');
      bestStreak = v ? parseInt(v) : 0;
    }
    function saveBest() {
      localStorage.setItem('rgbBest', bestStreak);
    }
 
    // ── Color helpers ─────────────────────────────────────────────
    function randomRgb() {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      return { str: `rgb(${r}, ${g}, ${b})`, r, g, b };
    }
 
    function parseRgb(str) {
      const [r,g,b] = str.match(/\d+/g).map(Number);
      return { r, g, b };
    }
 
    function normaliseRgb(str) {
      // Browsers may reformat rgb strings; normalise for comparison
      const { r, g, b } = parseRgb(str);
      return `rgb(${r}, ${g}, ${b})`;
    }
 
    // ── Attempt pips ──────────────────────────────────────────────
    function buildPips() {
      attemptsRow.innerHTML = '';
      for (let i = 0; i < numColors - 1; i++) {
        const pip = document.createElement('div');
        pip.className = 'attempt-pip';
        pip.id = `pip-${i}`;
        attemptsRow.appendChild(pip);
      }
    }
    function markPip() {
      const pip = document.getElementById(`pip-${wrongAttempts - 1}`);
      if (pip) pip.classList.add('used');
    }
 
    // ── Setup round ───────────────────────────────────────────────
    function setupGame() {
      roundOver     = false;
      wrongAttempts = 0;
      colors = [];
 
      for (let i = 0; i < numColors; i++) colors.push(randomRgb());
 
      // Pick answer
      const answerObj = colors[Math.floor(Math.random() * colors.length)];
      correctColor = answerObj.str;
      correctRgb   = { r: answerObj.r, g: answerObj.g, b: answerObj.b };
 
      // Display RGB target
      colorDisplay.textContent = correctColor.toUpperCase();
      chR.textContent = correctRgb.r;
      chG.textContent = correctRgb.g;
      chB.textContent = correctRgb.b;
 
      setMessage('Pick the matching swatch!', 'neutral');
 
      // Render boxes
      colorBoxes.forEach((box, i) => {
        box.classList.remove('fade', 'locked', 'correct-flash', 'wrong-flash');
        if (i < numColors) {
          box.style.display = 'block';
          box.style.backgroundColor = colors[i].str;
        } else {
          box.style.display = 'none';
        }
      });
 
      // Rebuild pips
      buildPips();
 
      newRoundBtn.textContent = '↻ New Round';
      diffBadge.textContent   = `Mode: ${numColors === 3 ? 'Easy' : 'Hard'} · ${numColors} swatches`;
    }
 
    // ── Message helper ────────────────────────────────────────────
    function setMessage(text, state) {
      messageEl.textContent = text;
      messageEl.className = `message ${state} pop`;
      // Re-trigger animation
      void messageEl.offsetWidth;
      messageEl.className = `message ${state} pop`;
    }
 
    // ── Click handler ─────────────────────────────────────────────
    function handleClick() {
      if (roundOver || this.classList.contains('fade')) return;
 
      const clicked = normaliseRgb(this.style.backgroundColor);
      const correct = normaliseRgb(correctColor);
 
      if (clicked === correct) {
        handleCorrect(this);
      } else {
        handleWrong(this);
      }
    }
 
    function handleCorrect(box) {
      roundOver = true;
      currentStreak++;
 
      if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
        saveBest();
      }
 
      // Visual: reveal all as correct color
      colorBoxes.forEach(b => {
        if (b.style.display !== 'none') {
          b.style.backgroundColor = correctColor;
          b.classList.add('locked');
        }
      });
      box.classList.add('correct-flash');
 
      updateScoreDisplay();
 
      const isNewBest = currentStreak === bestStreak && currentStreak > 1;
      setMessage(isNewBest ? '🎉 New Best Streak!' : '✓ Correct!', 'correct');
 
      newRoundBtn.textContent = '↻ Next Round';
 
      // Show overlay
      showOverlay('correct', isNewBest);
    }
 
    function handleWrong(box) {
      wrongAttempts++;
      currentStreak = 0;
      updateScoreDisplay();
 
      box.classList.add('fade', 'wrong-flash');
      markPip();
 
      // Check if only 1 box remains (force reveal)
      const remaining = [...colorBoxes].filter(
        b => b.style.display !== 'none' && !b.classList.contains('fade')
      );
 
      if (remaining.length <= 1) {
        // Last swatch — auto-win
        roundOver = true;
        remaining.forEach(b => { b.classList.add('correct-flash', 'locked'); });
        setMessage('Only one left — next round!', 'neutral');
        newRoundBtn.textContent = '↻ Next Round';
        setTimeout(() => showOverlay('last', false), 500);
      } else {
        setMessage(`✗ Wrong! ${remaining.length - 1} wrong left can be eliminated`, 'wrong');
      }
    }
 
    // ── Score display ─────────────────────────────────────────────
    function updateScoreDisplay() {
      animateNum(currentStreakEl, currentStreak);
      animateNum(bestStreakEl, bestStreak);
    }
    function animateNum(el, val) {
      el.textContent = val;
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    }
 
    // ── Overlay ───────────────────────────────────────────────────
    function showOverlay(type, isNewBest) {
      const emoji  = document.getElementById('overlayEmoji');
      const swatch = document.getElementById('overlaySwatch');
      const title  = document.getElementById('overlayTitle');
      const sub    = document.getElementById('overlaySub');
 
      swatch.style.backgroundColor = correctColor;
      swatch.style.boxShadow = `0 0 30px ${correctColor}`;
 
      if (type === 'correct') {
        emoji.textContent = isNewBest ? '🏆' : '🎯';
        title.textContent = isNewBest ? 'New Best Streak!' : 'Correct!';
        sub.textContent   = `${correctColor.toUpperCase()} · Streak: ${currentStreak}`;
      } else {
        emoji.textContent = '💡';
        title.textContent = 'This was the color';
        sub.textContent   = correctColor.toUpperCase();
      }
 
      overlay.classList.add('show');
    }
 
    function hideOverlay() {
      overlay.classList.remove('show');
    }
 
    // ── Mode switching ────────────────────────────────────────────
    function setMode(n) {
      numColors = n;
      easyBtn.classList.toggle('selected', n === 3);
      hardBtn.classList.toggle('selected', n === 6);
      setupGame();
      hideOverlay();
    }
 
    // ── Event Listeners ───────────────────────────────────────────
    colorBoxes.forEach(b => b.addEventListener('click', handleClick));
 
    newRoundBtn.addEventListener('click', () => { hideOverlay(); setupGame(); });
 
    easyBtn.addEventListener('click', () => setMode(3));
    hardBtn.addEventListener('click', () => setMode(6));
 
    resetStreakBtn.addEventListener('click', () => {
      if (!confirm('Reset both streaks to zero?')) return;
      currentStreak = 0;
      bestStreak    = 0;
      localStorage.removeItem('rgbBest');
      updateScoreDisplay();
      setMessage('Streaks reset — fresh start!', 'neutral');
      hideOverlay();
      setupGame();
    });
 
    document.getElementById('overlayNext').addEventListener('click', () => {
      hideOverlay(); setupGame();
    });
    document.getElementById('overlayReset').addEventListener('click', () => {
      if (!confirm('Reset streaks?')) return;
      currentStreak = bestStreak = 0;
      localStorage.removeItem('rgbBest');
      updateScoreDisplay();
      hideOverlay(); setupGame();
    });
 
    // ── Init ──────────────────────────────────────────────────────
    loadBest();
    updateScoreDisplay();
    setupGame();