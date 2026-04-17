    // ── Player Setup ──────────────────────────────────────────────
    const rawP1 = (prompt("Player 1 — Enter your name (plays O):") || "").trim();
    const rawP2 = (prompt("Player 2 — Enter your name (plays X):") || "").trim();
    const p1 = rawP1 || "Player 1";
    const p2 = rawP2 || "Player 2";
 
    document.getElementById("name1").textContent = p1;
    document.getElementById("name2").textContent = p2;
 
    // ── State ─────────────────────────────────────────────────────
    let isOTurn = true; // O goes first
    let scores  = { O: 0, X: 0 };
    const cells = document.querySelectorAll(".cell");
 
    const WIN_LINES = [
      [0,1,2],[3,4,5],[6,7,8], // rows
      [0,3,6],[1,4,7],[2,5,8], // cols
      [0,4,8],[2,4,6]          // diags
    ];
 
    // ── Helpers ───────────────────────────────────────────────────
    function currentMark()  { return isOTurn ? "O" : "X"; }
    function currentName()  { return isOTurn ? p1  : p2;  }
    function otherName()    { return isOTurn ? p2  : p1;  }
 
    function setStatus(html) {
      document.getElementById("status").innerHTML = html;
    }
 
    function updateStatus() {
      const mark = currentMark();
      const cls  = mark === "O" ? "o-name" : "x-name";
      setStatus(`<span class="${cls}">${currentName()}</span>'s turn &nbsp;·&nbsp; ${mark}`);
    }
 
    // ── Check winner ──────────────────────────────────────────────
    function checkWinner() {
      const board = [...cells].map(c => c.dataset.val || "");
 
      for (const [a,b,c] of WIN_LINES) {
        if (board[a] && board[a] === board[b] && board[b] === board[c]) {
          return { winner: board[a], line: [a,b,c] };
        }
      }
      if (board.every(v => v !== "")) return { winner: null, draw: true };
      return null;
    }
 
    // ── Handle a cell click ───────────────────────────────────────
    function handleClick() {
      if (this.disabled || this.dataset.val) return;
 
      const mark = currentMark();
      this.dataset.val = mark;
      this.textContent = mark;
      this.classList.add(mark.toLowerCase());
      this.disabled = true;
 
      const result = checkWinner();
 
      if (result) {
        cells.forEach(c => c.disabled = true);
 
        if (result.draw) {
          showOverlay("draw");
          setStatus("It's a <strong>draw!</strong> 🤝");
        } else {
          result.line.forEach(i => cells[i].classList.add("win"));
          scores[result.winner]++;
          document.getElementById(result.winner === "O" ? "score1" : "score2").textContent =
            scores[result.winner];
          showOverlay(result.winner);
          const n = result.winner === "O" ? p1 : p2;
          const cls = result.winner === "O" ? "o-name" : "x-name";
          setStatus(`<span class="${cls}">${n}</span> wins! 🎉`);
        }
      } else {
        isOTurn = !isOTurn;
        updateStatus();
      }
    }
 
    cells.forEach(c => c.addEventListener("click", handleClick));
 
    // ── Overlay ───────────────────────────────────────────────────
    function showOverlay(result) {
      const overlay = document.getElementById("overlay");
      const emoji   = document.getElementById("overlayEmoji");
      const title   = document.getElementById("overlayTitle");
      const name    = document.getElementById("overlayName");
 
      name.className = "overlay-name";
 
      if (result === "draw") {
        emoji.textContent = "🤝";
        title.textContent = "It's a Draw!";
        name.textContent  = "Well played both!";
        name.classList.add("draw");
      } else {
        const winName = result === "O" ? p1 : p2;
        emoji.textContent = "🏆";
        title.textContent = "Winner!";
        name.textContent  = winName;
        name.classList.add(result === "O" ? "o-win" : "x-win");
      }
 
      overlay.classList.add("show");
    }
 
    function hideOverlay() {
      document.getElementById("overlay").classList.remove("show");
    }
 
    // ── Reset (same players, keep scores) ────────────────────────
    function resetBoard() {
      hideOverlay();
      isOTurn = true;
      cells.forEach(c => {
        c.textContent  = "";
        c.dataset.val  = "";
        c.disabled     = false;
        c.className    = "cell";
      });
      updateStatus();
    }
 
    // ── New Game (same players, reset everything) ─────────────────
    function newGame() {
      scores = { O: 0, X: 0 };
      document.getElementById("score1").textContent = "0";
      document.getElementById("score2").textContent = "0";
      resetBoard();
    }
 
    document.getElementById("btnReset").addEventListener("click", resetBoard);
    document.getElementById("btnNew").addEventListener("click", newGame);
    document.getElementById("overlayReset").addEventListener("click", resetBoard);
    document.getElementById("overlayNew").addEventListener("click", newGame);
 
    // ── Init ──────────────────────────────────────────────────────
    updateStatus();